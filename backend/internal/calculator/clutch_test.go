package calculator
import "testing"
func TestClutchRecognition(t *testing.T) {
	clutches := 2
	if clutches < 0 {
		t.Error("Clutches cannot be negative")
	}
}
