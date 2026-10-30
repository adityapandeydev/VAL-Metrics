import type { AdvancedPlayerMetrics } from '../../types/analytics';

export interface Encounter {
  id: string; map: string; agent: string; icon?: string; win: boolean;
  score: string; k: number; d: number; a: number; hs: number; acs: number;
  adr?: number; kast?: number; openingWins?: number; openingAttempts?: number;
  rounds?: number; time: string;
}
export interface PlayerView {
  details?: AdvancedPlayerMetrics;
  name: string; source: string; matches: Encounter[];
  summary: { total: number; wins: number; kd: number; adr: number; hs: number; acs: number; kast: number };
  agents: { name: string; matches: number; winRate: number; kd: number }[];
  maps: { name: string; matches: number; winRate: number }[];
  weapons: { name: string; kills: number; hs: number }[];
}
const clamp = (n: number) => Math.min(100, Math.max(0, n));
export function impactParts(m: Encounter) {
  if (m.adr == null || m.kast == null || !m.openingAttempts || m.openingWins == null ||
      ![m.adr,m.kast,m.openingAttempts,m.openingWins].every(Number.isFinite) || m.openingAttempts < 0) return null;
  const damage = clamp(m.adr / 2);
  const participation = clamp(m.kast);
  const openings = clamp(m.openingWins / m.openingAttempts * 100);
  return { damage, participation, openings, total: damage * .4 + participation * .35 + openings * .25 };
}
export function impactScore(matches: Encounter[]) {
  if (!matches.length || matches.some(m => !impactParts(m) || !m.rounds || !Number.isFinite(m.rounds) || m.rounds < 0)) return null;
  const rounds = matches.reduce((n, m) => n + m.rounds!, 0);
  return matches.reduce((n, m) => n + impactParts(m)!.total * m.rounds!, 0) / rounds;
}
export function summarize(matches: Encounter[]) {
  const sum = (key: 'k' | 'd') => matches.reduce((n, m) => n + m[key], 0);
  const rounds = matches.reduce((n, m) => n + (m.rounds || 0), 0);
  const weighted = (key: 'adr' | 'acs' | 'kast') => rounds ? matches.reduce((n, m) => n + (m[key] || 0) * (m.rounds || 0), 0) / rounds : 0;
  return { total: matches.length, wins: matches.filter(m => m.win).length, kd: sum('k') / Math.max(1, sum('d')), adr: weighted('adr'), hs: matches.length ? matches.reduce((n, m) => n + m.hs, 0) / matches.length : 0, acs: weighted('acs'), kast: weighted('kast') };
}
export function fromServer(s: AdvancedPlayerMetrics): PlayerView {
  return {
    details: s,
    name: s.riotId, source: s.dataSource || 'Server response · source unspecified',
    summary: { total: s.totalMatches, wins: s.wins, kd: s.kdRatio, adr: s.damagePerRound, hs: s.headshotPercent, acs: s.averageCombatScore, kast: s.kastPercent },
    matches: s.recentEncounters.map(m => {
      const [k, d, a] = (m.killDeathAssist.match(/\d+/g) || []).map(Number);
      return { id: m.matchId, map: m.mapName, agent: m.agentName, icon: m.agentIconUrl, win: m.didWin, score: m.scoreString, k: k || 0, d: d || 0, a: a || 0, hs: m.headshotPercent, acs: m.combatScore, time: m.timeAgo };
    }),
    agents: s.agentLeaderboard.map(a => ({ name: a.agentName, matches: a.matchesPlayed, winRate: a.winRate, kd: a.kdRatio })),
    maps: s.mapDomination.map(m => ({ name: m.mapName, matches: m.matchesPlayed, winRate: m.winRate })),
    weapons: s.weaponArmory.map(w => ({ name: w.weaponName, kills: w.totalKills, hs: w.headshotPercent })),
  };
}
const localArtwork = new Set(['omen','sova','cypher','omen-portrait','haven','ascent','lotus','bind']);
export const asset = (name: string) => localArtwork.has(name.toLowerCase()) ? `/tracker/${name.toLowerCase()}.png` : '/tracker/unknown.svg';
