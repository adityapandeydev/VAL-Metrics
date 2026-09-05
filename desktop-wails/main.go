package main

import (
	"embed"
	"io/fs"
	"log"
	"os"

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
	// If ../frontend/dist exists on disk, serve directly
	if info, err := os.Stat("../frontend/dist"); err == nil && info.IsDir() {
		return os.DirFS("../frontend/dist")
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

	const windowName = "overlay"
	overlayService := NewOverlayService(windowName)

	// 2. Initialize the Wails v3 application
	app := application.New(application.Options{
		Name:        "VAL-Metrics",
		Description: "VALORANT In-Game Tactical HUD & Performance Intelligence",
		Services: []application.Service{
			application.NewService(overlayService),
		},
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(resolveAssetFS()),
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
		URL:             "/",
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
