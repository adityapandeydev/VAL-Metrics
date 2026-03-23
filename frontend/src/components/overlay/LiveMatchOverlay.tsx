import { Component, createSignal, Show, onMount } from 'solid-js';
import { OverlayTelemetryPayload } from '../../types/valorant';
import { fetchLiveOverlayTelemetry } from '../../services/telemetry';

interface Props {
  initialData?: OverlayTelemetryPayload;
}

export const LiveMatchOverlay: Component<Props> = (props) => {
  const [data, setData] = createSignal<OverlayTelemetryPayload | undefined>(props.initialData);
  const [isClickThrough, setIsClickThrough] = createSignal(false);
  const [isSimulated, setIsSimulated] = createSignal(false);

  onMount(async () => {
    if (!data()) {
      const live = await fetchLiveOverlayTelemetry("Vanguard#KILL");
      if (live) setData(live);
    }
  });

  // Invoke native Tauri Win32 IPC command to toggle transparency mouse pass-through
  const toggleClickThrough = async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const newState = !isClickThrough();
      await invoke('toggle_click_through', { enable: newState });
      setIsClickThrough(newState);
    } catch {
      setIsClickThrough(!isClickThrough());
      setIsSimulated(true);
    }
  };

  const setPhase = (newPhase: "BUY_PHASE" | "COMBAT" | "POST_ROUND") => {
    const current = data();
    if (!current) return;
    setData({
      ...current,
      matchState: { ...current.matchState, phase: newPhase }
    });
  };

  return (
    <Show when={data()} fallback={
      <div class="w-full min-h-[400px] flex items-center justify-center p-8 text-val-muted font-tactical text-xl">
        <span>CONNECTING TO SUB-KILOBYTE GO TELEMETRY STREAM...</span>
      </div>
    }>
      {(live) => (
        <div class="w-full h-[90vh] flex flex-col justify-between p-6 select-none font-sans overflow-hidden pointer-events-none">
          
          {/* TOP TOURNAMENT HUD SCORE BAR */}
          <header class="w-full max-w-4xl mx-auto flex items-center justify-between bg-[#0B0E14]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-3 shadow-2xl pointer-events-auto">
            {/* Map & Region Info */}
            <div class="flex items-center gap-3">
              <span class="w-2.5 h-7 rounded-sm bg-val-red shadow-glow-red" />
              <div>
                <h2 class="text-xl font-extrabold tracking-wider text-white font-tactical uppercase">
                  {live().matchState.mapName}
                </h2>
                <p class="text-[10px] text-val-muted uppercase tracking-widest font-bold">
                  {live().matchState.mode} • {live().matchState.serverRegion}
                </p>
              </div>
            </div>

            {/* Live Tournament Score Board */}
            <div class="flex items-center gap-4 bg-black/60 px-6 py-2 rounded-xl border border-white/5 shadow-inner">
              <div class="text-right">
                <span class="text-[10px] text-val-cyan font-bold block">YOUR TEAM (BLUE)</span>
                <span class="text-3xl font-black font-tactical text-val-cyan leading-none">{live().matchState.teamScore}</span>
              </div>
              <div class="text-xl font-black text-slate-600 font-tactical">:</div>
              <div>
                <span class="text-[10px] text-rose-500 font-bold block">ENEMY (RED)</span>
                <span class="text-3xl font-black font-tactical text-rose-500 leading-none">{live().matchState.enemyScore}</span>
              </div>
            </div>

            {/* Round & Game Phase Badge */}
            <div class="flex flex-col items-end">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold uppercase tracking-wider text-val-muted">Round {live().matchState.roundNumber}</span>
                <span class={`text-[11px] font-extrabold px-3 py-1 rounded-md uppercase tracking-wider shadow-md ${
                  live().matchState.phase === 'COMBAT' 
                    ? 'bg-val-red text-white shadow-glow-red' 
                    : live().matchState.phase === 'BUY_PHASE' 
                      ? 'bg-val-cyan text-val-obsidian font-black shadow-glow-cyan' 
                      : 'bg-val-gold text-val-obsidian font-black'
                }`}>
                  {live().matchState.phase.replace('_', ' ')}
                </span>
              </div>
            </div>
          </header>


          {/* BOTTOM PLAYER TACTICAL TELEMETRY TRAY */}
          <footer class="w-full max-w-5xl mx-auto flex items-end justify-between gap-6 pointer-events-auto">
            
            {/* Agent Portrait & Active Combat Score Pill */}
            <div class="flex items-center gap-5 bg-[#0B0E14]/95 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl relative overflow-hidden flex-1">
              <div class="absolute -right-6 -top-6 w-36 h-36 bg-val-cyan/10 rounded-full blur-2xl pointer-events-none" />
              
              <img 
                src={live().playerStats.agentIconUrl} 
                alt={live().playerStats.agentName} 
                class="w-20 h-20 rounded-xl border border-white/10 object-cover shadow-md bg-gradient-to-t from-black to-slate-900" 
              />
              
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="text-2xl font-black font-tactical text-white uppercase tracking-wide">{live().playerStats.agentName}</span>
                  <span class="text-xs px-2.5 py-0.5 rounded bg-white/10 text-val-cyan font-tactical font-bold border border-white/5">
                    {live().playerStats.currentTierName}
                  </span>
                </div>

                <div class="flex items-center gap-6 pt-2 text-xs">
                  <div>
                    <span class="text-[10px] text-val-muted uppercase font-semibold">Live K/D/A</span>
                    <p class="text-2xl font-tactical font-extrabold text-white mt-0.5">
                      {live().playerStats.kills} <span class="text-slate-500 font-normal">/</span> <span class="text-rose-400">{live().playerStats.deaths}</span> <span class="text-slate-500 font-normal">/</span> {live().playerStats.assists}
                    </p>
                  </div>

                  <div class="h-8 w-px bg-white/10" />

                  <div>
                    <span class="text-[10px] text-val-muted uppercase font-semibold">Avg Combat Score</span>
                    <p class="text-2xl font-tactical font-extrabold text-val-cyan mt-0.5">{live().playerStats.combatScore} <span class="text-[10px] font-normal text-val-muted">ACS</span></p>
                  </div>

                  <div class="h-8 w-px bg-white/10" />

                  <div>
                    <span class="text-[10px] text-val-muted uppercase font-semibold">Economy Reserve</span>
                    <p class="text-2xl font-tactical font-extrabold text-val-gold mt-0.5">${live().playerStats.economyCredits.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Rank Progression Rating Badge */}
              <div class="ml-auto text-right bg-black/60 p-4 rounded-xl border border-white/5">
                <span class="text-[10px] font-semibold uppercase text-val-muted block">Projected Act RR</span>
                <span class="text-3xl font-tactical font-extrabold text-val-emerald mt-1 inline-block">
                  +{live().playerStats.rrChangeLastMatch} RR
                </span>
                <span class="text-[10px] text-slate-400 block mt-0.5">Map Win Rate: {live().playerStats.mapWinRate}%</span>
              </div>
            </div>

            {/* Developer & Native Win32 Overlay Controls */}
            <div class="flex flex-col gap-3 bg-[#0B0E14]/90 p-4 rounded-2xl border border-white/10 shadow-2xl text-right shrink-0">
              <span class="text-[11px] font-bold text-val-muted uppercase tracking-wider border-b border-white/10 pb-2">
                ⚡ Overlay Dev Controls
              </span>
              
              {/* Phase Switchers */}
              <div class="flex justify-end gap-1.5">
                <button 
                  onClick={() => setPhase("BUY_PHASE")}
                  class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${live().matchState.phase === 'BUY_PHASE' ? 'bg-val-cyan text-val-obsidian font-black' : 'bg-val-card text-slate-400 hover:text-white'}`}
                >
                  BUY
                </button>
                <button 
                  onClick={() => setPhase("COMBAT")}
                  class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${live().matchState.phase === 'COMBAT' ? 'bg-val-red text-white shadow-glow-red' : 'bg-val-card text-slate-400 hover:text-white'}`}
                >
                  COMBAT
                </button>
                <button 
                  onClick={() => setPhase("POST_ROUND")}
                  class={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${live().matchState.phase === 'POST_ROUND' ? 'bg-val-gold text-val-obsidian font-black' : 'bg-val-card text-slate-400 hover:text-white'}`}
                >
                  END
                </button>
              </div>

              {/* Tauri Native Win32 Click-Through Lock Toggle */}
              <button
                onClick={toggleClickThrough}
                class={`px-4 py-2 rounded-xl font-extrabold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${
                  isClickThrough()
                    ? 'bg-val-emerald text-val-obsidian shadow-[0_0_15px_rgba(16,185,129,0.35)] font-black'
                    : 'bg-val-red text-white hover:bg-val-redHover shadow-glow-red'
                }`}
              >
                <span>{isClickThrough() ? '🔓 GHOST MODE (CLICK-THRU)' : '🔒 LOCK HUD WINDOW'}</span>
                <Show when={isSimulated()}><span class="text-[10px] opacity-75">(WEB SIM)</span></Show>
              </button>
            </div>

          </footer>
        </div>
      )}
    </Show>
  );
};
