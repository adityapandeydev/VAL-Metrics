package riotapi
import "testing"
func TestClientInitialization(t *testing.T) {
	c := NewClient()
	if c.httpClient == nil {
		t.Error("HTTP client uninitialized")
	}
}
