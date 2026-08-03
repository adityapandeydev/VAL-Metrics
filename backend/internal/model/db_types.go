package model

import "time"

type User struct {
	UserID        string    `json:"userId"`
	Username      string    `json:"username"`
	Email         string    `json:"email"`
	PasswordHash  string    `json:"-"`
	LinkedPUUID   string    `json:"linkedPuuid"`
	CreatedAt     time.Time `json:"createdAt"`
	LastLoginAt   time.Time `json:"lastLoginAt"`
	IsRiotVerified bool     `json:"isRiotVerified"`
}

type RiotLinkedAccount struct {
	PUUID          string    `json:"puuid"`
	GameName       string    `json:"gameName"`
	TagLine        string    `json:"tagLine"`
	InternalShard  string    `json:"-"` // Internal routing record (e.g. na, eu, ap) hidden from user UI
	ProfileIconID  int       `json:"profileIconId"`
	AccountLevel   int       `json:"accountLevel"`
	VerifiedUserID string    `json:"verifiedUserId,omitempty"`
	LastSyncedAt   time.Time `json:"lastSyncedAt"`
	TotalMatchesDb int       `json:"totalMatchesDb"`
	CachedValIndex int       `json:"cachedValIndex"`
	CachedGrade    string    `json:"cachedGrade"`
}

type AuthSession struct {
	Token       string    `json:"token"`
	UserID      string    `json:"userId"`
	Username    string    `json:"username"`
	RiotID      string    `json:"riotId"`
	PUUID       string    `json:"puuid"`
	IsVerified  bool      `json:"isVerified"`
	ExpiresAt   time.Time `json:"expiresAt"`
}

type SyncStatusReport struct {
	PUUID           string    `json:"puuid"`
	RiotID          string    `json:"riotId"`
	SyncState       string    `json:"syncState"` // "IDLE", "SYNCING", "COMPLETED", "FAILED"
	NewMatchesCount int       `json:"newMatchesCount"`
	LastSyncAgo     string    `json:"lastSyncAgo"`
	ErrorMessage    string    `json:"errorMessage,omitempty"`
}
