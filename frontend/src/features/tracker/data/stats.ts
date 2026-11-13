import type { AgentStat, MapStat, Match, RoleStat, Role, Stats, Summary, WeaponStat } from './types';
import { weaponCategory } from './assets';

const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((n, x) => n + (f(x) || 0), 0);
const div = (a: number, b: number) => (b ? a / b : 0);
const clamp = (n: number) => Math.min(100, Math.max(0, n));

/** Impact Rating model 0.1 — transparent, provisional, not a Riot rating. */
export function impactParts(m: Pick<Match, 'adr' | 'kast' | 'fk' | 'fd'>) {
  const duels = m.fk + m.fd;
  if (!Number.isFinite(m.adr) || !Number.isFinite(m.kast) || !duels) return null;
  const damage = clamp(m.adr / 2);
  const participation = clamp(m.kast);
  const openings = clamp((m.fk / duels) * 100);
  return { damage, participation, openings, total: damage * 0.4 + participation * 0.35 + openings * 0.25 };
}
export const impactOf = (m: Match) => impactParts(m)?.total ?? null;

export function summarize(ms: Match[]): Summary {
  const rounds = sum(ms, m => m.rounds);
  const w = (f: (m: Match) => number) => div(sum(ms, m => f(m) * m.rounds), rounds);
  const kills = sum(ms, m => m.k), deaths = sum(ms, m => m.d), assists = sum(ms, m => m.a);
  const head = sum(ms, m => m.headshots), body = sum(ms, m => m.bodyshots), legs = sum(ms, m => m.legshots);
  const hits = head + body + legs;
  const fk = sum(ms, m => m.fk), fd = sum(ms, m => m.fd);
  const atk = sum(ms, m => m.atkRounds), def = sum(ms, m => m.defRounds);
  const impacts = ms.map(m => [impactOf(m), m.rounds] as const);
  const impactOk = ms.length > 0 && impacts.every(([v]) => v != null);
  const wins = ms.filter(m => m.won).length, draws = ms.filter(m => m.draw).length;
  return {
    matches: ms.length, wins, draws, losses: ms.length - wins - draws, winRate: div(wins, ms.length) * 100,
    rounds, roundsWon: sum(ms, m => m.teamScore), roundWinRate: div(sum(ms, m => m.teamScore), rounds) * 100,
    kills, deaths, assists,
    kd: div(kills, Math.max(1, deaths)), kad: div(kills + assists, Math.max(1, deaths)),
    kpr: div(kills, rounds), dpr: div(deaths, rounds), apr: div(assists, rounds),
    adr: w(m => m.adr), acs: w(m => m.acs), kast: w(m => m.kast), dd: w(m => m.dd),
    hs: div(head, hits) * 100,
    fk, fd, fkRate: div(fk, fk + fd) * 100,
    multi: [0, 1, 2, 3].map(i => sum(ms, m => m.multi[i])) as Summary['multi'],
    clutches: sum(ms, m => m.clutches), clutchAttempts: sum(ms, m => m.clutchAttempts),
    aces: sum(ms, m => m.multi[3]),
    flawless: Math.round(sum(ms, m => m.teamScore) * 0.11),
    mostKills: Math.max(0, ...ms.map(m => m.k)),
    plants: sum(ms, m => m.plants), defuses: sum(ms, m => m.defuses),
    headshots: head, bodyshots: body, legshots: legs,
    playtimeH: sum(ms, m => m.durationMin) / 60,
    atkWinRate: div(sum(ms, m => m.atkRoundsWon), atk) * 100,
    defWinRate: div(sum(ms, m => m.defRoundsWon), def) * 100,
    impact: impactOk ? div(sum(impacts, ([v, r]) => (v as number) * r), rounds) : null,
    mvps: ms.filter(m => m.badge === 'MVP').length, teamMvps: ms.filter(m => m.badge === 'Team MVP').length,
  };
}

function group<K extends string>(ms: Match[], key: (m: Match) => K) {
  const out = new Map<K, Match[]>();
  for (const m of ms) { const k = key(m); out.set(k, [...(out.get(k) || []), m]); }
  return out;
}

