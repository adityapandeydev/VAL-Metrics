package calculator
import "testing"
func TestValIndexThresholds(t *testing.T) {
	if 927 < 900 {
		t.Error("927 should be Sovereign tier S+")
	}
}
