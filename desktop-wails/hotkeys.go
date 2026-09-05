package main

import (
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// HotkeyManager encapsulates global shortcut registration and callbacks
type HotkeyManager struct {
	app    *application.App
	window *application.WebviewWindow
}

// NewHotkeyManager creates a HotkeyManager instance bound to the application window.
func NewHotkeyManager(app *application.App, window *application.WebviewWindow) *HotkeyManager {
	return &HotkeyManager{
		app:    app,
		window: window,
	}
}

// RegisterAll binds the application global hotkeys (Alt+V, Alt+T) for HUD toggling.
func (h *HotkeyManager) RegisterAll() {
	toggleHUD := func() {
		if h.window == nil {
			return
		}
		if h.window.IsVisible() {
			h.window.Hide()
			log.Println("[Hotkeys] Global shortcut triggered: HUD Hidden")
		} else {
			h.window.Show()
			h.window.Focus()
			log.Println("[Hotkeys] Global shortcut triggered: HUD Shown & Focused")
		}
	}

	// Register Alt+V
	if err := h.app.GlobalShortcut.Register("Alt+V", toggleHUD); err != nil {
		log.Printf("[Hotkeys] Notice: Alt+V shortcut could not be bound: %v", err)
	} else {
		log.Println("[Hotkeys] Registered global shortcut: Alt+V (Toggle HUD)")
	}

	// Register Alt+T (Tactical alias)
	if err := h.app.GlobalShortcut.Register("Alt+T", toggleHUD); err != nil {
		log.Printf("[Hotkeys] Notice: Alt+T shortcut could not be bound: %v", err)
	} else {
		log.Println("[Hotkeys] Registered global shortcut: Alt+T (Toggle HUD Alias)")
	}
}
