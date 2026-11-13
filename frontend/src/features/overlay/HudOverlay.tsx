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
import { useScaled } from '../tracker/motion';

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

/* ───────────── static building blocks (Tailwind only, no motion) ───────────── */
const kicker = 'block font-display text-[10.5px] leading-tight font-semibold uppercase tracking-[.14em] text-muted';
const well = 'rounded-lg border border-line bg-bg';
const big = 'block font-display text-[22px] leading-[1.15] font-bold';
const foot = 'mt-auto pt-3 text-xs text-muted';
const empty = 'py-[18px] text-[13px] text-muted';
const toneCls = (v: number) => (v > 0 ? 'text-win' : v < 0 ? 'text-loss' : '');

const Img: Component<{ src: string; class?: string; alt?: string }> = p =>
  <img class={p.class} src={p.src} alt={p.alt ?? ''} draggable={false} onError={e => { if (!e.currentTarget.src.endsWith(FALLBACK)) e.currentTarget.src = FALLBACK; }} />;

const AgentImg: Component<{ name: string; size?: 'md' | 'lg' | 'xl' }> = p => {
  const src = useScaled(() => agentIcon(p.name), 128); // 1024px source → 128px copy in memory
  return <img class={`flex-none border border-line bg-surface-3 object-cover ${p.size === 'xl' ? 'size-[58px] rounded-[10px]' : p.size === 'lg' ? 'size-[42px] rounded-[7px]' : 'size-[34px] rounded-[7px]'}`}
    src={src() || undefined} style={src() ? undefined : { visibility: 'hidden' }} alt="" draggable={false} onError={e => { if (!e.currentTarget.src.endsWith(FALLBACK)) e.currentTarget.src = FALLBACK; }} />;
};

