import { Component, For, Show, createMemo } from 'solid-js';
import { store, Page } from '../store';
import { Card, Head, Stat, AgentIcon, Img, Result, Icon, ICONS, Empty, Swatch, tw, rrTone } from '../ui';
import { CountUp } from '../motion';
import { Gauge, Ring, LineChart, Meter, Donut, Heatmap, SplitBar } from '../charts';
import { fmt, relTime, impactOf } from '../data/stats';
import { agentPortrait, mapBanner, weaponIcon, rankName, ROLE_COLOR } from '../data/assets';

export const HIT = { head: 'var(--color-gold)', body: 'var(--color-hit-body)', legs: 'var(--color-hit-legs)' };

export function impactBand(v: number | null) {
  if (v == null) return 'Unavailable';
  return v >= 72 ? 'Standout' : v >= 62 ? 'Strong' : v >= 52 ? 'Steady' : 'Developing';
}

/** Body silhouette whose parts fill bottom-up to the hit share. */
export const Silhouette: Component<{ head: number; body: number; legs: number }> = p => {
  const part = 'fill-ink/6 stroke-line-2';
  return <svg class="h-auto w-full" viewBox="0 0 120 230" role="img" aria-label={`Head ${fmt(p.head, 1)}%, body ${fmt(p.body, 1)}%, legs ${fmt(p.legs, 1)}%`}>
    <defs>
      <clipPath id="sil-head"><circle cx="60" cy="26" r="20" /></clipPath>
      <clipPath id="sil-body"><path d="M32 52h56l16 62-12 5-12-34v52H40V85l-12 34-12-5z" /></clipPath>
      <clipPath id="sil-legs"><path d="M40 141h18v84H36zm22 0h18l4 84H62z" /></clipPath>
    </defs>
    <circle class={part} cx="60" cy="26" r="20" /><rect clip-path="url(#sil-head)" class="fx-scale-y" x="0" y="6" width="120" height="40" fill={HIT.head} style={{ '--s': Math.min(1, p.head / 40), '--i': 0 }} />
    <path class={part} d="M32 52h56l16 62-12 5-12-34v52H40V85l-12 34-12-5z" /><rect clip-path="url(#sil-body)" class="fx-scale-y" x="0" y="52" width="120" height="85" fill={HIT.body} style={{ '--s': Math.min(1, p.body / 80), '--i': 1 }} />
    <path class={part} d="M40 141h18v84H36zm22 0h18l4 84H62z" /><rect clip-path="url(#sil-legs)" class="fx-scale-y" x="0" y="141" width="120" height="84" fill={HIT.legs} style={{ '--s': Math.min(1, p.legs / 20), '--i': 2 }} />
  </svg>;
};

const ringStat = 'grid justify-items-center gap-1.5 text-center [&>span]:mt-1 [&>span]:font-display [&>span]:text-[11px] [&>span]:font-semibold [&>span]:uppercase [&>span]:tracking-[.14em] [&>span]:text-ink-2 [&>small]:text-[11.5px] [&>small]:text-muted';
const rowB = 'block font-display text-[15px] font-bold';
const rowSmall = 'text-[11.5px] text-muted';

