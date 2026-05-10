use crate::models::*;
use chrono::Utc;
use once_cell::sync::Lazy;
use parking_lot::RwLock;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Default, Serialize, Deserialize)]
pub struct Store {
    pub users: HashMap<String, User>,
    pub users_by_email: HashMap<String, String>,
    pub codes: Vec<VerificationCode>,
    pub chats: HashMap<String, Chat>,
    pub messages: Vec<Message>,
    pub complaints: Vec<Complaint>,
    pub current_user_id: Option<String>,
}

pub static STORE: Lazy<RwLock<Store>> = Lazy::new(|| RwLock::new(Store::default()));

pub fn now() -> i64 {
    Utc::now().timestamp()
}

pub fn new_id() -> String {
    Uuid::new_v4().to_string()
}

pub fn gen_code() -> String {
    let mut rng = rand::thread_rng();
    (0..6)
        .map(|_| rng.gen_range(0..10).to_string())
        .collect::<Vec<_>>()
        .join("")
}

pub fn hash_password(p: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut h = DefaultHasher::new();
    p.hash(&mut h);
    format!("h:{:x}", h.finish())
}
