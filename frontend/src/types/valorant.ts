export interface ValorantMatchState {
  matchId: string;
  mapName: string; // e.g., "Ascent", "Haven", "Lotus"
  mode: string; // e.g., "Competitive", "Premier"
  serverRegion: string; // e.g., "AP - Mumbai", "NA - N. Virginia"
  playerTeam: "RED" | "BLUE";
  teamScore: number;
  enemyScore: number;
  roundNumber: number;
  phase: "BUY_PHASE" | "COMBAT" | "POST_ROUND";
}

export interface PlayerRealtimeStats {
  puuid: string;
  riotId: string; // e.g., "Player#AP1"
  agentName: string; // e.g., "Jett", "Omen", "Viper"
  agentIconUrl: string;
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  combatScore: number;
  economyCredits: number;
  currentTierName: string; // e.g., "Immortal 1"
  currentTierIconUrl: string;
  rankingRating: number; // 0 - 100 RR inside current rank
  rrChangeLastMatch: number; // e.g., +21 or -14
  mapWinRate: number; // Percentage win rate on the currently loaded map
  historicalMatchesOnMap: number;
}

export interface OverlayTelemetryPayload {
  timestamp: number;
  matchState: ValorantMatchState;
  playerStats: PlayerRealtimeStats;
}
