import { Component, For, Show, createEffect, createMemo, createSignal, untrack } from 'solid-js';
import { store } from '../store';
import { Card, AgentIcon, Img, Result, RankBadge, Icon, ICONS, Empty, Stat, tw, rrTone, tone } from '../ui';
import { CountUp } from '../motion';
import { Meter, Ring } from '../charts';
import { byDay, dayLabel, fmt, impactParts, relTime } from '../data/stats';
import { mapSplash, mapLocation, agentPortrait, rankName, weaponIcon } from '../data/assets';
import { matchDetail } from '../data/demo';
import type { Match } from '../data/types';

const place = 'whitespace-nowrap rounded px-2 py-[3px] font-display text-xs font-bold';
const Badge: Component<{ badge: Match['badge'] }> = p =>
  <span class={place} classList={{
    'animate-shimmer border-0 bg-linear-135 from-gold to-accent-2 bg-[length:200%_100%] text-[#1a1205]': p.badge === 'MVP',
    'border border-accent-2/30 bg-accent-2/10 text-accent-2': p.badge === 'Team MVP',
  }}>{p.badge}</span>;
const Placement: Component<{ m: Match }> = p =>
  <Show when={p.m.badge} fallback={<span class={`${place} bg-surface-3 text-ink-2`}>{Number.isFinite(p.m.placement) ? `#${p.m.placement}` : '—'}</span>}>
    <Badge badge={p.m.badge} />
  </Show>;

const cell = 'relative [&_b]:block [&_b]:font-display [&_b]:text-sm [&_b]:font-bold [&_small]:text-[10.5px] [&_small]:uppercase [&_small]:tracking-[.08em] [&_small]:text-muted';

