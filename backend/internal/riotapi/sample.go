package riotapi

import (
	"crypto/md5"
	"encoding/binary"
	"fmt"
	"math/rand"
)

// GetSampleMatchlist returns realistic match list entries for developer fallback testing when VAL-Match V1 returns 403 Forbidden
func GetSampleMatchlist(puuid string) *MatchlistDTO {
	seed := hashPUUIDToSeed(puuid)
	rng := rand.New(rand.NewSource(seed))

	maps := []string{"SUNSET", "ASCENT", "LOTUS", "BIND", "HAVEN", "SPLIT"}
	var history []MatchlistEntryDTO

	for i := 0; i < 4; i++ {
		mapName := maps[rng.Intn(len(maps))]
		matchID := fmt.Sprintf("DEV-VAL-%s-%d-%s", mapName, 100+i, puuid[:4])
		history = append(history, MatchlistEntryDTO{
			MatchID:       matchID,
			GameStartTime: 1720000000000 - int64(i*86400000),
			QueueID:       "competitive",
		})
	}

	return &MatchlistDTO{
		PUUID:   puuid,
		History: history,
	}
}

// GetSampleMatchDetails generates player-specific statistical records when standard Developer API keys lack production Match V1 scope
func GetSampleMatchDetails(matchID, puuid string) MatchDTO {
	seed := hashPUUIDToSeed(puuid + matchID)
	rng := rand.New(rand.NewSource(seed))

	agents := []string{"Jett", "Reyna", "Raze", "Omen", "Viper", "Sova", "Fade", "Killjoy", "Cypher", "Clove", "Phoenix", "Iso"}
	maps := []string{"Sunset", "Ascent", "Lotus", "Bind", "Haven", "Split"}
	selectedAgent := agents[rng.Intn(len(agents))]
	selectedMap := maps[rng.Intn(len(maps))]

	roundsPlayed := 18 + rng.Intn(7) // 18 to 24 rounds
	roundsWon := 13
	roundsLost := roundsPlayed - 13
	won := true
	if rng.Float32() < 0.45 {
		won = false
		roundsWon = roundsPlayed - 13
		roundsLost = 13
	}

	kills := 12 + rng.Intn(18)  // 12 to 29 kills
	deaths := 9 + rng.Intn(13)  // 9 to 21 deaths
	assists := 3 + rng.Intn(11) // 3 to 13 assists

	acs := 180 + rng.Intn(160)
	score := acs * roundsPlayed

	return MatchDTO{
		MatchInfo: MatchInfoDTO{
			MatchID:          matchID,
			MapID:            selectedMap,
			GameLengthMillis: int64(roundsPlayed * 105000), // ~1.75 mins per round
			QueueID:          "competitive",
			GameMode:         "Bomb",
			SeasonID:         "V26: A4",
		},
		Teams: []TeamDTO{
			{TeamID: "Blue", Won: won, RoundsPlayed: roundsPlayed, RoundsWon: roundsWon, NumPoints: roundsWon},
			{TeamID: "Red", Won: !won, RoundsPlayed: roundsPlayed, RoundsWon: roundsLost, NumPoints: roundsLost},
		},
		Players: []PlayerDTO{
			{
				PUUID:           puuid,
				GameName:        "Player",
				TagLine:         "VAL",
				TeamID:          "Blue",
				CharacterID:     selectedAgent,
				CompetitiveTier: 18 + rng.Intn(7), // Platinum to Immortal tier
				Stats: PlayerStatsDTO{
					Score:        score,
					RoundsPlayed: roundsPlayed,
					Kills:        kills,
					Deaths:       deaths,
					Assists:      assists,
				},
			},
		},
	}
}

func hashPUUIDToSeed(s string) int64 {
	h := md5.Sum([]byte(s))
	return int64(binary.BigEndian.Uint64(h[:8]))
}
