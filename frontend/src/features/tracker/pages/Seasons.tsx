import { Component, For, Show } from 'solid-js';
import { store } from '../store';
import { Card, Head, RankBadge, Empty } from '../ui';
import { CountUp } from '../motion';
import { Ring, Meter } from '../charts';
import { fmt } from '../data/stats';
import { rankName, rankHue } from '../data/assets';

/** Act rank triangle: 9 best wins stacked 1-3-5 (bottom-up), like the in-game badge. */
const Triangle: Component<{ tiers: number[] }> = p => {
  const rows = [[0], [1, 2, 3], [4, 5, 6, 7, 8]];
  return <svg class="triangle" viewBox="0 0 100 88" role="img" aria-label={`Top wins: ${p.tiers.map(rankName).join(', ') || 'none'}`}>
    <For each={rows}>{(row, r) => <For each={row}>{(idx, c) => {
      const up = (c() + r()) % 2 === 0;
      const x = 50 + (c() - (row.length - 1) / 2) * 16.5, y = 8 + r() * 28;
      const pts = up ? `${x},${y} ${x + 16},${y + 26} ${x - 16},${y + 26}` : `${x - 16},${y} ${x + 16},${y} ${x},${y + 26}`;
      const t = p.tiers[idx];
      return <polygon class="tri" points={pts} style={{ fill: t ? rankHue(t) : 'transparent', '--i': idx }} />;
    }}</For>}</For>
  </svg>;
};

export const Seasons: Component = () => {
  const acts = () => store.profile().acts;
  const p = store.profile;
  return <Show when={acts().length} fallback={<Card><Empty title="Act history unavailable" text="Ranked act snapshots arrive with production access to ranked data and RSO consent." /></Card>}>
    <div class="stack">
      <Card class="season-hero" i={0}>
        <div class="sh-item"><RankBadge tier={p().tier} size={84} /><div><span class="kicker">Current · {acts()[0].label}</span><strong>{rankName(p().tier)}</strong><small><CountUp value={p().rr} /> RR</small></div></div>
        <div class="sh-item"><RankBadge tier={p().peakTier} size={84} /><div><span class="kicker">All-time peak</span><strong>{rankName(p().peakTier)}</strong><small>{p().peakAct}</small></div></div>
        <div class="sh-item"><Ring value={(acts().reduce((n, a) => n + a.wins, 0) / Math.max(1, acts().reduce((n, a) => n + a.games, 0))) * 100} size={96} color="var(--win)"><b><CountUp value={(acts().reduce((n, a) => n + a.wins, 0) / Math.max(1, acts().reduce((n, a) => n + a.games, 0))) * 100} digits={1} suffix="%" /></b></Ring><div><span class="kicker">Ranked win rate</span><strong><CountUp value={acts().reduce((n, a) => n + a.games, 0)} /> games</strong><small>across {acts().length} acts</small></div></div>
      </Card>
      <Card i={1}>
        <Head title="Rank climb" kicker="Final rank per act" />
        <div class="climb">
          <For each={acts().slice().reverse()}>{(a, i) =>
            <div class="climb-col" style={{ '--i': i(), '--h': `${((a.tier - 2) / 25) * 100}%`, '--rank': rankHue(a.tier) }}>
              <div class="climb-bar"><i /><RankBadge tier={a.tier} size={30} /></div>
              <span>{a.label}</span>
            </div>}
          </For>
        </div>
      </Card>
      <div class="act-grid">
        <For each={acts()}>{(a, i) =>
          <Card as="article" class="act-card" i={i()} style={{ '--rank': rankHue(a.tier) }}>
            <header><span class="kicker">{a.label}</span><Show when={i() === 0}><span class="live-dot">Current</span></Show></header>
            <Triangle tiers={a.triangle} />
            <div class="act-rank"><RankBadge tier={a.tier} size={38} /><div><strong>{rankName(a.tier)}</strong><small>{a.wins}W · {a.games - a.wins}L</small></div></div>
            <div class="act-wr"><Meter value={(a.wins / Math.max(1, a.games)) * 100} color={a.wins / a.games >= 0.5 ? 'var(--win)' : 'var(--loss)'} i={i()} thin /><b>{fmt((a.wins / Math.max(1, a.games)) * 100, 0)}%</b></div>
          </Card>}
        </For>
      </div>
    </div>
  </Show>;
};