const Rank: Component<{ tier: number; size?: number }> = p => {
  const [bad, setBad] = createSignal(false);
  const s = () => p.size ?? 36;
  return <Show when={p.tier >= 3} fallback={<span class="grid place-items-center rounded-full border border-dashed border-line-2 text-muted" style={{ width: `${s()}px`, height: `${s()}px` }}>—</span>}>
    <Show when={!bad()} fallback={<svg width={s()} height={s()} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 37 20 20 38 3 20z" fill="none" stroke={rankHue(p.tier)} stroke-width="2.5" /><path d="m20 11 8 9-8 9-8-9z" fill={rankHue(p.tier)} /></svg>}>
      <img src={rankIcon(p.tier)} width={s()} height={s()} alt="" draggable={false} onError={() => setBad(true)} />
    </Show>
  </Show>;
};

const Panel: Component<{ title?: string; kicker?: string; class?: string; aside?: JSX.Element; children: JSX.Element }> = p =>
  <section class={`relative flex min-h-0 min-w-0 flex-col rounded-[10px] border border-line bg-surface before:absolute before:-top-px before:-left-px before:size-3 before:rounded-tl-[10px] before:border-t-2 before:border-l-2 before:border-accent ${p.class ?? 'p-4'}`}>
    <Show when={p.title}><header class="mb-3 flex items-start justify-between gap-2.5"><div><Show when={p.kicker}><span class={kicker}>{p.kicker}</span></Show><h2 class="mt-[3px] font-display text-[15px] font-bold uppercase tracking-[.05em]">{p.title}</h2></div>{p.aside}</header></Show>
    {p.children}
  </section>;

const Tile: Component<{ label: string; value: string; note?: string; tone?: 'up' | 'down' | 'accent' }> = p =>
  <div class={`${well} min-w-0 px-3 py-2.5`}>
    <span class="block font-display text-[10px] font-semibold uppercase tracking-[.12em] text-muted">{p.label}</span>
    <b class="mt-[3px] block truncate font-display text-[21px] leading-[1.2] font-bold" classList={{ 'text-win': p.tone === 'up', 'text-loss': p.tone === 'down', 'text-accent-2': p.tone === 'accent' }}>{p.value}</b>
    <Show when={p.note}><small class="block text-[11.5px] text-muted">{p.note}</small></Show>
  </div>;

const Bar: Component<{ value: number; max?: number; color?: string; marker?: number; thick?: boolean }> = p => {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / (p.max ?? 100)) * 100))}%`;
  return <div class={`relative min-w-10 flex-1 rounded-full bg-ink/7 ${p.thick ? 'h-2.5' : 'h-1.5'}`}>
    <i class="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: Number.isFinite(p.value) ? pct(p.value) : '0%', background: p.color }} />
    <Show when={p.marker != null && Number.isFinite(p.marker)}><em class="absolute -inset-y-1 -ml-px w-0.5 rounded-[1px] bg-ink" style={{ left: pct(p.marker!) }} /></Show>
  </div>;
};

/** Static ring (no transition). */
const Ring: Component<{ value: number; max?: number; size?: number; color?: string; children?: JSX.Element }> = p => {
  const S = () => p.size ?? 84, sw = 7, r = () => (S() - sw) / 2, len = () => 2 * Math.PI * r();
  const f = () => (Number.isFinite(p.value) ? Math.max(0, Math.min(1, p.value / (p.max ?? 100))) : 0);
  return <div class="relative grid flex-none place-items-center" style={{ width: `${S()}px`, height: `${S()}px` }}>
    <svg class="absolute inset-0" width={S()} height={S()} viewBox={`0 0 ${S()} ${S()}`} aria-hidden="true">
      <circle class="fill-none stroke-ink/8" cx={S() / 2} cy={S() / 2} r={r()} stroke-width={sw} />
      <circle cx={S() / 2} cy={S() / 2} r={r()} stroke-width={sw} stroke={p.color || 'var(--color-accent)'} fill="none" stroke-linecap="round"
        stroke-dasharray={`${len() * f()} ${len()}`} transform={`rotate(-90 ${S() / 2} ${S() / 2})`} />
    </svg>
    <div class="grid justify-items-center leading-[1.1] [&_b]:font-display [&_b]:text-lg [&_b]:font-bold [&_small]:text-[10.5px] [&_small]:uppercase [&_small]:tracking-[.1em] [&_small]:text-muted">{p.children}</div>
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
  // Large art is downscaled once and only the small copy is kept in memory.
  const lobbyArt = useScaled(() => agentPortrait(profile.bannerAgent), 760);
  const mapArt = useScaled(() => mapSplash(now().map), 960);
  const delta = (a: number, b: number, digits = 0) => (Number.isFinite(a) && Number.isFinite(b) ? `${a - b >= 0 ? '+' : ''}${fmt(a - b, digits)}` : '—');

  const chip = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-[3px] font-display text-[10.5px] font-semibold uppercase tracking-[.08em] [&>i]:size-1.5 [&>i]:rounded-full [&>i]:bg-current';
  const chipOk = 'border-win/30 text-win', chipWarn = 'border-accent-2/30 text-accent-2', chipOff = 'border-line text-muted';
  const W = 'var(--color-win)', L = 'var(--color-loss)';
  const winLoss = (v: number) => (v >= 50 ? W : L);
  const sideRow = 'grid grid-cols-[140px_1fr_44px] items-center gap-3 text-[12.5px] text-ink-2 [&>b]:text-right [&>b]:font-display [&>b]:text-sm [&>b]:font-bold [&>b]:text-ink';

  return <div class="flex h-screen w-full flex-col overflow-hidden border border-line-2 bg-bg font-body text-sm leading-[1.4] text-ink select-none">
    {/* ── Title bar (draggable) ── */}
    <header class="flex h-11 flex-none items-center gap-3.5 border-b border-line bg-chrome pr-2 pl-3.5" data-tauri-drag-region="true" style={{ '--wails-draggable': 'drag' }}>
      <div class="flex items-center gap-2 font-display text-[13px] font-bold tracking-[.18em]" data-tauri-drag-region="true">
        <svg width="20" height="20" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 6h9l7 16 7-16h9L20 36z" fill="var(--color-ink)" /><path d="M4 6l16 30-3.6-.2L4 9z" fill="var(--color-accent)" /></svg>
        <span>VAL<b class="text-accent">METRICS</b></span>
        <em class="rounded border border-line-2 px-1.5 py-px text-[10px] tracking-[.14em] text-muted not-italic">HUD</em>
      </div>
      <div class="flex min-w-0 flex-1 gap-1.5 overflow-hidden" data-tauri-drag-region="true">
        <span class={`${chip} ${lcu().connected ? chipOk : `${chipOff} max-[1120px]:hidden`}`} title={lcu().reason || ''}><i />{lcu().connected ? 'Game client connected' : 'Game client not detected'}</span>
        <span class={`${chip} ${isLive() ? chipOk : chipWarn}`}><i />{isLive() ? 'Live data' : 'Sample data'}</span>
        <Show when={ghost()}><span class={`${chip} ${chipWarn}`}><i />Click-through on</span></Show>
      </div>
      <div class="flex items-center gap-1" style={{ '--wails-draggable': 'no-drag' }} data-tauri-drag-region="false" onMouseDown={e => e.stopPropagation()}>
        <button class="inline-flex h-[30px] items-center gap-1.5 rounded-md border px-2.5 font-display text-[11px] font-semibold uppercase tracking-[.06em]"
          classList={{ 'border-accent-2/45 bg-accent-2/8 text-accent-2': ghost(), 'border-line-2 text-ink-2 hover:bg-surface-2 hover:text-ink': !ghost() }}
          onClick={toggleGhost} title="Let mouse clicks pass through the HUD to the game">
          <Ico d="M5 3l14 9-6 1.5L10 20z" />{ghost() ? 'Click-through on' : 'Click-through off'}
        </button>
        <button class="grid h-[30px] w-[34px] place-items-center rounded-md text-ink-2 hover:bg-surface-2 hover:text-ink" onClick={() => windowControl('minimize')} title="Minimize" aria-label="Minimize"><Ico d="M5 12h14" /></button>
        <button class="grid h-[30px] w-[34px] place-items-center rounded-md text-ink-2 hover:bg-accent hover:text-white" onClick={() => windowControl('close')} title="Close HUD" aria-label="Close HUD"><Ico d="M6 6l12 12M18 6 6 18" /></button>
      </div>
    </header>

    {/* ── Stage bar ── */}
    <nav class="flex flex-none items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5" classList={{ 'opacity-55': ghost() }} style={{ '--wails-draggable': 'no-drag' }}>
      <div class="inline-flex rounded-lg border border-line bg-bg p-[3px]" role="tablist" aria-label="HUD stage">
        <For each={STAGES}>{s => <button role="tab" aria-selected={stage() === s.id} class="rounded-md px-3.5 py-[7px] font-display text-xs font-semibold uppercase tracking-[.06em]"
          classList={{ 'bg-accent text-white': stage() === s.id, 'text-muted hover:text-ink': stage() !== s.id }} onClick={() => setStage(s.id)}>{s.label}</button>}</For>
      </div>
      <div class="flex items-baseline gap-3 text-[12.5px] whitespace-nowrap text-ink-2 [&>span]:before:mr-3 [&>span]:before:text-muted [&>span]:before:content-['·']">
        <b class="font-display text-[15px] font-bold uppercase tracking-[.06em] text-ink">{now().map}</b><span>{stage() === 'ffa' ? 'Deathmatch' : now().mode}</span><span>{now().region}</span>
      </div>
    </nav>

    <main class="min-h-0 flex-1 overflow-auto px-4 py-3.5">
      {/* ═════════ LOBBY ═════════ */}
      <Show when={stage() === 'lobby'}>
        <div class="grid h-full min-h-0 grid-cols-[1.45fr_1fr] gap-3.5">
          <Panel class="flex-row overflow-hidden p-0">
            <div class="relative w-[34%] max-w-[300px] overflow-hidden bg-[radial-gradient(90%_70%_at_50%_30%,rgb(255_70_85/.18),transparent_70%),var(--color-surface-2)] max-[1120px]:hidden">
              <img class="absolute -top-[4%] -left-[10%] w-[120%] max-w-none [mask-image:linear-gradient(180deg,#000_70%,transparent)]" src={lobbyArt() || undefined} alt="" draggable={false} onError={e => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <div class="flex min-w-0 flex-1 flex-col gap-3.5 p-5">
              <span class={kicker}>Ready for matchmaking</span>
              <h1 class="mt-1 flex items-baseline gap-2 font-display text-4xl leading-none font-extrabold">{now().riotId.split('#')[0]}<em class="text-base font-semibold text-muted not-italic">#{now().riotId.split('#')[1] || ''}</em></h1>
              <div class="flex flex-wrap gap-2.5 [&_strong]:block [&_strong]:font-display [&_strong]:text-[17px] [&_strong]:font-bold [&_small]:text-[11.5px] [&_small]:text-muted">
                <div class={`${well} flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5`}><Rank tier={now().tier} size={52} /><div><span class={kicker}>Current rank</span><strong>{now().tier ? rankName(now().tier) : 'Unranked'}</strong>
                  <div class="mt-1.5 flex items-center gap-2"><Bar value={now().rr} color={rankHue(now().tier)} /><small class="whitespace-nowrap">{fmt(now().rr)} / 100 RR</small></div></div></div>
                <Show when={now().peakTier}><div class={`${well} flex min-w-0 flex-1 items-center gap-3 px-3.5 py-2.5`}><Rank tier={now().peakTier} size={40} /><div><span class={kicker}>Peak</span><strong>{rankName(now().peakTier)}</strong><small>{profile.peakAct}</small></div></div></Show>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <Tile label="Win rate" value={`${fmt(recent().winRate, 1)}%`} note={`${recent().wins}W · ${recent().losses}L`} />
                <Tile label="K/D" value={fmt(recent().kd, 2)} />
                <Tile label="HS %" value={`${fmt(recent().hs, 1)}%`} />
                <Tile label="ADR" value={fmt(recent().adr)} />
                <Tile label="ACS" value={fmt(recent().acs)} />
                <Tile label="Impact" value={fmt(recent().impact, 1)} tone="accent" />
              </div>
              <Show when={topAgents().length}>
                <div>
                  <span class={kicker}>Most played</span>
                  <div class="mt-2 grid grid-cols-3 gap-2"><For each={topAgents()}>{a =>
                    <div class={`${well} flex min-w-0 items-center gap-2.5 px-2.5 py-2`}><AgentImg name={a.agent} /><div class="min-w-0"><strong class="block font-display text-sm font-semibold">{a.agent}</strong><small class="block text-[11px] leading-tight text-muted">{a.s.matches} {a.s.matches === 1 ? 'match' : 'matches'}<br />{fmt(a.s.winRate, 0)}% win rate</small></div></div>}
                  </For></div>
                </div>
              </Show>
              <p class={foot}>Last {recent().matches} competitive matches</p>
            </div>
          </Panel>
          <Panel title="Recent matches" kicker={lastDay() ? `Latest session · ${lastDay()!.s.wins}W ${lastDay()!.s.losses}L · ${lastDay()!.rr >= 0 ? '+' : ''}${lastDay()!.rr} RR` : undefined}>
            <Show when={history().length} fallback={<p class={empty}>Match history appears here once your account is linked with Riot Sign-On.</p>}>
              <div class="flex flex-col gap-1.5">
                <For each={history().slice(0, 6)}>{m =>
                  <div class={`${well} relative grid grid-cols-[34px_1fr_auto_70px_48px] items-center gap-3 py-2 pr-2.5 pl-3.5 before:absolute before:inset-y-1.5 before:left-0 before:w-[3px] before:rounded-[2px] ${m.won ? 'before:bg-win' : 'before:bg-loss'}`}>
                    <AgentImg name={m.agent} />
                    <div><strong class="block font-display text-sm font-semibold">{m.map}</strong><small class="text-[11.5px] text-muted">{relTime(m.startedAt)}</small></div>
                    <b class={`font-display text-base font-bold ${m.won ? 'text-win' : 'text-loss'}`}>{m.teamScore}<i class="mx-[3px] text-muted not-italic">:</i>{m.enemyScore}</b>
                    <span class="text-right font-display text-[13px] font-semibold text-ink-2">{m.k}/{m.d}/{m.a}</span>
                    <span class={`rounded-[5px] py-[3px] text-center font-display text-[12.5px] font-bold ${(m.rrChange || 0) > 0 ? 'bg-win/12 text-win' : (m.rrChange || 0) < 0 ? 'bg-loss/12 text-loss' : 'bg-surface-3 text-muted'}`}>{m.rrChange != null ? `${m.rrChange > 0 ? '+' : ''}${m.rrChange}` : '—'}</span>
                  </div>}
                </For>
              </div>
            </Show>
          </Panel>
        </div>
      </Show>

      {/* ═════════ AGENT SELECT ═════════ */}
      <Show when={stage() === 'select'}>
        <div class="grid h-full min-h-0 grid-cols-[1fr_1.3fr] gap-3.5">
          <Panel class="overflow-hidden p-0">
            <div class="relative h-[150px] flex-none overflow-hidden after:absolute after:inset-0 after:bg-linear-to-t after:from-surface after:from-[2%] after:to-surface/20 after:to-70% [@media(max-height:700px)]:h-[110px]">
              <img class="size-full object-cover" src={mapArt() || undefined} alt="" draggable={false} onError={e => { if (!e.currentTarget.src.endsWith(FALLBACK)) e.currentTarget.src = FALLBACK; }} />
              <div class="absolute bottom-2.5 left-[18px] z-1"><span class={kicker}>{mapLocation(now().map) || 'Map'}</span><h2 class="font-display text-[32px] leading-none font-extrabold uppercase tracking-[.04em]">{now().map}</h2></div>
            </div>
            <div class="flex flex-1 flex-col gap-4 px-[18px] pt-3.5 pb-[18px]">
              <div class="flex items-center gap-4">
                <Ring value={mapSum().winRate} color={winLoss(mapSum().winRate)}><b>{fmt(mapSum().winRate, 0)}%</b><small>win</small></Ring>
                <div><span class={kicker}>Your record here</span><strong class={big}>{mapSum().wins}W · {mapSum().losses}L</strong><small class="text-[12.5px] text-muted">{mapSum().matches} competitive matches</small></div>
              </div>
              <div class="grid gap-2.5">
                <div class={sideRow}><span>Attack rounds won</span><Bar value={mapSum().atkWinRate} /><b>{fmt(mapSum().atkWinRate, 0)}%</b></div>
                <div class={sideRow}><span>Defense rounds won</span><Bar value={mapSum().defWinRate} color="var(--color-info)" /><b>{fmt(mapSum().defWinRate, 0)}%</b></div>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <Tile label="K/D" value={fmt(mapSum().kd, 2)} /><Tile label="ACS" value={fmt(mapSum().acs)} /><Tile label="ADR" value={fmt(mapSum().adr)} />
              </div>
            </div>
          </Panel>
          <Panel title={`Your agents on ${now().map}`} kicker={onMap().length >= 3 ? 'From your own match history' : 'Too few matches here · showing all maps'}>
            <Show when={bestAgents().length} fallback={<p class={empty}>No agent history yet.</p>}>
              <div class="flex flex-col gap-2">
                <For each={bestAgents()}>{(a, i) =>
                  <div class={`${well} grid grid-cols-[18px_42px_1.2fr_1.3fr_54px_54px] items-center gap-3 border-l-[3px] px-3 py-2.5`} style={{ 'border-left-color': ROLE_COLOR[agentRole(a.agent)] }}>
                    <span class="font-display text-[13px] font-bold text-muted">{i() + 1}</span>
                    <AgentImg name={a.agent} size="lg" />
                    <div><strong class="block font-display text-base font-bold">{a.agent}</strong><small class="text-[11.5px] text-muted">{agentRole(a.agent)} · {a.s.matches} {a.s.matches === 1 ? 'match' : 'matches'}</small></div>
                    <div class="flex items-center gap-2.5"><Bar value={a.s.winRate} color={winLoss(a.s.winRate)} /><b class="w-10 text-right font-display text-sm font-bold">{fmt(a.s.winRate, 0)}%</b></div>
                    <div class="text-right"><b class="block font-display text-[15px] font-bold">{fmt(a.s.kd, 2)}</b><small class="text-[10px] uppercase tracking-[.1em] text-muted">K/D</small></div>
                    <div class="text-right"><b class="block font-display text-[15px] font-bold">{fmt(a.s.acs)}</b><small class="text-[10px] uppercase tracking-[.1em] text-muted">ACS</small></div>
                  </div>}
                </For>
              </div>
            </Show>
            <p class={foot}>Personal history only. The HUD never shows stats about other players.</p>
          </Panel>
        </div>
      </Show>

      {/* ═════════ LIVE MATCH ═════════ */}
      <Show when={stage() === 'match'}>
        <div class="flex min-h-full flex-col gap-3.5">
          <div class="grid flex-none grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-[10px] border border-line bg-surface px-[22px] py-3 [&_b]:font-display [&_b]:text-5xl [&_b]:leading-none [&_b]:font-extrabold [&_b]:tracking-normal [@media(max-height:700px)]:[&_b]:text-[38px]">
            <div class="flex items-center justify-end gap-4 font-display text-xs font-semibold uppercase tracking-[.14em] text-ink-2"><span>Your team</span><b class="text-win">{now().ally}</b></div>
            <div class="grid justify-items-center border-x border-line px-[22px]"><strong class="font-display text-[17px] font-bold uppercase tracking-[.06em]">Round {now().round}</strong><span class="text-xs text-muted">{now().phase} · {side()}</span></div>
            <div class="flex items-center gap-4 font-display text-xs font-semibold uppercase tracking-[.14em] text-ink-2"><b class="text-loss">{now().enemy}</b><span>Enemy team</span></div>
          </div>
          <div class="grid flex-[1_0_auto] grid-cols-2 gap-3.5 min-[1121px]:grid-cols-[1.15fr_1fr_.85fr]">
            <Panel class="gap-3.5 p-4">
              <div class="flex items-center gap-3.5">
                <AgentImg name={now().agent} size="xl" />
                <div><span class={kicker}>You · {agentRole(now().agent)}</span><strong class={big}>{now().agent}</strong></div>
                <div class="ml-auto flex items-center gap-2 text-right"><Rank tier={now().tier} size={34} /><div><b class="block font-display text-[13px] font-semibold">{now().tier ? rankName(now().tier) : 'Unranked'}</b><small class="text-[11.5px] text-muted">{fmt(now().rr)} RR</small></div></div>
              </div>
              <div class={`${well} flex items-baseline justify-center gap-3 rounded-[10px] p-3.5 font-display text-[56px] leading-none font-extrabold [@media(max-height:700px)]:p-2.5 [@media(max-height:700px)]:text-[42px]`}>
                <b>{now().k}</b><i class="text-3xl text-muted not-italic">/</i><b class="text-loss">{now().d}</b><i class="text-3xl text-muted not-italic">/</i><b>{now().a}</b>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <Tile label="ACS" value={fmt(now().acs)} />
                <Tile label="K/D" value={fmt(liveKd(), 2)} tone={liveKd() >= 1 ? 'up' : 'down'} />
                <Tile label="Credits" value={fmt(now().credits)} />
              </div>
            </Panel>
            <Panel title={`Versus your ${now().agent} average`} kicker={agentSum().matches ? `${agentSum().matches} previous matches` : 'No previous matches'}>
              <Show when={agentSum().matches} fallback={<p class={empty}>{isLive() ? 'Personal averages load from your synced history.' : 'No history on this agent yet.'}</p>}>
                <div class="flex flex-col gap-[18px]">
                  <For each={[
                    { l: 'Combat score', v: now().acs, avg: agentSum().acs, max: 400, d: 0 },
                    { l: 'K/D', v: liveKd(), avg: agentSum().kd, max: 2.5, d: 2 },
                    { l: 'Kills / round', v: now().k / Math.max(1, now().round - 1), avg: agentSum().kpr, max: 1.5, d: 2 },
                  ]}>{c =>
                    <div class="grid gap-[7px]">
                      <div class="flex items-baseline gap-2.5"><span class="flex-1 text-[13px] text-ink-2">{c.l}</span><b class="font-display text-xl font-bold">{fmt(c.v, c.d)}</b>
                        <em class={`min-w-[92px] text-right font-display text-xs font-semibold not-italic ${c.v >= c.avg ? 'text-win' : 'text-loss'}`}>{delta(c.v, c.avg, c.d)} vs avg</em></div>
                      <Bar value={c.v} max={c.max} marker={c.avg} color={c.v >= c.avg ? W : L} />
                      <small class="text-[11px] text-muted">Average {fmt(c.avg, c.d)} · marker</small>
                    </div>}
                  </For>
                </div>
              </Show>
            </Panel>
            <Panel title={`On ${now().map}`} kicker="Your history" class="col-span-2 p-4 min-[1121px]:col-span-1">
              <div class="flex flex-row items-center gap-4 min-[1121px]:flex-col">
                <Ring value={now().mapWR} size={96} color={winLoss(now().mapWR)}><b>{fmt(now().mapWR, 0)}%</b><small>win</small></Ring>
                <div class="grid w-full gap-2 [&>div]:flex [&>div]:justify-between [&>div]:rounded-md [&>div]:bg-bg [&>div]:px-2.5 [&>div]:py-2 [&>div]:text-[12.5px] [&>div]:text-ink-2 [&_b]:font-display [&_b]:text-sm [&_b]:font-bold [&_b]:text-ink">
                  <div><span>Matches</span><b>{fmt(now().mapGames)}</b></div>
                  <div><span>Attack rounds</span><b>{fmt(mapSum().atkWinRate, 0)}%</b></div>
                  <div><span>Defense rounds</span><b>{fmt(mapSum().defWinRate, 0)}%</b></div>
                  <div><span>Last match RR</span><b class={toneCls(now().rrLast)}>{now().rrLast > 0 ? '+' : ''}{fmt(now().rrLast)}</b></div>
                </div>
              </div>
            </Panel>
          </div>
          <Show when={lastDay()}>{d =>
            <div class="flex flex-none items-center gap-[18px] rounded-[10px] border border-line bg-surface px-[18px] py-3 min-[1121px]:gap-7 [&>div]:flex [&>div]:items-baseline [&>div]:gap-1.5 [&_b]:font-display [&_b]:text-[17px] [&_b]:font-bold [&_small]:text-[11.5px] [&_small]:text-muted">
              <span class={`${kicker} mr-auto`}>Latest session</span>
              <div><b>{d().s.wins}W · {d().s.losses}L</b><small>Record</small></div>
              <div><b class={toneCls(d().rr)}>{d().rr > 0 ? '+' : ''}{d().rr}</b><small>RR</small></div>
              <div><b>{fmt(d().s.kd, 2)}</b><small>K/D</small></div>
              <div><b>{fmt(d().s.acs)}</b><small>ACS</small></div>
              <div><b>{Number.isFinite(now().rr) ? 100 - now().rr : '—'}</b><small>RR to next rank</small></div>
            </div>}
          </Show>
        </div>
      </Show>

      {/* ═════════ DEATHMATCH ═════════ */}
      <Show when={stage() === 'ffa'}>
        <div class="grid h-full grid-cols-2 gap-3.5">
          <Panel title="Deathmatch" kicker="Warm-up · first to 40">
            <div class="flex flex-col gap-4">
              <div class="flex items-baseline gap-2.5"><b class="font-display text-7xl leading-none font-extrabold">{isLive() ? now().k : 27}</b><span class="font-display text-[13px] font-semibold uppercase tracking-[.14em] text-muted">kills</span></div>
              <div class="flex items-center gap-3"><Bar value={isLive() ? now().k : 27} max={40} thick /><small class="text-xs whitespace-nowrap text-muted">{40 - (isLive() ? now().k : 27)} to go</small></div>
              <div class="grid grid-cols-3 gap-2">
                <Tile label="Deaths" value={fmt(isLive() ? now().d : 19)} />
                <Tile label="K/D" value={fmt((isLive() ? now().k : 27) / Math.max(1, isLive() ? now().d : 19), 2)} />
                <Tile label="Agent" value={now().agent} />
              </div>
            </div>
          </Panel>
          <Panel title="Aim check" kicker="Your last 20 competitive matches">
            <div class="grid gap-3.5">
              <For each={[['Head', recent().headshots, 'var(--color-gold)'], ['Body', recent().bodyshots, 'var(--color-hit-body)'], ['Legs', recent().legshots, 'var(--color-hit-legs)']] as const}>{([l, n, c]) => {
                const total = recent().headshots + recent().bodyshots + recent().legshots;
                return <div class="grid grid-cols-[60px_1fr_54px] items-center gap-3 text-[12.5px] text-ink-2"><span>{l}</span><Bar value={total ? (n / total) * 100 : 0} color={c} thick /><b class="text-right font-display text-sm font-bold text-ink">{fmt(total ? (n / total) * 100 : NaN, 1)}%</b></div>;
              }}</For>
            </div>
            <p class={foot}>Use warm-up to practise head-level crosshair placement. Your competitive HS% is {fmt(recent().hs, 1)}%.</p>
          </Panel>
        </div>
      </Show>
    </main>

    <footer class="flex flex-none justify-between gap-3 border-t border-line bg-chrome px-4 py-2 text-[11.5px] text-muted [&_kbd]:rounded [&_kbd]:border [&_kbd]:border-line-2 [&_kbd]:px-[5px] [&_kbd]:py-px [&_kbd]:font-display [&_kbd]:text-[10.5px] [&_kbd]:font-semibold [&_kbd]:text-ink-2">
      <span><kbd>Alt</kbd>+<kbd>V</kbd> show / hide HUD</span>
      <span>Personal statistics only · no information about other players</span>
      <span>{isLive() ? 'Live data from your connected client' : 'Sample data · interface preview'}</span>
    </footer>
  </div>;
};
