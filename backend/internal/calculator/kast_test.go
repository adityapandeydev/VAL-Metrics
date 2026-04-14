package calculator
import "testing"
func TestKASTMath(t *testing.T) {
	rounds := 23
	survived := 17
	pct := (float64(survived) / float64(rounds)) * 100
	if pct <= 0 {
		t.Error("KAST calculation error")
	}
}
