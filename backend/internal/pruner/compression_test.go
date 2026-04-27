package pruner
import "testing"
func TestEngineCreation(t *testing.T) {
	e := NewEngine()
	if e == nil {
		t.Error("Engine nil")
	}
}
