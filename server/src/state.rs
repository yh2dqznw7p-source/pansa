use crate::db::DbPool;
use crate::models::Message;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::broadcast;

#[derive(Clone)]
pub struct AppState {
    pub db: DbPool,
    pub jwt_secret: Arc<Vec<u8>>,
    pub expose_dev_code: bool,
    /// Per-chat broadcast so connected WebSocket clients get real-time messages.
    pub chat_tx: Arc<RwLock<HashMap<String, broadcast::Sender<Message>>>>,
}

impl AppState {
    pub fn sender_for(&self, chat_id: &str) -> broadcast::Sender<Message> {
        let mut map = self.chat_tx.write();
        map.entry(chat_id.to_string())
            .or_insert_with(|| broadcast::channel::<Message>(256).0)
            .clone()
    }
}
