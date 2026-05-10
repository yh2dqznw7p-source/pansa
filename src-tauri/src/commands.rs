use crate::models::*;
use crate::storage::*;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Serialize)]
pub struct AuthResult {
    pub ok: bool,
    pub message: Option<String>,
    pub user: Option<User>,
}

#[tauri::command]
pub fn register_user(
    email: String,
    nickname: String,
    password: String,
    password2: String,
) -> AuthResult {
    if password != password2 {
        return AuthResult { ok: false, message: Some("Пароли не совпадают".into()), user: None };
    }
    if password.len() < 6 {
        return AuthResult { ok: false, message: Some("Пароль слишком короткий".into()), user: None };
    }
    let mut store = STORE.write();
    if store.users_by_email.contains_key(&email) {
        return AuthResult { ok: false, message: Some("Email уже используется".into()), user: None };
    }
    let user = User {
        id: new_id(),
        email: email.clone(),
        nickname,
        password_hash: hash_password(&password),
        balance: 0,
        role: Role::User,
        created_at: now(),
    };
    store.users_by_email.insert(email, user.id.clone());
    store.users.insert(user.id.clone(), user.clone());
    store.current_user_id = Some(user.id.clone());
    AuthResult { ok: true, message: None, user: Some(user) }
}

#[tauri::command]
pub fn login_user(email: String, password: String) -> AuthResult {
    let mut store = STORE.write();
    let uid = match store.users_by_email.get(&email).cloned() {
        Some(u) => u,
        None => return AuthResult { ok: false, message: Some("Пользователь не найден".into()), user: None },
    };
    let user = store.users.get(&uid).cloned().unwrap();
    if user.password_hash != hash_password(&password) {
        return AuthResult { ok: false, message: Some("Неверный пароль".into()), user: None };
    }
    store.current_user_id = Some(user.id.clone());
    AuthResult { ok: true, message: None, user: Some(user) }
}

#[tauri::command]
pub fn logout_user() -> bool {
    let mut store = STORE.write();
    store.current_user_id = None;
    true
}

#[tauri::command]
pub fn current_user() -> Option<User> {
    let store = STORE.read();
    let id = store.current_user_id.clone()?;
    store.users.get(&id).cloned()
}

#[tauri::command]
pub fn top_up(amount: u64) -> Result<User, String> {
    if amount < 50 {
        return Err("Минимальная сумма пополнения — 50 рублей".into());
    }
    let mut store = STORE.write();
    let id = store.current_user_id.clone().ok_or_else(|| "Не авторизован".to_string())?;
    let user = store.users.get_mut(&id).ok_or_else(|| "Пользователь не найден".to_string())?;
    user.balance = user.balance.saturating_add(amount);
    Ok(user.clone())
}

#[tauri::command]
pub async fn request_verification_code(email: String) -> Result<String, String> {
    let code = gen_code();
    {
        let mut store = STORE.write();
        store.codes.push(VerificationCode {
            email: email.clone(),
            code: code.clone(),
            created_at: now(),
            consumed: false,
        });
    }
    println!("[tauri-cmd] send-code {} -> {}", email, code);
    Ok(code)
}

#[tauri::command]
pub fn verify_code(email: String, code: String) -> bool {
    let mut store = STORE.write();
    for c in store.codes.iter_mut().rev() {
        if !c.consumed && c.email == email && c.code == code {
            c.consumed = true;
            return true;
        }
    }
    false
}

#[tauri::command]
pub fn list_chats() -> Vec<Chat> {
    let store = STORE.read();
    store.chats.values().cloned().collect()
}

#[tauri::command]
pub fn list_messages(chat_id: String) -> Vec<Message> {
    let store = STORE.read();
    store.messages.iter().filter(|m| m.chat_id == chat_id).cloned().collect()
}

#[tauri::command]
pub fn send_message(chat_id: String, text: String) -> Result<Message, String> {
    let mut store = STORE.write();
    let uid = store.current_user_id.clone().ok_or_else(|| "Не авторизован".to_string())?;
    let nickname = store.users.get(&uid).map(|u| u.nickname.clone()).unwrap_or_default();
    let msg = Message {
        id: new_id(),
        chat_id: chat_id.clone(),
        author_id: uid,
        author_nickname: nickname,
        text,
        created_at: now(),
    };
    store.messages.push(msg.clone());
    if let Some(chat) = store.chats.get_mut(&chat_id) {
        chat.last_message_at = msg.created_at;
    }
    Ok(msg)
}

#[tauri::command]
pub fn create_chat(title: String) -> Chat {
    let mut store = STORE.write();
    let uid = store.current_user_id.clone().unwrap_or_default();
    let chat = Chat {
        id: new_id(),
        title,
        members: if uid.is_empty() { vec![] } else { vec![uid] },
        last_message_at: now(),
    };
    store.chats.insert(chat.id.clone(), chat.clone());
    chat
}

#[tauri::command]
pub fn list_complaints() -> Vec<Complaint> {
    let store = STORE.read();
    store.complaints.clone()
}

#[tauri::command]
pub fn submit_complaint(target: String, reason: String) -> Result<Complaint, String> {
    let mut store = STORE.write();
    let uid = store.current_user_id.clone().ok_or_else(|| "Не авторизован".to_string())?;
    let nickname = store.users.get(&uid).map(|u| u.nickname.clone()).unwrap_or_default();
    let c = Complaint {
        id: new_id(),
        from_user_id: uid,
        from_nickname: nickname,
        target,
        reason,
        status: ComplaintStatus::Open,
        created_at: now(),
    };
    store.complaints.push(c.clone());
    Ok(c)
}

#[tauri::command]
pub fn resolve_complaint(id: String) -> bool {
    let mut store = STORE.write();
    if let Some(c) = store.complaints.iter_mut().find(|c| c.id == id) {
        c.status = ComplaintStatus::Resolved;
        return true;
    }
    false
}

#[tauri::command]
pub fn list_users() -> Vec<User> {
    let store = STORE.read();
    store.users.values().cloned().collect()
}

#[tauri::command]
pub fn assign_role(user_id: String, role: Role) -> Result<User, String> {
    let mut store = STORE.write();
    let user = store.users.get_mut(&user_id).ok_or_else(|| "Пользователь не найден".to_string())?;
    user.role = role;
    Ok(user.clone())
}

#[tauri::command]
pub fn open_support_window(app: AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("support") {
        let _ = w.show();
        let _ = w.set_focus();
    }
    Ok(())
}
