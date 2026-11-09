import { Component, For, Show, createMemo } from 'solid-js';
import { store, Page } from '../store';
import { Card, Head, Stat, AgentIcon, Img, Result, Icon, ICONS, Empty } from '../ui';
import { CountUp } from '../motion';
import { Gauge, Ring, LineChart, Meter, Donut, Heatmap, SplitBar } from '../charts';
import { fmt, relTime, impactOf } from '../data/stats';
import { agentPortrait, mapSplash, weaponIcon, rankName, ROLE_COLOR } from '../data/assets';

export const HIT = { head: '#FFC857', body: '#9AA3B5', legs: '#5A6274' };

export function impactBand(v: number | null) {
  if (v == null) return 'Unavailable';
  return v >= 72 ? 'Standout' : v >= 62 ? 'Strong' : v >= 52 ? 'Steady' : 'Developing';
}

/** Body silhouette whose parts fill bottom-up to the hit share. */
export const Silhouette: Component<{ head: number; body: number; legs: number }> = p =>
  <svg class="silhouette" viewBox="0 0 120 230" role="img" aria-label={`Head ${fmt(p.head, 1)}%, body ${fmt(p.body, 1)}%, legs ${fmt(p.legs, 1)}%`}>
    <defs>
      <clipPath id="sil-head"><circle cx="60" cy="26" r="20" /></clipPath>
      <clipPath id="sil-body"><path d="M32 52h56l16 62-12 5-12-34v52H40V85l-12 34-12-5z" /></clipPath>
      <clipPath id="sil-legs"><path d="M40 141h18v84H36zm22 0h18l4 84H62z" /></clipPath>
    </defs>
    <g class="sil-part" style={{ '--i': 0 }}><circle class="sil-bg" cx="60" cy="26" r="20" /><rect clip-path="url(#sil-head)" class="sil-fill" x="0" y="6" width="120" height="40" fill={HIT.head} style={{ '--s': Math.min(1, p.head / 40) }} /></g>
    <g class="sil-part" style={{ '--i': 1 }}><path class="sil-bg" d="M32 52h56l16 62-12 5-12-34v52H40V85l-12 34-12-5z" /><rect clip-path="url(#sil-body)" class="sil-fill" x="0" y="52" width="120" height="85" fill={HIT.body} style={{ '--s': Math.min(1, p.body / 80) }} /></g>
    <g class="sil-part" style={{ '--i': 2 }}><path class="sil-bg" d="M40 141h18v84H36zm22 0h18l4 84H62z" /><rect clip-path="url(#sil-legs)" class="sil-fill" x="0" y="141" width="120" height="84" fill={HIT.legs} style={{ '--s': Math.min(1, p.legs / 20) }} /></g>
  </svg>;

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
    <div class="grid overview">
      {/* Impact rating */}
      <Card class="impact-card" i={0}>
        <Head title="Impact Rating" kicker="VAL-Metrics model 0.1"><button class="chip" onClick={() => props.go('performance')}>How it works</button></Head>
        <div class="impact-body">
          <Gauge value={s().impact} label={`Impact ${fmt(s().impact, 1)} of 100`}>
            <span class="gauge-num"><CountUp value={s().impact} digits={1} duration={1800} /></span>
            <span class="gauge-band">{impactBand(s().impact)}</span>
          </Gauge>
          <ul class="impact-legend">
            <li><b>40%</b> Damage <span>ADR ÷ 200</span></li>
            <li><b>35%</b> Participation <span>KAST</span></li>
            <li><b>25%</b> Openings <span>first-duel win rate</span></li>
          </ul>
        </div>
      </Card>

      {/* Headline rings */}
      <Card class="headline" i={1}>
        <Head title="Combat summary" kicker={`${s().matches} matches · ${store.queue() === 'All' ? 'all queues' : store.queue()}`} />
        <div class="ring-row">
          <div class="ring-stat"><Ring value={s().winRate} size={118} color="var(--win)" label={`Win rate ${fmt(s().winRate, 1)}%`}><b><CountUp value={s().winRate} digits={1} suffix="%" /></b></Ring><span>Win rate</span><small>{s().wins}W · {s().losses}L</small></div>
          <div class="ring-stat"><Ring value={s().kd} max={2} size={118} color="var(--accent)" delay={120} label={`K/D ${fmt(s().kd, 2)}`}><b><CountUp value={s().kd} digits={2} /></b></Ring><span>K/D ratio</span><small>{s().kills} K · {s().deaths} D</small></div>
          <div class="ring-stat"><Ring value={s().hs} max={50} size={118} color={HIT.head} delay={240} label={`Headshot ${fmt(s().hs, 1)}%`}><b><CountUp value={s().hs} digits={1} suffix="%" /></b></Ring><span>Headshot %</span><small>{s().headshots} head hits</small></div>
          <div class="ring-stat"><Ring value={s().kast} size={118} color="var(--info)" delay={360} label={`KAST ${fmt(s().kast, 1)}%`}><b><CountUp value={s().kast} digits={1} suffix="%" /></b></Ring><span>KAST</span><small>Kill · assist · survive · trade</small></div>
        </div>
        <div class="stat-strip">
          <Stat label="ADR" value={s().adr} digits={1} note="Damage / round" i={0} />
          <Stat label="ACS" value={s().acs} digits={0} note="Combat score" i={1} />
          <Stat label="DDΔ / round" value={s().dd} digits={1} signed note="Damage delta" tone={s().dd >= 0 ? 'up' : 'down'} i={2} />
          <Stat label="KAD" value={s().kad} digits={2} note="(K+A) / D" i={3} />
        </div>
      </Card>

      {/* RR trajectory */}
      <Card class="rr-card" i={2}>
        <Head title="Rank rating trajectory" kicker={`${rankName(store.profile().tier)} · ${store.profile().rr} RR`}>
          <span class="muted">{ranked().length} ranked matches</span>
        </Head>
        <Show when={ranked().length >= 2} fallback={<Empty title="Not enough ranked matches" text="Rank movement appears after two competitive matches in this view." />}>
          <LineChart label="Rank rating over competitive matches, oldest to newest"
            points={ranked().map(m => ({ y: (m.tierAfter! - 3) * 100 + m.rrAfter!, label: `${m.map} · ${m.won ? 'Win' : 'Loss'} ${m.teamScore}–${m.enemyScore}`, sub: `${rankName(m.tierAfter!)} · ${m.rrAfter} RR (${m.rrChange! > 0 ? '+' : ''}${m.rrChange})`, tone: m.won ? 'win' : 'loss' }))}
            hideAxis tipValue={i => `${ranked()[i].rrChange! > 0 ? '+' : ''}${ranked()[i].rrChange} RR`}
            bands={Array.from({ length: 7 }, (_, i) => ({ at: (store.profile().tier - 6 + i) * 100, label: rankName(store.profile().tier - 3 + i) }))}
            onPick={i => store.setOpenMatch(ranked()[i])} height={230} color="var(--accent)" />
        </Show>
      </Card>

      {/* Accuracy */}
      <Card class="acc-card" i={3}>
        <Head title="Accuracy" kicker={`${fmt(hits())} hits recorded`} />
        <Show when={hits()} fallback={<Empty title="No hit data" text="Hit locations weren't supplied for this profile." />}>
          <div class="acc-body">
            <Silhouette head={pct(s().headshots)} body={pct(s().bodyshots)} legs={pct(s().legshots)} />
            <div class="acc-rows">
              <For each={[['Head', s().headshots, HIT.head], ['Body', s().bodyshots, HIT.body], ['Legs', s().legshots, HIT.legs]] as const}>{([l, n, c], i) =>
                <div class="acc-row" style={{ '--i': i() }}><span class="swatch" style={{ background: c }} /><span>{l}</span><b><CountUp value={pct(n)} digits={1} suffix="%" /></b><small>{fmt(n)} hits</small></div>}
              </For>
              <SplitBar parts={[{ label: 'Head', value: pct(s().headshots), color: HIT.head }, { label: 'Body', value: pct(s().bodyshots), color: HIT.body }, { label: 'Legs', value: pct(s().legshots), color: HIT.legs }]} />
            </div>
          </div>
        </Show>
      </Card>

      {/* Combat record grid */}
      <Card class="record" i={4}>
        <Head title="Combat record" kicker="Totals for this view" />
        <div class="stat-grid">
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
      <Card class="multi" i={5}>
        <Head title="Multi-kills" kicker="Rounds with 2+ kills" />
        <div class="multi-row">
          <For each={['2K', '3K', '4K', 'Ace']}>{(l, i) =>
            <div class="multi-cell" style={{ '--i': i() }}>
              <div class="multi-bar"><i style={{ '--h': `${Math.min(100, (s().multi[i()] / Math.max(1, s().multi[0])) * 100)}%` }} /></div>
              <b><CountUp value={s().multi[i()]} delay={i() * 90} /></b><span>{l}</span>
            </div>}
          </For>
        </div>
      </Card>

      {/* Top agents */}
      <Card class="top-agents" i={6}>
        <Head title="Top agents" kicker="By matches played"><button class="chip" onClick={() => props.go('agents')}>All agents <Icon d={ICONS.arrow} size={14} /></button></Head>
        <div class="agent-cards">
          <For each={st().agents.slice(0, 3)}>{(a, i) =>
            <button class="agent-card" style={{ '--i': i(), '--role': ROLE_COLOR[a.role] }} onClick={() => props.go('agents')}>
              <Img class="agent-card-art" src={agentPortrait(a.name)} />
              <div class="agent-card-body">
                <span class="role-tag">{a.role}</span>
                <strong>{a.name}</strong>
                <div class="mini-stats"><span><b>{fmt(a.winRate, 0)}%</b>Win</span><span><b>{fmt(a.kd, 2)}</b>K/D</span><span><b>{fmt(a.acs, 0)}</b>ACS</span></div>
                <small>{a.matches} matches · {fmt(a.playtimeH, 1)}h</small>
              </div>
            </button>}
          </For>
        </div>
      </Card>

      {/* Roles */}
      <Card class="roles" i={7}>
        <Head title="Roles" kicker="Share of matches" />
        <div class="roles-body">
          <Donut parts={st().roles.map(r => ({ label: r.role, value: r.matches, color: ROLE_COLOR[r.role] }))}>
            <b><CountUp value={st().roles.filter(r => r.matches).length} /></b><small>roles</small>
          </Donut>
          <ul class="role-list">
            <For each={st().roles}>{(r, i) => <li style={{ '--i': i() }}>
              <span class="swatch" style={{ background: ROLE_COLOR[r.role] }} /><span>{r.role}</span>
              <b>{r.matches ? `${fmt(r.winRate, 0)}%` : '—'}</b><small>{r.matches ? `${r.wins}W ${r.matches - r.wins}L · ${fmt(r.kd, 2)} K/D` : 'No matches'}</small>
            </li>}</For>
          </ul>
        </div>
      </Card>

      {/* Maps */}
      <Card class="top-maps" i={8}>
        <Head title="Top maps" kicker="Win rate"><button class="chip" onClick={() => props.go('maps')}>All maps <Icon d={ICONS.arrow} size={14} /></button></Head>
        <div class="map-rows">
          <For each={st().maps.slice(0, 5)}>{(m, i) =>
            <div class="map-row" style={{ '--i': i() }}>
              <Img class="map-row-art" src={mapSplash(m.name)} />
              <div class="map-row-body"><strong>{m.name}</strong><small>{m.wins}W · {m.losses}L</small></div>
              <div class="map-row-meter"><Meter value={m.winRate} color={m.winRate >= 50 ? 'var(--win)' : 'var(--loss)'} i={i()} /><b>{fmt(m.winRate, 0)}%</b></div>
            </div>}
          </For>
        </div>
      </Card>

      {/* Weapons */}
      <Card class="top-weapons" i={9}>
        <Head title="Top weapons" kicker="Kills"><button class="chip" onClick={() => props.go('weapons')}>All weapons <Icon d={ICONS.arrow} size={14} /></button></Head>
        <div class="weapon-rows">
          <For each={st().weapons.slice(0, 4)}>{(w, i) =>
            <div class="weapon-row" style={{ '--i': i() }}>
              <Img class="weapon-art" src={weaponIcon(w.name)} />
              <div><strong>{w.name}</strong><small>{fmt(w.hs, 0)}% HS</small></div>
              <b><CountUp value={w.kills} delay={i() * 80} /></b>
              <Meter value={w.kills} max={st().weapons[0]?.kills || 1} i={i()} thin />
            </div>}
          </For>
        </div>
      </Card>

      {/* Activity */}
      <Card class="activity" i={10}>
        <Head title="Activity" kicker="Last 5 weeks" />
        <Heatmap days={days()} />
        <div class="heat-legend"><span>Less</span><i style={{ '--a': 0.25 }} /><i style={{ '--a': 0.55 }} /><i style={{ '--a': 1 }} /><span>More</span></div>
      </Card>

      {/* Recent matches */}
      <Card class="recent" i={11}>
        <Head title="Recent matches" kicker="Select to review"><button class="chip" onClick={() => props.go('matches')}>Full history <Icon d={ICONS.arrow} size={14} /></button></Head>
        <div class="recent-list">
          <For each={ms().slice(0, 6)}>{(m, i) =>
            <button class="recent-row" classList={{ win: m.won, loss: !m.won }} style={{ '--i': i() }} onClick={() => store.setOpenMatch(m)}>
              <span class="recent-map" style={{ 'background-image': `url("${mapSplash(m.map)}")` }} />
              <AgentIcon name={m.agent} size={38} />
              <div class="recent-id"><strong>{m.map}</strong><small>{m.queue} · {relTime(m.startedAt)}</small></div>
              <div class="recent-score"><Result won={m.won} draw={m.draw} /><b>{m.teamScore}<em>:</em>{m.enemyScore}</b></div>
              <div class="recent-kda"><b>{m.k}/{m.d}/{m.a}</b><small>{fmt(m.k / Math.max(1, m.d), 2)} K/D</small></div>
              <div class="recent-acs"><b>{fmt(m.acs)}</b><small>ACS</small></div>
              <div class="recent-impact"><b>{fmt(impactOf(m), 0)}</b><small>Impact</small></div>
              <Show when={m.rrChange != null} fallback={<span class="rr-chip none">—</span>}><span class="rr-chip" classList={{ up: m.rrChange! > 0, down: m.rrChange! < 0 }}>{m.rrChange! > 0 ? '+' : ''}{m.rrChange}</span></Show>
            </button>}
          </For>
        </div>
      </Card>
    </div>
  </Show>;
};
