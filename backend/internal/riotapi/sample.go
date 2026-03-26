package riotapi

// GetSampleMatchlist returns realistic Riot VAL-Match V1 match history IDs for comprehensive testing & fallback
func GetSampleMatchlist(puuid string) *MatchlistDTO {
	return &MatchlistDTO{
		PUUID: puuid,
		History: []MatchlistEntryDTO{
			{MatchID: "VAL-MATCH-SUNSET-001", GameStartTime: 1720656000000, QueueID: "competitive"},
			{MatchID: "VAL-MATCH-SUNSET-002", GameStartTime: 1719619200000, QueueID: "competitive"},
			{MatchID: "VAL-MATCH-ASCENT-003", GameStartTime: 1718102400000, QueueID: "competitive"},
			{MatchID: "VAL-MATCH-LOTUS-004", GameStartTime: 1716547200000, QueueID: "unrated"},
		},
	}
}

// GetSampleMatchDetails provides high-fidelity VALORANT match logs replicating professional match statistics
func GetSampleMatchDetails(matchID, puuid string) MatchDTO {
	if matchID == "VAL-MATCH-SUNSET-002" {
		return MatchDTO{
			MatchInfo: MatchInfoDTO{
				MatchID:          matchID,
				MapID:            "/Game/Maps/Jude/Jude", // Sunset
				GameLengthMillis: 2160000,                // ~36 mins (0.6 hours)
				QueueID:          "competitive",
				GameMode:         "Bomb",
				SeasonID:         "V26: A4",
			},
			Teams: []TeamDTO{
				{TeamID: "Blue", Won: true, RoundsPlayed: 22, RoundsWon: 13, NumPoints: 13},
				{TeamID: "Red", Won: false, RoundsPlayed: 22, RoundsWon: 9, NumPoints: 9},
			},
			Players: []PlayerDTO{
				{
					PUUID:           puuid,
					GameName:        "throwkarumga",
					TagLine:         "6969",
					TeamID:          "Blue",
					CharacterID:     "Phoenix", // Phoenix
					CompetitiveTier: 21,        // Diamond / Ascendant range
					Stats: PlayerStatsDTO{
						Score:        8030, // 365 ACS over 22 rounds
						RoundsPlayed: 22,
						Kills:        28,
						Deaths:       14,
						Assists:      8,
					},
				},
			},
		}
	}

	// Default to Sunset MVP Raze victory (VAL-MATCH-SUNSET-001)
	return MatchDTO{
		MatchInfo: MatchInfoDTO{
			MatchID:          matchID,
			MapID:            "/Game/Maps/Jude/Jude", // Sunset
			GameLengthMillis: 1800000,                // 30 mins (0.5 hours)
			QueueID:          "competitive",
			GameMode:         "Bomb",
			SeasonID:         "V26: A4",
		},
		Teams: []TeamDTO{
			{TeamID: "Blue", Won: true, RoundsPlayed: 23, RoundsWon: 13, NumPoints: 13},
			{TeamID: "Red", Won: false, RoundsPlayed: 23, RoundsWon: 10, NumPoints: 10},
		},
		Players: []PlayerDTO{
			{
				PUUID:           puuid,
				GameName:        "throwkarumga",
				TagLine:         "6969",
				TeamID:          "Blue",
				CharacterID:     "Raze", // Raze
				CompetitiveTier: 21,
				Stats: PlayerStatsDTO{
					Score:        6348, // ~276 ACS over 23 rounds
					RoundsPlayed: 23,
					Kills:        21,
					Deaths:       16,
					Assists:      5,
				},
			},
		},
	}
}
