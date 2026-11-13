import { Component, For, Show } from 'solid-js';
import { store } from '../store';
import { Card, Head, RankBadge, Empty, tw } from '../ui';
import { CountUp } from '../motion';
import { Ring, Meter } from '../charts';
import { fmt } from '../data/stats';
import { rankName, rankHue } from '../data/assets';

/** Act rank triangle: 9 best wins stacked 1-3-5 (bottom-up), like the in-game badge. */
const Triangle: Component<{ tiers: number[] }> = p => {
  const rows = [[0], [1, 2, 3], [4, 5, 6, 7, 8]];
  return <svg class="mx-auto w-[72%] overflow-visible" viewBox="0 0 100 88" role="img" aria-label={`Top wins: ${p.tiers.map(rankName).join(', ') || 'none'}`}>
    <For each={rows}>{(row, r) => <For each={row}>{(idx, c) => {
      const up = (c() + r()) % 2 === 0;
      const x = 50 + (c() - (row.length - 1) / 2) * 16.5, y = 8 + r() * 28;
      const pts = up ? `${x},${y} ${x + 16},${y + 26} ${x - 16},${y + 26}` : `${x - 16},${y} ${x + 16},${y} ${x},${y + 26}`;
      const t = p.tiers[idx];
      return <polygon class="fx-pop" points={pts} stroke-width="1.5" style={{ fill: t ? rankHue(t) : 'transparent', stroke: t ? 'rgb(7 8 13 / .9)' : 'var(--color-line-2)', '--i': idx, '--step': '70ms', '--base': '250ms' }} />;
    }}</For>}</For>
  </svg>;
};

export const Seasons: Component = () => {
  const acts = () => store.profile().acts;
  const p = store.profile;
  return <Show when={acts().length} fallback={<Card><Empty title="Act history unavailable" text="Ranked act snapshots arrive with production access to ranked data and RSO consent." /></Card>}>
    <div class="grid gap-4">
      <Card class="grid grid-cols-1 gap-4 md:grid-cols-3 [&>div]:flex [&>div]:items-center [&>div]:gap-4 [&_strong]:block [&_strong]:font-display [&_strong]:text-2xl [&_strong]:font-extrabold [&_small]:text-muted" i={0}>
        <div><RankBadge tier={p().tier} size={84} /><div><span class={tw.kicker}>Current · {acts()[0].label}</span><strong>{rankName(p().tier)}</strong><small><CountUp value={p().rr} /> RR</small></div></div>
        <div><RankBadge tier={p().peakTier} size={84} /><div><span class={tw.kicker}>All-time peak</span><strong>{rankName(p().peakTier)}</strong><small>{p().peakAct}</small></div></div>
        <div><Ring value={(acts().reduce((n, a) => n + a.wins, 0) / Math.max(1, acts().reduce((n, a) => n + a.games, 0))) * 100} size={96} color="var(--color-win)"><b><CountUp value={(acts().reduce((n, a) => n + a.wins, 0) / Math.max(1, acts().reduce((n, a) => n + a.games, 0))) * 100} digits={1} suffix="%" /></b></Ring><div><span class={tw.kicker}>Ranked win rate</span><strong><CountUp value={acts().reduce((n, a) => n + a.games, 0)} /> games</strong><small>across {acts().length} acts</small></div></div>
      </Card>
      <Card i={1}>
        <Head title="Rank climb" kicker="Final rank per act" />
        <div class="flex h-[200px] items-end gap-1 md:h-60 md:gap-2.5">
          <For each={acts().slice().reverse()}>{(a, i) =>
            <div class="grid h-full flex-1 grid-rows-[1fr_auto] justify-items-center gap-2" style={{ '--i': i(), '--h': `${((a.tier - 2) / 25) * 100}%`, '--rank': rankHue(a.tier) }}>
              <div class="relative flex h-full w-full max-w-16 items-end justify-center">
                <i class="fx-grow-y h-(--h) w-full rounded-t-lg rounded-b-[2px] bg-linear-to-b from-[color-mix(in_srgb,var(--rank)_85%,transparent)] to-[color-mix(in_srgb,var(--rank)_10%,transparent)]" style={{ '--i': i() * 2 }} />
                <span class="fx-pop absolute -translate-y-1.5" style={{ bottom: 'var(--h)', '--i': i(), '--step': '90ms', '--base': '1000ms' }}><RankBadge tier={a.tier} size={30} /></span>
              </div>
              <span class="-rotate-[35deg] font-display text-[8.5px] font-semibold tracking-[.08em] whitespace-nowrap text-muted md:rotate-0 md:text-[10.5px]">{a.label}</span>
            </div>}
          </For>
        </div>
      </Card>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
        <For each={acts()}>{(a, i) =>
          <Card as="article" class="grid gap-3" i={i()} style={{ background: `radial-gradient(100% 70% at 50% 0%, color-mix(in srgb, ${rankHue(a.tier)} 14%, transparent), transparent 70%), linear-gradient(180deg, rgb(22 26 37 / .92), rgb(16 19 27 / .92))` }}>
            <header class="flex items-center justify-between"><span class={tw.kicker}>{a.label}</span><Show when={i() === 0}><span class="inline-flex items-center gap-1.5 px-1 py-1 contain-paint font-display text-[10px] font-semibold uppercase tracking-[.12em] text-win"><i class="fx-pulse size-[7px] rounded-full bg-current" />Current</span></Show></header>
            <Triangle tiers={a.triangle} />
            <div class="flex items-center gap-2.5"><RankBadge tier={a.tier} size={38} /><div><strong class="block font-display text-base font-bold">{rankName(a.tier)}</strong><small class="text-xs text-muted">{a.wins}W · {a.games - a.wins}L</small></div></div>
            <div class="flex items-center gap-2.5"><Meter value={(a.wins / Math.max(1, a.games)) * 100} color={a.wins / a.games >= 0.5 ? 'var(--color-win)' : 'var(--color-loss)'} i={i()} thin /><b class="font-display text-[13px] font-bold">{fmt((a.wins / Math.max(1, a.games)) * 100, 0)}%</b></div>
          </Card>}
        </For>
      </div>
    </div>
  </Show>;
};
