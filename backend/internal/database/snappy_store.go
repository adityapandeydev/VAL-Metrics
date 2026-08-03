package database

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/val-metrics/backend/internal/model"
	"github.com/val-metrics/backend/internal/riotapi"
)

// SnappyStore provides sub-millisecond RAM-indexed reads backed by durable disk serialization.
// Designed to surpass Tracker.gg query responsiveness while eliminating Windows CGO compiler friction.
type SnappyStore struct {
	mu         sync.RWMutex
	baseDir    string
	users      map[string]*model.User               // UserID -> User
	usernameMap map[string]string                   // lowercase(username) -> UserID
	riotAccounts map[string]*model.RiotLinkedAccount // PUUID -> Account
	riotIDMap  map[string]string                    // lowercase("gameName#tagLine") -> PUUID
	matches    map[string][]riotapi.MatchDTO        // PUUID -> chronological Matches
}

func NewSnappyStore(dataDirectory string) *SnappyStore {
	store := &SnappyStore{
		baseDir:      dataDirectory,
		users:        make(map[string]*model.User),
		usernameMap:  make(map[string]string),
		riotAccounts: make(map[string]*model.RiotLinkedAccount),
		riotIDMap:    make(map[string]string),
		matches:      make(map[string][]riotapi.MatchDTO),
	}
	store.initDirs()
	store.loadFromDisk()
	return store
}

func (s *SnappyStore) initDirs() {
	dirs := []string{"users", "riot_accounts", "matches"}
	for _, d := range dirs {
		os.MkdirAll(filepath.Join(s.baseDir, d), 0755)
	}
}

func (s *SnappyStore) loadFromDisk() {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Load Users
	files, _ := os.ReadDir(filepath.Join(s.baseDir, "users"))
	for _, f := range files {
		if strings.HasSuffix(f.Name(), ".json") {
			data, err := os.ReadFile(filepath.Join(s.baseDir, "users", f.Name()))
			if err == nil {
				var u model.User
				if json.Unmarshal(data, &u) == nil && u.UserID != "" {
					s.users[u.UserID] = &u
					s.usernameMap[strings.ToLower(u.Username)] = u.UserID
				}
			}
		}
	}

	// Load Riot Accounts
	accFiles, _ := os.ReadDir(filepath.Join(s.baseDir, "riot_accounts"))
	for _, f := range accFiles {
		if strings.HasSuffix(f.Name(), ".json") {
			data, err := os.ReadFile(filepath.Join(s.baseDir, "riot_accounts", f.Name()))
			if err == nil {
				var acc model.RiotLinkedAccount
				if json.Unmarshal(data, &acc) == nil && acc.PUUID != "" {
					s.riotAccounts[acc.PUUID] = &acc
					key := strings.ToLower(fmt.Sprintf("%s#%s", acc.GameName, acc.TagLine))
					s.riotIDMap[key] = acc.PUUID
				}
			}
		}
	}

	// Load Matches
	matchDirs, _ := os.ReadDir(filepath.Join(s.baseDir, "matches"))
	for _, d := range matchDirs {
		if d.IsDir() {
			puuid := d.Name()
			mFiles, _ := os.ReadDir(filepath.Join(s.baseDir, "matches", puuid))
			for _, mf := range mFiles {
				if strings.HasSuffix(mf.Name(), ".json") {
					mData, err := os.ReadFile(filepath.Join(s.baseDir, "matches", puuid, mf.Name()))
					if err == nil {
						var match riotapi.MatchDTO
						if json.Unmarshal(mData, &match) == nil && match.MatchInfo.MatchID != "" {
							s.matches[puuid] = append(s.matches[puuid], match)
						}
					}
				}
			}
			sort.Slice(s.matches[puuid], func(i, j int) bool {
				return s.matches[puuid][i].MatchInfo.GameStartMillis > s.matches[puuid][j].MatchInfo.GameStartMillis
			})
		}
	}

	log.Printf("[SNAPPY-DB] Loaded universal index: %d Users, %d Riot Profiles, %d Player Match Vaults in-memory.", len(s.users), len(s.riotAccounts), len(s.matches))
}

func (s *SnappyStore) SaveUser(u *model.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.users[u.UserID] = u
	s.usernameMap[strings.ToLower(u.Username)] = u.UserID
	data, _ := json.MarshalIndent(u, "", "  ")
	return os.WriteFile(filepath.Join(s.baseDir, "users", u.UserID+".json"), data, 0644)
}

func (s *SnappyStore) GetUserByUsername(username string) (*model.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	id, exists := s.usernameMap[strings.ToLower(username)]
	if !exists {
		return nil, fmt.Errorf("user %s not found in database", username)
	}
	return s.users[id], nil
}

func (s *SnappyStore) GetUserByID(id string) (*model.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	u, exists := s.users[id]
	if !exists {
		return nil, fmt.Errorf("user ID %s not found in database", id)
	}
	return u, nil
}