export const Overview: Component<{ go: (p: Page) => void }> = props => {
  const st = () => store.stats();
  const s = () => st().summary;
  const ms = () => store.matches();
  const ranked = createMemo(() => ms().filter(m => m.rrAfter != null).slice().reverse());
  const hits = () => s().headshots + s().bodyshots + s().legshots;
  const pct = (n: number) => (hits() ? (n / hits()) * 100 : NaN);
  const days = createMemo(() => {
    const out: { date: Date; count: number; wins: number }[] = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    for (let i = 34; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 864e5);
      const list = ms().filter(m => new Date(m.startedAt).toDateString() === d.toDateString());
      out.push({ date: d, count: list.length, wins: list.filter(m => m.won).length });
    }
    return out;
  });

  return <Show when={ms().length || store.profile().serverView} fallback={<Card><Empty title="No matches in this queue" text="Try another queue — this profile hasn't played any matches here in the sampled window." /></Card>}>
    <div class="grid grid-cols-12 gap-4">
      {/* Impact rating */}
      <Card class="col-span-12 md:col-span-6 wide:col-span-4" i={0}>
        <Head title="Impact Rating" kicker="VAL-Metrics model 0.1"><button class={tw.chip} onClick={() => props.go('performance')}>How it works</button></Head>
        <div class="grid justify-items-center gap-4">
          <Gauge value={s().impact} label={`Impact ${fmt(s().impact, 1)} of 100`}>
            <span class="bg-linear-to-b from-white to-[#c9c4bb] bg-clip-text font-display text-[54px] leading-none font-extrabold tracking-[-.02em] text-transparent"><CountUp value={s().impact} digits={1} duration={1800} /></span>
            <span class="rounded-full border border-accent-2/30 px-2.5 py-[3px] font-display text-[11px] font-semibold uppercase tracking-[.2em] text-accent-2">{impactBand(s().impact)}</span>
          </Gauge>
          <ul class="grid w-full gap-1.5">
            <For each={[['40%', 'Damage', 'ADR ÷ 200'], ['35%', 'Participation', 'KAST'], ['25%', 'Openings', 'first-duel win rate']]}>{([w, l, d], i) =>
              <li class="fx-rise grid grid-cols-[44px_1fr_auto] items-center rounded-md bg-bg/35 px-2.5 py-[7px] text-[12.5px]" style={{ '--i': i() }}>
                <b class="font-display text-[13px] font-bold text-accent-2">{w}</b>{l}<span class="text-[11.5px] text-muted">{d}</span>
              </li>}
            </For>
          </ul>
        </div>
      </Card>

      {/* Headline rings */}
      <Card class="col-span-12 wide:col-span-8" i={1}>
        <Head title="Combat summary" kicker={`${s().matches} matches · ${store.queue() === 'All' ? 'all queues' : store.queue()}`} />
        <div class="grid grid-cols-2 gap-y-[18px] gap-x-3 md:grid-cols-4">
          <div class={ringStat}><Ring value={s().winRate} size={118} color="var(--color-win)" label={`Win rate ${fmt(s().winRate, 1)}%`}><b><CountUp value={s().winRate} digits={1} suffix="%" /></b></Ring><span>Win rate</span><small>{s().wins}W · {s().losses}L</small></div>
          <div class={ringStat}><Ring value={s().kd} max={2} size={118} delay={120} label={`K/D ${fmt(s().kd, 2)}`}><b><CountUp value={s().kd} digits={2} /></b></Ring><span>K/D ratio</span><small>{s().kills} K · {s().deaths} D</small></div>
          <div class={ringStat}><Ring value={s().hs} max={50} size={118} color={HIT.head} delay={240} label={`Headshot ${fmt(s().hs, 1)}%`}><b><CountUp value={s().hs} digits={1} suffix="%" /></b></Ring><span>Headshot %</span><small>{s().headshots} head hits</small></div>
          <div class={ringStat}><Ring value={s().kast} size={118} color="var(--color-info)" delay={360} label={`KAST ${fmt(s().kast, 1)}%`}><b><CountUp value={s().kast} digits={1} suffix="%" /></b></Ring><span>KAST</span><small>Kill · assist · survive · trade</small></div>
        </div>
        <div class="mt-[18px] grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <Stat label="ADR" value={s().adr} digits={1} note="Damage / round" i={0} />
          <Stat label="ACS" value={s().acs} digits={0} note="Combat score" i={1} />
          <Stat label="DDΔ / round" value={s().dd} digits={1} signed note="Damage delta" tone={s().dd >= 0 ? 'up' : 'down'} i={2} />
          <Stat label="KAD" value={s().kad} digits={2} note="(K+A) / D" i={3} />
        </div>
      </Card>

      {/* RR trajectory */}
      <Card class="col-span-12 wide:col-span-8" i={2}>
        <Head title="Rank rating trajectory" kicker={`${rankName(store.profile().tier)} · ${store.profile().rr} RR`}>
          <span class="text-muted">{ranked().length} ranked matches</span>
        </Head>
        <Show when={ranked().length >= 2} fallback={<Empty title="Not enough ranked matches" text="Rank movement appears after two competitive matches in this view." />}>
          <LineChart label="Rank rating over competitive matches, oldest to newest"
            points={ranked().map(m => ({ y: (m.tierAfter! - 3) * 100 + m.rrAfter!, label: `${m.map} · ${m.won ? 'Win' : 'Loss'} ${m.teamScore}–${m.enemyScore}`, sub: `${rankName(m.tierAfter!)} · ${m.rrAfter} RR (${m.rrChange! > 0 ? '+' : ''}${m.rrChange})`, tone: m.won ? 'win' : 'loss' }))}
            hideAxis tipValue={i => `${ranked()[i].rrChange! > 0 ? '+' : ''}${ranked()[i].rrChange} RR`}
            bands={Array.from({ length: 7 }, (_, i) => ({ at: (store.profile().tier - 6 + i) * 100, label: rankName(store.profile().tier - 3 + i) }))}
            onPick={i => store.setOpenMatch(ranked()[i])} height={230} />
        </Show>
      </Card>

      {/* Accuracy */}
      <Card class="col-span-12 md:col-span-6 wide:col-span-4" i={3}>
        <Head title="Accuracy" kicker={`${fmt(hits())} hits recorded`} />
        <Show when={hits()} fallback={<Empty title="No hit data" text="Hit locations weren't supplied for this profile." />}>
          <div class="grid grid-cols-[90px_1fr] items-center gap-[18px] md:grid-cols-[120px_1fr]">
            <Silhouette head={pct(s().headshots)} body={pct(s().bodyshots)} legs={pct(s().legshots)} />
            <div class="grid gap-2.5">
              <For each={[['Head', s().headshots, HIT.head], ['Body', s().bodyshots, HIT.body], ['Legs', s().legshots, HIT.legs]] as const}>{([l, n, c], i) =>
                <div class="fx-slide grid grid-cols-[10px_1fr_auto] items-center gap-x-2" style={{ '--i': i() }}>
                  <Swatch color={c} /><span>{l}</span><b class="row-span-2 font-display text-[22px] font-bold"><CountUp value={pct(n)} digits={1} suffix="%" /></b><small class="col-start-2 text-[11.5px] text-muted">{fmt(n)} hits</small>
                </div>}
              </For>
              <SplitBar parts={[{ label: 'Head', value: pct(s().headshots), color: HIT.head }, { label: 'Body', value: pct(s().bodyshots), color: HIT.body }, { label: 'Legs', value: pct(s().legshots), color: HIT.legs }]} />
            </div>
          </div>
        </Show>
      </Card>

      {/* Combat record grid */}
      <Card class="col-span-12 wide:col-span-8" i={4}>
        <Head title="Combat record" kicker="Totals for this view" />
        <div class="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <Stat label="Kills" value={s().kills} i={0} />
          <Stat label="Deaths" value={s().deaths} i={1} />
          <Stat label="Assists" value={s().assists} i={2} />
          <Stat label="Kills / round" value={s().kpr} digits={2} i={3} />
          <Stat label="First bloods" value={s().fk} i={4} tone="accent" />
          <Stat label="First deaths" value={s().fd} i={5} />
          <Stat label="Aces" value={s().aces} i={6} tone="accent" />
          <Stat label="Clutches" value={s().clutches} note={Number.isFinite(s().clutchAttempts) ? `of ${s().clutchAttempts} attempts` : undefined} i={7} />
          <Stat label="Flawless rounds" value={s().flawless} i={8} />
          <Stat label="Most kills" value={s().mostKills} note="in one match" i={9} />
          <Stat label="Plants" value={s().plants} i={10} />
          <Stat label="Defuses" value={s().defuses} i={11} />
          <Stat label="Round win %" value={s().roundWinRate} digits={1} suffix="%" i={12} />
          <Stat label="MVPs" value={s().mvps} note={Number.isFinite(s().teamMvps) ? `+ ${s().teamMvps} team MVP` : undefined} i={13} />
          <Stat label="Attack win %" value={s().atkWinRate} digits={1} suffix="%" i={14} />
          <Stat label="Defense win %" value={s().defWinRate} digits={1} suffix="%" i={15} />
        </div>
      </Card>

      {/* Multi-kills */}
      <Card class="col-span-12 md:col-span-6 wide:col-span-4" i={5}>
        <Head title="Multi-kills" kicker="Rounds with 2+ kills" />
        <div class="grid h-[calc(100%-40px)] min-h-40 grid-cols-4 items-end gap-3">
          <For each={['2K', '3K', '4K', 'Ace']}>{(l, i) =>
            <div class="grid h-full grid-rows-[1fr_auto_auto] justify-items-center gap-1">
              <div class="flex h-full min-h-[90px] w-full max-w-[46px] items-end overflow-hidden rounded-md bg-ink/4">
                <i class="fx-grow-y w-full rounded-md bg-linear-to-b from-accent-2 to-accent" style={{ '--i': i() * 2, height: `max(${Math.min(100, (s().multi[i()] / Math.max(1, s().multi[0])) * 100)}%, 4%)` }} />
              </div>
              <b class="font-display text-[22px] font-bold"><CountUp value={s().multi[i()]} delay={i() * 90} /></b>
              <span class="font-display text-[10.5px] font-semibold tracking-[.14em] text-muted">{l}</span>
            </div>}
          </For>
        </div>
      </Card>

      {/* Top agents */}
      <Card class="col-span-12 wide:col-span-8" i={6}>
        <Head title="Top agents" kicker="By matches played"><button class={tw.chip} onClick={() => props.go('agents')}>All agents <Icon d={ICONS.arrow} size={14} /></button></Head>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
          <For each={st().agents.slice(0, 3)}>{(a, i) =>
            <button class="fx-rise group relative block min-h-[190px] overflow-hidden rounded-[10px] border border-line text-left transition duration-300 ease-out-expo hover:-translate-y-[5px] hover:border-[color-mix(in_srgb,var(--role)_60%,transparent)] md:min-h-[230px]"
              style={{ '--i': i() * 2, '--role': ROLE_COLOR[a.role], background: `radial-gradient(120% 90% at 80% 10%, color-mix(in srgb, ${ROLE_COLOR[a.role]} 35%, transparent), transparent 60%), var(--color-surface-3)` }} onClick={() => props.go('agents')}>
              <Img class="absolute -top-[6%] -right-[24%] w-[95%] max-w-none opacity-85 transition-transform duration-500 ease-out-expo [mask-image:linear-gradient(180deg,#000_55%,transparent_95%)] group-hover:-translate-x-[4%] group-hover:scale-[1.07]" src={agentPortrait(a.name)} scale={760} />
              <div class="absolute inset-x-0 bottom-0 bg-linear-to-b from-transparent to-bg/92 to-45% p-3.5">
                <RoleTag role={a.role} />
                <strong class="block font-display text-2xl font-extrabold uppercase tracking-[.04em]">{a.name}</strong>
                <div class="mt-1.5 mb-1 flex gap-3.5 [&_span]:grid [&_span]:text-[10px] [&_span]:uppercase [&_span]:tracking-[.1em] [&_span]:text-muted [&_b]:font-display [&_b]:text-base [&_b]:font-bold [&_b]:tracking-normal [&_b]:text-ink">
                  <span><b>{fmt(a.winRate, 0)}%</b>Win</span><span><b>{fmt(a.kd, 2)}</b>K/D</span><span><b>{fmt(a.acs, 0)}</b>ACS</span>
                </div>
                <small class={rowSmall}>{a.matches} matches · {fmt(a.playtimeH, 1)}h</small>
              </div>
            </button>}
          </For>
        </div>
      </Card>

      {/* Roles */}
      <Card class="col-span-12 md:col-span-6 wide:col-span-4" i={7}>
        <Head title="Roles" kicker="Share of matches" />
        <div class="grid justify-items-center gap-4">
          <Donut parts={st().roles.map(r => ({ label: r.role, value: r.matches, color: ROLE_COLOR[r.role] }))}>
            <b><CountUp value={st().roles.filter(r => r.matches).length} /></b><small>roles</small>
          </Donut>
          <ul class="grid w-full gap-2">
            <For each={st().roles}>{(r, i) => <li class="fx-slide grid grid-cols-[10px_1fr_auto] items-center gap-x-2 text-[13px]" style={{ '--i': i() + 3 }}>
              <Swatch color={ROLE_COLOR[r.role]} /><span>{r.role}</span>
              <b class="text-right font-display text-[15px] font-bold">{r.matches ? `${fmt(r.winRate, 0)}%` : '—'}</b>
              <small class="col-span-2 col-start-2 text-[11.5px] text-muted">{r.matches ? `${r.wins}W ${r.matches - r.wins}L · ${fmt(r.kd, 2)} K/D` : 'No matches'}</small>
            </li>}</For>
          </ul>
        </div>
      </Card>

      {/* Maps */}
      <Card class="col-span-12 md:col-span-6 wide:col-span-4" i={8}>
        <Head title="Top maps" kicker="Win rate"><button class={tw.chip} onClick={() => props.go('maps')}>All maps <Icon d={ICONS.arrow} size={14} /></button></Head>
        <div class="grid gap-2.5">
          <For each={st().maps.slice(0, 5)}>{(m, i) =>
            <div class="fx-slide grid grid-cols-[54px_1fr_1.2fr] items-center gap-3" style={{ '--i': i() }}>
              <Img class="h-9 w-[54px] rounded-[5px] border border-line object-cover" src={mapBanner(m.name)} />
              <div><strong class="block font-display text-sm font-semibold">{m.name}</strong><small class={rowSmall}>{m.wins}W · {m.losses}L</small></div>
              <div class="flex items-center gap-2"><Meter value={m.winRate} color={m.winRate >= 50 ? 'var(--color-win)' : 'var(--color-loss)'} i={i()} /><b class="w-9 text-right font-display text-[13px] font-bold">{fmt(m.winRate, 0)}%</b></div>
            </div>}
          </For>
        </div>
      </Card>

      {/* Weapons */}
      <Card class="col-span-12 md:col-span-6 wide:col-span-4" i={9}>
        <Head title="Top weapons" kicker="Kills"><button class={tw.chip} onClick={() => props.go('weapons')}>All weapons <Icon d={ICONS.arrow} size={14} /></button></Head>
        <div class="grid gap-2.5">
          <For each={st().weapons.slice(0, 4)}>{(w, i) =>
            <div class="fx-slide grid grid-cols-[84px_1fr_auto] items-center gap-x-3 gap-y-1.5" style={{ '--i': i() }}>
              <Img class="h-7 w-[84px] object-contain drop-shadow-[0_2px_6px_rgb(0_0_0/.6)]" src={weaponIcon(w.name)} />
              <div><strong class="block font-display text-sm font-semibold">{w.name}</strong><small class={rowSmall}>{fmt(w.hs, 0)}% HS</small></div>
              <b class="font-display text-lg font-bold"><CountUp value={w.kills} delay={i() * 80} /></b>
              <div class="col-span-full flex"><Meter value={w.kills} max={st().weapons[0]?.kills || 1} i={i()} thin /></div>
            </div>}
          </For>
        </div>
      </Card>

      {/* Activity */}
      <Card class="col-span-12 md:col-span-6 wide:col-span-4" i={10}>
        <Head title="Activity" kicker="Last 5 weeks" />
        <Heatmap days={days()} />
        <div class="mt-3 flex items-center justify-end gap-[5px] text-[11px] text-muted">
          <span>Less</span><For each={[0.25, 0.55, 1]}>{a => <i class="size-3 rounded-[3px]" style={{ background: `rgb(255 70 85 / ${a})` }} />}</For><span>More</span>
        </div>
      </Card>

      {/* Recent matches */}
      <Card class="col-span-12" i={11}>
        <Head title="Recent matches" kicker="Select to review"><button class={tw.chip} onClick={() => props.go('matches')}>Full history <Icon d={ICONS.arrow} size={14} /></button></Head>
        <div class="grid gap-1.5">
          <For each={ms().slice(0, 6)}>{(m, i) =>
            <button class="fx-slide group relative grid grid-cols-[34px_1fr_auto] items-center gap-x-3.5 gap-y-1.5 overflow-hidden rounded-lg border border-line bg-bg/35 py-2.5 pr-3.5 pl-[18px] text-left transition duration-200 ease-out-expo before:absolute before:inset-y-0 before:left-0 before:w-[3px] hover:translate-x-1 hover:border-line-2 hover:bg-surface-3/60 md:grid-cols-[38px_1.5fr_1fr_1fr_.7fr_.6fr] wide:grid-cols-[38px_1.6fr_1fr_1fr_.7fr_.7fr_.6fr]"
              classList={{ 'before:bg-win': m.won, 'before:bg-loss': !m.won }} style={{ '--i': i() }} onClick={() => store.setOpenMatch(m)}>
              <span class="absolute inset-y-0 left-0 w-2/5 bg-cover bg-center opacity-10 transition-opacity [mask-image:linear-gradient(90deg,#000,transparent)] group-hover:opacity-20" style={{ 'background-image': `url("${mapBanner(m.map)}")` }} />
              <AgentIcon name={m.agent} size={38} class="relative" />
              <div class="relative"><strong class={rowB}>{m.map}</strong><small class={rowSmall}>{m.queue} · {relTime(m.startedAt)}</small></div>
              <div class="relative col-span-2 flex items-center gap-2.5 md:col-span-1"><Result won={m.won} draw={m.draw} /><b class={rowB}>{m.teamScore}<em class="mx-[3px] not-italic text-muted">:</em>{m.enemyScore}</b></div>
              <div class="relative hidden md:block"><b class={rowB}>{m.k}/{m.d}/{m.a}</b><small class={rowSmall}>{fmt(m.k / Math.max(1, m.d), 2)} K/D</small></div>
              <div class="relative hidden md:block"><b class={rowB}>{fmt(m.acs)}</b><small class={rowSmall}>ACS</small></div>
              <div class="relative hidden wide:block"><b class={rowB}>{fmt(impactOf(m), 0)}</b><small class={rowSmall}>Impact</small></div>
              <span class={`relative col-start-3 row-start-1 md:col-start-auto md:row-start-auto ${tw.rrChip} ${rrTone(m.rrChange)}`}>{m.rrChange == null ? '—' : `${m.rrChange > 0 ? '+' : ''}${m.rrChange}`}</span>
            </button>}
          </For>
        </div>
      </Card>
    </div>
  </Show>;
};

export const RoleTag: Component<{ role: string }> = p =>
  <span class="inline-block justify-self-start rounded-full border px-2 py-0.5 font-display text-[10px] font-semibold uppercase tracking-[.16em] text-ink"
    style={{ 'border-color': ROLE_COLOR[p.role as keyof typeof ROLE_COLOR], background: `color-mix(in srgb, ${ROLE_COLOR[p.role as keyof typeof ROLE_COLOR]} 45%, transparent)` }}>{p.role}</span>;
