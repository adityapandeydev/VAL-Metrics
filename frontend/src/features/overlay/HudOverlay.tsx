/**
 * VAL-Metrics desktop HUD — rendered inside the Wails window and in the website preview (?mode=overlay).
 * Same visual language as the tracker, deliberately static: no entrance motion, count-ups or pulses,
 * so nothing competes for attention while a player is in a match.
 *
 * Shows the player's OWN live line and OWN history only. No statistics about teammates or
 * opponents are displayed (Riot policy: no opponent scouting / no de-anonymising other players).
 */
import { Component, For, JSX, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { Window as WailsWindow, Call as WailsCall, Events as WailsEvents } from '@wailsio/runtime';
import { auditLCUConnection, authSession, LCUStatus } from '../../services/telemetry';
import type { OverlayTelemetryPayload } from '../../types/valorant';
import { sampleProfile } from '../tracker/data/demo';
import { summarize, fmt, relTime } from '../tracker/data/stats';
import { agentIcon, agentPortrait, agentRole, mapSplash, mapLocation, rankIcon, rankName, rankHue, FALLBACK, ROLE_COLOR } from '../tracker/data/assets';
import type { Match } from '../tracker/data/types';
import './hud.css';

type Stage = 'lobby' | 'select' | 'match' | 'ffa';
const STAGES: { id: Stage; label: string }[] = [
  { id: 'lobby', label: 'Lobby' }, { id: 'select', label: 'Agent select' }, { id: 'match', label: 'Match' }, { id: 'ffa', label: 'Deathmatch' },
];

const isWails = (): boolean => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return Boolean(w._wails?.environment?.OS || (w._wails && (w.chrome?.webview || w.webkit?.messageHandlers)) || w.wails || navigator.userAgent.includes('Wails'));
};

/** Reverse of rankName(): "Immortal 1" → 24. */
function tierFromName(name?: string) {
  if (!name) return 0;
  for (let t = 3; t <= 27; t++) if (rankName(t).toLowerCase() === name.trim().toLowerCase()) return t;
  return 0;
}
const PHASE: Record<string, string> = { BUY_PHASE: 'Buy phase', COMBAT: 'Round live', POST_ROUND: 'Round over' };

/* ───────────── small static building blocks ───────────── */
const Img: Component<{ src: string; class?: string; alt?: string }> = p =>
  <img class={p.class} src={p.src} alt={p.alt ?? ''} draggable={false} onError={e => { if (!e.currentTarget.src.endsWith(FALLBACK)) e.currentTarget.src = FALLBACK; }} />;

