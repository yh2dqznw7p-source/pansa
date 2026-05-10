use crate::models::Message;
use axum::extract::ws::{Message as WsMessage, WebSocket};
use futures_util::{sink::SinkExt, stream::StreamExt};
use tokio::sync::broadcast::Receiver;

/// Forwards broadcast messages from the chat's channel out to the WebSocket client.
/// The client is expected to keep the socket open; any inbound text is ignored
/// (messages should be sent via POST /api/chats/:id/messages so they persist to DB).
pub async fn run_ws(socket: WebSocket, mut rx: Receiver<Message>) {
    let (mut tx, mut rx_ws) = socket.split();

    // Drain incoming frames so the socket doesn't fill up. We intentionally ignore
    // client-sent payloads for now — writes go through the REST endpoint.
    let reader = tokio::spawn(async move {
        while let Some(Ok(_)) = rx_ws.next().await {}
    });

    loop {
        match rx.recv().await {
            Ok(msg) => {
                let json = match serde_json::to_string(&msg) {
                    Ok(j) => j,
                    Err(_) => continue,
                };
                if tx.send(WsMessage::Text(json)).await.is_err() {
                    break;
                }
            }
            Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
            Err(_) => break,
        }
    }

    let _ = tx.close().await;
    reader.abort();
}
