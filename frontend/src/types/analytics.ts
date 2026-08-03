export interface RoleStats {
  roleName: string;
  matches: number;
  winRate: number;
  kdRatio: number;
  adr: number;
}

export interface AgentPerformance {
  agentName: string;
  agentIconUrl: string;
  role: string;
  matchesPlayed: number;
  playtimeHours: number;
  winRate: number;
  kdRatio: number;
  adr: number;
  acs: number;
  damageDelta: number;
  bestMapName: string;
  bestMapWinRate: number;
}

export interface WeaponLethality {
  weaponName: string;
  category: string;
  totalKills: number;
  headshotPercent: number;
  bodyshotPercent: number;
  legshotPercent: number;
}

export interface MapRecord {
  mapName: string;
  matchesPlayed: number;
  winRate: number;
  recordString: string;
}

export interface MatchEncounterSummary {
  matchId: string;
  timeAgo: string;
  mapName: string;
  queueMode: string;
  agentName: string;
  agentIconUrl: string;
  scoreString: string;
  didWin: boolean;
  valIndex: number;
  badges: string[];
  kdRatio: number;
  killDeathAssist: string;
  damageDelta: number;
  headshotPercent: number;
  combatScore: number;
}

export interface AdvancedPlayerMetrics {
  riotId: string;
  puuid: string;
  dataSource?: string;
  selectedAct: string;
  selectedQueue: string;
  playtimeHours: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
  
  kills: number;
  deaths: number;
  assists: number;
  kdRatio: number;
  kadRatio: number;
  killsPerRound: number;
  damagePerRound: number;
  damageDeltaPerRound: number;
  averageCombatScore: number;
  kastPercent: number;

  firstBloods: number;
  flawlessRounds: number;
  aces: number;
  clutches: number;

  valIndexScore: number;
  valIndexGrade: string;
  roundWinRate: number;

  totalHits: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  headshotPercent: number;
  bodyshotPercent: number;
  legshotPercent: number;
  
  roleMastery: Record<string, RoleStats>;
  agentLeaderboard: AgentPerformance[];
  weaponArmory: WeaponLethality[];
  mapDomination: MapRecord[];
  recentEncounters: MatchEncounterSummary[];
}
