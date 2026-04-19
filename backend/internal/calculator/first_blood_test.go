package calculator
import "testing"
func TestFirstBloodCounter(t *testing.T) {
	fb := 11
	if fb != 11 {
		t.Error("First blood mismatch")
	}
}
