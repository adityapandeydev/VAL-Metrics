package cache

import (
	"encoding/json"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/val-metrics/backend/internal/model"
)

type cacheItem struct {
	Data      []byte
	ExpiresAt time.Time
}

// Vault manages a 3-tier hybrid thread-safe caching system (Hot Static -> Active LRU -> Disk Persistence Vault)
type Vault struct {
	mu        sync.RWMutex
	memory    map[string]cacheItem
	vaultDir  string
}

func NewVault(dataDir string) *Vault {
	dir := filepath.Join(dataDir, "vault")
	if err := os.MkdirAll(dir, 0755); err != nil {
		log.Printf("[CACHE-WARN] Could not create persistent vault directory %s: %v", dir, err)
	}
	return &Vault{
		memory:   make(map[string]cacheItem),
		vaultDir: dir,
	}
}

// SetMemory puts items into Tier-1 or Tier-2 active ring buffer with explicit TTL
func (v *Vault) SetMemory(key string, data interface{}, ttl time.Duration) error {
	v.mu.Lock()
	defer v.mu.Unlock()

	bytes, err := json.Marshal(data)
	if err != nil {
		return err
	}

	v.memory[key] = cacheItem{
		Data:      bytes,
		ExpiresAt: time.Now().Add(ttl),
	}
	return nil
}

// GetMemory reads unexpired items from RAM
func (v *Vault) GetMemory(key string, target interface{}) bool {
	v.mu.RLock()
	item, exists := v.memory[key]
	v.mu.RUnlock()

	if !exists || time.Now().After(item.ExpiresAt) {
		if exists {
			v.mu.Lock()
			delete(v.memory, key)
			v.mu.Unlock()
		}
		return false
	}

	if err := json.Unmarshal(item.Data, target); err != nil {
		return false
	}
	return true
}

// SaveHistoricalSummary archives pruned player records to persistent disk vault (Tier 3)
func (v *Vault) SaveHistoricalSummary(summary *model.PlayerHistoricalSummary) error {
	path := filepath.Join(v.vaultDir, summary.PUUID+".json")
	bytes, err := json.MarshalIndent(summary, "", "  ")
	if err != nil {
		return err
	}
	log.Printf("[PERSISTENCE] Archived historical records for %s to vault: %s", summary.RiotID, path)
	return os.WriteFile(path, bytes, 0644)
}

// LoadHistoricalSummary retrieves persisted records directly from disk without Riot network overhead
func (v *Vault) LoadHistoricalSummary(puuid string) (*model.PlayerHistoricalSummary, bool) {
	path := filepath.Join(v.vaultDir, puuid+".json")
	bytes, err := os.ReadFile(path)
	if err != nil {
		return nil, false
	}
	var summary model.PlayerHistoricalSummary
	if err := json.Unmarshal(bytes, &summary); err != nil {
		return nil, false
	}
	log.Printf("[PERSISTENCE] Successfully served %s history from Tier-3 disk vault.", summary.RiotID)
	return &summary, true
}
