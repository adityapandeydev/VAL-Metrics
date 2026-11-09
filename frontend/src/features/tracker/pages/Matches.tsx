import { Component, For, Show, createEffect, createMemo, createSignal, untrack } from 'solid-js';
import { store } from '../store';
import { Card, Head, AgentIcon, Img, Result, RankBadge, Icon, ICONS, Empty, Stat } from '../ui';
import { CountUp } from '../motion';
import { Meter, Ring } from '../charts';
import { byDay, dayLabel, fmt, impactParts, relTime } from '../data/stats';
import { mapSplash, mapLocation, agentPortrait, rankName, weaponIcon } from '../data/assets';
import { matchDetail } from '../data/demo';
import type { Match } from '../data/types';

const Placement: Component<{ m: Match }> = p =>
  <Show when={p.m.badge} fallback={<span class="place">{Number.isFinite(p.m.placement) ? `#${p.m.placement}` : '—'}</span>}>
    <span class="place badge" classList={{ mvp: p.m.badge === 'MVP' }}>{p.m.badge}</span>
  </Show>;

export const Matches: Component = () => {
  const [result, setResult] = createSignal<'all' | 'win' | 'loss'>('all');
  const [agent, setAgent] = createSignal('all');
  const [map, setMap] = createSignal('all');
  const all = () => store.matches();
  const list = createMemo(() => all().filter(m => (result() === 'all' || (result() === 'win') === m.won) && (agent() === 'all' || m.agent === agent()) && (map() === 'all' || m.map === map())));
  const groups = createMemo(() => byDay(list()));
  return <div class="stack">
    <Card class="filters-card" i={0}>
      <div class="filters">
        <div class="segmented small" role="radiogroup" aria-label="Result">
          <For each={[['all', 'All'], ['win', 'Wins'], ['loss', 'Losses']] as const}>{([v, l]) => <button role="radio" aria-checked={result() === v} classList={{ on: result() === v }} onClick={() => setResult(v)}>{l}</button>}</For>
        </div>
        <label class="select"><span>Agent</span><select value={agent()} onChange={e => setAgent(e.currentTarget.value)}><option value="all">All agents</option><For each={[...new Set(all().map(m => m.agent))].sort()}>{a => <option>{a}</option>}</For></select></label>
        <label class="select"><span>Map</span><select value={map()} onChange={e => setMap(e.currentTarget.value)}><option value="all">All maps</option><For each={[...new Set(all().map(m => m.map))].sort()}>{a => <option>{a}</option>}</For></select></label>
        <span class="muted filters-count"><b><CountUp value={list().length} duration={500} /></b> of {all().length} matches</span>
      </div>
    </Card>
    <Show when={groups().length} fallback={<Card><Empty title="No matches match these filters" text="Clear a filter to see the rest of the history." /></Card>}>
      <For each={groups()}>{(g, gi) =>
        <Card class="day" i={Math.min(gi(), 4)} flush>
          <header class="day-head">
            <div><strong>{dayLabel(g.date)}</strong><span>{g.s.wins}W · {g.s.losses}L</span></div>
            <div class="day-stats">
              <span><small>K/D</small><b>{fmt(g.s.kd, 2)}</b></span>
              <span><small>HS%</small><b>{fmt(g.s.hs, 1)}</b></span>
              <span><small>ADR</small><b>{fmt(g.s.adr, 0)}</b></span>
              <span><small>ACS</small><b>{fmt(g.s.acs, 0)}</b></span>
              <Show when={g.list.some(m => m.rrChange != null)}>{_on => { const rr = g.list.reduce((n, m) => n + (m.rrChange || 0), 0); return <span><small>RR</small><b classList={{ up: rr > 0, down: rr < 0 }}>{rr > 0 ? '+' : ''}{rr}</b></span>; }}</Show>
            </div>
          </header>
          <div class="match-list">
            <For each={g.list}>{(m, i) =>
              <button class="match-row" classList={{ win: m.won, loss: !m.won }} style={{ '--i': i() }} onClick={() => store.setOpenMatch(m)} aria-label={`Review ${m.map}, ${m.won ? 'victory' : 'defeat'} ${m.teamScore} to ${m.enemyScore}`}>
                <span class="mr-art" style={{ 'background-image': `url("${mapSplash(m.map)}")` }} />
                <div class="mr-id"><AgentIcon name={m.agent} size={44} /><div><strong>{m.map}</strong><small>{m.queue} · {new Date(m.startedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</small></div></div>
                <div class="mr-score"><Result won={m.won} draw={m.draw} /><b>{m.teamScore}<em>:</em>{m.enemyScore}</b></div>
                <div class="mr-rank"><Show when={m.tierAfter} fallback={<span class="muted">—</span>}><RankBadge tier={m.tierAfter!} size={30} /></Show><Placement m={m} /></div>
                <div class="mr-cell kda"><b>{m.k} / {m.d} / {m.a}</b><small>{fmt(m.k / Math.max(1, m.d), 2)} K/D</small></div>
                <div class="mr-cell"><b>{fmt(m.hs, 0)}%</b><small>HS</small></div>
                <div class="mr-cell hide-sm"><b>{fmt(m.adr)}</b><small>ADR</small></div>
                <div class="mr-cell"><b>{fmt(m.acs)}</b><small>ACS</small></div>
                <div class="mr-cell hide-sm"><b classList={{ up: m.dd > 0, down: m.dd < 0 }}>{m.dd > 0 ? '+' : ''}{fmt(m.dd)}</b><small>DDΔ</small></div>
                <Show when={m.rrChange != null} fallback={<span class="rr-chip none">—</span>}><span class="rr-chip" classList={{ up: m.rrChange! > 0, down: m.rrChange! < 0 }}>{m.rrChange! > 0 ? '+' : ''}{m.rrChange}<small>RR</small></span></Show>
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

export const MatchDrawer: Component = () => {
  let dlg!: HTMLDialogElement;
  const [tab, setTab] = createSignal<Tab>('summary');
  const m = () => store.openMatch();
  createEffect(() => { if (m()) { const want = untrack(store.pendingTab) as Tab; store.setPendingTab(''); setTab(want && ['summary', 'scoreboard', 'rounds', 'duels'].includes(want) ? want : 'summary'); if (!dlg.open) dlg.showModal(); } });
  const close = () => { dlg.classList.add('closing'); setTimeout(() => { dlg.classList.remove('closing'); dlg.close(); }, 220); };
  const detail = createMemo(() => { const x = m(); if (!x || x.partial) return null; const p = store.profile(); return matchDetail(x, { name: p.name, tag: p.tag, tier: p.tier }); });
  return <dialog ref={dlg} class="drawer" onClose={() => store.setOpenMatch(null)} onCancel={e => { e.preventDefault(); close(); }} onClick={e => { if (e.target === dlg) close(); }} aria-labelledby="drawer-h">
    <Show when={m()}>{mm => {
      const x = mm();
      const parts = impactParts(x);
      return <div class="drawer-inner">
        <header class="drawer-hero" style={{ 'background-image': `url("${mapSplash(x.map)}")` }}>
          <button class="icon-btn drawer-close" aria-label="Close match review" onClick={close}><Icon d={ICONS.close} /></button>
          <Img class="drawer-agent" src={agentPortrait(x.agent)} />
          <div class="drawer-title">
            <Result won={x.won} draw={x.draw} />
            <h2 id="drawer-h">{x.map}<small>{mapLocation(x.map)}</small></h2>
            <p>{x.queue} · {new Date(x.startedAt).toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })} · {Number.isFinite(x.durationMin) ? `${x.durationMin} min` : relTime(x.startedAt)}{store.isSample() ? ' · sample match' : ''}</p>
          </div>
          <div class="drawer-score"><b class="ally"><CountUp value={x.teamScore} duration={700} /></b><span>:</span><b class="enemy"><CountUp value={x.enemyScore} duration={700} /></b></div>
        </header>
        <nav class="drawer-tabs" aria-label="Match sections">
          <For each={[['summary', 'Summary'], ['scoreboard', 'Scoreboard'], ['rounds', 'Rounds & economy'], ['duels', 'Duels']] as const}>{([id, l]) =>
            <button classList={{ on: tab() === id }} disabled={id !== 'summary' && !detail()} onClick={() => setTab(id)}>{l}</button>}
          </For>
        </nav>
        <div class="drawer-body">
          <Show when={x.partial}><p class="sample-note"><Icon d={ICONS.info} size={15} /><span>This server response includes a match summary only. Scoreboard, rounds and duels need full <code>val-match-v1</code> match data.</span></p></Show>
          <Show when={tab() === 'summary'}>
            <div class="drawer-grid">
              <div class="you">
                <AgentIcon name={x.agent} size={56} />
                <div><strong>{x.agent}</strong><small>{x.role}{x.tierAfter ? ` · ${rankName(x.tierAfter)}` : ''}</small></div>
                <Show when={x.badge}><span class="place badge" classList={{ mvp: x.badge === 'MVP' }}>{x.badge}</span></Show>
                <Show when={x.rrChange != null}><span class="rr-chip big" classList={{ up: x.rrChange! > 0, down: x.rrChange! < 0 }}>{x.rrChange! > 0 ? '+' : ''}{x.rrChange} RR</span></Show>
              </div>
              <div class="stat-grid tight">
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
              <div class="drawer-side">
              <div class="kda-big"><b>{x.k}</b><span>/</span><b class="d">{x.d}</b><span>/</span><b>{x.a}</b></div>
              <div class="impact-break">
                <h3>Impact breakdown</h3>
                <Show when={parts} fallback={<p class="muted">Impact needs damage, KAST and opening-duel data, which this response doesn't include.</p>}>
                  <For each={[['Damage', parts!.damage, '40%', `${x.adr} ADR`], ['Participation', parts!.participation, '35%', `${x.kast}% KAST`], ['Openings', parts!.openings, '25%', `${x.fk} won of ${x.fk + x.fd}`]] as const}>{([l, v, w, d], i) =>
                    <div class="ib-row"><div><strong>{l}</strong><small>{d} · weight {w}</small></div><Meter value={v} i={i()} /><b>{fmt(v, 0)}</b></div>}
                  </For>
                  <div class="ib-total"><span>Impact Rating <small>model 0.1 · not a Riot rating</small></span><b><CountUp value={parts!.total} digits={1} /></b></div>
                </Show>
              </div>
              </div>
              <Show when={!x.partial}>
                <div class="sides">
                  <div><span>Attack</span><Ring value={x.atkRounds ? (x.atkRoundsWon / x.atkRounds) * 100 : 0} size={84} stroke={7} color="var(--accent)"><b>{x.atkRoundsWon}/{x.atkRounds}</b></Ring></div>
                  <div><span>Defense</span><Ring value={x.defRounds ? (x.defRoundsWon / x.defRounds) * 100 : 0} size={84} stroke={7} color="var(--info)" delay={150}><b>{x.defRoundsWon}/{x.defRounds}</b></Ring></div>
                  <div class="weapons-used"><span>Weapons</span><For each={Object.entries(x.weapons).sort((a, b) => b[1].kills - a[1].kills).slice(0, 4)}>{([w, l]) => <div><Img src={weaponIcon(w)} /><b>{l.kills}</b></div>}</For></div>
                </div>
              </Show>
            </div>
          </Show>
          <Show when={tab() === 'scoreboard' && detail()}>
            <div class="scoreboard">
              <For each={[['ally', 'Your team', x.teamScore], ['enemy', 'Enemy team', x.enemyScore]] as const}>{([team, label, score]) =>
                <div class="sb-team" classList={{ ally: team === 'ally', enemy: team === 'enemy' }}>
                  <div class="sb-head"><strong>{label}</strong><b>{score}</b></div>
                  <div class="table-scroll"><table>
                    <thead><tr><th>Player</th><th>Rank</th><th>ACS</th><th>K</th><th>D</th><th>A</th><th>+/−</th><th>K/D</th><th>ADR</th><th>HS%</th><th>KAST</th><th>FK</th><th>FD</th><th>MK</th></tr></thead>
                    <tbody><For each={detail()!.scoreboard.filter(p => p.team === team)}>{(p, i) =>
                      <tr classList={{ self: p.self }} style={{ '--i': i() }}>
                        <th><div class="sb-player"><AgentIcon name={p.agent} size={30} /><span>{p.name}<small>#{p.tag}</small></span></div></th>
                        <td><RankBadge tier={p.tier} size={24} /></td><td><b>{p.acs}</b></td><td>{p.k}</td><td>{p.d}</td><td>{p.a}</td>
                        <td classList={{ up: p.k - p.d > 0, down: p.k - p.d < 0 }}>{p.k - p.d > 0 ? '+' : ''}{p.k - p.d}</td>
                        <td>{fmt(p.k / Math.max(1, p.d), 2)}</td><td>{fmt(p.adr)}</td><td>{fmt(p.hs, 0)}%</td><td>{fmt(p.kast)}%</td><td>{p.fk}</td><td>{p.fd}</td><td>{p.mk}</td>
                      </tr>}</For></tbody>
                  </table></div>
                </div>}
              </For>
            </div>
          </Show>
          <Show when={tab() === 'rounds' && detail()}>
            <div class="rounds">
              <div class="round-strip">
                <For each={detail()!.rounds}>{(r, i) =>
                  <div class="round" classList={{ won: r.won, lost: !r.won, half: r.n === 13 }} style={{ '--i': i() }} title={`Round ${r.n} · ${r.side} · ${r.won ? 'Won' : 'Lost'} by ${r.end} · ${r.kills} kills`}>
                    <span class="round-n">{r.n}</span><Icon d={END_ICON[r.end]} size={14} /><span class="round-k">{r.kills ? '●'.repeat(Math.min(5, r.kills)) : ''}</span>
                  </div>}
                </For>
              </div>
              <div class="round-legend"><span><Icon d={ICONS.skull} size={13} /> Elimination</span><span><Icon d={ICONS.spike} size={13} /> Detonate</span><span><Icon d={ICONS.shield} size={13} /> Defuse</span><span><Icon d={ICONS.clock} size={13} /> Time</span><span>● your kills</span></div>
              <h3>Economy · loadout value per round</h3>
              <div class="econ">
                <For each={detail()!.rounds}>{(r, i) =>
                  <div class="econ-col" style={{ '--i': i() }} title={`R${r.n}: you ${r.loadout} vs enemy avg ${r.enemyLoadout} · bank ${r.bank}`}>
                    <i class="ally" style={{ '--h': `${(r.loadout / 5000) * 100}%` }} /><i class="enemy" style={{ '--h': `${(r.enemyLoadout / 5000) * 100}%` }} />
                    <span classList={{ won: r.won }}>{r.n}</span>
                  </div>}
                </For>
              </div>
              <div class="round-legend"><span><i class="sw ally" /> Your loadout</span><span><i class="sw enemy" /> Enemy avg loadout</span></div>
            </div>
          </Show>
          <Show when={tab() === 'duels' && detail()}>
            <div class="duels">
              <For each={detail()!.duels}>{(d, i) => {
                const total = Math.max(1, d.kills + d.deaths);
                return <div class="duel" style={{ '--i': i() }}>
                  <AgentIcon name={d.agent} size={40} />
                  <div class="duel-name"><strong>{d.name}</strong><small>{d.agent}</small></div>
                  <div class="duel-bar"><i class="k" style={{ '--w': `${(d.kills / total) * 100}%` }} /><i class="d" style={{ '--w': `${(d.deaths / total) * 100}%` }} /></div>
                  <b class="up">{d.kills}</b><span>–</span><b class="down">{d.deaths}</b>
                </div>;
              }}</For>
              <p class="muted small">Kills you scored on each opponent vs. deaths to them. Shown for your own match only — no opponent scouting.</p>
            </div>
          </Show>
        </div>
      </div>;
    }}</Show>
  </dialog>;
};
