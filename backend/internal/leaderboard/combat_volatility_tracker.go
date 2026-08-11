package leaderboard

// CombatVolatilityTracker mathematically evaluates a player's performance consistency.
// POLICY COMPLIANCE NOTE: This strictly calculates standard deviation of personal combat scores 
// (e.g. Damage Delta per Round) across match histories.
// It is explicitly NOT an MMR calculator, does NOT approximate official Ranked MMR, 
// and cannot be used as an alternative to official skill rankings.
type CombatVolatility struct {
	BaseScore       int
	VolatilityDelta int
}
