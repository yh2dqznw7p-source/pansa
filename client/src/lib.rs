use tauri::Manager;
use tauri_plugin_shell::ShellExt;

#[cfg(target_os = "windows")]
fn apply_glass(window: &tauri::WebviewWindow) {
    use window_vibrancy::{apply_acrylic, apply_mica};
    if apply_mica(window, None).is_err() {
        let _ = apply_acrylic(window, Some((12, 14, 24, 140)));
    }
}

#[cfg(not(target_os = "windows"))]
fn apply_glass(_w: &tauri::WebviewWindow) {}

#[tauri::command]
fn open_support(app: tauri::AppHandle) -> Result<(), String> {
    // Try to launch the sibling Support binary from the install directory.
    // On Windows installers both executables are placed side-by-side.
    let exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let dir = exe.parent().ok_or("no parent dir")?.to_path_buf();

    let candidates = [
        dir.join("OffMessenger Support.exe"),
        dir.join("offmessenger-support.exe"),
        dir.join("OffMessengerSupport.exe"),
    ];

    for p in &candidates {
        if p.exists() {
            let _ = app.shell()
                .command(p.to_string_lossy().to_string())
                .spawn()
                .map_err(|e| e.to_string())?;
            return Ok(());
        }
    }
    Err("OffMessenger Support not found. Install it alongside OffMessenger.".into())
}

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
        .invoke_handler(tauri::generate_handler![open_support])
        .run(tauri::generate_context!())
        .expect("error while running tauri client");
}
