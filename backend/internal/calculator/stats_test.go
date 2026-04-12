package calculator
import "testing"
func TestComputePlayerAnalyticsEmpty(t *testing.T) {
	res := ComputePlayerAnalytics("puuid-001", "Player#1", "V26: A4", "Competitive", nil)
	if res.TotalMatches != 0 {
		t.Errorf("Expected 0 matches, got %d", res.TotalMatches)
	}
}
