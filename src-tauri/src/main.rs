#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::api::dialog::message;
use tauri::plugin::TauriPlugin;
use tauri::{
    AppHandle, CustomMenuItem, Manager, Menu, MenuItem, Runtime, Submenu, Window, WindowBuilder,
    WindowMenuEvent,
};
use tauri_plugin_sql::{Migration, MigrationKind, TauriSql};
use tauri_plugin_store::PluginBuilder;

fn main() {
    tauri::Builder::default()
        .menu(enable_menu())
        .on_menu_event(menu_handler)
        .plugin(enable_sql_plugin())
        .plugin(enable_store_plugin())
        .invoke_handler(tauri::generate_handler![open_problem_view])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn enable_sql_plugin<R: Runtime>() -> TauriSql<R> {
    TauriSql::default().add_migrations(
        "sqlite:sinogi.db",
        vec![Migration {
            version: 1,
            description: "Create tables",
            sql: include_str!("../migrations/V1__create_tables.sql"),
            kind: MigrationKind::Up,
        }],
    )
}

fn enable_store_plugin<R: Runtime>() -> TauriPlugin<R> {
    PluginBuilder::default().build()
}

fn enable_menu() -> Menu {
    let sinogi = Submenu::new(
        "Sinogi",
        Menu::new()
            .add_item(CustomMenuItem::new("page_root", "詰碁を解く").accelerator("CmdOrCtrl+1"))
            .add_item(
                CustomMenuItem::new("page_footprints", "あしあとを見る").accelerator("CmdOrCtrl+2"),
            )
            .add_item(
                CustomMenuItem::new("page_books", "問題を管理する").accelerator("CmdOrCtrl+3"),
            )
            .add_native_item(MenuItem::Separator)
            .add_item(
                CustomMenuItem::new("import_book", "ブックをインポートする")
                    .accelerator("CmdOrCtrl+Shift+I"),
            )
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("version", "バージョン情報..."))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Quit),
    );
    Menu::new().add_submenu(sinogi)
}

fn menu_handler<R: Runtime>(event: WindowMenuEvent<R>) {
    match event.menu_item_id() {
        "page_root" => {
            let _ = event.window().emit("page", "/");
        }
        "page_footprints" => {
            let _ = event.window().emit("page", "/footprints");
        }
        "page_books" => {
            let _ = event.window().emit("page", "/books");
        }
        "import_book" => {
            let _ = event.window().emit("import_book", ());
        }
        "version" => {
            let app_handle = event.window().app_handle();
            let msg = format!(
                "{} {}",
                app_handle.package_info().name,
                app_handle.package_info().version
            );
            let _ = message(
                Some(&event.window()),
                &msg,
                "詰碁練習アプリ\nDeveloped by Hiroki Takizawa",
            );
        }
        _ => {}
    }
}

#[tauri::command]
async fn open_problem_view<R: Runtime>(handle: AppHandle<R>, problem_id: String, title: String) {
    let url = format!("/problems/{}", problem_id.clone());
    if let Some(window) = handle.get_window("problem") {
        let _ = load_url(&window, &url);
        let _ = window.set_title(&title);
    } else {
        WindowBuilder::new(&handle, "problem", tauri::WindowUrl::App(url.into()))
            .title(title)
            .menu(Menu::new())
            .always_on_top(true)
            .build()
            .unwrap();
    }
}

fn load_url<R: Runtime>(window: &Window<R>, url: &str) -> tauri::Result<()> {
    let js = format!("window.location.replace('{}');", url);
    window.eval(&js)
}
