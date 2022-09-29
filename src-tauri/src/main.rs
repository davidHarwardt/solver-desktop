#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command

#[tauri::command]
fn save(content: &str) -> bool {
    std::fs::write("test_save.json", content).is_ok()
}

#[tauri::command]
fn load() -> String {
    std::fs::read_to_string("test_save.json").unwrap()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save,
            load,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
