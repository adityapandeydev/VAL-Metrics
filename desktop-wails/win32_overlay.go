package main

import (
	"fmt"
	"log"

	"github.com/wailsapp/wails/v3/pkg/application"
	"golang.org/x/sys/windows"
)

const (
	// Win32 Window Extended Styles
	GWL_EXSTYLE       int32 = -20
	WS_EX_LAYERED     int32 = 0x00080000
	WS_EX_TRANSPARENT int32 = 0x00000020
	WS_EX_NOACTIVATE  int32 = 0x08000000

	// SetWindowPos Flags
	HWND_TOPMOST   uintptr = ^uintptr(0) // -1
	SWP_NOSIZE     uint32  = 0x0001
	SWP_NOMOVE     uint32  = 0x0002
	SWP_NOACTIVATE uint32  = 0x0010

	// Layered Window Attributes
	LWA_ALPHA uint32 = 0x00000002
)

var (
	user32 = windows.NewLazySystemDLL("user32.dll")

	procGetWindowLongW    = user32.NewProc("GetWindowLongW")
	procSetWindowLongW    = user32.NewProc("SetWindowLongW")
	procGetWindowLongPtrW = user32.NewProc("GetWindowLongPtrW")
	procSetWindowLongPtrW = user32.NewProc("SetWindowLongPtrW")

	procSetWindowPos               = user32.NewProc("SetWindowPos")
	procSetLayeredWindowAttributes = user32.NewProc("SetLayeredWindowAttributes")
)

func getWindowLongPtr(hwnd uintptr, index int32) (uintptr, error) {
	if err := procGetWindowLongPtrW.Find(); err == nil {
		r, _, callErr := procGetWindowLongPtrW.Call(hwnd, uintptr(index))
		return r, callErr
	}
	r, _, callErr := procGetWindowLongW.Call(hwnd, uintptr(index))
	return r, callErr
}

func setWindowLongPtr(hwnd uintptr, index int32, value uintptr) (uintptr, error) {
	if err := procSetWindowLongPtrW.Find(); err == nil {
		r, _, callErr := procSetWindowLongPtrW.Call(hwnd, uintptr(index), value)
		return r, callErr
	}
	r, _, callErr := procSetWindowLongW.Call(hwnd, uintptr(index), value)
	return r, callErr
}

// GetHWND extracts the native Win32 window handle from a Wails v3 WebviewWindow.
func GetHWND(win *application.WebviewWindow) uintptr {
	if win == nil {
		return 0
	}
	ptr := win.NativeWindow()
	if ptr == nil {
		return 0
	}
	return uintptr(ptr)
}

// ApplyWin32ClickThrough modifies the Win32 window extended styles to enable or disable
// mouse click-through capability. When enabled, all pointer events bypass the WebView2
// overlay directly into VALORANT.
func ApplyWin32ClickThrough(hwnd uintptr, enable bool) error {
	if hwnd == 0 {
		return fmt.Errorf("invalid native window handle (HWND is null)")
	}

	// 1. Retrieve existing extended style flags
	r0, err := getWindowLongPtr(hwnd, GWL_EXSTYLE)
	if r0 == 0 && err != windows.ERROR_SUCCESS {
		return fmt.Errorf("failed to get window extended style: %w", err)
	}
	exStyle := int32(r0)

	// 2. Compute new extended styles
	var newStyle int32
	if enable {
		// Attach WS_EX_TRANSPARENT (ignore pointer events) and WS_EX_NOACTIVATE (prevent window focus seizure)
		newStyle = exStyle | WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_NOACTIVATE
	} else {
		// Strip WS_EX_TRANSPARENT so UI becomes interactive again, maintain layered transparency
		newStyle = (exStyle | WS_EX_LAYERED) &^ WS_EX_TRANSPARENT
	}

	// 3. Apply updated extended styles
	r1, err := setWindowLongPtr(hwnd, GWL_EXSTYLE, uintptr(newStyle))
	if r1 == 0 && err != windows.ERROR_SUCCESS {
		log.Printf("[Win32Overlay] Notice: setWindowLongPtr returned 0: %v", err)
	}

	// 4. Ensure window stays pinned above full-screen game without seizing DWM focus
	procSetWindowPos.Call(
		hwnd,
		HWND_TOPMOST,
		0,
		0,
		0,
		0,
		uintptr(SWP_NOMOVE|SWP_NOSIZE|SWP_NOACTIVATE),
	)

	// 5. Maintain true transparency blending (255 = full opacity rendering of webview HTML contents)
	procSetLayeredWindowAttributes.Call(hwnd, 0, 255, uintptr(LWA_ALPHA))

	log.Printf("[Win32Overlay] HWND 0x%X click-through updated to: %v (ExStyle: 0x%08X -> 0x%08X)",
		hwnd, enable, uint32(exStyle), uint32(newStyle))

	return nil
}
