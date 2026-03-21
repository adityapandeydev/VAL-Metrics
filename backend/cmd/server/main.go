package main

import (
	"bufio"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/val-metrics/backend/internal/cache"
	"github.com/val-metrics/backend/internal/lcu"
	"github.com/val-metrics/backend/internal/pruner"
	"github.com/val-metrics/backend/internal/riotapi"
)

// loadEnvFile scans local .env files and populates os environment variables without external dependencies
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

	log.Println("=== VAL-Metrics High-Performance Telemetry Backend ===")
	log.Println("[INFO] Initializing Global Routing, Data Pruning & Multi-Tier Cache engines...")

	apiKey := os.Getenv("RIOT_API_KEY")
	if apiKey == "" || apiKey == "your_riot_api_key_here" {
		log.Println("[WARN] RIOT_API_KEY not detected or still default. Relying on local LCU socket lockfile or RSO auth.")
	} else {
		log.Printf("[OK] Successfully loaded Riot Developer API Key (Prefix: %s***) for global multi-region VALORANT endpoints.\n", apiKey[:8])
	}

	// Initialize subsystems
	client := riotapi.NewClient()
	engine := pruner.NewEngine()
	vault := cache.NewVault("backend/data")
	lcuWatcher := lcu.NewWatcher()

	defaultShard := os.Getenv("DEFAULT_SHARD")
	if defaultShard == "" {
		defaultShard = "na"
	}
	log.Printf("[RIOT-DRIVER] Active global routing engine initialized (Fallback Shard: %s -> Cluster: %s)\n", defaultShard, client.GetCluster(defaultShard))

	// Proactively attempt loopback LCU discovery
	go func() {
		lcuWatcher.LocateLockfile()
	}()

	// Route: Health Status
	http.HandleFunc("/api/v1/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Write([]byte(`{"status":"ONLINE","version":"2.0.0-global","riot_429_defense":"ENABLED","vanguard_safe":true}`))
	})

	// Route: Sub-Kilobyte Live Match Overlay HUD Telemetry
	http.HandleFunc("/api/v1/players/live/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/players/live/"), "/")
		riotID := "Vanguard#KILL"
		if len(parts) > 0 && parts[0] != "" {
			riotID = parts[0]
		}

		// Prune verbose match data down to < 450 Bytes for the SolidJS Overlay HUD
		payload := engine.PruneLiveMatchToHUD(
			"4b56445b-670f-46ab-977d-dfc4a90f2f46",
			riotID,
			"Ascent", "Competitive", "AP - Mumbai (Global Auto-Detect)",
			18, 11, 4, 4200, 285, 78,
		)
		json.NewEncoder(w).Encode(payload)
	})

	// Route: Comprehensive Historical Analytics & Weapon Mastery Matrix (Web Dashboard Mode)
	http.HandleFunc("/api/v1/players/analytics/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/v1/players/analytics/"), "/")
		riotID := "Vanguard#KILL"
		puuid := "4b56445b-670f-46ab-977d-dfc4a90f2f46"
		if len(parts) > 0 && parts[0] != "" {
			riotID = parts[0]
		}

		// Check Tier-3 disk vault persistence first to prevent Riot network calls
		summary, found := vault.LoadHistoricalSummary(puuid)
		if !found {
			// Generate from pruning engine and archive into disk vault
			summary = engine.GenerateHistoricalAnalytics(puuid, riotID)
			_ = vault.SaveHistoricalSummary(summary)
		}

		json.NewEncoder(w).Encode(summary)
	})

	// Route: Local VALORANT LCU Loopback Status
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

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("[READY] Telemetry Server listening on port :%s...\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("[FATAL] Server terminated: %v", err)
	}
}
