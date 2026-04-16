package calculator
import "testing"
func TestRoleMasteryMap(t *testing.T) {
	roles := make(map[string]bool)
	roles["Duelist"] = true
	if !roles["Duelist"] {
		t.Error("Duelist role mapping failure")
	}
}
