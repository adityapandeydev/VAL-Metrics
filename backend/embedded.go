package backend

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	stdSync "sync"
	"sync/atomic"
	"time"

	"github.com/val-metrics/backend/internal/auth"
	"github.com/val-metrics/backend/internal/calculator"
	"github.com/val-metrics/backend/internal/database"
	"github.com/val-metrics/backend/internal/lcu"
	"github.com/val-metrics/backend/internal/pruner"
	"github.com/val-metrics/backend/internal/riotapi"
	valSync "github.com/val-metrics/backend/internal/sync"
)

// ServerConfig defines initialization parameters for the embedded backend engine.
type ServerConfig struct {
	Port         string
	DatabasePath string
	EnvFiles     []string
}

// EmbeddedServer wraps the Universal Database, Auto-Sync Daemon, LCU process watcher,
// and REST API routes into an in-process Go server suitable for single-binary desktop execution.
type EmbeddedServer struct {
	config     ServerConfig
	db         *database.SnappyStore
	syncDaemon *valSync.Daemon
	client     *riotapi.Client
	authMgr    *auth.Manager
	engine     *pruner.Engine
	lcuWatcher *lcu.Watcher
	mux        *http.ServeMux
	handler    http.Handler
	httpServer *http.Server
	listener   net.Listener
	running    atomic.Bool
	mu         stdSync.Mutex
}

// loadEnvFiles parses .env key-value pairs without overriding existing environment variables.
func loadEnvFiles(filenames ...string) {
	for _, filename := range filenames {
		file, err := os.Open(filename)
		if err != nil {
			continue
		}
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
		if err := scanner.Err(); err != nil {
			log.Printf("[EmbeddedServer] [WARN] Error scanning env file %s: %v", filename, err)
		}
		file.Close()
	}
}

// resolveDatabasePath dynamically locates the SnappyStore database folder across runtimes.
func resolveDatabasePath(customPath string) string {
	if customPath != "" {
		return customPath
	}
	candidates := []string{
		"backend/data/database",
		"data/database",
		"../backend/data/database",
		"../../backend/data/database",
	}
	for _, p := range candidates {
		if fi, err := os.Stat(p); err == nil && fi.IsDir() {
			return p
		}
	}
	// Default to backend/data/database if running from project root
	if fi, err := os.Stat("backend"); err == nil && fi.IsDir() {
		_ = os.MkdirAll("backend/data/database", 0755)
		return "backend/data/database"
	}
	_ = os.MkdirAll("data/database", 0755)
	return "data/database"
}

// NewServer initializes all backend subsystems and mounts the complete REST API.
func NewServer(cfg ServerConfig) (*EmbeddedServer, error) {
	// 1. Load environment variables
	envCandidates := []string{
		"backend/.env",
		".env",
		"../backend/.env",
		"../.env",
	}
	if len(cfg.EnvFiles) > 0 {
		envCandidates = append(envCandidates, cfg.EnvFiles...)
	}
	loadEnvFiles(envCandidates...)

	if cfg.Port == "" {
		cfg.Port = os.Getenv("PORT")
		if cfg.Port == "" {
			cfg.Port = "8080"
		}
	}

	dbPath := resolveDatabasePath(cfg.DatabasePath)
	log.Printf("[EmbeddedServer] Initializing Snappy Universal Database at: %s", filepath.Clean(dbPath))

	client := riotapi.NewClient()
	engine := pruner.NewEngine()
	lcuWatcher := lcu.NewWatcher()
	db := database.NewSnappyStore(dbPath)
	syncDaemon := valSync.NewDaemon(db, client)
	authMgr := auth.NewManager(db, client)

	if client.IsRealAPIActive() {
		log.Println("[EmbeddedServer] [OK] Verified official Riot Developer API Key. Live Cloud VALORANT querying active.")
	} else {
		log.Println("[EmbeddedServer] [INFO] Using development key / demo mode. High-fidelity simulation active.")
	}

	mux := http.NewServeMux()

	// Authentication & Riot Sign-On (RSO) Routes
	mux.HandleFunc("/api/v1/auth/register", authMgr.HandleRegister)
	mux.HandleFunc("/api/v1/auth/login", authMgr.HandleLogin)
	mux.HandleFunc("/api/v1/auth/logout", authMgr.HandleLogout)
	mux.HandleFunc("/api/v1/auth/riot/login", authMgr.HandleRiotOAuthLogin)
	mux.HandleFunc("/api/v1/auth/riot/link", authMgr.HandleLinkRiotID)
	mux.HandleFunc("/api/v1/auth/session", authMgr.HandleSessionStatus)

	// Health Check & System Status Endpoint
	mux.HandleFunc("/api/v1/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":           "ONLINE",
			"version":          "3.0.1-universal-db",
			"live_riot_api":    client.IsRealAPIActive(),
			"auto_sync_daemon": "OPERATIONAL",
			"db_engine":        "SnappyStore",
			"vanguard_safe":    true,
			"embedded_mode":    true,
		})
	})

	// Instantaneous Background Sync Trigger
	mux.HandleFunc("/api/v1/players/sync/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

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
		_ = json.NewEncoder(w).Encode(report)
	})

	// Sub-Kilobyte Live Match Overlay HUD Telemetry (< 450 Bytes)
	mux.HandleFunc("/api/v1/players/live/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

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
		_ = json.NewEncoder(w).Encode(payload)
	})

	// Comprehensive Universal Database-Backed VAL-Index Analytics Dashboard
	mux.HandleFunc("/api/v1/players/analytics/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

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

		// 1. Check Universal Database Index first
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
			// 2. Not in DB? Probe Riot Cloud clusters and persist
			log.Printf("[UNIVERSAL-DB] Cache Miss for %s#%s. Probing global Riot Cloud clusters...", gameName, tagLine)
			resolveResp, discoveredShard, resErr := client.ResolveRiotID(context.Background(), gameName, tagLine, "na")
			if resErr == nil && resolveResp != nil && resolveResp.PUUID != "" {
				puuid = resolveResp.PUUID
				internalShard = discoveredShard
			}
			syncDaemon.SyncPlayerNow(puuid, gameName, tagLine, internalShard)
		}

		// 3. Load matches directly from database archive or fallback to immediate cloud sync
		matches, err := db.GetPlayerMatches(puuid, queue, 10)
		if err != nil || len(matches) == 0 {
			matches, _ = client.FetchPlayerMatches(context.Background(), puuid, internalShard, queue)
			for _, m := range matches {
				_ = db.SaveMatch(puuid, &m)
			}
		}

		// 4. Compute Dynamic Statistical Evaluation from stored match archives
		metrics := calculator.ComputePlayerAnalytics(puuid, fmt.Sprintf("%s#%s", gameName, tagLine), act, queue, matches)
		metrics.DataSource = "LIVE_RIOT_CLOUD"
		if len(matches) > 0 && (strings.HasPrefix(matches[0].MatchInfo.MatchID, "DEV-VAL") || strings.HasPrefix(matches[0].MatchInfo.MatchID, "VAL-MATCH")) {
			metrics.DataSource = "DEV_KEY_RESTRICTED_SIMULATED"
		}

		_ = json.NewEncoder(w).Encode(metrics)
	})

	// Local VALORANT LCU Loopback Status
	mux.HandleFunc("/api/v1/lcu/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		creds, err := lcuWatcher.LocateLockfile()
		if err != nil {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"connected": false, "reason": err.Error()})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"connected": true, "port": creds.Port, "pid": creds.ProcessID})
	})

	// System Information Endpoint
	mux.HandleFunc("/api/v1/system/info", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"universal_db_version": "Universal DB v4.0",
		})
	})

	// Wrap mux with CORS and path normalization (/v1/... -> /api/v1/...)
	corsHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		// Normalize paths: if Wails mounts service at /api, path might arrive as /v1/...
		if strings.HasPrefix(r.URL.Path, "/v1/") {
			r.URL.Path = "/api" + r.URL.Path
		}

		mux.ServeHTTP(w, r)
	})

	return &EmbeddedServer{
		config:     cfg,
		db:         db,
		syncDaemon: syncDaemon,
		client:     client,
		authMgr:    authMgr,
		engine:     engine,
		lcuWatcher: lcuWatcher,
		mux:        mux,
		handler:    corsHandler,
	}, nil
}

