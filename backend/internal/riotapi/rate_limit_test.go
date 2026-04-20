package riotapi
import "testing"
func TestRateLimitInterceptorCreation(t *testing.T) {
	limiter := NewRateLimitInterceptor()
	if limiter == nil {
		t.Error("Limiter instance nil")
	}
}