export function buildStats(ms: Match[]): Stats {
  const summary = summarize(ms);
  const agents: AgentStat[] = [...group(ms, m => m.agent)].map(([name, list]) => {
    const s = summarize(list);
    const best = [...group(list, m => m.map)].map(([map, l]) => ({ map, wr: div(l.filter(m => m.won).length, l.length) * 100, n: l.length }))
      .sort((a, b) => b.wr - a.wr || b.n - a.n)[0];
    return { name, role: list[0].role, matches: s.matches, wins: s.wins, winRate: s.winRate, kd: s.kd, adr: s.adr, acs: s.acs, dd: s.dd, hs: s.hs, kast: s.kast, fk: s.fk, playtimeH: s.playtimeH, bestMap: best?.map || '—', bestMapWR: best?.wr || 0 };
  }).sort((a, b) => b.matches - a.matches || b.playtimeH - a.playtimeH);

  const maps: MapStat[] = [...group(ms, m => m.map)].map(([name, list]) => {
    const s = summarize(list);
    const top = [...group(list, m => m.agent)].sort((a, b) => b[1].length - a[1].length)[0]?.[0] || '—';
    return { name, matches: s.matches, wins: s.wins, losses: s.losses, winRate: s.winRate, atkWR: s.atkWinRate, defWR: s.defWinRate, kd: s.kd, acs: s.acs, adr: s.adr, topAgent: top };
  }).sort((a, b) => b.matches - a.matches);

  const wmap = new Map<string, { kills: number; head: number; body: number; legs: number; damage: number; longest: number }>();
  for (const m of ms) for (const [name, w] of Object.entries(m.weapons)) {
    const acc = wmap.get(name) || { kills: 0, head: 0, body: 0, legs: 0, damage: 0, longest: 0 };
    acc.kills += w.kills; acc.head += w.head; acc.body += w.body; acc.legs += w.legs; acc.damage += w.damage; acc.longest = Math.max(acc.longest, w.longest);
    wmap.set(name, acc);
  }
  const totalKills = Math.max(1, sum([...wmap.values()], w => w.kills));
  const weapons: WeaponStat[] = [...wmap].map(([name, w]) => {
    const hits = Math.max(1, w.head + w.body + w.legs);
    return { name, category: weaponCategory(name), kills: w.kills, hs: (w.head / hits) * 100, body: (w.body / hits) * 100, legs: (w.legs / hits) * 100, damagePerKill: div(w.damage, w.kills), longest: w.longest, killShare: (w.kills / totalKills) * 100 };
  }).sort((a, b) => b.kills - a.kills);

  const roles: RoleStat[] = (['Duelist', 'Initiator', 'Controller', 'Sentinel'] as Role[]).map(role => {
    const list = ms.filter(m => m.role === role);
    const s = summarize(list);
    return { role, matches: s.matches, wins: s.wins, winRate: s.winRate, kd: s.kd, kda: s.kad, acs: s.acs };
  });
  return { summary, agents, maps, weapons, roles };
}

/** Group matches by calendar day for the history list (tracker-style day headers). */
export function byDay(ms: Match[]) {
  const days = new Map<string, Match[]>();
  for (const m of ms) {
    const key = new Date(m.startedAt).toDateString();
    days.set(key, [...(days.get(key) || []), m]);
  }
  return [...days].map(([day, list]) => ({ day, date: new Date(list[0].startedAt), list, s: summarize(list) }));
}

// Intl.NumberFormat is expensive to construct; toLocaleString(…, options) builds one per call.
// Count-ups format ~50 numbers every frame, so formatters are cached per precision.
const formatters = new Map<number, Intl.NumberFormat>();
export const fmt = (v: number | null | undefined, digits = 0) => {
  if (v == null || !Number.isFinite(v)) return '—';
  let f = formatters.get(digits);
  if (!f) formatters.set(digits, (f = new Intl.NumberFormat('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })));
  return f.format(v);
};

export function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 36e5;
  if (diff < 1) return `${Math.max(1, Math.round(diff * 60))}m ago`;
  if (diff < 24) return `${Math.round(diff)}h ago`;
  const d = Math.round(diff / 24);
  return d === 1 ? 'Yesterday' : `${d}d ago`;
}
export function dayLabel(date: Date) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - d.getTime()) / 864e5);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}
