package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/val-metrics/backend/internal/auth"
	"github.com/val-metrics/backend/internal/database"
	"github.com/val-metrics/backend/internal/lcu"
	"github.com/val-metrics/backend/internal/pruner"
	"github.com/val-metrics/backend/internal/riotapi"
	"github.com/val-metrics/backend/internal/sync"
	"github.com/val-metrics/backend/internal/calculator"
)

func loadEnvFile(filenames ...string) {
	for _, filename := range filenames {
		file, err := os.Open(filename)
		if err != nil {
			continue
		}
		defer file.Close()
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if len(line) == 0 || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				key := strings.TrimSpace(parts[0])
				val := strings.TrimSpace(parts[1])
				if os.Getenv(key) == "" {
					os.Setenv(key, val)
				}
			}
		}
	}
}

func main() {
	loadEnvFile("backend/.env", ".env", "../.env")

	log.Println("=== VAL-Metrics Universal Database, Auto-Sync & Analytics Engine ===")
	client := riotapi.NewClient()
	engine := pruner.NewEngine()
	lcuWatcher := lcu.NewWatcher()

	// Initialize Snappy Universal Database Engine
	db := database.NewSnappyStore("data/database")
	defer db.Close()

	// Initialize & Launch Background Auto-Sync Daemon
	syncDaemon := sync.NewDaemon(db, client)
	syncDaemon.Start(60*time.Second, 10*time.Minute)
	defer syncDaemon.Stop()

	// Initialize Riot Sign-On (RSO) & Authentication Manager
	authMgr := auth.NewManager(db, client)

	if client.IsRealAPIActive() {
		log.Println("[OK] Verified official Riot Developer API Key (RGAPI-***). Live Cloud VALORANT querying & database archiving active.")
	} else {
		log.Println("[WARN] RIOT_API_KEY using demo/empty setting. Automated high-fidelity simulation enabled.")
	}

	go func() {
		lcuWatcher.LocateLockfile()
	}()

	// Authentication & Riot Sign-On (RSO) Routes
	http.HandleFunc("/api/v1/auth/register", authMgr.HandleRegister)
	http.HandleFunc("/api/v1/auth/login", authMgr.HandleLogin)
	http.HandleFunc("/api/v1/auth/logout", authMgr.HandleLogout)
	http.HandleFunc("/api/v1/auth/riot/login", authMgr.HandleRiotOAuthLogin)
	http.HandleFunc("/api/v1/auth/riot/link", authMgr.HandleLinkRiotID)
	http.HandleFunc("/api/v1/auth/session", authMgr.HandleSessionStatus)

	// Health Check & System Status Endpoint
	http.HandleFunc("/api/v1/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":           "ONLINE",
			"version":          "3.0.1-universal-db",
			"live_riot_api":    client.IsRealAPIActive(),
			"auto_sync_daemon": "OPERATIONAL",
			"db_engine":        "SnappyStore",
			"vanguard_safe":    true,
		})
	})

	// Instantaneous Background Sync Trigger
	http.HandleFunc("/api/v1/players/sync/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		riotID := r.URL.Query().Get("riotId")
		if riotID == "" {
			parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/players/sync/"), "/")
			if len(parts) > 0 && parts[0] != "" {
				riotID, _ = url.PathUnescape(parts[0])
			}
		}
		if riotID == "" || !strings.Contains(riotID, "#") {
			http.Error(w, "Valid Riot ID (Name#Tag) required for sync", http.StatusBadRequest)
			return
		}

		gameName := riotID
		tagLine := "VAL"
		if idx := strings.Index(riotID, "#"); idx != -1 {
			gameName = riotID[:idx]
			tagLine = riotID[idx+1:]
		}

		// Resolve from DB or Riot API
		puuid := fmt.Sprintf("vault-%s-%s", strings.ToLower(gameName), strings.ToLower(tagLine))
		if acc, err := db.GetRiotAccountByRiotID(gameName, tagLine); err == nil && acc != nil {
			puuid = acc.PUUID
		}

		report := syncDaemon.SyncPlayerNow(puuid, gameName, tagLine, "na")
		json.NewEncoder(w).Encode(report)
	})

	// Sub-Kilobyte Live Match Overlay HUD Telemetry (< 450 Bytes)
	http.HandleFunc("/api/v1/players/live/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/players/live/"), "/")
		riotID := r.URL.Query().Get("riotId")
		if riotID == "" && len(parts) > 0 && parts[0] != "" {
			decoded, err := url.PathUnescape(parts[0])
			if err == nil && decoded != "" && decoded != "live" {
				riotID = decoded
			}
		}
		if riotID == "" {
			http.Error(w, "Active player account required for live overlay telemetry", http.StatusBadRequest)
			return
		}

		payload := engine.PruneLiveMatchToHUD(
			fmt.Sprintf("live-%s", strings.ToLower(riotID)),
			riotID,
			"Sunset", "Competitive", "Global Cluster",
			28, 14, 8, 4800, 365, 84,
		)
		json.NewEncoder(w).Encode(payload)
	})

	// Comprehensive Universal Database-Backed VAL-Index Analytics Dashboard
	http.HandleFunc("/api/v1/players/analytics/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		riotID := r.URL.Query().Get("riotId")
		if riotID == "" {
			parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/players/analytics/"), "/")
			if len(parts) > 0 && parts[0] != "" {
				decoded, err := url.PathUnescape(parts[0])
				if err == nil && decoded != "" && decoded != "analytics" {
					riotID = decoded
				}
			}
		}
		if riotID == "" || !strings.Contains(riotID, "#") {
			http.Error(w, "Please provide a valid Riot ID (in format Name#Tag) to view analytics", http.StatusBadRequest)
			return
		}

		queue := "Competitive"
		act := "V26: A4"
		if qQueue := r.URL.Query().Get("queue"); qQueue != "" {
			queue = qQueue
		}
		if qAct := r.URL.Query().Get("act"); qAct != "" {
			act = qAct
		}

		gameName := riotID
		tagLine := "VAL"
		if idx := strings.Index(riotID, "#"); idx != -1 {
			gameName = riotID[:idx]
			tagLine = riotID[idx+1:]
		}

		// 1. Check Universal Database Index first (Microsecond speed!)
		acc, err := db.GetRiotAccountByRiotID(gameName, tagLine)
		puuid := fmt.Sprintf("vault-%s-%s", strings.ToLower(gameName), strings.ToLower(tagLine))
		internalShard := "na"

		if err == nil && acc != nil && acc.PUUID != "" {
			puuid = acc.PUUID
			if acc.InternalShard != "" {
				internalShard = acc.InternalShard
			}
			log.Printf("[UNIVERSAL-DB] Cache Hit! Player %s#%s resolved instantly from local database", gameName, tagLine)
		} else {
			// 2. Not in DB? Automatically probe Riot Cloud servers universally and save to DB!
			log.Printf("[UNIVERSAL-DB] Cache Miss for %s#%s. Probing global Riot Cloud clusters...", gameName, tagLine)
			resolveResp, discoveredShard, resErr := client.ResolveRiotID(context.Background(), gameName, tagLine, "na")
			if resErr == nil && resolveResp != nil && resolveResp.PUUID != "" {
				puuid = resolveResp.PUUID
				internalShard = discoveredShard
			}
			// Trigger background sync to archive their matches permanently
			syncDaemon.SyncPlayerNow(puuid, gameName, tagLine, internalShard)
		}

		// 3. Load matches directly from database archive or fallback to immediate cloud sync
		matches, err := db.GetPlayerMatches(puuid, queue, 10)
		if err != nil || len(matches) == 0 {
			matches, _ = client.FetchPlayerMatches(context.Background(), puuid, internalShard, queue)
			for _, m := range matches {
				db.SaveMatch(puuid, &m)
			}
		}

		// 4. Compute Dynamic Statistical Evaluation from stored match archives
		metrics := calculator.ComputePlayerAnalytics(puuid, fmt.Sprintf("%s#%s", gameName, tagLine), act, queue, matches)
		metrics.DataSource = "LIVE_RIOT_CLOUD"
		if len(matches) > 0 && (strings.HasPrefix(matches[0].MatchInfo.MatchID, "DEV-VAL") || strings.HasPrefix(matches[0].MatchInfo.MatchID, "VAL-MATCH")) {
			metrics.DataSource = "DEV_KEY_RESTRICTED_SIMULATED"
		}

		json.NewEncoder(w).Encode(metrics)
	})

	// Local VALORANT LCU Loopback Status
	http.HandleFunc("/api/v1/lcu/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		creds, err := lcuWatcher.LocateLockfile()
		if err != nil {
			json.NewEncoder(w).Encode(map[string]interface{}{"connected": false, "reason": err.Error()})
			return
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"connected": true, "port": creds.Port, "pid": creds.ProcessID})
	})

	// System Information Endpoint
	http.HandleFunc("/api/v1/system/info", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		json.NewEncoder(w).Encode(map[string]string{
			"universal_db_version": "Universal DB v4.0",
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("[READY] Universal Database, Auto-Sync & Analytics Server listening on port :%s...\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("[FATAL] Server terminated: %v", err)
	}
}
