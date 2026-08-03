package sync

import (
	"context"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/val-metrics/backend/internal/database"
	"github.com/val-metrics/backend/internal/model"
	"github.com/val-metrics/backend/internal/riotapi"
)

// Daemon automatically crawls and syncs competitive match archives into our persistent database
// to ensure VAL-Metrics builds an immutable historical dataset outperforming traditional trackers.
type Daemon struct {
	db          database.Engine
	riotClient  *riotapi.Client
	mu          sync.Mutex
	inProgress  map[string]bool      // PUUID -> running sync status
	lastSynced  map[string]time.Time // Key -> timestamp of last sync attempt
	stopCh      chan struct{}
}

func NewDaemon(db database.Engine, riotClient *riotapi.Client) *Daemon {
	return &Daemon{
		db:         db,
		riotClient: riotClient,
		inProgress: make(map[string]bool),
		lastSynced: make(map[string]time.Time),
		stopCh:     make(chan struct{}),
	}
}

func (d *Daemon) Start(pollInterval time.Duration, maxStaleAge time.Duration) {
	log.Printf("[AUTO-SYNC-DAEMON] Background Riot Match telemetry harvesting engine operational (Interval: %v, Cooldown: 3m)", pollInterval)
	ticker := time.NewTicker(pollInterval)
	go func() {
		for {
			select {
			case <-ticker.C:
				d.runCycle(maxStaleAge)
			case <-d.stopCh:
				ticker.Stop()
				return
			}
		}
	}()
}

func (d *Daemon) Stop() {
	close(d.stopCh)
}

func (d *Daemon) runCycle(maxStaleAge time.Duration) {
	accounts, err := d.db.ListAccountsForAutoSync(maxStaleAge)
	if err != nil || len(accounts) == 0 {
		return
	}
	for _, acc := range accounts {
		go d.SyncPlayerNow(acc.PUUID, acc.GameName, acc.TagLine, acc.InternalShard)
	}
}

func (d *Daemon) SyncPlayerNow(puuid, gameName, tagLine, shard string) *model.SyncStatusReport {
	d.mu.Lock()
	syncKey := puuid
	if syncKey == "" || syncKey == "4b56445b-670f-46ab-977d-dfc4a90f2f46" {
		syncKey = fmt.Sprintf("%s#%s", strings.ToLower(gameName), strings.ToLower(tagLine))
	}
	if last, ok := d.lastSynced[syncKey]; ok && time.Since(last) < 3*time.Minute {
		d.mu.Unlock()
		return &model.SyncStatusReport{
			PUUID:       puuid,
			RiotID:      fmt.Sprintf("%s#%s", gameName, tagLine),
			SyncState:   "COOLDOWN",
			LastSyncAgo: fmt.Sprintf("%ds ago (3-minute sync protection active)", int(time.Since(last).Seconds())),
		}
	}
	if d.inProgress[syncKey] {
		d.mu.Unlock()
		return &model.SyncStatusReport{PUUID: puuid, RiotID: fmt.Sprintf("%s#%s", gameName, tagLine), SyncState: "SYNCING", LastSyncAgo: "In Progress"}
	}
	d.inProgress[syncKey] = true
	d.lastSynced[syncKey] = time.Now()
	d.mu.Unlock()

	defer func() {
		d.mu.Lock()
		delete(d.inProgress, syncKey)
		d.mu.Unlock()
	}()

	log.Printf("[AUTO-SYNC] Initiating deep telemetry harvest for %s#%s (PUUID: %s... on shard: %s)", gameName, tagLine, puuid[:8], strings.ToUpper(shard))
	ctx := context.Background()

	// 1. If PUUID is placeholder or unresolved, resolve via Riot Cloud globally across clusters
	if puuid == "" || puuid == "4b56445b-670f-46ab-977d-dfc4a90f2f46" {
		accResp, resolvedShard, err := d.riotClient.ResolveRiotID(ctx, gameName, tagLine, shard)
		if err == nil && accResp != nil && accResp.PUUID != "" {
			puuid = accResp.PUUID
			if resolvedShard != "" {
				shard = resolvedShard
			}
		}
	}

	// 2. Fetch live VAL-Match V1 history from Riot API
	matches, err := d.riotClient.FetchPlayerMatches(ctx, puuid, shard, "all")
	if err != nil {
		log.Printf("[AUTO-SYNC] Notice: cloud pull failed for %s (%v). Maintaining cached database state.", puuid[:8], err)
		return &model.SyncStatusReport{PUUID: puuid, RiotID: fmt.Sprintf("%s#%s", gameName, tagLine), SyncState: "FAILED", ErrorMessage: err.Error()}
	}

	newCount := 0
	for _, m := range matches {
		if err := d.db.SaveMatch(puuid, &m); err == nil {
			newCount++
		}
	}

	// 3. Update database profile record
	acc := &model.RiotLinkedAccount{
		PUUID:          puuid,
		GameName:       gameName,
		TagLine:        tagLine,
		InternalShard:  shard,
		LastSyncedAt:   time.Now(),
		TotalMatchesDb: d.db.CountPlayerMatches(puuid),
	}
	d.db.SaveRiotAccount(acc)

	log.Printf("[AUTO-SYNC] Successfully preserved %d match records into persistent database for %s#%s!", newCount, gameName, tagLine)
	return &model.SyncStatusReport{
		PUUID:           puuid,
		RiotID:          fmt.Sprintf("%s#%s", gameName, tagLine),
		SyncState:       "COMPLETED",
		NewMatchesCount: newCount,
		LastSyncAgo:     "Just now",
	}
}
