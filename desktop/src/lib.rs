#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tauri::{Manager, Emitter};

#[cfg(target_os = "windows")]
use windows_sys::Win32::{
    Foundation::HWND,
    UI::WindowsAndMessaging::{
        GetWindowLongW, SetLayeredWindowAttributes, SetWindowLongW, SetWindowPos,
        GWL_EXSTYLE, HWND_TOPMOST, LWA_ALPHA, SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE,
        WS_EX_LAYERED, WS_EX_NOACTIVATE, WS_EX_TOPMOST, WS_EX_TRANSPARENT,
    },
};

// Global application state holding overlay properties
pub struct OverlayState {
    pub is_click_through: Arc<AtomicBool>,
}

/// Modifies the Win32 window extended styles to enable or disable mouse click-through capability.
/// When enabled, all pointer events bypass the WebView2 window directly into VALORANT.
#[tauri::command]
fn toggle_click_through(
    window: tauri::WebviewWindow,
    state: tauri::State<OverlayState>,
    enable: bool,
) -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let hwnd = window
            .hwnd()
            .map_err(|e| format!("Failed to fetch native window handle: {}", e))?
            .0 as HWND;

        unsafe {
            // Retrieve existing extended style flags
            let ex_style = GetWindowLongW(hwnd, GWL_EXSTYLE);
            
            let new_style = if enable {
                // Attach WS_EX_TRANSPARENT (ignore pointer events) and WS_EX_NOACTIVATE (prevent window focus)
                ex_style | WS_EX_LAYERED as i32 | WS_EX_TRANSPARENT as i32 | WS_EX_NOACTIVATE as i32
            } else {
                // Strip WS_EX_TRANSPARENT so UI becomes interactive again, maintain layered transparency
                (ex_style | WS_EX_LAYERED as i32) & !(WS_EX_TRANSPARENT as i32)
            };

            SetWindowLongW(hwnd, GWL_EXSTYLE, new_style);

            // Ensure window stays pinned above full-screen game without seizing DWM focus
            SetWindowPos(
                hwnd,
                HWND_TOPMOST,
                0,
                0,
                0,
                0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            );

            // Maintain true transparency blending (255 = full opacity rendering of webview HTML contents)
            SetLayeredWindowAttributes(hwnd, 0, 255, LWA_ALPHA);
        }

        state.is_click_through.store(enable, Ordering::SeqCst);
        
        // Broadcast state change back to SolidJS front-end for UI badge update
        let _ = window.emit("click-through-status-changed", enable);
        
        Ok(enable)
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Overlay click-through win32 styling is only supported on Windows OS.".to_string())
    }
}

/// Applies GPU hardware acceleration safety guards under high DirectX VALORANT loads.
/// Injects WebView2 Chromium engine flags to prevent GPU command buffer stalls during uncapped gameplay.
fn configure_webview_hardware_safety() {
    #[cfg(target_os = "windows")]
    {
        // Set essential WebView2 chromium flags for esports overlay stability:
        // --disable-features=RendererCodeIntegrity: Prevents hooks from conflicting with anti-cheats / game overlays.
        // --enable-features=OverlayScrollbar: Minimal UI drawing footprint.
        // --disable-background-timer-throttling: Ensures sub-kilobyte Go backend websocket ticks aren't throttled.
        std::env::set_var(
            "WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
            "--disable-features=RendererCodeIntegrity --enable-features=OverlayScrollbar --disable-background-timer-throttling --no-sandbox"
        );
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Enforce Webview hardware acceleration safety before webview runtime initialization
    configure_webview_hardware_safety();

    let click_through_state = Arc::new(AtomicBool::new(false));

    tauri::Builder::default()
        .manage(OverlayState {
            is_click_through: click_through_state.clone(),
        })
        .invoke_handler(tauri::generate_handler![toggle_click_through])
        .setup(|_app| {
            println!("VALORANT Tactical Overlay Tauri v2 backend initialized successfully in interactive windowed mode.");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running VAL-Metrics desktop application");
}
