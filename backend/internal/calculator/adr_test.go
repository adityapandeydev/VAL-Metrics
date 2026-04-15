package calculator
import "testing"
func TestADRMath(t *testing.T) {
	dmg := 4866
	rounds := 23
	adr := float64(dmg) / float64(rounds)
	if adr < 210 || adr > 212 {
		t.Errorf("Expected ~211.5 ADR, got %v", adr)
	}
}
