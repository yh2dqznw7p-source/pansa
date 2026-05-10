// The desktop client is now a thin shell: all data lives on the remote server.
// We only keep window setup and Mica/Acrylic translucency here.

use tauri::Manager;

#[cfg(target_os = "windows")]
fn apply_mica(window: &tauri::WebviewWindow) {
    use window_vibrancy::{apply_acrylic, apply_mica};
    if apply_mica(window, None).is_err() {
        let _ = apply_acrylic(window, Some((18, 18, 28, 160)));
    }
}

#[cfg(not(target_os = "windows"))]
fn apply_mica(_window: &tauri::WebviewWindow) {}

#[tauri::command]
fn open_support_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("support") {
        let _ = w.show();
        let _ = w.set_focus();
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if let Some(w) = app.get_webview_window("main") {
                apply_mica(&w);
            }
            if let Some(w) = app.get_webview_window("support") {
                apply_mica(&w);
                let _ = w.hide();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_support_window])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