func (s *SnappyStore) LinkRiotAccountToUser(userID, puuid string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	u, exists := s.users[userID]
	if !exists {
		return fmt.Errorf("user ID %s not found", userID)
	}
	u.LinkedPUUID = puuid
	u.IsRiotVerified = true
	data, _ := json.MarshalIndent(u, "", "  ")
	os.WriteFile(filepath.Join(s.baseDir, "users", u.UserID+".json"), data, 0644)
	
	if acc, ok := s.riotAccounts[puuid]; ok {
		acc.VerifiedUserID = userID
		accData, _ := json.MarshalIndent(acc, "", "  ")
		os.WriteFile(filepath.Join(s.baseDir, "riot_accounts", puuid+".json"), accData, 0644)
	}
	return nil
}

func (s *SnappyStore) SaveRiotAccount(acc *model.RiotLinkedAccount) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.riotAccounts[acc.PUUID] = acc
	key := strings.ToLower(fmt.Sprintf("%s#%s", acc.GameName, acc.TagLine))
	s.riotIDMap[key] = acc.PUUID
	data, _ := json.MarshalIndent(acc, "", "  ")
	return os.WriteFile(filepath.Join(s.baseDir, "riot_accounts", acc.PUUID+".json"), data, 0644)
}

func (s *SnappyStore) GetRiotAccountByRiotID(gameName, tagLine string) (*model.RiotLinkedAccount, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	key := strings.ToLower(fmt.Sprintf("%s#%s", gameName, tagLine))
	puuid, exists := s.riotIDMap[key]
	if !exists {
		return nil, fmt.Errorf("riot account %s#%s not found in universal database", gameName, tagLine)
	}
	return s.riotAccounts[puuid], nil
}

func (s *SnappyStore) GetRiotAccountByPUUID(puuid string) (*model.RiotLinkedAccount, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	acc, exists := s.riotAccounts[puuid]
	if !exists {
		return nil, fmt.Errorf("puuid %s not found in universal database", puuid)
	}
	return acc, nil
}

func (s *SnappyStore) SearchRiotAccounts(prefix string, limit int) ([]*model.RiotLinkedAccount, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	prefix = strings.ToLower(strings.TrimSpace(prefix))
	var results []*model.RiotLinkedAccount
	for key, puuid := range s.riotIDMap {
		if strings.HasPrefix(key, prefix) {
			results = append(results, s.riotAccounts[puuid])
			if len(results) >= limit {
				break
			}
		}
	}
	return results, nil
}

func (s *SnappyStore) ListAccountsForAutoSync(maxStaleAge time.Duration) ([]*model.RiotLinkedAccount, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	now := time.Now()
	var out []*model.RiotLinkedAccount
	for _, acc := range s.riotAccounts {
		if now.Sub(acc.LastSyncedAt) >= maxStaleAge {
			out = append(out, acc)
		}
	}
	return out, nil
}

func (s *SnappyStore) SaveMatch(puuid string, match *riotapi.MatchDTO) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Dedup check
	for _, m := range s.matches[puuid] {
		if m.MatchInfo.MatchID == match.MatchInfo.MatchID {
			return nil // Already stored in historical archive
		}
	}
	s.matches[puuid] = append([]riotapi.MatchDTO{*match}, s.matches[puuid]...)
	sort.Slice(s.matches[puuid], func(i, j int) bool {
		return s.matches[puuid][i].MatchInfo.GameStartMillis > s.matches[puuid][j].MatchInfo.GameStartMillis
	})
	if acc, ok := s.riotAccounts[puuid]; ok {
		acc.TotalMatchesDb = len(s.matches[puuid])
	}
	dir := filepath.Join(s.baseDir, "matches", puuid)
	os.MkdirAll(dir, 0755)
	data, _ := json.MarshalIndent(match, "", "  ")
	return os.WriteFile(filepath.Join(dir, match.MatchInfo.MatchID+".json"), data, 0644)
}

func (s *SnappyStore) GetPlayerMatches(puuid, queue string, limit int) ([]riotapi.MatchDTO, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	all, exists := s.matches[puuid]
	if !exists || len(all) == 0 {
		return nil, fmt.Errorf("no match records archived for PUUID %s", puuid)
	}
	var filtered []riotapi.MatchDTO
	for _, m := range all {
		if queue == "" || queue == "all" || strings.EqualFold(queue, "All Acts") || strings.EqualFold(m.MatchInfo.QueueID, queue) {
			filtered = append(filtered, m)
			if len(filtered) >= limit {
				break
			}
		}
	}
	return filtered, nil
}

func (s *SnappyStore) CountPlayerMatches(puuid string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return len(s.matches[puuid])
}

func (s *SnappyStore) Close() error {
	return nil
}
