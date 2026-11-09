/**
 * Adapter: backend `AdvancedPlayerMetrics` → hub Profile. The server returns aggregates and
 * a short encounter list, so per-match telemetry that is not supplied is marked partial and
 * rendered as unavailable ("—") rather than invented.
 */
import type { AdvancedPlayerMetrics } from '../../../types/analytics';
import { agentRole, weaponCategory } from './assets';
import type { Match, Profile, Role, Stats } from './types';

const N = NaN;
export function fromServer(s: AdvancedPlayerMetrics): Profile {
  const [name, tag] = s.riotId.split('#');
  const matches: Match[] = s.recentEncounters.map((e, i) => {
    const [k, d, a] = (e.killDeathAssist.match(/\d+/g) || []).map(Number);
    const [ts, es] = (e.scoreString.match(/\d+/g) || []).map(Number);
    return {
      id: e.matchId, map: e.mapName, queue: (e.queueMode as Match['queue']) || 'Competitive', agent: e.agentName, role: agentRole(e.agentName),
      startedAt: new Date(Date.now() - i * 36e5).toISOString(), durationMin: N, won: e.didWin, draw: false,
      teamScore: ts || 0, enemyScore: es || 0, rounds: (ts || 0) + (es || 0),
      k: k || 0, d: d || 0, a: a || 0, acs: e.combatScore, adr: N, hs: e.headshotPercent, kast: N, dd: e.damageDelta, fk: 0, fd: 0,
      multi: [0, 0, 0, 0], clutches: 0, clutchAttempts: 0, plants: 0, defuses: 0, headshots: 0, bodyshots: 0, legshots: 0,
      placement: N, badge: null, atkRounds: 0, atkRoundsWon: 0, defRounds: 0, defRoundsWon: 0, weapons: {}, seed: i + 1, partial: true,
    };
  });
  const sum = s;
  const view: Stats = {
    summary: {
      matches: sum.totalMatches, wins: sum.wins, losses: sum.losses, draws: 0, winRate: sum.winRate,
      rounds: N, roundsWon: N, roundWinRate: sum.roundWinRate,
      kills: sum.kills, deaths: sum.deaths, assists: sum.assists, kd: sum.kdRatio, kad: sum.kadRatio, kpr: sum.killsPerRound, dpr: N, apr: N,
      adr: sum.damagePerRound, acs: sum.averageCombatScore, hs: sum.headshotPercent, kast: sum.kastPercent, dd: sum.damageDeltaPerRound,
      fk: sum.firstBloods, fd: N, fkRate: N, multi: [N, N, N, sum.aces], clutches: sum.clutches, clutchAttempts: N,
      aces: sum.aces, flawless: sum.flawlessRounds, mostKills: N, plants: N, defuses: N,
      headshots: sum.headshots, bodyshots: sum.bodyshots, legshots: sum.legshots, playtimeH: sum.playtimeHours,
      atkWinRate: N, defWinRate: N, impact: null, mvps: N, teamMvps: N,
    },
    agents: sum.agentLeaderboard.map(a => ({ name: a.agentName, role: (a.role as Role) || agentRole(a.agentName), matches: a.matchesPlayed, wins: Math.round(a.matchesPlayed * a.winRate / 100), winRate: a.winRate, kd: a.kdRatio, adr: a.adr, acs: a.acs, dd: a.damageDelta, hs: N, kast: N, fk: N, playtimeH: a.playtimeHours, bestMap: a.bestMapName || '—', bestMapWR: a.bestMapWinRate })),
    maps: sum.mapDomination.map(m => { const w = Math.round(m.matchesPlayed * m.winRate / 100); return { name: m.mapName, matches: m.matchesPlayed, wins: w, losses: m.matchesPlayed - w, winRate: m.winRate, atkWR: N, defWR: N, kd: N, acs: N, adr: N, topAgent: '—' }; }),
    weapons: sum.weaponArmory.map(w => ({ name: w.weaponName, category: w.category || weaponCategory(w.weaponName), kills: w.totalKills, hs: w.headshotPercent, body: w.bodyshotPercent, legs: w.legshotPercent, damagePerKill: N, longest: N, killShare: N })),
    roles: Object.values(sum.roleMastery || {}).map(r => ({ role: r.roleName as Role, matches: r.matches, wins: Math.round(r.matches * r.winRate / 100), winRate: r.winRate, kd: r.kdRatio, kda: N, acs: N })),
  };
  return {
    source: 'server', sourceNote: s.dataSource || 'Backend response',
    name: name || s.riotId, tag: tag || '', level: N, region: '—', title: '', bannerAgent: view.agents[0]?.name || 'Omen',
    tier: 0, rr: N, peakTier: 0, peakAct: '—', acts: [], matches, serverView: view,
  };
}
