package model

import "time"

// --- Raw Riot API Representation (Input Data) ---

type RiotAccountResponse struct {
	PUUID    string `json:"puuid"`
	GameName string `json:"gameName"`
	TagLine  string `json:"tagLine"`
}

type ActiveShardResponse struct {
	PUUID string `json:"puuid"`
	Game  string `json:"game"`
	ActiveShard string `json:"activeShard"`
}

type RawMatchListResponse struct {
	PUUID   string   `json:"puuid"`
	Matches []string `json:"history"`
}

// --- Pruned Live HUD Telemetry Protocol (Sub-Kilobyte Output Data) ---

type ValorantMatchState struct {
	MatchID      string `json:"matchId"`
	MapName      string `json:"mapName"`
	Mode         string `json:"mode"`
	ServerRegion string `json:"serverRegion"`
	PlayerTeam   string `json:"playerTeam"` // "RED" | "BLUE"
	TeamScore    int    `json:"teamScore"`
	EnemyScore   int    `json:"enemyScore"`
	RoundNumber  int    `json:"roundNumber"`
	Phase        string `json:"phase"` // "BUY_PHASE" | "COMBAT" | "POST_ROUND"
}

type PlayerRealtimeStats struct {
	PUUID                 string  `json:"puuid"`
	RiotID                string  `json:"riotId"`
	AgentName             string  `json:"agentName"`
	AgentIconURL          string  `json:"agentIconUrl"`
	Kills                 int     `json:"kills"`
	Deaths                int     `json:"deaths"`
	Assists               int     `json:"assists"`
	KDRatio               float64 `json:"kdRatio"`
	CombatScore           int     `json:"combatScore"`
	EconomyCredits        int     `json:"economyCredits"`
	CurrentTierName       string  `json:"currentTierName"`
	CurrentTierIconURL    string  `json:"currentTierIconUrl"`
	RankingRating         int     `json:"rankingRating"`
	RRChangeLastMatch     int     `json:"rrChangeLastMatch"`
	MapWinRate            float64 `json:"mapWinRate"`
	HistoricalMatchesOnMap int    `json:"historicalMatchesOnMap"`
}

type OverlayTelemetryPayload struct {
	Timestamp   int64               `json:"timestamp"`
	MatchState  ValorantMatchState  `json:"matchState"`
	PlayerStats PlayerRealtimeStats `json:"playerStats"`
}

// --- Comprehensive Historical Analytics (Web Dashboard & Deep View) ---

type AgentMastery struct {
	AgentName      string  `json:"agentName"`
	AgentIconURL   string  `json:"agentIconUrl"`
	MatchesPlayed  int     `json:"matchesPlayed"`
	WinRate        float64 `json:"winRate"`
	AvgCombatScore float64 `json:"avgCombatScore"`
	KDRatio        float64 `json:"kdRatio"`
}

type WeaponMarksmanship struct {
	WeaponName     string  `json:"weaponName"`
	TotalKills     int     `json:"totalKills"`
	HeadshotPercent float64 `json:"headshotPercent"`
	BodyshotPercent float64 `json:"bodyshotPercent"`
	LegshotPercent  float64 `json:"legshotPercent"`
}

type MapPerformance struct {
	MapName       string  `json:"mapName"`
	MatchesPlayed int     `json:"matchesPlayed"`
	WinRate       float64 `json:"winRate"`
	AttackWinRate float64 `json:"attackWinRate"`
	DefendWinRate float64 `json:"defendWinRate"`
}

type PlayerHistoricalSummary struct {
	PUUID            string               `json:"puuid"`
	RiotID           string               `json:"riotId"`
	CurrentRank      string               `json:"currentRank"`
	PeakRank         string               `json:"peakRank"`
	OverallKDRatio   float64              `json:"overallKdRatio"`
	OverallWinRate   float64              `json:"overallWinRate"`
	TotalMatches     int                  `json:"totalMatches"`
	AgentMasteries   []AgentMastery       `json:"agentMasteries"`
	WeaponAccuracy   []WeaponMarksmanship `json:"weaponAccuracy"`
	MapMatrix        []MapPerformance     `json:"mapMatrix"`
	LastUpdated      time.Time            `json:"lastUpdated"`
}
