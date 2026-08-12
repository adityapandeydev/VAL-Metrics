package leaderboard

// ImmortalDistribution tracks the regional volume of players reaching the Immortal rank threshold.
// POLICY COMPLIANCE NOTE: This model will rely exclusively on Riot's official VAL-RANKED-V1 endpoint 
// if implemented. It does not calculate rank locally and operates strictly as an approved
// Official Ladder Leaderboard viewer, requiring no explicit opt-in for aggregate public data.
type ImmortalDistribution struct {
	TotalPlayers int
	Region       string
}
