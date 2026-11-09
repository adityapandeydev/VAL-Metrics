import { Component, For } from 'solid-js';
import { Card, Head, Icon, ICONS, tw } from '../ui';
import { CountUp } from '../motion';
import { Ring } from '../charts';

type State = 'Ready' | 'Needs production key' | 'Needs RSO' | 'Derived';
const ROWS: { area: string; fields: string; source: string; state: State }[] = [
  { area: 'Player identity', fields: 'Riot ID, tag, PUUID, active shard', source: 'account-v1 · /accounts/by-riot-id, /active-shards', state: 'Ready' },
  { area: 'Match history', fields: 'Match IDs, queue, start time', source: 'val-match-v1 · /matchlists/by-puuid', state: 'Needs production key' },
  { area: 'Match detail', fields: 'Scoreboard, K/D/A, score, damage, hit locations, rounds, plants, defuses, economy', source: 'val-match-v1 · /matches/{matchId}', state: 'Needs production key' },
  { area: 'Rank & RR', fields: 'Competitive tier per match, act rank, rank triangle', source: 'val-match-v1 (competitiveTier) + stored history', state: 'Needs production key' },
  { area: 'Leaderboards', fields: 'Immortal+/Radiant leaderboard position', source: 'val-ranked-v1 · /leaderboards/by-act', state: 'Needs production key' },
  { area: 'Game content', fields: 'Agents, maps, weapons, acts, art', source: 'val-content-v1 · /contents', state: 'Ready' },
  { area: 'Service status', fields: 'Maintenance and incident notices', source: 'val-status-v1 · /platform-data', state: 'Ready' },
  { area: 'Ownership & consent', fields: 'Only players who opt in are searchable', source: 'Riot Sign-On (RSO) · /accounts/me', state: 'Needs RSO' },
  { area: 'Derived metrics', fields: 'ADR, KAST, DDΔ, first bloods, clutches, multi-kills, Impact Rating', source: 'Computed by the VAL-Metrics Go backend from match detail', state: 'Derived' },
];

export const DataCoverage: Component = () => {
  const ready = ROWS.filter(r => r.state === 'Ready' || r.state === 'Derived').length;
  return <div class="grid grid-cols-12 gap-4">
    <Card class="col-span-12 flex flex-wrap items-center gap-7" i={0}>
      <Ring value={(ready / ROWS.length) * 100} size={132} color="var(--color-win)"><b><CountUp value={ready} />/{ROWS.length}</b><small>live-ready</small></Ring>
      <div class="min-w-[260px] flex-1">
        <span class={tw.kicker}>For Riot API reviewers</span>
        <h2 class="mt-1.5 mb-2 max-w-[760px] font-display text-[26px] leading-[1.15] font-extrabold">Every section maps to an official Riot API source</h2>
        <p class="max-w-[760px] text-ink-2">The prototype runs on a deterministic sample profile so the full experience is testable today. Swapping in live data is an adapter change: the backend already resolves Riot IDs, pages match lists through a rate-limited cache, and computes every derived stat server-side.</p>
      </div>
    </Card>
    <Card class="col-span-12 wide:col-span-8" i={1}>
      <Head title="Data sources" kicker="What powers each section" />
      <div class="overflow-x-auto"><table class={`${tw.table} [&_td]:min-w-[180px] [&_td]:whitespace-normal [&_td]:text-ink-2`}>
        <thead><tr><th>Section</th><th>Fields</th><th>Riot source</th><th>Status</th></tr></thead>
        <tbody><For each={ROWS}>{(r, i) => <tr class="fx-slide" style={{ '--i': i() }}>
          <th>{r.area}</th><td>{r.fields}</td><td><code class="font-mono text-xs">{r.source}</code></td>
          <td><span class="inline-block rounded px-2 py-[3px] font-display text-[10.5px] font-semibold uppercase tracking-[.08em] whitespace-nowrap" classList={{ 'bg-win/10 text-win': r.state === 'Ready', 'bg-info/10 text-info': r.state === 'Derived', 'bg-accent-2/10 text-accent-2': r.state === 'Needs production key', 'bg-[#9c62f0]/14 text-[#c9a7ff]': r.state === 'Needs RSO' }}>{r.state}</span></td>
        </tr>}</For></tbody>
      </table></div>
    </Card>
    <Card class="col-span-12 wide:col-span-4" i={2}>
      <Head title="Player-protection commitments" />
      <ul class="grid gap-2.5">
        <For each={[
          'Players opt in through Riot Sign-On before their profile is searchable or stored.',
          'No opponent scouting, live win predictions, MMR estimates or hidden information.',
          'Duels and encounters show only your own matches, with neutral wording, and no labels about other players.',
          'Impact Rating is transparent, versioned, and labeled as not a Riot rating.',
          'Sample data is labeled on every screen and kept separate from real player records.',
          'Data deletion requests remove every record tied to a PUUID.',
        ]}>{(t, i) => <li class="fx-slide flex gap-2.5 rounded-lg bg-bg/30 px-3 py-2.5 text-[13px] text-ink-2" style={{ '--i': i() + 2 }}><Icon d={ICONS.shield} size={16} class="mt-0.5 text-win" /><span>{t}</span></li>}</For>
      </ul>
    </Card>
  </div>;
};
