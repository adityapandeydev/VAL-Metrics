package pruner

import "testing"

func TestHUDPacketPruning(t *testing.T) {
	e := NewEngine()
	res := e.PruneLiveMatchToHUD("test", "id#1", "Sunset", "Competitive", "AP", 10, 5, 2, 3000, 250, 50)
	if res == nil {
		t.Error("HUD pruning returned nil payload")
	}
}
