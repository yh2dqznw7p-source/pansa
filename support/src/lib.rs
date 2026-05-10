use tauri::Manager;

#[cfg(target_os = "windows")]
fn apply_glass(window: &tauri::WebviewWindow) {
    use window_vibrancy::{apply_acrylic, apply_mica};
    if apply_mica(window, None).is_err() {
        let _ = apply_acrylic(window, Some((12, 14, 24, 140)));
    }
}

#[cfg(not(target_os = "windows"))]
fn apply_glass(_w: &tauri::WebviewWindow) {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if let Some(w) = app.get_webview_window("main") {
                apply_glass(&w);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri support");
}
