package lcu
import "testing"
func TestWatcherCreation(t *testing.T) {
	w := NewWatcher()
	if w == nil {
		t.Error("Watcher nil")
	}
}
