package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync/atomic"

	"github.com/val-metrics/backend"
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
// Applies native Win32 extended styles (WS_EX_TRANSPARENT, WS_EX_LAYERED, HWND_TOPMOST)
// for true pointer bypass into VALORANT, along with Wails runtime mouse event controls.
func (s *OverlayService) ToggleClickThrough(enable bool) (bool, error) {
	win := s.getWindow()
	if win == nil {
		return false, fmt.Errorf("overlay window not available")
	}

	// 1. Apply native Win32 extended styles for true pointer bypass into VALORANT
	hwnd := GetHWND(win)
	if hwnd != 0 {
		if err := ApplyWin32ClickThrough(hwnd, enable); err != nil {
			log.Printf("[OverlayService] Warning: ApplyWin32ClickThrough failed: %v", err)
		}
	}

	// 2. Also toggle Wails v3 built-in mouse event ignoring
	win.SetIgnoreMouseEvents(enable)

	// 3. Update internal state
	s.isClickThrough.Store(enable)

	// 4. Emit event to frontend (listened to by LiveMatchOverlay.tsx for badge state)
	win.EmitEvent("click-through-status-changed", enable)

	log.Printf("[OverlayService] Click-through mode set to: %v", enable)
	return enable, nil
}

// IsClickThrough returns current click-through status.
func (s *OverlayService) IsClickThrough() bool {
	return s.isClickThrough.Load()
}

// BackendService exposes the in-process Go backend server to Wails v3,
// providing HTTP route mounting, automatic lifecycle management,
// and direct RPC methods for the desktop HUD.
type BackendService struct {
	server *backend.EmbeddedServer
}

// NewBackendService initializes an in-process BackendService instance.
func NewBackendService() (*BackendService, error) {
	server, err := backend.NewServer(backend.ServerConfig{})
	if err != nil {
		return nil, fmt.Errorf("failed to create embedded backend server: %w", err)
	}
	return &BackendService{
		server: server,
	}, nil
}

// ServiceStartup satisfies application.ServiceStartup, launching the backend server on desktop start.
func (s *BackendService) ServiceStartup(ctx context.Context, options application.ServiceOptions) error {
	log.Println("[BackendService] Starting in-process backend server...")
	return s.server.Start()
}

// ServiceShutdown satisfies application.ServiceShutdown, gracefully stopping daemons and database.
func (s *BackendService) ServiceShutdown() error {
	log.Println("[BackendService] Shutting down in-process backend server...")
	return s.server.Stop()
}

// ServeHTTP satisfies http.Handler so Wails AssetServer can route /api requests in-process.
func (s *BackendService) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if s.server != nil {
		s.server.ServeHTTP(w, r)
		return
	}
	http.Error(w, "Backend service unavailable", http.StatusServiceUnavailable)
}

// Shutdown provides a manual shutdown hook for Wails app.OnShutdown.
func (s *BackendService) Shutdown() {
	if s.server != nil {
		_ = s.server.Stop()
	}
}

// GetServer returns the underlying EmbeddedServer instance.
func (s *BackendService) GetServer() *backend.EmbeddedServer {
	return s.server
}

// CheckLCU provides direct RPC access to LCU credentials from the frontend without HTTP.
func (s *BackendService) CheckLCU() map[string]interface{} {
	if s.server == nil {
		return map[string]interface{}{"connected": false, "reason": "backend not initialized"}
	}
	creds, err := s.server.LocateLCU()
	if err != nil {
		return map[string]interface{}{"connected": false, "reason": err.Error()}
	}
	return map[string]interface{}{"connected": true, "port": creds.Port, "pid": creds.ProcessID}
}

