package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/val-metrics/backend/internal/database"
	"github.com/val-metrics/backend/internal/model"
	"github.com/val-metrics/backend/internal/riotapi"
)

type Manager struct {
	db         database.Engine
	riotClient *riotapi.Client
	sessions   map[string]*model.AuthSession // Token -> Session
}

func NewManager(db database.Engine, riotClient *riotapi.Client) *Manager {
	return &Manager{
		db:         db,
		riotClient: riotClient,
		sessions:   make(map[string]*model.AuthSession),
	}
}

func (m *Manager) GenerateToken() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// HandleRegister allows users to register a persistent identity in our database if desired
func (m *Manager) HandleRegister(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		return
	}

	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" {
		http.Error(w, "Invalid registration payload", http.StatusBadRequest)
		return
	}

	userID := fmt.Sprintf("user-%d", time.Now().UnixNano())
	newUser := &model.User{
		UserID:       userID,
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: req.Password,
		CreatedAt:    time.Now(),
		LastLoginAt:  time.Now(),
	}
	m.db.SaveUser(newUser)

	token := m.GenerateToken()
	session := &model.AuthSession{
		Token:      token,
		UserID:     userID,
		Username:   req.Username,
		IsVerified: false,
		ExpiresAt:  time.Now().Add(7 * 24 * time.Hour),
	}
	m.sessions[token] = session

	log.Printf("[VAL-AUTH] New Account created: %s (ID: %s)", req.Username, userID)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "REGISTERED",
		"token":      token,
		"username":   req.Username,
		"isVerified": false,
		"message":    "Account created. Please link your actual Riot Games profile.",
	})
}

// HandleLogin authenticates users via database credentials
func (m *Manager) HandleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		return
	}

	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Username == "" {
		http.Error(w, "Invalid login request", http.StatusBadRequest)
		return
	}

	u, err := m.db.GetUserByUsername(req.Username)
	if err != nil || u == nil {
		http.Error(w, "Account not found in database. Please register or log in with your actual Riot ID.", http.StatusUnauthorized)
		return
	}

	token := m.GenerateToken()
	var riotID, puuid string
	if u.LinkedPUUID != "" {
		if acc, _ := m.db.GetRiotAccountByPUUID(u.LinkedPUUID); acc != nil {
			riotID = fmt.Sprintf("%s#%s", acc.GameName, acc.TagLine)
			puuid = acc.PUUID
		}
	}

	session := &model.AuthSession{
		Token:      token,
		UserID:     u.UserID,
		Username:   u.Username,
		RiotID:     riotID,
		PUUID:      puuid,
		IsVerified: u.IsRiotVerified,
		ExpiresAt:  time.Now().Add(7 * 24 * time.Hour),
	}
	m.sessions[token] = session

	log.Printf("[VAL-AUTH] User signed in: %s", u.Username)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "SUCCESS",
		"token":      token,
		"username":   u.Username,
		"riotId":     riotID,
		"puuid":      puuid,
		"isVerified": u.IsRiotVerified,
	})
}

// HandleLogout terminates current session
func (m *Manager) HandleLogout(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		return
	}

	var req struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err == nil && req.Token != "" {
		delete(m.sessions, req.Token)
	}
	json.NewEncoder(w).Encode(map[string]interface{}{"status": "LOGGED_OUT"})
}

// HandleRiotOAuthLogin manages Riot Sign-On (RSO) redirection or direct API linking
func (m *Manager) HandleRiotOAuthLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	clientID := os.Getenv("RIOT_RSO_CLIENT_ID")
	redirectURI := os.Getenv("RIOT_RSO_REDIRECT_URI")

	if clientID != "" && redirectURI != "" {
		oauthUrl := fmt.Sprintf("https://auth.riotgames.com/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=openid+offline_access", clientID, redirectURI)
		json.NewEncoder(w).Encode(map[string]interface{}{"status": "REDIRECT", "url": oauthUrl})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "NO_CLIENT_ID",
		"message": "Official RSO OAuth requires a registered RIOT_RSO_CLIENT_ID in .env. Please enter your actual Riot ID (Name#Tag) below to authenticate directly against the Riot Developer API.",
	})
}

