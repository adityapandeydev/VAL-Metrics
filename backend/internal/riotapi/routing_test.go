package riotapi
import "testing"
func TestShardClusterRouting(t *testing.T) {
	c := NewClient()
	if c.GetCluster("na") != "americas" || c.GetCluster("eu") != "europe" || c.GetCluster("ap") != "asia" {
		t.Error("Global cluster routing error")
	}
}
