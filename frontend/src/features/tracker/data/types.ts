export type Role = 'Duelist' | 'Initiator' | 'Controller' | 'Sentinel';
export type Queue = 'Competitive' | 'Unrated' | 'Premier';
export type RoundEnd = 'Elimination' | 'Defuse' | 'Detonate' | 'Time';

/** Per-match weapon line: kills and hit locations. */
export interface WeaponLine { kills: number; head: number; body: number; legs: number; damage: number; longest: number }

export interface Match {
  id: string;
  map: string;
  queue: Queue;
  agent: string;
  role: Role;
  startedAt: string;          // ISO
  durationMin: number;
  won: boolean;
  draw: boolean;
  teamScore: number;
  enemyScore: number;
  rounds: number;
  k: number; d: number; a: number;
  acs: number; adr: number; hs: number; kast: number; dd: number;
  fk: number; fd: number;
  multi: [number, number, number, number]; // 2K 3K 4K 5K
  clutches: number; clutchAttempts: number;
  plants: number; defuses: number;
  headshots: number; bodyshots: number; legshots: number;
  placement: number;          // 1..10 by ACS
  badge: 'MVP' | 'Team MVP' | null;
  rrChange?: number;          // only ranked
  tierAfter?: number; rrAfter?: number;
  atkRoundsWon: number; atkRounds: number; defRoundsWon: number; defRounds: number;
  weapons: Record<string, WeaponLine>;
  seed: number;
  partial?: boolean;          // server rows lacking full telemetry
}

export interface ActRecord { id: string; label: string; tier: number; wins: number; games: number; triangle: number[] }

export interface Profile {
  source: 'sample' | 'server';
  sourceNote: string;
  name: string; tag: string;
  level: number; region: string; title: string;
  bannerAgent: string;
  tier: number; rr: number;
  peakTier: number; peakAct: string;
  leaderboardRank?: number;
  acts: ActRecord[];
  matches: Match[];               // newest first
  serverView?: Stats;            // server-supplied aggregates (used instead of recomputing)
}

export interface Summary {
  matches: number; wins: number; losses: number; draws: number; winRate: number;
  rounds: number; roundsWon: number; roundWinRate: number;
  kills: number; deaths: number; assists: number;
  kd: number; kad: number; kpr: number; dpr: number; apr: number;
  adr: number; acs: number; hs: number; kast: number; dd: number;
  fk: number; fd: number; fkRate: number;
  multi: [number, number, number, number];
  clutches: number; clutchAttempts: number;
  aces: number; flawless: number; mostKills: number;
  plants: number; defuses: number;
  headshots: number; bodyshots: number; legshots: number;
  playtimeH: number;
  atkWinRate: number; defWinRate: number;
  impact: number | null;
  mvps: number; teamMvps: number;
}

export interface AgentStat { name: string; role: Role; matches: number; wins: number; winRate: number; kd: number; adr: number; acs: number; dd: number; hs: number; kast: number; fk: number; playtimeH: number; bestMap: string; bestMapWR: number }
export interface MapStat { name: string; matches: number; wins: number; losses: number; winRate: number; atkWR: number; defWR: number; kd: number; acs: number; adr: number; topAgent: string }
export interface WeaponStat { name: string; category: string; kills: number; hs: number; body: number; legs: number; damagePerKill: number; longest: number; killShare: number }
export interface RoleStat { role: Role; matches: number; wins: number; winRate: number; kd: number; kda: number; acs: number }

export interface Stats {
  summary: Summary;
  agents: AgentStat[];
  maps: MapStat[];
  weapons: WeaponStat[];
  roles: RoleStat[];
}

export interface ScoreLine { name: string; tag: string; agent: string; team: 'ally' | 'enemy'; self: boolean; tier: number; acs: number; k: number; d: number; a: number; adr: number; hs: number; kast: number; fk: number; fd: number; mk: number; party?: number }
export interface RoundLine { n: number; won: boolean; side: 'Attack' | 'Defense'; end: RoundEnd; kills: number; damage: number; loadout: number; bank: number; enemyLoadout: number; planted: boolean; survived: boolean }
export interface DuelLine { name: string; agent: string; kills: number; deaths: number }
export interface MatchDetail { scoreboard: ScoreLine[]; rounds: RoundLine[]; duels: DuelLine[] }
