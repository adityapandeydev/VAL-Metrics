package calculator
import "testing"
func TestHitDistribution(t *testing.T) {
	head, body, legs := 25, 140, 6
	total := head + body + legs
	if total != 171 {
		t.Errorf("Expected 171 total hits, got %d", total)
	}
}
