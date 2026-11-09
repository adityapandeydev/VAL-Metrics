/**
 * Deterministic synthetic profile. Every number is generated from a fixed seed so the
 * prototype is reproducible for reviewers. Nothing here is a real player's data.
 */
import { agentRole } from './assets';
import type { ActRecord, DuelLine, Match, MatchDetail, Profile, Queue, RoundEnd, RoundLine, ScoreLine, WeaponLine } from './types';

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type R = () => number;
const between = (r: R, a: number, b: number) => a + (b - a) * r();
const int = (r: R, a: number, b: number) => Math.floor(between(r, a, b + 1));
const pick = <T,>(r: R, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];
function weighted<T>(r: R, items: readonly (readonly [T, number])[]) {
  let x = r() * items.reduce((n, [, w]) => n + w, 0);
  for (const [v, w] of items) { if ((x -= w) <= 0) return v; }
  return items[items.length - 1][0];
}
function normal(r: R) { return Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r()); }
function split(r: R, total: number, parts: number[]) {
  const sumW = parts.reduce((a, b) => a + b, 0) || 1;
  const out = parts.map(p => Math.floor((p / sumW) * total));
  let rest = total - out.reduce((a, b) => a + b, 0);
  while (rest-- > 0) out[Math.floor(r() * out.length)]++;
  return out;
}

const AGENTS = [['Omen', 26], ['Sova', 18], ['Jett', 15], ['Cypher', 12], ['Raze', 9], ['Killjoy', 8], ['Fade', 7], ['Clove', 5]] as const;
const AGENT_FORM: Record<string, number> = { Omen: 1.04, Sova: 1.0, Jett: 1.08, Cypher: 0.95, Raze: 1.05, Killjoy: 0.94, Fade: 0.97, Clove: 1.0 };
const MAPS = [['Ascent', 18, 0.07], ['Haven', 16, 0.04], ['Lotus', 14, -0.03], ['Bind', 13, 0.02], ['Sunset', 12, -0.06], ['Split', 10, 0.0], ['Abyss', 9, -0.02], ['Corrode', 8, 0.05]] as const;
const HANDLES = ['Nyx', 'Vantor', 'Kairo', 'lumen', 'Brisk', 'Okami', 'Halcyon', 'zeph', 'Rook', 'Tidal', 'Ember', 'Quill', 'Saber', 'mono', 'Crux', 'Vesper', 'Arlo', 'Juno', 'pixl', 'Drift', 'Nova', 'Kestrel', 'Onyx', 'Wren', 'Sable', 'Fable', 'Cobalt', 'Mirth', 'Rune', 'Glint'];
const TAGS = ['EUW', '0001', 'NA1', 'MUMB', 'APAC', '777', 'GG', 'ZEN', 'K1NG', 'VAL'];
const ALL_AGENT_NAMES = ['Jett', 'Raze', 'Reyna', 'Phoenix', 'Neon', 'Iso', 'Yoru', 'Sova', 'Fade', 'Skye', 'Breach', 'Gekko', 'KAY/O', 'Omen', 'Viper', 'Astra', 'Brimstone', 'Harbor', 'Clove', 'Killjoy', 'Cypher', 'Sage', 'Chamber', 'Deadlock', 'Vyse'];

