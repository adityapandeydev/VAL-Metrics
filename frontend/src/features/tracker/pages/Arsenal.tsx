import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { store } from '../store';
import { Card, Head, AgentIcon, Img, Empty, Swatch, tw, tone } from '../ui';
import { CountUp } from '../motion';
import { Meter, Ring, SplitBar } from '../charts';
import { fmt } from '../data/stats';
import { agentPortrait, mapSplash, mapLocation, weaponIcon, ROLE_COLOR } from '../data/assets';
import { HIT, RoleTag } from './Overview';
import type { Role } from '../data/types';

const statList = '[&_span]:grid [&_small]:font-display [&_small]:text-[9.5px] [&_small]:font-semibold [&_small]:uppercase [&_small]:tracking-[.14em] [&_small]:text-muted [&_b]:font-display [&_b]:font-bold';
const ringCol = '[&>div]:grid [&>div]:justify-items-center [&>div]:gap-1.5 [&>div>span]:font-display [&>div>span]:text-[10.5px] [&>div>span]:font-semibold [&>div>span]:uppercase [&>div>span]:tracking-[.14em] [&>div>span]:text-muted';

/* ─────────────────────────── Agents ─────────────────────────── */
export const Agents: Component = () => {
  const [role, setRole] = createSignal<'All' | Role>('All');
  const [sort, setSort] = createSignal<'matches' | 'winRate' | 'kd' | 'acs' | 'adr'>('matches');
  const [pick, setPick] = createSignal<string>();
  const list = createMemo(() => store.stats().agents.filter(a => role() === 'All' || a.role === role()).slice().sort((a, b) => (b[sort()] as number) - (a[sort()] as number)));
  const spot = createMemo(() => store.stats().agents.find(a => a.name === pick()) || list()[0]);
  const maxM = () => Math.max(1, ...store.stats().agents.map(a => a.matches));
  return <Show when={store.stats().agents.length} fallback={<Card><Empty title="No agent data" text="No agents were played in this view." /></Card>}>
    <div class="grid gap-4">
      <Show when={spot()} keyed>{a =>
        <Card class="grid min-h-80 grid-cols-1 gap-6 md:grid-cols-[340px_1fr]" flush i={0}
          style={{ background: `radial-gradient(70% 120% at 10% 50%, color-mix(in srgb, ${ROLE_COLOR[a.role]} 30%, transparent), transparent 70%), linear-gradient(180deg, rgb(22 26 37 / .95), rgb(16 19 27 / .95))` }}>
          <div class="relative h-[220px] overflow-hidden md:h-auto">
            <Img class="absolute -top-[20%] left-[5%] w-[90%] max-w-none animate-hero-in [mask-image:linear-gradient(180deg,#000_70%,transparent)] md:-top-[8%] md:-left-[10%] md:w-[125%]" src={agentPortrait(a.name)} loading="eager" />
          </div>
          <div class="grid content-center gap-2.5 px-[18px] pb-[22px] md:py-[26px] md:pr-[26px] md:pl-0">
            <RoleTag role={a.role} />
            <h2 class="animate-rise font-display text-[40px] leading-none font-extrabold uppercase tracking-[.02em] [animation-delay:.1s] md:text-[54px]">{a.name}</h2>
            <p class="text-muted">{a.matches} matches · {fmt(a.playtimeH, 1)} hours · best on <b class="text-ink">{a.bestMap}</b> ({fmt(a.bestMapWR, 0)}% WR)</p>
            <div class={`mt-1.5 flex flex-wrap gap-[22px] ${ringCol}`}>
              <div><Ring value={a.winRate} size={96} color="var(--color-win)"><b><CountUp value={a.winRate} digits={0} suffix="%" /></b></Ring><span>Win rate</span></div>
              <div><Ring value={a.kd} max={2} size={96} delay={100}><b><CountUp value={a.kd} digits={2} /></b></Ring><span>K/D</span></div>
              <div><Ring value={a.hs} max={50} size={96} color={HIT.head} delay={200}><b><CountUp value={a.hs} digits={0} suffix="%" /></b></Ring><span>HS%</span></div>
              <div><Ring value={a.kast} size={96} color="var(--color-info)" delay={300}><b><CountUp value={a.kast} digits={0} suffix="%" /></b></Ring><span>KAST</span></div>
            </div>
            <div class={`mt-2 flex flex-wrap gap-[26px] [&_b]:text-xl ${statList}`}>
              <span><small>ACS</small><b><CountUp value={a.acs} /></b></span>
              <span><small>ADR</small><b><CountUp value={a.adr} /></b></span>
              <span><small>DDΔ</small><b><CountUp value={a.dd} signed /></b></span>
              <span><small>First bloods</small><b><CountUp value={a.fk} /></b></span>
              <span><small>Record</small><b>{a.wins}W · {a.matches - a.wins}L</b></span>
            </div>
          </div>
        </Card>}
      </Show>
      <Card i={1}>
        <Head title="Agent breakdown" kicker="Select a row to spotlight">
          <div class="flex flex-wrap items-center gap-1.5">
            <For each={['All', 'Duelist', 'Initiator', 'Controller', 'Sentinel'] as const}>{r =>
              <button class={`${tw.chip} ${role() === r ? tw.chipOn : ''}`} style={{ '--role': r === 'All' ? 'var(--color-ink-2)' : ROLE_COLOR[r] }} onClick={() => setRole(r)}>{r}</button>}
            </For>
            <label class={tw.select}><span>Sort</span><select value={sort()} onChange={e => setSort(e.currentTarget.value as any)}><option value="matches">Matches</option><option value="winRate">Win rate</option><option value="kd">K/D</option><option value="acs">ACS</option><option value="adr">ADR</option></select></label>
          </div>
        </Head>
        <div class="overflow-x-auto"><table class={tw.table}>
          <thead><tr><th>Agent</th><th>Matches</th><th>Time</th><th>Win rate</th><th>K/D</th><th>ADR</th><th>ACS</th><th>DDΔ</th><th>HS%</th><th>KAST</th><th>Best map</th></tr></thead>
          <tbody><For each={list()} fallback={<tr><td colspan="11" class="text-muted">No {role()} agents played.</td></tr>}>{(a, i) =>
            <tr class="fx-slide cursor-pointer transition-colors hover:bg-surface-3/55" classList={{ 'bg-accent/8! [&>th]:shadow-[inset_3px_0_0_var(--role)]': spot()?.name === a.name }}
              style={{ '--i': i(), '--role': ROLE_COLOR[a.role] }} onClick={() => { setPick(a.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }} tabindex="0" onKeyDown={e => e.key === 'Enter' && setPick(a.name)}>
              <th><div class="flex items-center gap-2.5"><AgentIcon name={a.name} size={36} /><span class="grid font-display text-sm font-semibold">{a.name}<small class="font-body text-[10.5px] font-medium tracking-[.04em] text-muted">{a.role}</small></span></div></th>
              <td><div class="flex min-w-[120px] items-center gap-2.5"><b class="w-[46px] font-display text-[13px] font-bold">{a.matches}</b><Meter value={a.matches} max={maxM()} thin i={i()} /></div></td>
              <td>{fmt(a.playtimeH, 1)}h</td>
              <td><div class="flex min-w-[120px] items-center gap-2.5"><b class="w-[46px] font-display text-[13px] font-bold">{fmt(a.winRate, 1)}%</b><Meter value={a.winRate} color={a.winRate >= 50 ? 'var(--color-win)' : 'var(--color-loss)'} thin i={i()} /></div></td>
              <td>{fmt(a.kd, 2)}</td><td>{fmt(a.adr, 0)}</td><td>{fmt(a.acs, 0)}</td>
              <td class={tone(a.dd)}>{a.dd > 0 ? '+' : ''}{fmt(a.dd, 0)}</td>
              <td>{fmt(a.hs, 1)}%</td><td>{fmt(a.kast, 0)}%</td><td>{a.bestMap}<small class="text-muted"> {fmt(a.bestMapWR, 0)}%</small></td>
            </tr>}</For></tbody>
        </table></div>
      </Card>
    </div>
  </Show>;
};

/* ─────────────────────────── Maps ─────────────────────────── */
export const Maps: Component = () => {
  const maps = () => store.stats().maps;
  return <Show when={maps().length} fallback={<Card><Empty title="No map data" text="No maps were played in this view." /></Card>}>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      <For each={maps()}>{(m, i) =>
        <Card as="article" class="group" i={i()} flush>
          <div class="relative h-[130px] overflow-hidden after:absolute after:inset-0 after:bg-linear-to-t after:from-surface after:to-transparent after:to-70%">
            <Img class="size-full scale-[1.12] object-cover transition-transform duration-[1400ms] ease-out-expo group-[.in]:scale-100 group-hover:scale-[1.07]" src={mapSplash(m.name)} />
          </div>
          <div class="relative -mt-[42px] grid gap-3 px-[18px] pb-4">
            <header class="flex items-end justify-between">
              <div><h3 class="font-display text-[26px] font-extrabold uppercase tracking-[.04em]">{m.name}</h3><small class="text-xs text-ink-2">{mapLocation(m.name)}</small></div>
              <div class="rounded-full bg-bg/70"><Ring value={m.winRate} size={74} stroke={6} color={m.winRate >= 50 ? 'var(--color-win)' : 'var(--color-loss)'} delay={i() * 60}><b class="text-base!"><CountUp value={m.winRate} digits={0} suffix="%" /></b></Ring></div>
            </header>
            <div class="flex gap-3 font-display text-[13px] font-bold"><span class="text-win">{m.wins}W</span><span class="text-loss">{m.losses}L</span><span class="text-muted">{m.matches} played</span></div>
            <div class="grid gap-2 [&>div]:grid [&>div]:grid-cols-[62px_1fr_38px] [&>div]:items-center [&>div]:gap-2.5 [&>div]:text-xs [&>div]:text-ink-2 [&_b]:text-right [&_b]:font-display [&_b]:text-[13px] [&_b]:font-bold [&_b]:text-ink">
              <div><span>Attack</span><Meter value={m.atkWR} i={i()} /><b>{fmt(m.atkWR, 0)}%</b></div>
              <div><span>Defense</span><Meter value={m.defWR} color="var(--color-info)" i={i() + 1} /><b>{fmt(m.defWR, 0)}%</b></div>
            </div>
            <footer class={`flex justify-between gap-2.5 border-t border-line pt-3 [&_b]:text-[15px] ${statList}`}>
              <span><small>K/D</small><b>{fmt(m.kd, 2)}</b></span><span><small>ACS</small><b>{fmt(m.acs, 0)}</b></span><span><small>ADR</small><b>{fmt(m.adr, 0)}</b></span>
              <span class="justify-items-end"><small>Most played</small><Show when={m.topAgent !== '—'} fallback={<b>—</b>}><AgentIcon name={m.topAgent} size={26} /></Show></span>
            </footer>
          </div>
        </Card>}
      </For>
    </div>
  </Show>;
};

/* ─────────────────────────── Weapons ─────────────────────────── */
export const Weapons: Component = () => {
  const [cat, setCat] = createSignal('All');
  const cats = () => ['All', ...new Set(store.stats().weapons.map(w => w.category))];
  const list = () => store.stats().weapons.filter(w => cat() === 'All' || w.category === cat());
  const top = () => Math.max(1, ...store.stats().weapons.map(w => w.kills));
  return <Show when={store.stats().weapons.length} fallback={<Card><Empty title="No weapon data" text="No weapon kills were recorded in this view." /></Card>}>
    <div class="grid gap-4">
      <div class="flex flex-wrap items-center gap-1.5 px-0.5"><For each={cats()}>{c => <button class={`${tw.chip} ${cat() === c ? tw.chipOn : ''}`} onClick={() => setCat(c)}>{c}</button>}</For></div>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        <For each={list()}>{(w, i) =>
          <Card as="article" class="group grid gap-3" i={i()}>
            <header class="flex items-start justify-between">
              <div><h3 class="font-display text-[22px] font-extrabold uppercase tracking-[.04em]">{w.name}</h3><small class="text-xs text-muted">{w.category}</small></div>
              <span class="grid justify-items-end"><b class="font-display text-[28px] leading-none font-extrabold text-accent-2"><CountUp value={w.kills} delay={i() * 50} /></b><small class={tw.label}>kills</small></span>
            </header>
            <div class="grid h-[92px] place-items-center rounded-lg bg-[radial-gradient(60%_80%_at_50%_50%,rgb(255_70_85/.1),transparent_70%)]">
              <Img class="max-h-[70px] w-auto -translate-x-10 -rotate-6 opacity-0 drop-shadow-[0_10px_18px_rgb(0_0_0/.7)] transition duration-1000 ease-spring group-[.in]:translate-x-0 group-[.in]:rotate-0 group-[.in]:opacity-100 group-hover:translate-x-1.5! group-hover:-rotate-2! group-hover:scale-105" src={weaponIcon(w.name)} />
            </div>
            <div class="grid grid-cols-[auto_1fr_46px] items-center gap-2.5 text-xs text-ink-2"><span>Share of kills</span><Meter value={w.kills} max={top()} i={i()} /><b class="text-right font-display text-[13px] font-bold text-ink">{fmt(w.killShare, 1)}%</b></div>
            <SplitBar parts={[{ label: 'Head', value: w.hs, color: HIT.head }, { label: 'Body', value: w.body, color: HIT.body }, { label: 'Legs', value: w.legs, color: HIT.legs }]} />
            <div class="flex flex-wrap justify-between gap-1.5 text-xs text-ink-2 [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px] [&_b]:font-display [&_b]:text-ink">
              <span><Swatch color={HIT.head} class="size-2!" />Head <b>{fmt(w.hs, 1)}%</b></span><span><Swatch color={HIT.body} class="size-2!" />Body <b>{fmt(w.body, 1)}%</b></span><span><Swatch color={HIT.legs} class="size-2!" />Legs <b>{fmt(w.legs, 1)}%</b></span>
            </div>
            <footer class={`flex justify-between gap-2.5 border-t border-line pt-3 [&_b]:text-[15px] ${statList}`}>
              <span><small>Damage / kill</small><b>{fmt(w.damagePerKill, 0)}</b></span><span><small>Longest kill</small><b>{Number.isFinite(w.longest) ? `${fmt(w.longest)} m` : '—'}</b></span>
            </footer>
          </Card>}
        </For>
      </div>
    </div>
  </Show>;
};
