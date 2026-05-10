use crate::models::*;
use crate::storage::*;
use axum::{
    extract::Path,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};

pub const LOCAL_PORT: u16 = 5005;

#[derive(Deserialize)]
pub struct SendCodeReq {
    pub email: String,
}

#[derive(Serialize)]
pub struct SendCodeRes {
    pub ok: bool,
    pub code: String, // returned for local dev only
    pub expires_in: i64,
}

#[derive(Deserialize)]
pub struct VerifyCodeReq {
    pub email: String,
    pub code: String,
}

#[derive(Serialize)]
pub struct VerifyCodeRes {
    pub ok: bool,
}

#[derive(Deserialize)]
pub struct ComplaintReq {
    pub from_user_id: String,
    pub from_nickname: String,
    pub target: String,
    pub reason: String,
}

#[derive(Deserialize)]
pub struct AssignRoleReq {
    pub user_id: String,
    pub role: Role,
}

async fn health() -> impl IntoResponse {
    Json(serde_json::json!({ "ok": true, "service": "offmessenger-local" }))
}

async fn send_code(Json(req): Json<SendCodeReq>) -> impl IntoResponse {
    let code = gen_code();
    {
        let mut store = STORE.write();
        store.codes.push(VerificationCode {
            email: req.email.clone(),
            code: code.clone(),
            created_at: now(),
            consumed: false,
        });
    }
    println!("[local-server] code for {} = {}", req.email, code);
    Json(SendCodeRes {
        ok: true,
        code,
        expires_in: 600,
    })
}

async fn verify_code(Json(req): Json<VerifyCodeReq>) -> impl IntoResponse {
    let mut store = STORE.write();
    let mut ok = false;
    for c in store.codes.iter_mut().rev() {
        if !c.consumed && c.email == req.email && c.code == req.code {
            c.consumed = true;
            ok = true;
            break;
        }
    }
    Json(VerifyCodeRes { ok })
}

async fn list_complaints() -> impl IntoResponse {
    let store = STORE.read();
    Json(store.complaints.clone())
}

async fn create_complaint(Json(req): Json<ComplaintReq>) -> impl IntoResponse {
    let c = Complaint {
        id: new_id(),
        from_user_id: req.from_user_id,
        from_nickname: req.from_nickname,
        target: req.target,
        reason: req.reason,
        status: ComplaintStatus::Open,
        created_at: now(),
    };
    let mut store = STORE.write();
    store.complaints.push(c.clone());
    (StatusCode::CREATED, Json(c))
}

async fn resolve_complaint(Path(id): Path<String>) -> impl IntoResponse {
    let mut store = STORE.write();
    if let Some(c) = store.complaints.iter_mut().find(|c| c.id == id) {
        c.status = ComplaintStatus::Resolved;
        return Json(serde_json::json!({ "ok": true }));
    }
    Json(serde_json::json!({ "ok": false }))
}

async fn list_users() -> impl IntoResponse {
    let store = STORE.read();
    let users: Vec<_> = store.users.values().cloned().collect();
    Json(users)
}

async fn assign_role(Json(req): Json<AssignRoleReq>) -> impl IntoResponse {
    let mut store = STORE.write();
    if let Some(u) = store.users.get_mut(&req.user_id) {
        u.role = req.role;
        return Json(serde_json::json!({ "ok": true, "role": req.role }));
    }
    Json(serde_json::json!({ "ok": false }))
}

pub fn router() -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/health", get(health))
        .route("/send-code", post(send_code))
        .route("/verify-code", post(verify_code))
        .route("/complaints", get(list_complaints).post(create_complaint))
        .route("/complaints/:id/resolve", post(resolve_complaint))
        .route("/users", get(list_users))
        .route("/roles/assign", post(assign_role))
        .layer(cors)
}

pub async fn run() -> std::io::Result<()> {
    let app = router();
    let addr = std::net::SocketAddr::from(([127, 0, 0, 1], LOCAL_PORT));
    println!("[local-server] listening on http://{}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await
}