/** Shared round plan so the list view and detailed timeline always agree. */
export function roundPlan(seed: number, team: number, enemy: number, won: boolean) {
  const r = rng(seed * 7 + 3);
  const total = team + enemy;
  const startAttack = r() < 0.5;
  // Shuffle a fixed number of wins/losses with a mild momentum bias.
  const fill = (t: number, e: number) => {
    const out: boolean[] = [];
    while (t + e > 0) {
      const p = t / (t + e) + (out[out.length - 1] ? 0.06 : -0.06);
      const w = e === 0 || (t > 0 && r() < p);
      out.push(w); w ? t-- : e--;
    }
    return out;
  };
  let seq: boolean[];
  if (total <= 24) {
    // The winner takes the final round; the loser never reaches 13 first.
    seq = [...fill(won ? team - 1 : team, won ? enemy : enemy - 1), won];
  } else {
    // Overtime: 12–12 at regulation, split pairs, then the winner closes out two in a row.
    const extraPairs = (total - 24) / 2 - 1;
    const pairs = Array.from({ length: extraPairs }, () => (r() < 0.5 ? [true, false] : [false, true])).flat();
    seq = [...fill(12, 12), ...pairs, won, won];
  }
  return seq.map((w, i) => {
    const half = i < 12 ? 0 : i < 24 ? 1 : (i - 24) % 2;
    const attack = half === 0 ? startAttack : !startAttack;
    return { won: w, side: (attack ? 'Attack' : 'Defense') as 'Attack' | 'Defense' };
  });
}

