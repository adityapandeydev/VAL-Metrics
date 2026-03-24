package riotapi

// --- Riot Account V1 Schema ---

type AccountDTO struct {
	PUUID    string `json:"puuid"`
	GameName string `json:"gameName"`
	TagLine  string `json:"tagLine"`
}

type ActiveShardDTO struct {
	PUUID       string `json:"puuid"`
	Game        string `json:"game"`
	ActiveShard string `json:"activeShard"`
}

// --- Riot VAL-Match V1 Schema (Official API Response Structure) ---

type MatchlistDTO struct {
	PUUID   string         `json:"puuid"`
	History []MatchlistEntryDTO `json:"history"`
}

type MatchlistEntryDTO struct {
	MatchID       string `json:"matchId"`
	GameStartTime int64  `json:"gameStartTimeMillis"`
	QueueID       string `json:"queueId"` // e.g. "competitive", "unrated", "deathmatch"
}

type MatchDTO struct {
	MatchInfo MatchInfoDTO `json:"matchInfo"`
	Players   []PlayerDTO  `json:"players"`
	Coaches   []CoachDTO   `json:"coaches"`
	Teams     []TeamDTO    `json:"teams"`
	RoundResults []RoundResultDTO `json:"roundResults"`
}

type MatchInfoDTO struct {
	MatchID            string `json:"matchId"`
	MapID              string `json:"mapId"`
	GameLengthMillis   int64  `json:"gameLengthMillis"`
	GameStartMillis    int64  `json:"gameStartMillis"`
	ProvisioningFlowID string `json:"provisioningFlowId"`
	IsCompleted        bool   `json:"isCompleted"`
	CustomGameName     string `json:"customGameName"`
	QueueID            string `json:"queueId"`
	GameMode           string `json:"gameMode"`
	IsRanked           bool   `json:"isRanked"`
	SeasonID           string `json:"seasonId"` // e.g. "2d97a3a8-4ce0-a2fa-10a1-79ba518ff5e1" (Act UUID)
}

type PlayerDTO struct {
	PUUID        string       `json:"puuid"`
	GameName     string       `json:"gameName"`
	TagLine      string       `json:"tagLine"`
	TeamID       string       `json:"teamId"` // "Red", "Blue", or neutral
	PartyID      string       `json:"partyId"`
	CharacterID  string       `json:"characterId"` // Agent GUID
	Stats        PlayerStatsDTO `json:"stats"`
	CompetitiveTier int       `json:"competitiveTier"` // e.g. 24 (Immortal 1)
	PlayerCard   string       `json:"playerCard"`
	PlayerTitle  string       `json:"playerTitle"`
}

type CoachDTO struct {
	PUUID  string `json:"puuid"`
	TeamID string `json:"teamId"`
}

type PlayerStatsDTO struct {
	Score          int `json:"score"` // Total Combat Score
	RoundsPlayed   int `json:"roundsPlayed"`
	Kills          int `json:"kills"`
	Deaths         int `json:"deaths"`
	Assists        int `json:"assists"`
	PlaytimeMillis int `json:"playtimeMillis"`
	AbilityCasts   AbilityCastsDTO `json:"abilityCasts"`
}

type AbilityCastsDTO struct {
	GrenadeCasts int `json:"grenadeCasts"`
	Ability1Casts int `json:"ability1Casts"`
	Ability2Casts int `json:"ability2Casts"`
	UltimateCasts int `json:"ultimateCasts"`
}

type TeamDTO struct {
	TeamID       string `json:"teamId"`
	Won          bool   `json:"won"`
	RoundsPlayed int    `json:"roundsPlayed"`
	RoundsWon    int    `json:"roundsWon"`
	NumPoints    int    `json:"numPoints"`
}

type RoundResultDTO struct {
	RoundNum              int                 `json:"roundNum"`
	RoundResult           string              `json:"roundResult"` // "Elimination", "Bomb defused", "Bomb detonated", "Time elapsed"
	RoundCeremony         string              `json:"roundCeremony"` // "Flawless", "Clutch", "Thrifty", "Ace"
	WinningTeam           string              `json:"winningTeam"`
	BombPlanter           string              `json:"bombPlanter"`
	BombDefuser           string              `json:"bombDefuser"`
	PlayerStats           []PlayerRoundStatsDTO `json:"playerStats"`
}

type PlayerRoundStatsDTO struct {
	PUUID  string         `json:"puuid"`
	Kills  []KillDTO      `json:"kills"`
	Damage []DamageDTO    `json:"damage"`
	Score  int            `json:"score"`
	Economy EconomyDTO    `json:"economy"`
}

type KillDTO struct {
	TimeSinceGameStartMillis int64          `json:"timeSinceGameStartMillis"`
	TimeSinceRoundStartMillis int64         `json:"timeSinceRoundStartMillis"`
	Killer                   string         `json:"killer"` // PUUID
	Victim                   string         `json:"victim"` // PUUID
	VictimLocation           LocationDTO    `json:"victimLocation"`
	Assistants               []string       `json:"assistants"` // PUUID array
	FinishingDamage          FinishingDamageDTO `json:"finishingDamage"`
}

type FinishingDamageDTO struct {
	DamageType          string `json:"damageType"` // "Weapon", "Bomb", "Ability", "Melee"
	DamageItem          string `json:"damageItem"` // Weapon GUID (Vandal, Phantom, etc.)
	IsSecondaryFireMode bool   `json:"isSecondaryFireMode"`
}

type DamageDTO struct {
	Receiver      string `json:"receiver"` // PUUID
	Damage        int    `json:"damage"`
	Legshots      int    `json:"legshots"`
	Bodyshots     int    `json:"bodyshots"`
	Headshots     int    `json:"headshots"`
}

type EconomyDTO struct {
	LoadoutValue int    `json:"loadoutValue"`
	Weapon       string `json:"weapon"` // Weapon ID at buy end
	Armor        string `json:"armor"`  // Armor ID
	Remaining    int    `json:"remaining"`
	Spent        int    `json:"spent"`
}

type LocationDTO struct {
	X int `json:"x"`
	Y int `json:"y"`
}
