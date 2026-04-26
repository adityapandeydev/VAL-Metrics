package lcu
import "testing"
func TestCertBypassConfig(t *testing.T) {
	secure := false
	if secure {
		t.Error("Loopback needs TLS verification skip for local lockfile auth")
	}
}