function makeMatch(i: number, when: number, tierBefore: number): Match {
  const seed = 9001 + i * 131;
  const r = rng(seed);
  const queue: Queue = weighted(r, [['Competitive', 78], ['Unrated', 15], ['Premier', 7]] as const);
  const agent = weighted(r, AGENTS);
  const role = agentRole(agent);
  const mapRow = weighted(r, MAPS.map(m => [m, m[1]] as const));
  const map = mapRow[0];
  const won = r() < 0.49 + mapRow[2] + (AGENT_FORM[agent] - 1) * 0.6;
  const ot = r() < 0.09;
  const loserScore = ot ? 0 : int(r, 3, 11);
  const [teamScore, enemyScore] = ot ? (r() < 0.6 ? (won ? [14, 12] : [12, 14]) : (won ? [15, 13] : [13, 15])) : (won ? [13, loserScore] : [loserScore, 13]);
  const rounds = teamScore + enemyScore;
  const plan = roundPlan(seed, teamScore, enemyScore, won);

  const perf = Math.max(0.45, 1 + normal(r) * 0.22 + (won ? 0.1 : -0.06)) * AGENT_FORM[agent];
  const duelist = role === 'Duelist';
  const k = Math.max(3, Math.round(rounds * 0.78 * perf * (duelist ? 1.1 : 1)));
  const d = Math.max(4, Math.round(rounds * 0.7 / Math.sqrt(perf) + normal(r) * 1.4));
  const a = Math.max(1, Math.round(rounds * (role === 'Initiator' ? 0.36 : role === 'Controller' ? 0.31 : 0.24) * between(r, 0.75, 1.25)));
  const kpr = k / rounds;
  const adr = Math.round(kpr * 128 + between(r, 22, 46));
  const acs = Math.round(kpr * 185 + adr * 0.62 + a / rounds * 25 + between(r, -12, 14));
  const hsBase = (duelist ? 27 : 24) + normal(r) * 4.5;
  const hits = Math.round(k * between(r, 5.2, 6.4));
  const headshots = Math.round(hits * Math.max(0.1, hsBase) / 100);
  const legshots = Math.round(hits * between(r, 0.04, 0.08));
  const bodyshots = hits - headshots - legshots;
  const kast = Math.round(Math.min(94, Math.max(48, 60 + perf * 14 + (won ? 4 : -3) + normal(r) * 4)));
  const dd = Math.round(adr - (d / rounds) * 141);
  const fkRate = duelist ? 0.15 : role === 'Initiator' ? 0.08 : 0.065;
  const fk = Math.max(0, Math.round(rounds * fkRate * perf + normal(r)));
  const fd = Math.max(0, Math.round(rounds * (duelist ? 0.12 : 0.07) / perf + normal(r) * 0.8));
  const m2 = Math.max(0, Math.round(k * 0.16 + normal(r))), m3 = Math.max(0, Math.round(k * 0.045 + normal(r) * 0.5));
  const m4 = r() < 0.09 * perf ? 1 : 0, m5 = r() < 0.025 * perf ? 1 : 0;
  const clutchAttempts = int(r, 0, Math.round(rounds * 0.1));
  const clutches = Math.round(clutchAttempts * between(r, 0.15, 0.45));
  const atk = plan.filter(p => p.side === 'Attack'), def = plan.filter(p => p.side === 'Defense');
  const plants = Math.round(atk.filter(p => p.won).length * between(r, 0.12, 0.35));
  const defuses = Math.round(def.filter(p => p.won).length * between(r, 0, 0.18));
  const placement = Math.max(1, Math.min(10, Math.round(1 + (290 - acs) / 24 + normal(r) * 0.8)));
  const badge = won && placement === 1 ? 'MVP' : !won && placement <= 3 && r() < 0.6 ? 'Team MVP' : null;

  const rifle = r() < 0.55 ? 'Vandal' : 'Phantom';
  const sniper = agent === 'Jett' ? 'Operator' : 'Outlaw';
  const weaponPool: [string, number][] = [[rifle, 58], [rifle === 'Vandal' ? 'Phantom' : 'Vandal', 6], ['Sheriff', 9], ['Ghost', 7], ['Spectre', 6], ['Classic', 4], [sniper, agent === 'Jett' ? 14 : 3], ['Judge', agent === 'Raze' || agent === 'Cypher' ? 5 : 1], ['Marshal', 1.5], ['Bulldog', 2]];
  const killsPer = split(r, k, weaponPool.map(([, w]) => w * between(r, 0.4, 1.6)));
  const weapons: Record<string, WeaponLine> = {};
  weaponPool.forEach(([name], idx) => {
    const wk = killsPer[idx]; if (!wk) return;
    const wh = Math.round((wk / k) * hits);
    const hsShift = name === 'Sheriff' ? 1.5 : name === 'Ghost' ? 1.3 : name === 'Operator' || name === 'Outlaw' ? 0.35 : name === 'Judge' ? 0.4 : 1;
    const head = Math.min(wh, Math.round(wh * (headshots / Math.max(1, hits)) * hsShift));
    const legs = Math.round((wh - head) * between(r, 0.05, 0.11));
    weapons[name] = { kills: wk, head, body: Math.max(0, wh - head - legs), legs, damage: Math.round(wk * between(r, 128, 162)), longest: Math.round(between(r, 18, name === 'Operator' || name === 'Outlaw' ? 62 : 44)) };
  });

  const ranked = queue === 'Competitive';
  const rrChange = ranked ? (won ? Math.round(14 + perf * 8 + between(r, -2, 4)) : -Math.round(22 - perf * 6 + between(r, -3, 3))) : undefined;

  return {
    id: `VM-${(seed * 2654435761 >>> 0).toString(16).toUpperCase().slice(0, 8)}`,
    map, queue, agent, role, startedAt: new Date(when).toISOString(), durationMin: Math.round(rounds * 1.72 + between(r, 2, 6)),
    won, draw: false, teamScore, enemyScore, rounds,
    k, d, a, acs, adr, hs: (headshots / Math.max(1, hits)) * 100, kast, dd, fk, fd,
    multi: [m2, m3, m4, m5], clutches, clutchAttempts, plants, defuses,
    headshots, bodyshots, legshots, placement, badge, rrChange, tierAfter: ranked ? tierBefore : undefined,
    atkRounds: atk.length, atkRoundsWon: atk.filter(p => p.won).length, defRounds: def.length, defRoundsWon: def.filter(p => p.won).length,
    weapons, seed,
  };
}

