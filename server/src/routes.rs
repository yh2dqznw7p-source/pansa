use crate::auth::{hash_password, make_token, verify_password, verify_token, Claims};
use crate::db;
use crate::models::*;
use crate::state::AppState;
use axum::{
    extract::{ws::WebSocketUpgrade, Path, Query, State},
    http::{header, HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::json;

const MIN_TOPUP: i64 = 50;
const MAX_TEXT_LEN: usize = 4000;
const TOKEN_TTL_DAYS: i64 = 30;

fn err(status: StatusCode, msg: &str) -> Response {
    (status, Json(json!({ "ok": false, "error": msg }))).into_response()
}

fn bearer(headers: &HeaderMap) -> Option<String> {
    headers
        .get(header::AUTHORIZATION)?
        .to_str()
        .ok()?
        .strip_prefix("Bearer ")
        .map(|s| s.to_string())
}

fn require_auth(state: &AppState, headers: &HeaderMap) -> Result<Claims, Response> {
    let token = bearer(headers).ok_or_else(|| err(StatusCode::UNAUTHORIZED, "missing token"))?;
    verify_token(&state.jwt_secret, &token).map_err(|_| err(StatusCode::UNAUTHORIZED, "invalid token"))
}

pub fn build(state: AppState) -> Router {
    use tower_http::cors::{Any, CorsLayer};
    let cors = CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any);
    Router::new()
        .route("/health", get(health))
        .route("/api/auth/send-code", post(send_code))
        .route("/api/auth/register", post(register))
        .route("/api/auth/login", post(login))
        .route("/api/me", get(me))
        .route("/api/me/username", post(set_username))
        .route("/api/me/top-up", post(top_up))
        .route("/api/users/search", get(search_users))
        .route("/api/dm/open", post(open_dm))
        .route("/api/chats", get(list_chats).post(create_chat))
        .route("/api/chats/:id/messages", get(list_messages).post(send_message))
        .route("/api/chats/:id/ws", get(chat_ws))
        .route("/api/complaints", get(list_complaints).post(create_complaint))
        .route("/api/complaints/:id/resolve", post(resolve_complaint))
        .route("/api/users", get(list_users))
        .route("/api/roles/assign", post(assign_role))
        .with_state(state)
        .layer(cors)
}

async fn health() -> impl IntoResponse {
    Json(json!({ "ok": true, "service": "offmessenger-server", "version": env!("CARGO_PKG_VERSION") }))
}

// --- Auth ---------------------------------------------------------------

async fn send_code(
    State(state): State<AppState>,
    Json(req): Json<SendCodeReq>,
) -> Response {
    if req.email.len() < 3 || !req.email.contains('@') {
        return err(StatusCode::BAD_REQUEST, "invalid email");
    }
    let code: String = {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        (0..6).map(|_| rng.gen_range(0..10).to_string()).collect::<Vec<_>>().join("")
    };
    if let Err(e) = db::put_code(&state.db, &req.email, &code) {
        return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}"));
    }
    tracing::info!(email = %req.email, code = %code, "verification code issued");
    Json(SendCodeResponse {
        ok: true,
        dev_code: state.expose_dev_code.then(|| code),
    })
    .into_response()
}

async fn register(
    State(state): State<AppState>,
    Json(req): Json<RegisterReq>,
) -> Response {
    if req.password != req.password2 {
        return err(StatusCode::BAD_REQUEST, "passwords do not match");
    }
    if req.password.len() < 6 {
        return err(StatusCode::BAD_REQUEST, "password too short");
    }
    if req.nickname.trim().len() < 2 {
        return err(StatusCode::BAD_REQUEST, "nickname too short");
    }
    match db::verify_code(&state.db, &req.email, &req.code) {
        Ok(true) => {}
        Ok(false) => return err(StatusCode::BAD_REQUEST, "invalid verification code"),
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
    if matches!(db::get_user_by_email(&state.db, &req.email), Ok(Some(_))) {
        return err(StatusCode::CONFLICT, "email already used");
    }
    let hash = match hash_password(&req.password) {
        Ok(h) => h,
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("hash: {e}")),
    };
    let user = match db::create_user(&state.db, &req.email, &req.nickname, &hash) {
        Ok(u) => u,
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    };
    let token = make_token(&state.jwt_secret, &user.id, user.role.as_str(), TOKEN_TTL_DAYS)
        .unwrap_or_default();
    Json(AuthResponse { token, user }).into_response()
}

