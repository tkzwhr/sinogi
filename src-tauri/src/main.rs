#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::plugin::TauriPlugin;
use tauri::{CustomMenuItem, Menu, MenuItem, Runtime, Submenu, WindowMenuEvent};
use tauri_plugin_sql::{Migration, MigrationKind, TauriSql};
use tauri_plugin_store::PluginBuilder;

fn main() {
    tauri::Builder::default()
        .menu(enable_menu())
        .on_menu_event(menu_handler)
        .plugin(enable_sql_plugin())
        .plugin(enable_store_plugin())
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
            .add_native_item(MenuItem::Quit),
    );
    Menu::new().add_submenu(sinogi)
}

fn menu_handler<R: Runtime>(wme: WindowMenuEvent<R>) {
    match wme.menu_item_id() {
        "page_root" => {
            let _ = wme.window().emit("page", "/");
        }
        "page_footprints" => {
            let _ = wme.window().emit("page", "/footprints");
        }
        "page_books" => {
            let _ = wme.window().emit("page", "/books");
        }
        "import_book" => {
            let _ = wme.window().emit("import_book", ());
        }
        _ => {}
    }
}
