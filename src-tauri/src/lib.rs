mod commands;
mod models;
mod server;
mod storage;

use tauri::Manager;

#[cfg(target_os = "windows")]
fn apply_mica(window: &tauri::WebviewWindow) {
    use window_vibrancy::{apply_mica, apply_acrylic};
    // Try Mica first (Windows 11), fall back to Acrylic (Windows 10).
    if apply_mica(window, None).is_err() {
        let _ = apply_acrylic(window, Some((18, 18, 28, 160)));
    }
}

#[cfg(not(target_os = "windows"))]
fn apply_mica(_window: &tauri::WebviewWindow) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Spawn local HTTP server on 127.0.0.1:5005
            tauri::async_runtime::spawn(async move {
                if let Err(e) = server::run().await {
                    eprintln!("[local-server] error: {e}");
                }
            });

            // Seed a couple of demo chats so UI has content on first run.
            {
                use crate::models::Chat;
                use crate::storage::{new_id, now, STORE};
                let mut s = STORE.write();
                if s.chats.is_empty() {
                    for title in ["Общий чат", "Поддержка", "Новости"] {
                        let c = Chat {
                            id: new_id(),
                            title: title.into(),
                            members: vec![],
                            last_message_at: now(),
                        };
                        s.chats.insert(c.id.clone(), c);
                    }
                }
            }

            // Enable Mica/Acrylic on both windows for the "liquid glass" base.
            if let Some(w) = app.get_webview_window("main") {
                apply_mica(&w);
            }
            if let Some(w) = app.get_webview_window("support") {
                apply_mica(&w);
                let _ = w.hide();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::register_user,
            commands::login_user,
            commands::logout_user,
            commands::current_user,
            commands::top_up,
            commands::request_verification_code,
            commands::verify_code,
            commands::list_chats,
            commands::list_messages,
            commands::send_message,
            commands::create_chat,
            commands::list_complaints,
            commands::submit_complaint,
            commands::resolve_complaint,
            commands::list_users,
            commands::assign_role,
            commands::open_support_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
