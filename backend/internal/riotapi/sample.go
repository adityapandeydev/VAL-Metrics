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

	maps := []string{"Sunset", "Ascent", "Lotus", "Bind", "Haven", "Split", "Abyss", "Icebox", "Corrode", "Summit"}
	var history []MatchlistEntryDTO

	for i := 0; i < 8; i++ {
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

	agents := []string{
		"Jett", "Phoenix", "Raze", "Reyna", "Yoru", "Neon", "Iso", "Waylay",
		"Sova", "Breach", "Skye", "KAY/O", "Fade", "Gekko", "Tejo",
		"Brimstone", "Viper", "Omen", "Astra", "Harbor", "Clove", "Miks",
		"Sage", "Cypher", "Killjoy", "Chamber", "Deadlock", "Vyse", "Veto",
	}
	maps := []string{"Sunset", "Ascent", "Lotus", "Bind", "Haven", "Split", "Abyss", "Icebox", "Corrode", "Summit"}
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

	// Generate realistic round results with weapon distributions and hit splits
	weapons := []string{"Vandal", "Phantom", "Ghost", "Sheriff", "Operator", "Spectre", "Outlaw"}
	var roundResults []RoundResultDTO
	for r := 1; r <= roundsPlayed; r++ {
		roundWonByPlayer := (r <= roundsWon)
		winningTeam := "Red"
		if roundWonByPlayer {
			winningTeam = "Blue"
		}

		ceremony := ""
		if roundWonByPlayer && r%5 == 0 {
			ceremony = "Flawless"
		} else if roundWonByPlayer && r%7 == 0 {
			ceremony = "Clutch"
		}

		wName := weapons[rng.Intn(len(weapons))]
		hs := rng.Intn(2)
		body := 1 + rng.Intn(3)
		leg := 0
		if rng.Float32() < 0.2 {
			leg = 1
		}
		dmgDealt := (hs * 160) + (body * 40) + (leg * 34)

		var playerKills []KillDTO
		if rng.Float32() < 0.6 {
			playerKills = append(playerKills, KillDTO{
				TimeSinceRoundStartMillis: int64(15000 + rng.Intn(40000)),
				Killer:                    puuid,
				Victim:                    "enemy-puuid-placeholder",
				FinishingDamage: FinishingDamageDTO{
					DamageType: "Weapon",
					DamageItem: wName,
				},
			})
		}

		roundResults = append(roundResults, RoundResultDTO{
			RoundNum:      r,
			RoundResult:   "Elimination",
			RoundCeremony: ceremony,
			WinningTeam:   winningTeam,
			PlayerStats: []PlayerRoundStatsDTO{
				{
					PUUID: puuid,
					Kills: playerKills,
					Damage: []DamageDTO{
						{
							Receiver:  "enemy-puuid-placeholder",
							Damage:    dmgDealt,
							Headshots: hs,
							Bodyshots: body,
							Legshots:  leg,
						},
					},
					Score: acs,
				},
			},
		})
	}

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
		RoundResults: roundResults,
	}
}

func hashPUUIDToSeed(s string) int64 {
	h := md5.Sum([]byte(s))
	return int64(binary.BigEndian.Uint64(h[:8]))
}
