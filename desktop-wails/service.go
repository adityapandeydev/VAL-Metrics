package main

import (
	"log"
	"sync/atomic"

	"github.com/wailsapp/wails/v3/pkg/application"
)

// OverlayService provides desktop window and click-through management methods
// callable directly by the frontend through Wails v3 service bindings.
type OverlayService struct {
	windowName     string
	isClickThrough atomic.Bool
}

// NewOverlayService creates a new OverlayService bound to the specified window name.
func NewOverlayService(windowName string) *OverlayService {
	return &OverlayService{
		windowName: windowName,
	}
}

func (s *OverlayService) getWindow() *application.WebviewWindow {
	app := application.Get()
	if app == nil {
		return nil
	}
	win, exists := app.Window.GetByName(s.windowName)
	if !exists {
		return nil
	}
	if webviewWin, ok := win.(*application.WebviewWindow); ok {
		return webviewWin
	}
	return nil
}

// MinimizeWindow minimizes the HUD overlay.
func (s *OverlayService) MinimizeWindow() {
	if win := s.getWindow(); win != nil {
		win.Minimise()
	}
}

// MaximizeWindow toggles between maximized and restored window states.
func (s *OverlayService) MaximizeWindow() {
	if win := s.getWindow(); win != nil {
		if win.IsMaximised() {
			win.UnMaximise()
		} else {
			win.Maximise()
		}
	}
}

// CloseWindow closes the overlay window.
func (s *OverlayService) CloseWindow() {
	if win := s.getWindow(); win != nil {
		win.Close()
	}
}

// HideWindow hides the overlay from view without terminating process.
func (s *OverlayService) HideWindow() {
	if win := s.getWindow(); win != nil {
		win.Hide()
	}
}

// ShowWindow shows and focuses the overlay window.
func (s *OverlayService) ShowWindow() {
	if win := s.getWindow(); win != nil {
		win.Show()
		win.Focus()
	}
}

// ToggleClickThrough toggles mouse event transparency for in-game HUD mode.
// Full native Win32 style adjustments are hooked here and expanded in Phase 3.
func (s *OverlayService) ToggleClickThrough(enable bool) (bool, error) {
	win := s.getWindow()
	if win != nil {
		win.SetIgnoreMouseEvents(enable)
		s.isClickThrough.Store(enable)
		win.EmitEvent("click-through-status-changed", enable)
		log.Printf("[OverlayService] Click-through mode set to: %v", enable)
	}
	return enable, nil
}

// IsClickThrough returns current click-through status.
func (s *OverlayService) IsClickThrough() bool {
	return s.isClickThrough.Load()
}