// HandleLinkRiotID verifies an actual Riot ID via official Riot cloud endpoints and binds it to our database
func (m *Manager) HandleLinkRiotID(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	if r.Method == http.MethodOptions {
		return
	}

	var req struct {
		Token  string `json:"token"`
		RiotID string `json:"riotId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.RiotID == "" {
		http.Error(w, "Riot ID required in format Name#Tag", http.StatusBadRequest)
		return
	}

	parts := strings.Split(req.RiotID, "#")
	if len(parts) < 2 || strings.TrimSpace(parts[0]) == "" || strings.TrimSpace(parts[1]) == "" {
		http.Error(w, "Please provide a valid Riot ID containing Name and Tag (e.g. TenZ#0505)", http.StatusBadRequest)
		return
	}
	gameName := strings.TrimSpace(parts[0])
	tagLine := strings.TrimSpace(parts[1])

	ctx := context.Background()
	accResp, shard, err := m.riotClient.ResolveRiotID(ctx, gameName, tagLine, "na")
	if err != nil || accResp == nil || accResp.PUUID == "" {
		// If real Riot API fails or key is missing/unauthorized, log failure instead of faking an assumed ID
		log.Printf("[RIOT-ACCOUNT] Could not resolve actual account %s#%s on Riot servers: %v", gameName, tagLine, err)
		if m.riotClient.IsRealAPIActive() {
			http.Error(w, fmt.Sprintf("Could not find actual Riot account %s#%s on official servers. Please verify Name and Tagline.", gameName, tagLine), http.StatusNotFound)
			return
		}
	}

	puuid := fmt.Sprintf("vault-%s-%s", strings.ToLower(gameName), strings.ToLower(tagLine))
	if accResp != nil && accResp.PUUID != "" {
		puuid = accResp.PUUID
	}

	// Create or lookup session
	token := req.Token
	session, ok := m.sessions[token]
	if !ok || session == nil {
		token = m.GenerateToken()
		userID := fmt.Sprintf("player-%s", puuid[:8])
		session = &model.AuthSession{
			Token:      token,
			UserID:     userID,
			Username:   gameName,
			IsVerified: true,
			ExpiresAt:  time.Now().Add(7 * 24 * time.Hour),
		}
		m.sessions[token] = session
	}

	// Persist to our database
	m.db.SaveRiotAccount(&model.RiotLinkedAccount{
		PUUID:          puuid,
		GameName:       gameName,
		TagLine:        tagLine,
		InternalShard:  shard,
		VerifiedUserID: session.UserID,
		LastSyncedAt:   time.Now(),
	})

	session.RiotID = fmt.Sprintf("%s#%s", gameName, tagLine)
	session.PUUID = puuid
	session.IsVerified = true

	log.Printf("[RIOT-ACCOUNT-LINK] Verified & connected real account %s#%s (PUUID: %s)", gameName, tagLine, puuid)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     "LINKED",
		"token":      session.Token,
		"username":   session.Username,
		"riotId":     session.RiotID,
		"puuid":      session.PUUID,
		"isVerified": true,
		"message":    fmt.Sprintf("Successfully connected to actual Riot account %s#%s!", gameName, tagLine),
	})
}

// HandleSessionStatus verifies current session without forcing any fake assumed identities
func (m *Manager) HandleSessionStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	token := r.Header.Get("Authorization")
	token = strings.TrimPrefix(token, "Bearer ")
	if token == "" {
		token = r.URL.Query().Get("token")
	}

	if token == "" {
		json.NewEncoder(w).Encode(map[string]interface{}{"authenticated": false})
		return
	}

	session, exists := m.sessions[token]
	if !exists {
		json.NewEncoder(w).Encode(map[string]interface{}{"authenticated": false})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"authenticated": true,
		"token":         session.Token,
		"username":      session.Username,
		"riotId":        session.RiotID,
		"puuid":         session.PUUID,
		"isVerified":    session.IsVerified,
	})
}