// ServeHTTP satisfies the http.Handler interface so EmbeddedServer can be mounted directly.
func (s *EmbeddedServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.handler.ServeHTTP(w, r)
}

// Handler returns the underlying http.Handler.
func (s *EmbeddedServer) Handler() http.Handler {
	return s.handler
}

// Start initiates background auto-sync, LCU polling, and binds an in-process TCP listener.
func (s *EmbeddedServer) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running.Load() {
		return nil
	}

	// 1. Launch Background Auto-Sync Daemon
	s.syncDaemon.Start(60*time.Second, 10*time.Minute)

	// 2. Launch initial LCU probe
	go func() {
		_, _ = s.lcuWatcher.LocateLockfile()
	}()

	port := s.config.Port
	if port == "" {
		port = "8080"
	}

	listener, err := net.Listen("tcp", ":"+port)
	if err != nil {
		// Port already occupied (e.g. standalone server is running); log notice and allow in-process handlers to continue
		log.Printf("[EmbeddedServer] Notice: Port :%s is already bound (%v). In-process routing & Wails bindings active.", port, err)
		s.running.Store(true)
		return nil
	}

	s.listener = listener
	s.httpServer = &http.Server{
		Handler: s.handler,
	}
	s.running.Store(true)

	log.Printf("[EmbeddedServer] Universal Database, Auto-Sync & Analytics Engine active on http://127.0.0.1:%s", port)
	go func() {
		if err := s.httpServer.Serve(s.listener); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Printf("[EmbeddedServer] HTTP server listener closed: %v", err)
		}
	}()

	return nil
}

// Stop safely shuts down background daemons, the TCP listener, and closes database connections.
func (s *EmbeddedServer) Stop() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running.Swap(false) {
		return nil
	}

	log.Println("[EmbeddedServer] Shutting down embedded backend services...")

	if s.syncDaemon != nil {
		s.syncDaemon.Stop()
	}

	if s.httpServer != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_ = s.httpServer.Shutdown(ctx)
		s.httpServer = nil
	}

	if s.listener != nil {
		_ = s.listener.Close()
		s.listener = nil
	}

	if s.db != nil {
		_ = s.db.Close()
	}

	log.Println("[EmbeddedServer] Embedded backend stopped cleanly.")
	return nil
}

// LocateLCU provides direct programmatic access to LCU credentials.
func (s *EmbeddedServer) LocateLCU() (*lcu.LCUCredentials, error) {
	return s.lcuWatcher.LocateLockfile()
}

// IsRunning indicates whether the server is active.
func (s *EmbeddedServer) IsRunning() bool {
	return s.running.Load()
}
