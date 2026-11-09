import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { store } from '../store';
import { Card, Head, AgentIcon, Img, Empty } from '../ui';
import { CountUp } from '../motion';
import { Meter, Ring, SplitBar } from '../charts';
import { fmt } from '../data/stats';
import { agentPortrait, mapSplash, mapLocation, weaponIcon, ROLE_COLOR } from '../data/assets';
import { HIT } from './Overview';
import type { Role } from '../data/types';

/* ─────────────────────────── Agents ─────────────────────────── */
export const Agents: Component = () => {
  const [role, setRole] = createSignal<'All' | Role>('All');
  const [sort, setSort] = createSignal<'matches' | 'winRate' | 'kd' | 'acs' | 'adr'>('matches');
  const [pick, setPick] = createSignal<string>();
  const list = createMemo(() => store.stats().agents.filter(a => role() === 'All' || a.role === role()).slice().sort((a, b) => (b[sort()] as number) - (a[sort()] as number)));
  const spot = createMemo(() => store.stats().agents.find(a => a.name === pick()) || list()[0]);
  const maxM = () => Math.max(1, ...store.stats().agents.map(a => a.matches));
  return <Show when={store.stats().agents.length} fallback={<Card><Empty title="No agent data" text="No agents were played in this view." /></Card>}>
    <div class="stack">
      <Show when={spot()} keyed>{a =>
        <Card class="spotlight" i={0} style={{ '--role': ROLE_COLOR[a.role] }}>
          <div class="spot-art"><Img src={agentPortrait(a.name)} loading="eager" /></div>
          <div class="spot-body">
            <span class="role-tag">{a.role}</span>
            <h2 class="spot-name">{a.name}</h2>
            <p class="muted">{a.matches} matches · {fmt(a.playtimeH, 1)} hours · best on <b>{a.bestMap}</b> ({fmt(a.bestMapWR, 0)}% WR)</p>
            <div class="spot-rings">
              <div><Ring value={a.winRate} size={96} color="var(--win)"><b><CountUp value={a.winRate} digits={0} suffix="%" /></b></Ring><span>Win rate</span></div>
              <div><Ring value={a.kd} max={2} size={96} delay={100}><b><CountUp value={a.kd} digits={2} /></b></Ring><span>K/D</span></div>
              <div><Ring value={a.hs} max={50} size={96} color={HIT.head} delay={200}><b><CountUp value={a.hs} digits={0} suffix="%" /></b></Ring><span>HS%</span></div>
              <div><Ring value={a.kast} size={96} color="var(--info)" delay={300}><b><CountUp value={a.kast} digits={0} suffix="%" /></b></Ring><span>KAST</span></div>
            </div>
            <div class="spot-stats">
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
          <div class="chips">
            <For each={['All', 'Duelist', 'Initiator', 'Controller', 'Sentinel'] as const}>{r => <button class="chip" classList={{ on: role() === r }} style={{ '--role': r === 'All' ? 'var(--ink-2)' : ROLE_COLOR[r] }} onClick={() => setRole(r)}>{r}</button>}</For>
            <label class="select"><span>Sort</span><select value={sort()} onChange={e => setSort(e.currentTarget.value as any)}><option value="matches">Matches</option><option value="winRate">Win rate</option><option value="kd">K/D</option><option value="acs">ACS</option><option value="adr">ADR</option></select></label>
          </div>
        </Head>
        <div class="table-scroll"><table class="data-table">
          <thead><tr><th>Agent</th><th>Matches</th><th>Time</th><th class="w-meter">Win rate</th><th>K/D</th><th>ADR</th><th>ACS</th><th>DDΔ</th><th>HS%</th><th>KAST</th><th>Best map</th></tr></thead>
          <tbody><For each={list()} fallback={<tr><td colspan="11" class="muted">No {role()} agents played.</td></tr>}>{(a, i) =>
            <tr class="row-in" classList={{ picked: spot()?.name === a.name }} style={{ '--i': i(), '--role': ROLE_COLOR[a.role] }} onClick={() => { setPick(a.name); window.scrollTo({ top: 0, behavior: 'smooth' }); }} tabindex="0" onKeyDown={e => e.key === 'Enter' && setPick(a.name)}>
              <th><div class="cell-agent"><AgentIcon name={a.name} size={36} /><span>{a.name}<small>{a.role}</small></span></div></th>
              <td><div class="cell-bar"><b>{a.matches}</b><Meter value={a.matches} max={maxM()} thin i={i()} /></div></td>
              <td>{fmt(a.playtimeH, 1)}h</td>
              <td><div class="cell-bar"><b>{fmt(a.winRate, 1)}%</b><Meter value={a.winRate} color={a.winRate >= 50 ? 'var(--win)' : 'var(--loss)'} thin i={i()} /></div></td>
              <td>{fmt(a.kd, 2)}</td><td>{fmt(a.adr, 0)}</td><td>{fmt(a.acs, 0)}</td>
              <td classList={{ up: a.dd > 0, down: a.dd < 0 }}>{a.dd > 0 ? '+' : ''}{fmt(a.dd, 0)}</td>
              <td>{fmt(a.hs, 1)}%</td><td>{fmt(a.kast, 0)}%</td><td>{a.bestMap}<small class="muted"> {fmt(a.bestMapWR, 0)}%</small></td>
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
    <div class="map-grid">
      <For each={maps()}>{(m, i) =>
        <Card as="article" class="map-card" i={i()} flush>
          <div class="map-card-art"><Img src={mapSplash(m.name)} /></div>
          <div class="map-card-body">
            <header><div><h3>{m.name}</h3><small>{mapLocation(m.name)}</small></div>
              <Ring value={m.winRate} size={74} stroke={6} color={m.winRate >= 50 ? 'var(--win)' : 'var(--loss)'} delay={i() * 60}><b><CountUp value={m.winRate} digits={0} suffix="%" /></b></Ring>
            </header>
            <div class="map-record"><span class="up">{m.wins}W</span><span class="down">{m.losses}L</span><span class="muted">{m.matches} played</span></div>
            <div class="map-sides">
              <div><span>Attack</span><Meter value={m.atkWR} color="var(--accent)" i={i()} /><b>{fmt(m.atkWR, 0)}%</b></div>
              <div><span>Defense</span><Meter value={m.defWR} color="var(--info)" i={i() + 1} /><b>{fmt(m.defWR, 0)}%</b></div>
            </div>
            <footer><span><small>K/D</small><b>{fmt(m.kd, 2)}</b></span><span><small>ACS</small><b>{fmt(m.acs, 0)}</b></span><span><small>ADR</small><b>{fmt(m.adr, 0)}</b></span>
              <span class="top-agent"><small>Most played</small><Show when={m.topAgent !== '—'} fallback={<b>—</b>}><AgentIcon name={m.topAgent} size={26} /></Show></span></footer>
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
    <div class="stack">
      <div class="chips bar"><For each={cats()}>{c => <button class="chip" classList={{ on: cat() === c }} onClick={() => setCat(c)}>{c}</button>}</For></div>
      <div class="weapon-grid">
        <For each={list()}>{(w, i) =>
          <Card as="article" class="weapon-card" i={i()}>
            <header><div><h3>{w.name}</h3><small>{w.category}</small></div><span class="kills"><b><CountUp value={w.kills} delay={i() * 50} /></b><small>kills</small></span></header>
            <div class="weapon-stage"><Img src={weaponIcon(w.name)} /></div>
            <div class="weapon-share"><span>Share of kills</span><Meter value={w.kills} max={top()} i={i()} /><b>{fmt(w.killShare, 1)}%</b></div>
            <SplitBar parts={[{ label: 'Head', value: w.hs, color: HIT.head }, { label: 'Body', value: w.body, color: HIT.body }, { label: 'Legs', value: w.legs, color: HIT.legs }]} />
            <div class="weapon-hits"><span><i style={{ background: HIT.head }} />Head <b>{fmt(w.hs, 1)}%</b></span><span><i style={{ background: HIT.body }} />Body <b>{fmt(w.body, 1)}%</b></span><span><i style={{ background: HIT.legs }} />Legs <b>{fmt(w.legs, 1)}%</b></span></div>
            <footer><span><small>Damage / kill</small><b>{fmt(w.damagePerKill, 0)}</b></span><span><small>Longest kill</small><b>{Number.isFinite(w.longest) ? `${fmt(w.longest)} m` : '—'}</b></span></footer>
          </Card>}
        </For>
      </div>
    </div>
  </Show>;
};
