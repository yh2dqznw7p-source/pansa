mod auth;
mod db;
mod models;
mod routes;
mod state;
mod ws;

use anyhow::Result;
use parking_lot::RwLock;
use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use tracing_subscriber::{prelude::*, EnvFilter};

fn env_or(name: &str, default: &str) -> String {
    std::env::var(name).unwrap_or_else(|_| default.to_string())
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "offmessenger_server=info,tower_http=info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let bind = env_or("BIND", "0.0.0.0:5005");
    let data_dir = env_or("DATA_DIR", ".");
    std::fs::create_dir_all(&data_dir).ok();
    let db_path = format!("{}/offmessenger.sqlite", data_dir.trim_end_matches('/'));

    let jwt_secret = env_or(
        "JWT_SECRET",
        "change-me-in-production-please-generate-a-long-random-string",
    );
    if jwt_secret.starts_with("change-me") {
        tracing::warn!("JWT_SECRET is using the insecure default — set a strong value before deploying");
    }

    let expose_dev_code = env_or("SEND_CODE_EXPOSE", "true") == "true";
    if expose_dev_code {
        tracing::warn!("SEND_CODE_EXPOSE=true — verification codes will be returned in API responses (dev only)");
    }

    let pool = db::open_pool(&db_path)?;
    tracing::info!(db = %db_path, "database ready");

    let state = state::AppState {
        db: pool,
        jwt_secret: Arc::new(jwt_secret.into_bytes()),
        expose_dev_code,
        chat_tx: Arc::new(RwLock::new(HashMap::new())),
    };

    let app = routes::build(state);
    let addr: SocketAddr = bind.parse()?;
    tracing::info!(%addr, "OffMessenger server listening");
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