export const Matches: Component = () => {
  const [result, setResult] = createSignal<'all' | 'win' | 'loss'>('all');
  const [agent, setAgent] = createSignal('all');
  const [map, setMap] = createSignal('all');
  const all = () => store.matches();
  const list = createMemo(() => all().filter(m => (result() === 'all' || (result() === 'win') === m.won) && (agent() === 'all' || m.agent === agent()) && (map() === 'all' || m.map === map())));
  const groups = createMemo(() => byDay(list()));
  return <div class="grid gap-4">
    <Card class="px-4! py-3.5!" i={0}>
      <div class="flex flex-wrap items-center gap-3.5">
        <div class={tw.segWrap} role="radiogroup" aria-label="Result">
          <For each={[['all', 'All'], ['win', 'Wins'], ['loss', 'Losses']] as const}>{([v, l]) =>
            <button role="radio" aria-checked={result() === v} class={`${tw.segSm} ${result() === v ? tw.segOn : ''}`} onClick={() => setResult(v)}>{l}</button>}
          </For>
        </div>
        <label class={tw.select}><span>Agent</span><select value={agent()} onChange={e => setAgent(e.currentTarget.value)}><option value="all">All agents</option><For each={[...new Set(all().map(m => m.agent))].sort()}>{a => <option>{a}</option>}</For></select></label>
        <label class={tw.select}><span>Map</span><select value={map()} onChange={e => setMap(e.currentTarget.value)}><option value="all">All maps</option><For each={[...new Set(all().map(m => m.map))].sort()}>{a => <option>{a}</option>}</For></select></label>
        <span class="ml-auto text-[12.5px] text-muted"><b class="font-display text-[15px] font-bold text-ink"><CountUp value={list().length} duration={500} /></b> of {all().length} matches</span>
      </div>
    </Card>
    <Show when={groups().length} fallback={<Card><Empty title="No matches match these filters" text="Clear a filter to see the rest of the history." /></Card>}>
      <For each={groups()}>{(g, gi) =>
        <Card i={Math.min(gi(), 4)} flush>
          <header class="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/35 px-[18px] py-3.5">
            <div><strong class="mr-2.5 font-display text-[15px] font-bold uppercase tracking-[.06em]">{dayLabel(g.date)}</strong><span class="text-[12.5px] text-muted">{g.s.wins}W · {g.s.losses}L</span></div>
            <div class="flex gap-3 md:gap-[18px] [&_span]:grid [&_span]:text-right [&_small]:font-display [&_small]:text-[9.5px] [&_small]:font-semibold [&_small]:tracking-[.14em] [&_small]:text-muted [&_b]:font-display [&_b]:text-sm [&_b]:font-bold">
              <span><small>K/D</small><b>{fmt(g.s.kd, 2)}</b></span>
              <span><small>HS%</small><b>{fmt(g.s.hs, 1)}</b></span>
              <span><small>ADR</small><b>{fmt(g.s.adr, 0)}</b></span>
              <span><small>ACS</small><b>{fmt(g.s.acs, 0)}</b></span>
              <Show when={g.list.some(m => m.rrChange != null)}>{_on => { const rr = g.list.reduce((n, m) => n + (m.rrChange || 0), 0); return <span><small>RR</small><b class={tone(rr)}>{rr > 0 ? '+' : ''}{rr}</b></span>; }}</Show>
            </div>
          </header>
          <div class="grid">
            <For each={g.list}>{(m, i) =>
              <button class="fx-slide group relative grid grid-cols-[1fr_auto] items-center gap-3 gap-y-2 overflow-hidden border-b border-line py-3 pr-[18px] pl-[22px] text-left transition-colors duration-200 last:border-b-0 hover:bg-surface-3/55 md:grid-cols-[1.6fr_1fr_1fr_1.1fr_.6fr_.6fr_.7fr] wide:grid-cols-[1.7fr_1fr_1fr_1.1fr_.6fr_.6fr_.6fr_.6fr_.7fr]"
                style={{ '--i': i() }} onClick={() => store.setOpenMatch(m)} aria-label={`Review ${m.map}, ${m.won ? 'victory' : 'defeat'} ${m.teamScore} to ${m.enemyScore}`}>
                <span class="absolute inset-y-0 left-0 w-[45%] bg-cover bg-center opacity-10 transition duration-500 ease-out-expo [mask-image:linear-gradient(90deg,#000,transparent)] group-hover:scale-[1.04] group-hover:opacity-20" style={{ 'background-image': `url("${mapSplash(m.map)}")` }} />
                <span class="absolute inset-y-0 left-0 w-1" classList={{ 'bg-win': m.won, 'bg-loss': !m.won }} />
                <div class="relative flex items-center gap-3"><AgentIcon name={m.agent} size={44} /><div><strong class="block font-display text-base font-bold">{m.map}</strong><small class="text-[11.5px] text-muted">{m.queue} · {new Date(m.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small></div></div>
                <div class="relative grid justify-items-end gap-1 md:justify-items-start"><Result won={m.won} draw={m.draw} /><b class="font-display text-lg font-bold">{m.teamScore}<em class="mx-[3px] not-italic text-muted">:</em>{m.enemyScore}</b></div>
                <div class="relative hidden items-center gap-2 md:flex"><Show when={m.tierAfter} fallback={<span class="text-muted">—</span>}><RankBadge tier={m.tierAfter!} size={30} /></Show><Placement m={m} /></div>
                <div class={`${cell} [&_b]:text-[15px]`}><b>{m.k} / {m.d} / {m.a}</b><small>{fmt(m.k / Math.max(1, m.d), 2)} K/D</small></div>
                <div class={`${cell} hidden md:block`}><b>{fmt(m.hs, 0)}%</b><small>HS</small></div>
                <div class={`${cell} hidden wide:block`}><b>{fmt(m.adr)}</b><small>ADR</small></div>
                <div class={`${cell} hidden md:block`}><b>{fmt(m.acs)}</b><small>ACS</small></div>
                <div class={`${cell} hidden wide:block`}><b class={tone(m.dd)}>{m.dd > 0 ? '+' : ''}{fmt(m.dd)}</b><small>DDΔ</small></div>
                <span class={`relative ${tw.rrChip} ${rrTone(m.rrChange)}`}>{m.rrChange == null ? '—' : `${m.rrChange > 0 ? '+' : ''}${m.rrChange}`}<Show when={m.rrChange != null}><small class="ml-[3px] text-[9.5px] opacity-70">RR</small></Show></span>
              </button>}
            </For>
          </div>
        </Card>}
      </For>
    </Show>
  </div>;
};

/* ───────────────────────────── Match drawer ───────────────────────────── */
type Tab = 'summary' | 'scoreboard' | 'rounds' | 'duels';
const END_ICON: Record<string, string> = { Elimination: ICONS.skull, Defuse: ICONS.shield, Detonate: ICONS.spike, Time: ICONS.clock };
const panel = 'rounded-[10px] border border-line bg-surface';
const legend = 'mt-2.5 flex flex-wrap gap-3.5 text-[11.5px] text-muted [&>span]:inline-flex [&>span]:items-center [&>span]:gap-[5px]';

export const MatchDrawer: Component = () => {
  let dlg!: HTMLDialogElement;
  const [tab, setTab] = createSignal<Tab>('summary');
  const m = () => store.openMatch();
  createEffect(() => { if (m()) { const want = untrack(store.pendingTab) as Tab; store.setPendingTab(''); setTab(want && ['summary', 'scoreboard', 'rounds', 'duels'].includes(want) ? want : 'summary'); if (!dlg.open) dlg.showModal(); } });
  const close = () => { dlg.classList.add('fx-closing'); setTimeout(() => { dlg.classList.remove('fx-closing'); dlg.close(); }, 220); };
  const detail = createMemo(() => { const x = m(); if (!x || x.partial) return null; const p = store.profile(); return matchDetail(x, { name: p.name, tag: p.tag, tier: p.tier }); });
  return <dialog ref={dlg} class="fixed inset-y-0 right-0 left-auto m-0 h-screen max-h-screen w-[min(1000px,100vw)] max-w-[100vw] overflow-y-auto border-0 border-l border-line-2 bg-chrome p-0 font-body text-sm text-ink open:animate-drawer-in"
    onClose={() => store.setOpenMatch(null)} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === dlg) close(); }} aria-labelledby="drawer-h">
    <Show when={m()}>{mm => {
      const x = mm();
      const parts = impactParts(x);
      return <div class="in">
        <header class="relative flex min-h-[200px] flex-wrap items-end gap-5 overflow-hidden bg-cover bg-center px-[18px] py-[22px] md:min-h-[220px] md:flex-nowrap md:px-[30px] md:py-[26px]" style={{ 'background-image': `url("${mapSplash(x.map)}")` }}>
          <div class="absolute inset-0 bg-[linear-gradient(90deg,rgb(11_13_20/.95)_0%,rgb(11_13_20/.6)_60%,rgb(11_13_20/.9)),linear-gradient(0deg,var(--color-chrome),transparent_60%)]" />
          <Img class="absolute right-[-40px] bottom-[-40px] w-[220px] max-w-none animate-hero-in opacity-50 [mask-image:linear-gradient(180deg,#000_50%,transparent)] md:right-[120px] md:w-[300px]" src={agentPortrait(x.agent)} />
          <button class={`${tw.iconBtn} absolute! top-[18px] right-[18px] z-2`} aria-label="Close match review" onClick={close}><Icon d={ICONS.close} /></button>
          <div class="relative z-1 flex-1 animate-rise [animation-delay:.1s]">
            <Result won={x.won} draw={x.draw} />
            <h2 id="drawer-h" class="mt-2.5 mb-1.5 flex items-baseline gap-3 font-display text-[30px] leading-none font-extrabold uppercase md:text-[40px]">{x.map}<small class="font-body text-[13px] font-medium normal-case text-ink-2">{mapLocation(x.map)}</small></h2>
            <p class="text-[13px] text-ink-2">{x.queue} · {new Date(x.startedAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {Number.isFinite(x.durationMin) ? `${x.durationMin} min` : relTime(x.startedAt)}{store.isSample() ? ' · sample match' : ''}</p>
          </div>
          <div class="relative z-1 flex animate-rise items-baseline gap-2 font-display text-[40px] leading-none font-extrabold [animation-delay:.2s] md:text-[52px]">
            <b class="text-win [text-shadow:0_0_24px_rgb(47_211_166/.35)]"><CountUp value={x.teamScore} duration={700} /></b><span class="text-4xl text-muted">:</span><b class="text-loss [text-shadow:0_0_24px_rgb(255_92_122/.35)]"><CountUp value={x.enemyScore} duration={700} /></b>
          </div>
        </header>
        <nav class="sticky top-0 z-3 flex gap-1 overflow-x-auto border-b border-line bg-chrome/92 px-6 py-2 backdrop-blur-md" aria-label="Match sections">
          <For each={[['summary', 'Summary'], ['scoreboard', 'Scoreboard'], ['rounds', 'Rounds & economy'], ['duels', 'Duels']] as const}>{([id, l]) =>
            <button class="rounded-md px-3.5 py-[9px] font-display text-xs font-semibold uppercase tracking-[.08em] whitespace-nowrap transition-colors"
              classList={{ 'bg-accent/14 text-ink shadow-[inset_0_-2px_0_var(--color-accent)]': tab() === id, 'text-muted': tab() !== id }}
              disabled={id !== 'summary' && !detail()} onClick={() => setTab(id)}>{l}</button>}
          </For>
        </nav>
        <div class="px-4 pt-[18px] pb-8 md:px-7 md:pt-[22px] md:pb-10 [&>*]:animate-rise">
          <Show when={x.partial}><p class="mb-4 flex items-start gap-2.5 rounded-md border border-accent-2/20 bg-accent-2/6 px-3.5 py-2.5 text-[12.5px] text-ink-2"><Icon d={ICONS.info} size={15} class="mt-0.5 text-accent-2" /><span>This server response includes a match summary only. Scoreboard, rounds and duels need full <code class="text-xs">val-match-v1</code> match data.</span></p></Show>
          <Show when={tab() === 'summary'}>
            <div class="grid grid-cols-1 gap-[18px] md:grid-cols-[1.15fr_1fr]">
              <div class="col-span-full flex flex-wrap items-center gap-3.5">
                <AgentIcon name={x.agent} size={56} />
                <div><strong class="block font-display text-[22px] font-bold">{x.agent}</strong><small class="text-muted">{x.role}{x.tierAfter ? ` · ${rankName(x.tierAfter)}` : ''}</small></div>
                <Show when={x.badge}><Badge badge={x.badge} /></Show>
                <Show when={x.rrChange != null}><span class={`ml-auto ${tw.rrChip} px-3! py-1.5! text-[15px]! ${rrTone(x.rrChange)}`}>{x.rrChange! > 0 ? '+' : ''}{x.rrChange} RR</span></Show>
              </div>
              <div class="grid grid-cols-2 content-start gap-2 md:grid-cols-3">
                <Stat label="K/D ratio" value={x.k / Math.max(1, x.d)} digits={2} />
                <Stat label="ACS" value={x.acs} i={1} />
                <Stat label="ADR" value={x.adr} i={2} />
                <Stat label="HS %" value={x.hs} digits={1} suffix="%" i={3} />
                <Stat label="KAST" value={x.kast} suffix="%" i={4} />
                <Stat label="DDΔ / round" value={x.dd} signed i={5} />
                <Stat label="First bloods" value={x.fk} i={6} />
                <Stat label="First deaths" value={x.fd} i={7} />
                <Stat label="Multi-kills" value={x.multi[0] + x.multi[1] + x.multi[2] + x.multi[3]} i={8} />
                <Stat label="Clutches" value={x.clutches} note={`of ${x.clutchAttempts}`} i={9} />
                <Stat label="Plants" value={x.plants} i={10} />
                <Stat label="Defuses" value={x.defuses} i={11} />
              </div>
              <div class="grid content-start gap-[18px]">
                <div class={`${panel} flex items-baseline justify-center gap-2.5 bg-[radial-gradient(80%_100%_at_50%_0%,rgb(255_70_85/.12),transparent)] p-5 font-display text-[64px] leading-none font-extrabold`}>
                  <b>{x.k}</b><span class="text-4xl text-muted">/</span><b class="text-loss">{x.d}</b><span class="text-4xl text-muted">/</span><b>{x.a}</b>
                </div>
                <div class={`${panel} grid content-start gap-3 p-[18px]`}>
                  <h3 class="font-display text-sm font-bold uppercase tracking-[.08em]">Impact breakdown</h3>
                  <Show when={parts} fallback={<p class="text-muted">Impact needs damage, KAST and opening-duel data, which this response doesn't include.</p>}>
                    <For each={[['Damage', parts!.damage, '40%', `${x.adr} ADR`], ['Participation', parts!.participation, '35%', `${x.kast}% KAST`], ['Openings', parts!.openings, '25%', `${x.fk} won of ${x.fk + x.fd}`]] as const}>{([l, v, w, d], i) =>
                      <div class="grid grid-cols-[1.3fr_1fr_34px] items-center gap-3">
                        <div><strong class="block font-display text-[13.5px] font-semibold">{l}</strong><small class="text-[11.5px] text-muted">{d} · weight {w}</small></div>
                        <Meter value={v} i={i()} /><b class="text-right font-display text-[15px] font-bold">{fmt(v, 0)}</b>
                      </div>}
                    </For>
                    <div class="flex items-center justify-between border-t border-line pt-3">
                      <span class="grid font-display text-[13px] font-semibold uppercase tracking-[.08em]">Impact Rating <small class="font-body text-[11px] font-normal normal-case tracking-normal text-muted">model 0.1 · not a Riot rating</small></span>
                      <b class="font-display text-[34px] font-extrabold text-accent-2"><CountUp value={parts!.total} digits={1} /></b>
                    </div>
                  </Show>
                </div>
              </div>
              <Show when={!x.partial}>
                <div class={`${panel} col-span-full flex flex-wrap items-center gap-6 px-[18px] py-4 [&>div>span]:font-display [&>div>span]:text-[10.5px] [&>div>span]:font-semibold [&>div>span]:uppercase [&>div>span]:tracking-[.14em] [&>div>span]:text-muted`}>
                  <div class="grid justify-items-center gap-2"><span>Attack</span><Ring value={x.atkRounds ? (x.atkRoundsWon / x.atkRounds) * 100 : 0} size={84} stroke={7}><b class="text-[15px]!">{x.atkRoundsWon}/{x.atkRounds}</b></Ring></div>
                  <div class="grid justify-items-center gap-2"><span>Defense</span><Ring value={x.defRounds ? (x.defRoundsWon / x.defRounds) * 100 : 0} size={84} stroke={7} color="var(--color-info)" delay={150}><b class="text-[15px]!">{x.defRoundsWon}/{x.defRounds}</b></Ring></div>
                  <div class="ml-auto flex flex-wrap items-center gap-[18px]"><span>Weapons</span>
                    <For each={Object.entries(x.weapons).sort((a, b) => b[1].kills - a[1].kills).slice(0, 4)}>{([w, l]) =>
                      <div class="flex items-center gap-1.5"><Img class="h-6 w-[70px] object-contain" src={weaponIcon(w)} /><b class="font-display text-[15px] font-bold">{l.kills}</b></div>}
                    </For>
                  </div>
                </div>
              </Show>
            </div>
          </Show>
          <Show when={tab() === 'scoreboard' && detail()}>
            <div class="grid gap-[18px]">
              <For each={[['ally', 'Your team', x.teamScore], ['enemy', 'Enemy team', x.enemyScore]] as const}>{([team, label, score]) =>
                <div class="overflow-hidden rounded-[10px] border border-line">
                  <div class="flex items-center justify-between bg-linear-to-r to-transparent px-4 py-2.5 font-display text-sm font-bold uppercase tracking-[.08em]"
                    classList={{ 'from-win/16 text-win': team === 'ally', 'from-loss/16 text-loss': team === 'enemy' }}><strong>{label}</strong><b class="text-2xl">{score}</b></div>
                  <div class="overflow-x-auto"><table class={tw.table}>
                    <thead><tr><th>Player</th><th>Rank</th><th>ACS</th><th>K</th><th>D</th><th>A</th><th>+/−</th><th>K/D</th><th>ADR</th><th>HS%</th><th>KAST</th><th>FK</th><th>FD</th><th>MK</th></tr></thead>
                    <tbody><For each={detail()!.scoreboard.filter(p => p.team === team)}>{(p, i) =>
                      <tr class="animate-slide-in" classList={{ 'bg-linear-to-r from-accent-2/12 to-transparent [&>th]:shadow-[inset_3px_0_0_var(--color-accent-2)]': p.self }} style={{ 'animation-delay': `${i() * 60}ms` }}>
                        <th><div class="flex items-center gap-2.5 whitespace-nowrap"><AgentIcon name={p.agent} size={30} /><span class="font-semibold">{p.name}<small class="ml-0.5 font-normal text-muted">#{p.tag}</small></span></div></th>
                        <td><RankBadge tier={p.tier} size={24} /></td><td><b>{p.acs}</b></td><td>{p.k}</td><td>{p.d}</td><td>{p.a}</td>
                        <td class={tone(p.k - p.d)}>{p.k - p.d > 0 ? '+' : ''}{p.k - p.d}</td>
                        <td>{fmt(p.k / Math.max(1, p.d), 2)}</td><td>{fmt(p.adr)}</td><td>{fmt(p.hs, 0)}%</td><td>{fmt(p.kast)}%</td><td>{p.fk}</td><td>{p.fd}</td><td>{p.mk}</td>
                      </tr>}</For></tbody>
                  </table></div>
                </div>}
              </For>
            </div>
          </Show>
          <Show when={tab() === 'rounds' && detail()}>
            <div>
              <div class="flex flex-wrap gap-1">
                <For each={detail()!.rounds}>{(r, i) =>
                  <div class="relative grid w-[34px] animate-pop justify-items-center gap-[3px] rounded-md border pt-1.5 pb-[5px]"
                    classList={{ 'border-win/30 bg-win/14 text-win': r.won, 'border-loss/25 bg-loss/10 text-loss': !r.won, 'ml-3.5 before:absolute before:inset-y-1 before:-left-2.5 before:w-0.5 before:bg-line-2': r.n === 13 }}
                    style={{ 'animation-delay': `${i() * 30}ms` }} title={`Round ${r.n} · ${r.side} · ${r.won ? 'Won' : 'Lost'} by ${r.end} · ${r.kills} kills`}>
                    <span class="font-display text-[10px] font-semibold text-ink-2">{r.n}</span><Icon d={END_ICON[r.end]} size={14} />
                    <span class="h-2 text-[6px] tracking-[1px] text-accent-2">{r.kills ? '●'.repeat(Math.min(5, r.kills)) : ''}</span>
                  </div>}
                </For>
              </div>
              <div class={legend}><span><Icon d={ICONS.skull} size={13} /> Elimination</span><span><Icon d={ICONS.spike} size={13} /> Detonate</span><span><Icon d={ICONS.shield} size={13} /> Defuse</span><span><Icon d={ICONS.clock} size={13} /> Time</span><span>● your kills</span></div>
              <h3 class={`mt-[22px] mb-2.5 ${tw.h3}`}>Economy · loadout value per round</h3>
              <div class="flex h-[170px] items-end gap-[3px] border-b border-line-2">
                <For each={detail()!.rounds}>{(r, i) =>
                  <div class="grid h-full flex-1 grid-cols-2 grid-rows-[1fr_auto] items-end gap-x-px" style={{ '--i': i() }} title={`R${r.n}: you ${r.loadout} vs enemy avg ${r.enemyLoadout} · bank ${r.bank}`}>
                    <i class="fx-height rounded-t-[2px] bg-info" style={{ '--h': `${(r.loadout / 5000) * 100}%`, '--i': i() / 2 }} />
                    <i class="fx-height rounded-t-[2px] bg-ink/28" style={{ '--h': `${(r.enemyLoadout / 5000) * 100}%`, '--i': i() / 2 }} />
                    <span class="col-span-full pt-1 text-center font-display text-[9px] font-medium" classList={{ 'text-win': r.won, 'text-muted': !r.won }}>{r.n}</span>
                  </div>}
                </For>
              </div>
              <div class={legend}><span><i class="size-2.5 rounded-[2px] bg-info" /> Your loadout</span><span><i class="size-2.5 rounded-[2px] bg-ink/28" /> Enemy avg loadout</span></div>
            </div>
          </Show>
          <Show when={tab() === 'duels' && detail()}>
            <div class="grid gap-2">
              <For each={detail()!.duels}>{(d, i) => {
                const total = Math.max(1, d.kills + d.deaths);
                return <div class={`${panel} grid animate-slide-in grid-cols-[36px_1fr_24px_10px_24px] items-center gap-3 rounded-lg px-3.5 py-2.5 md:grid-cols-[40px_160px_1fr_24px_10px_24px]`} style={{ 'animation-delay': `${i() * 70}ms` }}>
                  <AgentIcon name={d.agent} size={40} />
                  <div><strong class="block font-display text-sm font-semibold">{d.name}</strong><small class="text-[11.5px] text-muted">{d.agent}</small></div>
                  <div class="col-span-full row-start-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-ink/5 md:col-span-1 md:row-start-auto">
                    <i class="fx-scale-x bg-win" style={{ flex: `0 0 ${(d.kills / total) * 100}%`, '--i': 4 }} /><i class="fx-scale-x bg-loss" style={{ flex: `0 0 ${(d.deaths / total) * 100}%`, '--i': 4 }} />
                  </div>
                  <b class="text-center font-display text-lg font-bold text-win">{d.kills}</b><span>–</span><b class="text-center font-display text-lg font-bold text-loss">{d.deaths}</b>
                </div>;
              }}</For>
              <p class="text-xs text-muted">Kills you scored on each opponent vs. deaths to them. Shown for your own match only — no opponent scouting.</p>
            </div>
          </Show>
        </div>
      </div>;
    }}</Show>
  </dialog>;
};