let cached: Profile | null = null;
export function sampleProfile(): Profile {
  if (cached) return cached;
  const r = rng(42);
  const COUNT = 56;
  // Build timestamps oldest → newest in evening sessions.
  const now = Date.now();
  const times: number[] = [];
  let day = new Date(now); day.setHours(0, 0, 0, 0);
  while (times.length < COUNT) {
    const start = new Date(day); start.setHours(int(r, 17, 21), int(r, 0, 59), 0, 0);
    let s = start.getTime();
    const session = r() < 0.25 ? 0 : int(r, 1, 4);
    for (let j = 0; j < session && times.length < COUNT; j++) { if (s < now - 36e5) times.push(s); s += int(r, 38, 52) * 6e4; }
    day = new Date(day.getTime() - 864e5);
  }
  times.sort((a, b) => a - b);
  // Forward pass to keep rank, RR and match outcomes consistent.
  let tier = 21, rr = 38;
  const chronological: Match[] = [];
  times.forEach((when, i) => {
    const m = makeMatch(i, when, tier);
    if (m.rrChange != null) {
      rr += m.rrChange;
      if (rr >= 100 && tier < 26) { tier++; rr -= 100; }
      else if (rr < 0 && tier > 3) { tier--; rr += 100; }
      rr = Math.max(0, rr);
      m.tierAfter = tier; m.rrAfter = rr;
    }
    chronological.push(m);
  });
  const acts: ActRecord[] = [
    ['e10a1', 'E10 · A1', 22, 54, 101], ['e9a3', 'E9 · A3', 23, 61, 112], ['e9a2', 'E9 · A2', 21, 38, 71], ['e9a1', 'E9 · A1', 20, 47, 88],
    ['e8a3', 'E8 · A3', 19, 29, 55], ['e8a2', 'E8 · A2', 18, 33, 64], ['e8a1', 'E8 · A1', 17, 22, 40], ['e7a3', 'E7 · A3', 15, 19, 37],
  ].map(([id, label, tr, wins, games]) => {
    const rr2 = rng((tr as number) * 97);
    const tri = Array.from({ length: 9 }, () => Math.max(3, (tr as number) - Math.floor(rr2() * 4))).sort((a, b) => b - a);
    tri[0] = tr as number;
    return { id: id as string, label: label as string, tier: tr as number, wins: wins as number, games: games as number, triangle: tri };
  });
  const currentWins = chronological.filter(m => m.queue === 'Competitive' && m.won).length;
  const currentGames = chronological.filter(m => m.queue === 'Competitive').length;
  acts.unshift({ id: 'e10a2', label: 'E10 · A2', tier, wins: currentWins, games: currentGames, triangle: chronological.filter(m => m.won && m.tierAfter).map(m => m.tierAfter!).sort((a, b) => b - a).slice(0, 9) });
  const peak = Math.max(...acts.map(a => a.tier));
  cached = {
    source: 'sample', sourceNote: 'Synthetic sample profile · deterministic fixture · not a real player',
    name: 'Ghost', tag: 'PLAY', level: 287, region: 'AP · Mumbai', title: 'Night Shift',
    bannerAgent: 'Omen', tier, rr, peakTier: peak, peakAct: acts.find(a => a.tier === peak)!.label,
    leaderboardRank: undefined, acts, matches: chronological.reverse(),
  };
  return cached;
}

