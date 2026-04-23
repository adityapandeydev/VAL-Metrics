package riotapi
import "testing"
func TestSampleMatchlistGeneration(t *testing.T) {
	list := GetSampleMatchlist("test-puuid")
	if len(list.History) != 4 {
		t.Errorf("Expected 4 fallback history matches, got %d", len(list.History))
	}
}
