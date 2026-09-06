package main

import (
	"embed"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:assets
var embeddedAssets embed.FS

// configureWebviewHardwareSafety enforces GPU hardware acceleration safety guards
// under high DirectX VALORANT loads by injecting Chromium engine flags.
func configureWebviewHardwareSafety() {
	// Prevents hooks from conflicting with anti-cheats / game overlays,
	// enables overlay scrollbars, and disables background timer throttling.
	os.Setenv(
		"WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS",
		"--disable-features=RendererCodeIntegrity --enable-features=OverlayScrollbar --disable-background-timer-throttling --no-sandbox",
	)
}

// resolveAssetFS selects between local dist filesystem (for rapid development)
// and embedded compiled assets (for standalone single binary production).
func resolveAssetFS() fs.FS {
	// Check common relative paths for compiled dist
	candidates := []string{
		"frontend/dist",
		"../frontend/dist",
		"../../frontend/dist",
	}
	for _, p := range candidates {
		if info, err := os.Stat(p); err == nil && info.IsDir() {
			log.Printf("[Wails] Serving assets from local filesystem: %s", p)
			return os.DirFS(p)
		}
	}

	// Otherwise serve embedded fallback assets
	sub, err := fs.Sub(embeddedAssets, "assets")
	if err == nil {
		return sub
	}
	return embeddedAssets
}

func main() {
	// 1. Enforce Webview hardware acceleration safety before webview runtime initialization
	configureWebviewHardwareSafety()

	// 2. Automatically detect if Vite dev server is active on http://localhost:1420
	// When active, Wails v3 AssetFileServerFS proxies directly to the live dev server (with HMR)
	if os.Getenv("FRONTEND_DEVSERVER_URL") == "" {
		conn, err := net.DialTimeout("tcp", "127.0.0.1:1420", 250*time.Millisecond)
		if err == nil {
			_ = conn.Close()
			os.Setenv("FRONTEND_DEVSERVER_URL", "http://localhost:1420")
			log.Println("[Wails] Connected to active Vite dev server at http://localhost:1420")
		}
	}

	const windowName = "overlay"
	overlayService := NewOverlayService(windowName)

	backendService, err := NewBackendService()
	if err != nil {
		log.Fatalf("Failed to initialize embedded backend service: %v", err)
	}

	// 3. Initialize the Wails v3 application
	app := application.New(application.Options{
		Name:        "VAL-Metrics",
		Description: "VALORANT In-Game Tactical HUD & Performance Intelligence",
		Services: []application.Service{
			application.NewService(overlayService),
			application.NewServiceWithOptions(backendService, application.ServiceOptions{
				Name:  "BackendService",
				Route: "/api",
			}),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(resolveAssetFS()),
			Middleware: func(next http.Handler) http.Handler {
				return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					if strings.HasPrefix(r.URL.Path, "/api/") {
						backendService.ServeHTTP(w, r)
						return
					}
					next.ServeHTTP(w, r)
				})
			},
		},
		OnShutdown: func() {
			backendService.Shutdown()
		},
		Windows: application.WindowsOptions{
			DisabledFeatures: []string{"RendererCodeIntegrity"},
			EnabledFeatures:  []string{"OverlayScrollbar"},
			AdditionalBrowserArgs: []string{
				"--disable-background-timer-throttling",
				"--no-sandbox",
			},
		},
	})

	// 3. Create the frameless overlay window mirroring Tauri dimensions (1280x820)
	window := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Name:            windowName,
		Title:           "VAL-Metrics Desktop HUD",
		URL:             "/?mode=overlay",
		Width:           1280,
		Height:          820,
		MinWidth:        900,
		MinHeight:       600,
		Frameless:       true,
		InitialPosition: application.WindowCentered,
		BackgroundType:  application.BackgroundTypeSolid,
		BackgroundColour: application.NewRGBA(11, 14, 20, 255),
	})

	// 4. Register global hotkeys (Alt+V / Alt+T) via HotkeyManager
	hotkeyManager := NewHotkeyManager(app, window)
	hotkeyManager.RegisterAll()

	log.Println("VALORANT Tactical Overlay Wails v3 desktop module initialized successfully.")

	// 5. Run application event loop
	if err := app.Run(); err != nil {
		log.Fatalf("Error running VAL-Metrics desktop application: %v", err)
	}
}