/** Lazily generated full match telemetry: scoreboard, rounds, economy and duels. */
const detailCache = new Map<string, MatchDetail>();
export function matchDetail(m: Match, self: { name: string; tag: string; tier: number }): MatchDetail {
  const hit = detailCache.get(m.id); if (hit) return hit;
  const r = rng(m.seed * 13 + 5);
  const plan = roundPlan(m.seed, m.teamScore, m.enemyScore, m.won);
  const used = new Set([m.agent]);
  const nextAgent = () => { let a; do a = pick(r, ALL_AGENT_NAMES); while (used.has(a)); used.add(a); return a; };
  const names = [...HANDLES].sort(() => r() - 0.5);
  const tier = m.tierAfter ?? self.tier;
  const others: ScoreLine[] = Array.from({ length: 9 }, (_, i) => {
    const higher = i < m.placement - 1;
    const acs = Math.max(62, Math.round(higher ? m.acs + between(r, 4, 95) : m.acs - between(r, 4, 125)));
    const rounds = m.rounds;
    const k = Math.max(1, Math.round((acs / 260) * rounds * 0.78 + normal(r)));
    const d = Math.max(3, Math.round(rounds * between(r, 0.55, 0.85)));
    const team: ScoreLine['team'] = i < 4 ? 'ally' : 'enemy';
    // Agents are unique per team, not across the match.
    if (i === 4) { used.clear(); }
    return { name: names[i], tag: pick(r, TAGS), agent: nextAgent(), team, self: false, tier: Math.max(3, Math.min(26, tier + int(r, -2, 2))), acs, k, d, a: int(r, 2, Math.round(rounds * 0.35)), adr: Math.round(acs * 0.62 + between(r, -10, 10)), hs: between(r, 14, 34), kast: Math.round(between(r, 55, 86)), fk: int(r, 0, 5), fd: int(r, 0, 5), mk: int(r, 0, 4), party: i < 2 && r() < 0.5 ? 1 : undefined };
  });
  const me: ScoreLine = { name: self.name, tag: self.tag, agent: m.agent, team: 'ally', self: true, tier, acs: m.acs, k: m.k, d: m.d, a: m.a, adr: m.adr, hs: m.hs, kast: m.kast, fk: m.fk, fd: m.fd, mk: m.multi[1] + m.multi[2] + m.multi[3], party: others.some(o => o.party) ? 1 : undefined };
  const scoreboard = [me, ...others].sort((a, b) => b.acs - a.acs);

  // Rounds: distribute kills toward won rounds; economy follows the classic buy cycle.
  const killShare = split(r, m.k, plan.map(p => (p.won ? 1.5 : 0.7) * between(r, 0.4, 1.6)));
  let bank = 800, lossStreak = 0, enemyLoss = 0;
  const rounds: RoundLine[] = plan.map((p, i) => {
    const pistol = i === 0 || i === 12;
    if (pistol) { bank = 800; lossStreak = 0; enemyLoss = 0; }
    const full = bank >= 3900;
    const loadout = pistol ? int(r, 4, 8) * 100 : full ? int(r, 39, 49) * 100 : bank >= 2000 ? int(r, 18, 26) * 100 : int(r, 2, 9) * 100;
    const enemyLoadout = pistol ? int(r, 4, 8) * 100 : enemyLoss >= 2 || r() < 0.75 ? int(r, 36, 49) * 100 : int(r, 6, 22) * 100;
    const ends: RoundEnd[] = p.side === 'Attack'
      ? (p.won ? ['Detonate', 'Elimination', 'Elimination'] : ['Elimination', 'Defuse', 'Time'])
      : (p.won ? ['Elimination', 'Defuse', 'Time', 'Elimination'] : ['Detonate', 'Elimination']);
    const end = pick(r, ends);
    const spent = Math.min(bank, loadout);
    bank = bank - spent + (p.won ? 3000 : 1900 + Math.min(2, lossStreak) * 500) + killShare[i] * 200;
    bank = Math.min(9000, bank);
    lossStreak = p.won ? 0 : lossStreak + 1; enemyLoss = p.won ? enemyLoss + 1 : 0;
    return { n: i + 1, won: p.won, side: p.side, end, kills: killShare[i], damage: Math.round(killShare[i] * 140 + between(r, 0, 90)), loadout, bank: Math.round(bank / 100) * 100, enemyLoadout, planted: p.side === 'Attack' ? end === 'Detonate' || end === 'Defuse' || r() < 0.3 : end === 'Defuse' || end === 'Detonate', survived: r() < (p.won ? 0.55 : 0.2) };
  });

  const enemies = scoreboard.filter(s => s.team === 'enemy');
  const kSplit = split(r, m.k, enemies.map(() => between(r, 0.5, 1.5)));
  const dSplit = split(r, m.d, enemies.map(e => e.k));
  const duels: DuelLine[] = enemies.map((e, i) => ({ name: e.name, agent: e.agent, kills: kSplit[i], deaths: dSplit[i] }));
  const out = { scoreboard, rounds, duels };
  detailCache.set(m.id, out);
  return out;
}