async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginReq>,
) -> Response {
    let (user, hash) = match db::get_user_by_email(&state.db, &req.email) {
        Ok(Some(t)) => t,
        Ok(None) => return err(StatusCode::UNAUTHORIZED, "user not found"),
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    };
    match verify_password(&req.password, &hash) {
        Ok(true) => {}
        _ => return err(StatusCode::UNAUTHORIZED, "wrong password"),
    }
    let token = make_token(&state.jwt_secret, &user.id, user.role.as_str(), TOKEN_TTL_DAYS)
        .unwrap_or_default();
    Json(AuthResponse { token, user }).into_response()
}

async fn me(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    match db::get_user(&state.db, &claims.sub) {
        Ok(Some(u)) => Json(u).into_response(),
        Ok(None) => err(StatusCode::NOT_FOUND, "user missing"),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

async fn top_up(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<TopUpReq>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    if req.amount < MIN_TOPUP {
        return err(StatusCode::BAD_REQUEST, "minimum top-up is 50");
    }
    match db::top_up(&state.db, &claims.sub, req.amount) {
        Ok(u) => Json(u).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

/// Validates a username and saves it on the current user.
/// Rules: 3..=32 chars, `[a-zA-Z0-9_]+`, case-insensitive uniqueness.
async fn set_username(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<SetUsernameReq>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let u = req.username.trim().trim_start_matches('@').to_string();

    if u.len() < 3 || u.len() > 32 {
        return err(StatusCode::BAD_REQUEST, "username must be 3..32 chars");
    }
    if !u.chars().all(|c| c.is_ascii_alphanumeric() || c == '_') {
        return err(StatusCode::BAD_REQUEST, "username may contain only a-z, 0-9, _");
    }
    // Case-insensitive uniqueness check.
    match db::get_user_by_username(&state.db, &u) {
        Ok(Some(existing)) if existing.id != claims.sub => {
            return err(StatusCode::CONFLICT, "username is taken");
        }
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
        _ => {}
    }
    match db::set_username(&state.db, &claims.sub, &u) {
        Ok(user) => Json(user).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

// --- Chats & messages ---------------------------------------------------

async fn list_chats(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    match db::list_chats_for(&state.db, &claims.sub) {
        Ok(cs) => Json(cs).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

async fn create_chat(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<CreateChatReq>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let title = req.title.trim();
    if title.is_empty() || title.len() > 120 {
        return err(StatusCode::BAD_REQUEST, "invalid title");
    }
    match db::create_group_chat(&state.db, &claims.sub, title) {
        Ok(c) => Json(c).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

async fn open_dm(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<OpenDmReq>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let uname = req.username.trim().trim_start_matches('@');
    if uname.is_empty() {
        return err(StatusCode::BAD_REQUEST, "empty username");
    }
    let peer = match db::get_user_by_username(&state.db, uname) {
        Ok(Some(u)) => u,
        Ok(None) => return err(StatusCode::NOT_FOUND, "user not found"),
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    };
    if peer.id == claims.sub {
        return err(StatusCode::BAD_REQUEST, "cannot open DM with yourself");
    }
    match db::get_or_create_dm(&state.db, &claims.sub, &peer.id) {
        Ok(mut chat) => {
            chat.title = peer.nickname.clone();
            chat.peer = Some(peer);
            Json(chat).into_response()
        }
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

async fn search_users(
    State(state): State<AppState>,
    headers: HeaderMap,
    Query(q): Query<SearchQuery>,
) -> Response {
    if let Err(r) = require_auth(&state, &headers) { return r; }
    let query = q.q.trim();
    if query.is_empty() {
        return Json(Vec::<crate::models::User>::new()).into_response();
    }
    match db::search_users(&state.db, query, 30) {
        Ok(us) => Json(us).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

async fn send_message(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(chat_id): Path<String>,
    Json(req): Json<SendMessageReq>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let text = req.text.trim();
    if text.is_empty() || text.len() > MAX_TEXT_LEN {
        return err(StatusCode::BAD_REQUEST, "invalid text length");
    }
    match db::is_member(&state.db, &chat_id, &claims.sub) {
        Ok(true) => {}
        Ok(false) => return err(StatusCode::FORBIDDEN, "not a chat member"),
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
    let user = match db::get_user(&state.db, &claims.sub) {
        Ok(Some(u)) => u,
        _ => return err(StatusCode::UNAUTHORIZED, "user not found"),
    };
    let _ = req.chat_id;
    let msg = match db::insert_message(&state.db, &chat_id, &user.id, &user.nickname, text) {
        Ok(m) => m,
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    };
    let _ = state.sender_for(&chat_id).send(msg.clone());
    Json(msg).into_response()
}

async fn list_messages(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(chat_id): Path<String>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    match db::is_member(&state.db, &chat_id, &claims.sub) {
        Ok(true) => {}
        Ok(false) => return err(StatusCode::FORBIDDEN, "not a chat member"),
        Err(e) => return err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
    match db::list_messages(&state.db, &chat_id, 500) {
        Ok(ms) => Json(ms).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

// --- WebSocket for live chat messages -----------------------------------

#[derive(Deserialize)]
pub struct WsQuery {
    pub token: String,
}

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

async fn chat_ws(
    State(state): State<AppState>,
    Path(chat_id): Path<String>,
    Query(q): Query<WsQuery>,
    ws: WebSocketUpgrade,
) -> Response {
    let claims = match verify_token(&state.jwt_secret, &q.token) {
        Ok(c) => c,
        Err(_) => return err(StatusCode::UNAUTHORIZED, "invalid token"),
    };
    match db::is_member(&state.db, &chat_id, &claims.sub) {
        Ok(true) => {}
        _ => return err(StatusCode::FORBIDDEN, "not a chat member"),
    }
    let rx = state.sender_for(&chat_id).subscribe();
    ws.on_upgrade(move |socket| crate::ws::run_ws(socket, rx))
}

// --- Complaints ---------------------------------------------------------

async fn list_complaints(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let role = Role::from_str(&claims.role);
    if !role.is_staff() {
        return err(StatusCode::FORBIDDEN, "staff only");
    }
    match db::list_complaints(&state.db) {
        Ok(cs) => Json(cs).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

async fn create_complaint(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<CreateComplaintReq>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    let target = req.target.trim();
    let reason = req.reason.trim();
    if target.is_empty() || reason.is_empty() || reason.len() > 2000 {
        return err(StatusCode::BAD_REQUEST, "invalid target or reason");
    }
    let user = match db::get_user(&state.db, &claims.sub) {
        Ok(Some(u)) => u,
        _ => return err(StatusCode::UNAUTHORIZED, "user missing"),
    };
    match db::create_complaint(&state.db, &user.id, &user.nickname, target, reason) {
        Ok(c) => Json(c).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

async fn resolve_complaint(
    State(state): State<AppState>,
    headers: HeaderMap,
    Path(id): Path<String>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    if !Role::from_str(&claims.role).is_staff() {
        return err(StatusCode::FORBIDDEN, "staff only");
    }
    match db::resolve_complaint(&state.db, &id) {
        Ok(true) => Json(json!({ "ok": true })).into_response(),
        Ok(false) => err(StatusCode::NOT_FOUND, "not found"),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

// --- Users & roles ------------------------------------------------------

async fn list_users(State(state): State<AppState>, headers: HeaderMap) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    if !Role::from_str(&claims.role).is_staff() {
        return err(StatusCode::FORBIDDEN, "staff only");
    }
    match db::list_users(&state.db) {
        Ok(us) => Json(us).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}

async fn assign_role(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(req): Json<AssignRoleReq>,
) -> Response {
    let claims = match require_auth(&state, &headers) { Ok(c) => c, Err(r) => return r };
    if !Role::from_str(&claims.role).can_assign_roles() {
        return err(StatusCode::FORBIDDEN, "admin only");
    }
    match db::set_role(&state.db, &req.user_id, req.role) {
        Ok(u) => Json(u).into_response(),
        Err(e) => err(StatusCode::INTERNAL_SERVER_ERROR, &format!("db: {e}")),
    }
}