const Rank: Component<{ tier: number; size?: number }> = p => {
  const [bad, setBad] = createSignal(false);
  const s = () => p.size ?? 36;
  return <Show when={p.tier >= 3} fallback={<span class="h-rank-none" style={{ width: `${s()}px`, height: `${s()}px` }}>—</span>}>
    <Show when={!bad()} fallback={<svg width={s()} height={s()} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 37 20 20 38 3 20z" fill="none" stroke={rankHue(p.tier)} stroke-width="2.5" /><path d="m20 11 8 9-8 9-8-9z" fill={rankHue(p.tier)} /></svg>}>
      <img src={rankIcon(p.tier)} width={s()} height={s()} alt="" draggable={false} onError={() => setBad(true)} />
    </Show>
  </Show>;
};

const Panel: Component<{ title?: string; kicker?: string; class?: string; aside?: JSX.Element; children: JSX.Element }> = p =>
  <section class={`h-panel ${p.class || ''}`}>
    <Show when={p.title}><header class="h-head"><div><Show when={p.kicker}><span class="h-kicker">{p.kicker}</span></Show><h2>{p.title}</h2></div>{p.aside}</header></Show>
    {p.children}
  </section>;

const Tile: Component<{ label: string; value: string; note?: string; tone?: 'up' | 'down' | 'accent' }> = p =>
  <div class="h-tile"><span>{p.label}</span><b class={p.tone || ''}>{p.value}</b><Show when={p.note}><small>{p.note}</small></Show></div>;

const Bar: Component<{ value: number; max?: number; color?: string; marker?: number }> = p => {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / (p.max ?? 100)) * 100))}%`;
  return <div class="h-bar"><i style={{ width: Number.isFinite(p.value) ? pct(p.value) : '0%', background: p.color }} />
    <Show when={p.marker != null && Number.isFinite(p.marker)}><em style={{ left: pct(p.marker!) }} /></Show></div>;
};

/** Static ring (no transition). */
const Ring: Component<{ value: number; max?: number; size?: number; color?: string; children?: JSX.Element }> = p => {
  const S = () => p.size ?? 84, sw = 7, r = () => (S() - sw) / 2, len = () => 2 * Math.PI * r();
  const f = () => (Number.isFinite(p.value) ? Math.max(0, Math.min(1, p.value / (p.max ?? 100))) : 0);
  return <div class="h-ring" style={{ width: `${S()}px`, height: `${S()}px` }}>
    <svg width={S()} height={S()} viewBox={`0 0 ${S()} ${S()}`} aria-hidden="true">
      <circle cx={S() / 2} cy={S() / 2} r={r()} stroke-width={sw} class="h-ring-track" />
      <circle cx={S() / 2} cy={S() / 2} r={r()} stroke-width={sw} stroke={p.color || 'var(--accent)'} fill="none" stroke-linecap="round"
        stroke-dasharray={`${len() * f()} ${len()}`} transform={`rotate(-90 ${S() / 2} ${S() / 2})`} />
    </svg>
    <div>{p.children}</div>
  </div>;
};

const Ico: Component<{ d: string; size?: number }> = p =>
  <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={p.d} /></svg>;

/* ───────────────────────────── overlay ───────────────────────────── */
export const HudOverlay: Component<{ initialData?: OverlayTelemetryPayload }> = props => {
  const urlStage = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('stage') as Stage | null : null;
  const [stage, setStage] = createSignal<Stage>(urlStage && STAGES.some(s => s.id === urlStage) ? urlStage : 'match');
  const [lcu, setLcu] = createSignal<LCUStatus>({ connected: false });
  const [ghost, setGhost] = createSignal(false);

  /* Window controls — Wails v3 first, Tauri fallback, browser simulation last. */
  const windowControl = async (action: 'minimize' | 'close' | 'hide') => {
    if (isWails()) {
      try {
        await WailsCall.ByName(`main.OverlayService.${action === 'minimize' ? 'MinimizeWindow' : action === 'close' ? 'CloseWindow' : 'HideWindow'}`);
        return;
      } catch {
        try { if (action === 'minimize') await WailsWindow.Minimise(); else if (action === 'close') await WailsWindow.Close(); else await WailsWindow.Hide(); return; }
        catch (err) { console.warn('Wails window call failed:', err); }
      }
    }
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke(`${action === 'minimize' ? 'minimize' : action === 'close' ? 'close' : 'hide'}_window`);
    } catch {
      console.log(`Window action "${action}" simulated outside the desktop app.`);
    }
  };
  const toggleGhost = async () => {
    const next = !ghost();
    if (isWails()) {
      try { setGhost(Boolean(await WailsCall.ByName('main.OverlayService.ToggleClickThrough', next))); }
      catch (err) { console.error('Click-through toggle failed:', err); }
    } else setGhost(next);
  };

  onMount(async () => {
    const res = await auditLCUConnection();
    setLcu(res);
    const key = (e: KeyboardEvent) => {
      if (e.altKey && ['v', 't'].includes(e.key.toLowerCase())) { e.preventDefault(); void windowControl('hide'); }
    };
    window.addEventListener('keydown', key);
    onCleanup(() => window.removeEventListener('keydown', key));
    if (isWails()) {
      try {
        const off = WailsEvents.On('click-through-status-changed', (ev: any) => setGhost(Boolean(Array.isArray(ev?.data) ? ev.data[0] : ev?.data)));
        onCleanup(() => off?.());
      } catch (err) { console.warn('Wails event listener unavailable:', err); }
    }
  });

  /* ───── data: live telemetry when present, otherwise the labelled sample profile ───── */
  const live = () => props.initialData;
  const isLive = () => Boolean(live());
  const profile = sampleProfile();
  const history = createMemo<Match[]>(() => (isLive() ? [] : profile.matches.filter(m => m.queue === 'Competitive')));
  const recent = createMemo(() => summarize(history().slice(0, 20)));

  const now = createMemo(() => {
    const t = live();
    if (t) {
      const ps = t.playerStats, ms = t.matchState;
      return {
        riotId: ps.riotId, tier: tierFromName(ps.currentTierName), rr: ps.rankingRating, rrLast: ps.rrChangeLastMatch, peakTier: 0,
        map: ms.mapName, mode: ms.mode, region: ms.serverRegion, round: ms.roundNumber, phase: PHASE[ms.phase] || ms.phase,
        ally: ms.teamScore, enemy: ms.enemyScore, agent: ps.agentName, k: ps.kills, d: ps.deaths, a: ps.assists,
        acs: ps.combatScore, credits: ps.economyCredits, mapWR: ps.mapWinRate, mapGames: ps.historicalMatchesOnMap,
      };
    }
    // Sample "in progress" state for the preview, consistent with the sample profile.
    const onMap = history().filter(m => m.map === 'Haven');
    return {
      riotId: `${profile.name}#${profile.tag}`, tier: profile.tier, rr: profile.rr, rrLast: history()[0]?.rrChange ?? 0, peakTier: profile.peakTier,
      map: 'Haven', mode: 'Competitive', region: profile.region, round: 14, phase: 'Buy phase',
      ally: 8, enemy: 5, agent: 'Omen', k: 12, d: 8, a: 5, acs: 241, credits: 4100,
      mapWR: onMap.length ? (onMap.filter(m => m.won).length / onMap.length) * 100 : NaN, mapGames: onMap.length,
    };
  });
  // Red attacks first in VALORANT; sides swap after round 12 and alternate in overtime.
  const side = () => {
    const attackFirst = live() ? live()!.matchState.playerTeam === 'RED' : true;
    const r = now().round;
    const firstHalf = r <= 12 || (r > 24 && (r - 24) % 2 === 1);
    return firstHalf === attackFirst ? 'Attack' : 'Defense';
  };

  const onMap = createMemo(() => history().filter(m => m.map === now().map));
  const mapSum = createMemo(() => summarize(onMap()));
  const agentSum = createMemo(() => summarize(history().filter(m => m.agent === now().agent)));
  const bestAgents = createMemo(() => {
    const pool = onMap().length >= 3 ? onMap() : history();
    const by = new Map<string, Match[]>();
    for (const m of pool) by.set(m.agent, [...(by.get(m.agent) || []), m]);
    return [...by].map(([agent, list]) => ({ agent, s: summarize(list) })).sort((a, b) => b.s.matches - a.s.matches || b.s.winRate - a.s.winRate).slice(0, 4);
  });
  const topAgents = createMemo(() => {
    const by = new Map<string, Match[]>();
    for (const m of history().slice(0, 20)) by.set(m.agent, [...(by.get(m.agent) || []), m]);
    return [...by].map(([agent, list]) => ({ agent, s: summarize(list) })).sort((a, b) => b.s.matches - a.s.matches).slice(0, 3);
  });
  const lastDay = createMemo(() => {
    const first = history()[0]; if (!first) return null;
    const day = new Date(first.startedAt).toDateString();
    const list = history().filter(m => new Date(m.startedAt).toDateString() === day);
    return { list, s: summarize(list), rr: list.reduce((n, m) => n + (m.rrChange || 0), 0) };
  });
  const liveKd = () => now().k / Math.max(1, now().d);
  const delta = (a: number, b: number, digits = 0) => (Number.isFinite(a) && Number.isFinite(b) ? `${a - b >= 0 ? '+' : ''}${fmt(a - b, digits)}` : '—');

  return <div class="hud" classList={{ ghost: ghost() }}>
    {/* ── Title bar (draggable) ── */}
    <header class="h-titlebar" data-tauri-drag-region="true" style={{ '--wails-draggable': 'drag' }}>
      <div class="h-brand" data-tauri-drag-region="true">
        <svg width="20" height="20" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 6h9l7 16 7-16h9L20 36z" fill="var(--ink)" /><path d="M4 6l16 30-3.6-.2L4 9z" fill="var(--accent)" /></svg>
        <span>VAL<b>METRICS</b></span><em>HUD</em>
      </div>
      <div class="h-status" data-tauri-drag-region="true">
        <span class="h-chip" classList={{ ok: lcu().connected }} title={lcu().reason || ''}><i />{lcu().connected ? 'Game client connected' : 'Game client not detected'}</span>
        <span class="h-chip" classList={{ warn: !isLive(), ok: isLive() }}><i />{isLive() ? 'Live data' : 'Sample data'}</span>
        <Show when={ghost()}><span class="h-chip warn"><i />Click-through on</span></Show>
      </div>
      <div class="h-controls" style={{ '--wails-draggable': 'no-drag' }} data-tauri-drag-region="false" onMouseDown={e => e.stopPropagation()}>
        <button class="h-btn" classList={{ on: ghost() }} onClick={toggleGhost} title="Let mouse clicks pass through the HUD to the game">
          <Ico d="M5 3l14 9-6 1.5L10 20z" />{ghost() ? 'Click-through on' : 'Click-through off'}
        </button>
        <button class="h-icon" onClick={() => windowControl('minimize')} title="Minimize" aria-label="Minimize"><Ico d="M5 12h14" /></button>
        <button class="h-icon close" onClick={() => windowControl('close')} title="Close HUD" aria-label="Close HUD"><Ico d="M6 6l12 12M18 6 6 18" /></button>
      </div>
    </header>

    {/* ── Stage bar ── */}
    <nav class="h-stagebar" style={{ '--wails-draggable': 'no-drag' }}>
      <div class="h-seg" role="tablist" aria-label="HUD stage">
        <For each={STAGES}>{s => <button role="tab" aria-selected={stage() === s.id} classList={{ on: stage() === s.id }} onClick={() => setStage(s.id)}>{s.label}</button>}</For>
      </div>
      <div class="h-context"><b>{now().map}</b><span>{stage() === 'ffa' ? 'Deathmatch' : now().mode}</span><span>{now().region}</span></div>
    </nav>

    <main class="h-main">
      {/* ═════════ LOBBY ═════════ */}
      <Show when={stage() === 'lobby'}>
        <div class="h-grid h-lobby">
          <Panel class="h-profile">
            <div class="h-profile-art"><img src={agentPortrait(profile.bannerAgent)} alt="" draggable={false} onError={e => { e.currentTarget.style.display = 'none'; }} /></div>
            <div class="h-profile-body">
              <span class="h-kicker">Ready for matchmaking</span>
              <h1>{now().riotId.split('#')[0]}<em>#{now().riotId.split('#')[1] || ''}</em></h1>
              <div class="h-rankrow">
                <div class="h-rankcard"><Rank tier={now().tier} size={52} /><div><span class="h-kicker">Current rank</span><strong>{now().tier ? rankName(now().tier) : 'Unranked'}</strong>
                  <div class="h-rr"><Bar value={now().rr} color={rankHue(now().tier)} /><small>{fmt(now().rr)} / 100 RR</small></div></div></div>
                <Show when={now().peakTier}><div class="h-rankcard"><Rank tier={now().peakTier} size={40} /><div><span class="h-kicker">Peak</span><strong>{rankName(now().peakTier)}</strong><small>{profile.peakAct}</small></div></div></Show>
              </div>
              <div class="h-tiles h-six">
                <Tile label="Win rate" value={`${fmt(recent().winRate, 1)}%`} note={`${recent().wins}W · ${recent().losses}L`} />
                <Tile label="K/D" value={fmt(recent().kd, 2)} />
                <Tile label="HS %" value={`${fmt(recent().hs, 1)}%`} />
                <Tile label="ADR" value={fmt(recent().adr)} />
                <Tile label="ACS" value={fmt(recent().acs)} />
                <Tile label="Impact" value={fmt(recent().impact, 1)} tone="accent" />
              </div>
              <Show when={topAgents().length}>
                <div class="h-mostplayed">
                  <span class="h-kicker">Most played</span>
                  <div><For each={topAgents()}>{a =>
                    <div class="h-mp"><Img class="h-agent" src={agentIcon(a.agent)} /><div><strong>{a.agent}</strong><small>{a.s.matches} {a.s.matches === 1 ? 'match' : 'matches'} · {fmt(a.s.winRate, 0)}% WR</small></div></div>}
                  </For></div>
                </div>
              </Show>
              <p class="h-foot">Last {recent().matches} competitive matches</p>
            </div>
          </Panel>
          <Panel title="Recent matches" kicker={lastDay() ? `Latest session · ${lastDay()!.s.wins}W ${lastDay()!.s.losses}L · ${lastDay()!.rr >= 0 ? '+' : ''}${lastDay()!.rr} RR` : undefined}>
            <Show when={history().length} fallback={<p class="h-empty">Match history appears here once your account is linked with Riot Sign-On.</p>}>
              <div class="h-list">
                <For each={history().slice(0, 6)}>{m =>
                  <div class="h-row" classList={{ win: m.won, loss: !m.won }}>
                    <Img class="h-agent" src={agentIcon(m.agent)} />
                    <div class="h-row-id"><strong>{m.map}</strong><small>{relTime(m.startedAt)}</small></div>
                    <b class="h-score">{m.teamScore}<i>:</i>{m.enemyScore}</b>
                    <span class="h-kda">{m.k}/{m.d}/{m.a}</span>
                    <span class="h-rrchip" classList={{ up: (m.rrChange || 0) > 0, down: (m.rrChange || 0) < 0 }}>{m.rrChange != null ? `${m.rrChange > 0 ? '+' : ''}${m.rrChange}` : '—'}</span>
                  </div>}
                </For>
              </div>
            </Show>
          </Panel>
        </div>
      </Show>

      {/* ═════════ AGENT SELECT ═════════ */}
      <Show when={stage() === 'select'}>
        <div class="h-grid h-sel">
          <Panel class="h-map" >
            <div class="h-map-art"><Img src={mapSplash(now().map)} /><div><span class="h-kicker">{mapLocation(now().map) || 'Map'}</span><h2 class="h-map-name">{now().map}</h2></div></div>
            <div class="h-map-body">
              <div class="h-map-top">
                <Ring value={mapSum().winRate} color={mapSum().winRate >= 50 ? 'var(--win)' : 'var(--loss)'}><b>{fmt(mapSum().winRate, 0)}%</b><small>win</small></Ring>
                <div><span class="h-kicker">Your record here</span><strong class="h-big">{mapSum().wins}W · {mapSum().losses}L</strong><small class="h-muted">{mapSum().matches} competitive matches</small></div>
              </div>
              <div class="h-sides">
                <div><span>Attack rounds won</span><Bar value={mapSum().atkWinRate} color="var(--accent)" /><b>{fmt(mapSum().atkWinRate, 0)}%</b></div>
                <div><span>Defense rounds won</span><Bar value={mapSum().defWinRate} color="var(--info)" /><b>{fmt(mapSum().defWinRate, 0)}%</b></div>
              </div>
              <div class="h-tiles h-three">
                <Tile label="K/D" value={fmt(mapSum().kd, 2)} /><Tile label="ACS" value={fmt(mapSum().acs)} /><Tile label="ADR" value={fmt(mapSum().adr)} />
              </div>
            </div>
          </Panel>
          <Panel title={`Your agents on ${now().map}`} kicker={onMap().length >= 3 ? 'From your own match history' : 'Too few matches here · showing all maps'}>
            <Show when={bestAgents().length} fallback={<p class="h-empty">No agent history yet.</p>}>
              <div class="h-agents">
                <For each={bestAgents()}>{(a, i) =>
                  <div class="h-agentrow" style={{ '--role': ROLE_COLOR[agentRole(a.agent)] }}>
                    <span class="h-rankno">{i() + 1}</span>
                    <Img class="h-agent lg" src={agentIcon(a.agent)} />
                    <div class="h-agent-id"><strong>{a.agent}</strong><small>{agentRole(a.agent)} · {a.s.matches} {a.s.matches === 1 ? 'match' : 'matches'}</small></div>
                    <div class="h-agent-wr"><Bar value={a.s.winRate} color={a.s.winRate >= 50 ? 'var(--win)' : 'var(--loss)'} /><b>{fmt(a.s.winRate, 0)}%</b></div>
                    <div class="h-num"><b>{fmt(a.s.kd, 2)}</b><small>K/D</small></div>
                    <div class="h-num"><b>{fmt(a.s.acs)}</b><small>ACS</small></div>
                  </div>}
                </For>
              </div>
            </Show>
            <p class="h-foot">Personal history only. The HUD never shows stats about other players.</p>
          </Panel>
        </div>
      </Show>

      {/* ═════════ LIVE MATCH ═════════ */}
      <Show when={stage() === 'match'}>
        <div class="h-match">
          <div class="h-scorebar">
            <div class="h-team ally"><span>Your team</span><b>{now().ally}</b></div>
            <div class="h-round"><strong>Round {now().round}</strong><span>{now().phase} · {side()}</span></div>
            <div class="h-team enemy"><b>{now().enemy}</b><span>Enemy team</span></div>
          </div>
          <div class="h-grid h-matchrow">
            <Panel class="h-you">
              <div class="h-you-head">
                <Img class="h-agent xl" src={agentIcon(now().agent)} />
                <div><span class="h-kicker">You · {agentRole(now().agent)}</span><strong class="h-big">{now().agent}</strong></div>
                <div class="h-you-rank"><Rank tier={now().tier} size={34} /><div><b>{now().tier ? rankName(now().tier) : 'Unranked'}</b><small>{fmt(now().rr)} RR</small></div></div>
              </div>
              <div class="h-kda-big"><b>{now().k}</b><i>/</i><b class="d">{now().d}</b><i>/</i><b>{now().a}</b></div>
              <div class="h-tiles h-three">
                <Tile label="ACS" value={fmt(now().acs)} />
                <Tile label="K/D" value={fmt(liveKd(), 2)} tone={liveKd() >= 1 ? 'up' : 'down'} />
                <Tile label="Credits" value={fmt(now().credits)} />
              </div>
            </Panel>
            <Panel title={`Versus your ${now().agent} average`} kicker={agentSum().matches ? `${agentSum().matches} previous matches` : 'No previous matches'}>
              <Show when={agentSum().matches} fallback={<p class="h-empty">{isLive() ? 'Personal averages load from your synced history.' : 'No history on this agent yet.'}</p>}>
                <div class="h-compare">
                  <For each={[
                    { l: 'Combat score', v: now().acs, avg: agentSum().acs, max: 400, d: 0 },
                    { l: 'K/D', v: liveKd(), avg: agentSum().kd, max: 2.5, d: 2 },
                    { l: 'Kills / round', v: now().k / Math.max(1, now().round - 1), avg: agentSum().kpr, max: 1.5, d: 2 },
                  ]}>{c =>
                    <div class="h-cmp">
                      <div class="h-cmp-top"><span>{c.l}</span><b>{fmt(c.v, c.d)}</b><em classList={{ up: c.v >= c.avg, down: c.v < c.avg }}>{delta(c.v, c.avg, c.d)} vs avg</em></div>
                      <Bar value={c.v} max={c.max} marker={c.avg} color={c.v >= c.avg ? 'var(--win)' : 'var(--loss)'} />
                      <small>Average {fmt(c.avg, c.d)} · marker</small>
                    </div>}
                  </For>
                </div>
              </Show>
            </Panel>
            <Panel title={`On ${now().map}`} kicker="Your history">
              <div class="h-onmap">
                <Ring value={now().mapWR} size={96} color={now().mapWR >= 50 ? 'var(--win)' : 'var(--loss)'}><b>{fmt(now().mapWR, 0)}%</b><small>win</small></Ring>
                <div class="h-onmap-list">
                  <div><span>Matches</span><b>{fmt(now().mapGames)}</b></div>
                  <div><span>Attack rounds</span><b>{fmt(mapSum().atkWinRate, 0)}%</b></div>
                  <div><span>Defense rounds</span><b>{fmt(mapSum().defWinRate, 0)}%</b></div>
                  <div><span>Last match RR</span><b classList={{ up: now().rrLast > 0, down: now().rrLast < 0 }}>{now().rrLast > 0 ? '+' : ''}{fmt(now().rrLast)}</b></div>
                </div>
              </div>
            </Panel>
          </div>
          <Show when={lastDay()}>{d =>
            <div class="h-session">
              <span class="h-kicker">Latest session</span>
              <div><b>{d().s.wins}W · {d().s.losses}L</b><small>Record</small></div>
              <div><b classList={{ up: d().rr > 0, down: d().rr < 0 }}>{d().rr > 0 ? '+' : ''}{d().rr}</b><small>RR</small></div>
              <div><b>{fmt(d().s.kd, 2)}</b><small>K/D</small></div>
              <div><b>{fmt(d().s.acs)}</b><small>ACS</small></div>
              <div><b>{Number.isFinite(now().rr) ? 100 - now().rr : '—'}</b><small>RR to next rank</small></div>
            </div>}
          </Show>
        </div>
      </Show>

      {/* ═════════ DEATHMATCH ═════════ */}
      <Show when={stage() === 'ffa'}>
        <div class="h-grid h-ffa-grid">
          <Panel title="Deathmatch" kicker="Warm-up · first to 40">
            <div class="h-ffa">
              <div class="h-ffa-k"><b>{isLive() ? now().k : 27}</b><span>kills</span></div>
              <div class="h-ffa-prog"><Bar value={isLive() ? now().k : 27} max={40} color="var(--accent)" /><small>{40 - (isLive() ? now().k : 27)} to go</small></div>
              <div class="h-tiles h-three">
                <Tile label="Deaths" value={fmt(isLive() ? now().d : 19)} />
                <Tile label="K/D" value={fmt((isLive() ? now().k : 27) / Math.max(1, isLive() ? now().d : 19), 2)} />
                <Tile label="Agent" value={now().agent} />
              </div>
            </div>
          </Panel>
          <Panel title="Aim check" kicker="Your last 20 competitive matches">
            <div class="h-aim">
              <For each={[['Head', recent().headshots, 'var(--gold)'], ['Body', recent().bodyshots, '#9aa3b5'], ['Legs', recent().legshots, '#5a6274']] as const}>{([l, n, c]) => {
                const total = recent().headshots + recent().bodyshots + recent().legshots;
                return <div class="h-aim-row"><span>{l}</span><Bar value={total ? (n / total) * 100 : 0} color={c} /><b>{fmt(total ? (n / total) * 100 : NaN, 1)}%</b></div>;
              }}</For>
            </div>
            <p class="h-foot">Use warm-up to practise head-level crosshair placement. Your competitive HS% is {fmt(recent().hs, 1)}%.</p>
          </Panel>
        </div>
      </Show>
    </main>

    <footer class="h-footer">
      <span><kbd>Alt</kbd>+<kbd>V</kbd> show / hide HUD</span>
      <span>Personal statistics only · no information about other players</span>
      <span>{isLive() ? 'Live data from your connected client' : 'Sample data · interface preview'}</span>
    </footer>
  </div>;
};
