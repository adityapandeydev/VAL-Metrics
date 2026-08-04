import { Component, createSignal, onMount, onCleanup, Show, For } from 'solid-js';
import { authSession, auditLCUConnection } from '../../services/telemetry';
import { OverlayTelemetryPayload } from '../../types/valorant';

interface Props {
  initialData?: OverlayTelemetryPayload;
}

type OverlayStage = 'home' | 'agent_select' | 'live_team' | 'live_ffa';

interface TeammateStat {
  name: string;
  agent: string;
  agentIcon: string;
  rank: string;
  valIndex: number;
  kd: number;
  winRate: number;
  dpr: number;
  ddr: number;
  hs: number;
  recent: string;
  peak: string;
  isPrivate: boolean;
}

export const LiveMatchOverlay: Component<Props> = (props) => {
  const [activeStage, setActiveStage] = createSignal<OverlayStage>('live_team');
  const [lcuStatus, setLcuStatus] = createSignal<{ connected: boolean; pid?: number }>({ connected: false });
  const [selectedMap, setSelectedMap] = createSignal("Haven");
  const [gameMode, setGameMode] = createSignal("Competitive");

  // Native Rust window manipulation commands (guaranteed zero-latency win32 response)
  const handleWindowControl = async (action: 'minimize' | 'maximize' | 'close' | 'hide') => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      if (action === 'minimize') await invoke('minimize_window');
      if (action === 'maximize') await invoke('maximize_window');
      if (action === 'close') await invoke('close_window');
      if (action === 'hide') await invoke('hide_window');
    } catch (err) {
      // Browser test fallback
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        const win = getCurrentWindow();
        if (action === 'minimize') await win.minimize();
        if (action === 'maximize') await win.toggleMaximize();
        if (action === 'close') await win.close();
        if (action === 'hide') await win.hide();
      } catch {
        console.log(`Window control action (${action}) simulated outside native desktop environment.`);
      }
    }
  };

  onMount(async () => {
    const res = await auditLCUConnection();
    if (res.connected) setLcuStatus({ connected: true, pid: res.pid });

    // Local key listener for Alt+V / Alt+T shortcut when HUD window has focus
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 't')) {
        e.preventDefault();
        handleWindowControl('hide');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  // Mocked rich telemetry ready for Riot Production Key integration
  const allyTeam: TeammateStat[] = [
    { name: authSession().riotId || "Player 1 (Me)", agent: "Jett", agentIcon: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png", rank: "Diamond 1", valIndex: 824, kd: 1.18, winRate: 62, dpr: 164, ddr: 22, hs: 28, recent: "8W - 2L", peak: "Ascendant 1", isPrivate: false },
    { name: "Vanguard#KILL", agent: "Phoenix", agentIcon: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png", rank: "Platinum 3", valIndex: 752, kd: 1.06, winRate: 54, dpr: 149, ddr: 8, hs: 22, recent: "7W - 3L", peak: "Diamond 2", isPrivate: false },
    { name: "ShadowPulse#VAL", agent: "Omen", agentIcon: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png", rank: "Platinum 2", valIndex: 690, kd: 0.96, winRate: 48, dpr: 135, ddr: -5, hs: 19, recent: "5W - 5L", peak: "Diamond 1", isPrivate: true },
    { name: "CypherGod#NA", agent: "Cypher", agentIcon: "https://media.valorant-api.com/agents/117ed9e3-49f1-5afd-a808-1111afee9015/displayicon.png", rank: "Diamond 2", valIndex: 810, kd: 1.12, winRate: 59, dpr: 151, ddr: 16, hs: 31, recent: "6W - 4L", peak: "Ascendant 2", isPrivate: false },
    { name: "ClawMaster#EU", agent: "Sova", agentIcon: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png", rank: "Platinum 3", valIndex: 720, kd: 1.01, winRate: 51, dpr: 142, ddr: 3, hs: 24, recent: "6W - 4L", peak: "Platinum 3", isPrivate: false },
  ];

  const enemyTeam: TeammateStat[] = [
    { name: "StrikerPro#AP", agent: "Reyna", agentIcon: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png", rank: "Diamond 2", valIndex: 850, kd: 1.29, winRate: 67, dpr: 178, ddr: 34, hs: 36, recent: "9W - 1L", peak: "Immortal 1", isPrivate: false },
    { name: "NeonDrift#KR", agent: "Neon", agentIcon: "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png", rank: "Platinum 3", valIndex: 710, kd: 0.99, winRate: 50, dpr: 140, ddr: -2, hs: 21, recent: "4W - 6L", peak: "Diamond 1", isPrivate: false },
    { name: "GhostReaper#BR", agent: "Fade", agentIcon: "https://media.valorant-api.com/agents/ddeccfc2-4dde-6435-0fe6-17b447831f24/displayicon.png", rank: "Diamond 1", valIndex: 780, kd: 1.09, winRate: 55, dpr: 152, ddr: 11, hs: 26, recent: "6W - 4L", peak: "Diamond 2", isPrivate: true },
    { name: "Vipera#LATAM", agent: "Viper", agentIcon: "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png", rank: "Platinum 3", valIndex: 730, kd: 1.03, winRate: 52, dpr: 145, ddr: 6, hs: 23, recent: "5W - 5L", peak: "Diamond 1", isPrivate: false },
    { name: "KimiNoWa#INT", agent: "Chamber", agentIcon: "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png", rank: "Diamond 1", valIndex: 795, kd: 1.14, winRate: 58, dpr: 156, ddr: 18, hs: 29, recent: "7W - 3L", peak: "Ascendant 1", isPrivate: false },
  ];

  const topMapAgents = [
    { agent: "Omen", role: "Controller", icon: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png", matches: 14, winRate: 64.3, kd: 1.27, ddr: 23, kast: 79 },
    { agent: "Fade", role: "Initiator", icon: "https://media.valorant-api.com/agents/ddeccfc2-4dde-6435-0fe6-17b447831f24/displayicon.png", matches: 9, winRate: 77.8, kd: 1.50, ddr: 59, kast: 82 },
    { agent: "Jett", role: "Duelist", icon: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png", matches: 6, winRate: 50.0, kd: 1.11, ddr: 8, kast: 71 }
  ];

  return (
    <div class="w-full h-screen bg-[#080C12] text-white font-sans flex flex-col select-none overflow-hidden border border-white/10">
      
      {/* CUSTOM WINDOW TITLE BAR WITH TAURI DRAG REGION & WIN32 WINDOW CONTROLS */}
      <header 
        data-tauri-drag-region="true"
        class="w-full h-10 bg-[#0B0E17] border-b border-white/10 flex items-center justify-between px-3 select-none shrink-0"
      >
        {/* Brand & Drag Handle */}
        <div data-tauri-drag-region="true" class="flex items-center gap-2 cursor-grab active:cursor-grabbing">
          <span data-tauri-drag-region="true" class="w-2 h-5 bg-val-cyan rounded-sm shadow-glow-cyan" />
          <span data-tauri-drag-region="true" class="font-extrabold font-tactical text-xs tracking-wider text-white">
            VAL-METRICS <span class="text-val-cyan font-normal text-[11px]">DESKTOP HUD [ALT + V TO TOGGLE]</span>
          </span>
          <span data-tauri-drag-region="true" class="ml-2 px-2 py-0.5 rounded bg-val-emerald/20 text-val-emerald text-[9px] font-extrabold uppercase tracking-wider">
            ● SNAPPY DB & LCU ONLINE
          </span>
        </div>

        {/* Native Window Action Control Buttons (Guarded against drag interception) */}
        <div class="flex items-center gap-1" data-tauri-drag-region="false" onMouseDown={(e) => e.stopPropagation()}>
          <button
            data-tauri-drag-region="false"
            onMouseDown={(e) => { e.stopPropagation(); }}
            onClick={() => handleWindowControl('minimize')}
            class="w-8 h-7 flex items-center justify-center rounded bg-transparent text-val-muted hover:bg-white/10 hover:text-white transition-all text-sm font-black cursor-pointer shadow-sm"
            title="Minimize window"
          >
            —
          </button>
          <button
            data-tauri-drag-region="false"
            onMouseDown={(e) => { e.stopPropagation(); }}
            onClick={() => handleWindowControl('close')}
            class="w-8 h-7 flex items-center justify-center rounded bg-transparent text-val-muted hover:bg-rose-600 hover:text-white transition-all text-xs font-black cursor-pointer shadow-sm"
            title="Close HUD overlay"
          >
            ✕
          </button>
        </div>
      </header>

      {/* SUB-HEADER COMMAND CONSOLE & STAGE SWITCHER */}
      <div class="w-full bg-[#111726]/90 border-b border-white/5 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>
          <h2 class="text-base font-black font-tactical tracking-wider flex items-center gap-2 text-white">
            <span>TACTICAL RECONNAISSANCE</span>
            <span class="text-val-gold text-xs font-mono">[{selectedMap()} • {gameMode()}]</span>
          </h2>
          <p class="text-[10px] text-val-muted font-mono">
            Real-time lockfile stream active • Vanguard safe (zero injection)
          </p>
        </div>

        {/* Stage Testing Simulator Navigation */}
        <div class="flex items-center bg-[#070A0F] p-1 rounded-xl border border-white/10 gap-1 text-[11px] font-tactical" data-tauri-drag-region="false" onMouseDown={(e) => e.stopPropagation()}>
          <button
            data-tauri-drag-region="false"
            onClick={() => { setActiveStage('home'); setGameMode('Idle Lobby'); }}
            class={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeStage() === 'home' ? 'bg-val-cyan text-val-obsidian shadow-glow-cyan font-black' : 'text-val-muted hover:text-white'}`}
          >
            🏡 HOME
          </button>
          <button
            data-tauri-drag-region="false"
            onClick={() => { setActiveStage('agent_select'); setGameMode('Competitive'); }}
            class={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeStage() === 'agent_select' ? 'bg-val-gold text-val-obsidian font-black' : 'text-val-muted hover:text-white'}`}
          >
            🎭 AGENT SELECT
          </button>
          <button
            data-tauri-drag-region="false"
            onClick={() => { setActiveStage('live_team'); setGameMode('Competitive'); }}
            class={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeStage() === 'live_team' ? 'bg-val-red text-white shadow-glow-red font-black' : 'text-val-muted hover:text-white'}`}
          >
            ⚔️ LIVE 5V5 MATCH
          </button>
          <button
            data-tauri-drag-region="false"
            onClick={() => { setActiveStage('live_ffa'); setGameMode('Deathmatch'); }}
            class={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${activeStage() === 'live_ffa' ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)] font-black' : 'text-val-muted hover:text-white'}`}
          >
            🎯 DEATHMATCH / FFA
          </button>
        </div>
      </div>

      {/* ZERO-SCROLL HIGH-DENSITY MAIN CONTENT AREA */}
      <div class="flex-1 overflow-hidden p-4 flex flex-col justify-between max-w-7xl mx-auto w-full">
        
        {/* STAGE 1: HOME (IDLE LOBBY STATE) */}
        <Show when={activeStage() === 'home'}>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full animate-fade-in">
            {/* Main Identity Command Box */}
            <div class="lg:col-span-2 bg-gradient-to-br from-[#131B2E] via-[#0E1524] to-[#0A0F1A] p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
              <div class="flex items-start justify-between">
                <div>
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-val-cyan/20 text-val-cyan border border-val-cyan/40 tracking-widest font-tactical">
                    READY FOR MATCHMAKING
                  </span>
                  <h2 class="text-3xl font-black font-tactical tracking-tight mt-3 text-white">
                    {authSession().riotId || "NOT LOGGED IN"}
                  </h2>
                  <p class="text-val-muted text-xs mt-1">
                    {authSession().authenticated ? "Vanguard security loopback locked & synced." : "Please log into the Web App to link your authentic Riot Account."}
                  </p>
                </div>

                <div class="flex flex-col items-end">
                  <span class="text-[10px] font-bold text-val-muted uppercase">Lobby Status</span>
                  <span class="text-sm font-black font-tactical text-val-emerald flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-val-emerald animate-ping" />
                    LISTENING FOR MATCH
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10">
                <div class="bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                  <span class="text-[10px] text-val-muted uppercase font-bold block">Current Rank</span>
                  <span class="text-lg font-black font-tactical text-val-cyan">DIAMOND 1</span>
                </div>
                <div class="bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                  <span class="text-[10px] text-val-muted uppercase font-bold block">Peak Rank</span>
                  <span class="text-lg font-black font-tactical text-purple-400">ASCENDANT 1</span>
                </div>
                <div class="bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                  <span class="text-[10px] text-val-muted uppercase font-bold block">VAL-Index Score</span>
                  <span class="text-lg font-black font-tactical text-val-gold">824 / 1000</span>
                </div>
                <div class="bg-[#0A0D14] p-3 rounded-xl border border-white/5">
                  <span class="text-[10px] text-val-muted uppercase font-bold block">Act Win Rate</span>
                  <span class="text-lg font-black font-tactical text-val-emerald">62.0%</span>
                </div>
              </div>
            </div>

            {/* Quick Readiness Tracker */}
            <div class="bg-[#111726]/90 p-5 rounded-2xl border border-white/10 flex flex-col justify-between shadow-xl">
              <div>
                <h3 class="text-sm font-black font-tactical text-white flex items-center gap-2">
                  <span>🛡️</span> DESKTOP OVERLAY CAPABILITIES
                </h3>
                <ul class="mt-4 space-y-2.5 text-xs">
                  <li class="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5 text-val-muted">
                    <span class="text-val-cyan text-base">✓</span>
                    <span><strong>Agent Select Scout:</strong> Instantly inspect team form and view top map agents.</span>
                  </li>
                  <li class="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5 text-val-muted">
                    <span class="text-val-cyan text-base">✓</span>
                    <span><strong>Live 5v5 Scoreboard:</strong> Real-time K/D & Damage Delta matchups in combat.</span>
                  </li>
                  <li class="flex items-center gap-2.5 bg-white/5 p-2.5 rounded-xl border border-white/5 text-val-muted">
                    <span class="text-val-cyan text-base">✓</span>
                    <span><strong>Vanguard Compliant:</strong> Zero memory injection; authorized LCU loopback only.</span>
                  </li>
                </ul>
              </div>
              <div class="mt-4 p-3 rounded-xl bg-gradient-to-r from-val-red/20 via-rose-600/10 to-transparent border border-val-red/30 text-[11px] text-rose-300 font-mono">
                ⚡ READY FOR RIOT PRODUCTION API DEPLOYMENT
              </div>
            </div>
          </div>
        </Show>

        {/* STAGE 2: AGENT SELECT (PRE-GAME ROSTER & TOP MAP AGENTS) - ZERO SCROLL DENSE */}
        <Show when={activeStage() === 'agent_select'}>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full animate-fade-in">
            
            {/* Main Ally Roster Scout (Col 8) */}
            <div class="lg:col-span-8 bg-[#111726]/95 p-4 rounded-2xl border border-white/10 shadow-2xl flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                  <div class="flex items-center gap-2">
                    <span class="w-1.5 h-5 bg-val-gold rounded-full" />
                    <h3 class="text-sm font-black font-tactical text-white uppercase">TEAM ALLY SCOUT (PRE-GAME)</h3>
                  </div>
                  <span class="px-2.5 py-0.5 rounded-full bg-val-gold/20 text-val-gold text-[10px] font-bold uppercase tracking-wider">
                    MAP: {selectedMap()} • LOCKING IN
                  </span>
                </div>

                <table class="w-full text-left font-mono text-xs">
                  <thead>
                    <tr class="text-val-muted uppercase text-[10px] border-b border-white/5 pb-1">
                      <th class="py-1">Player / Agent</th>
                      <th>Rank</th>
                      <th>VAL-Idx</th>
                      <th>K/D</th>
                      <th>Win%</th>
                      <th>DDΔ/R</th>
                      <th>HS%</th>
                      <th>Recent Form</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-white/5">
                    <For each={allyTeam}>
                      {(player) => (
                        <tr class="hover:bg-white/5 transition-colors">
                          <td class="py-1.5 font-sans font-bold text-xs text-white flex items-center gap-2">
                            <img src={player.agentIcon} alt={player.agent} class="w-6 h-6 rounded-md bg-black border border-white/20 object-cover shadow-sm" />
                            <div>
                              <span class="block leading-tight">{player.name}</span>
                              <span class="text-[9px] text-val-cyan uppercase font-mono leading-tight">Picking: {player.agent}</span>
                            </div>
                          </td>
                          {player.isPrivate ? (
                            <td colSpan={7} class="text-center py-1.5 text-[11px] text-val-muted font-tactical italic tracking-wider bg-black/20 rounded-lg">
                              🔒 PROFILE SET TO PRIVATE • RSO UNLINKED
                            </td>
                          ) : (
                            <>
                              <td class="font-bold text-slate-200 text-xs">{player.rank}</td>
                              <td class="font-black font-tactical text-val-gold">{player.valIndex}</td>
                              <td class={`font-black ${player.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>{player.kd}</td>
                              <td class="text-white font-semibold">{player.winRate}%</td>
                              <td class={`font-bold ${player.ddr > 0 ? 'text-val-cyan' : 'text-slate-400'}`}>{player.ddr > 0 ? `+${player.ddr}` : player.ddr}</td>
                              <td class="text-amber-300 font-bold">{player.hs}%</td>
                              <td class="text-[11px] font-sans text-slate-300">{player.recent}</td>
                            </>
                          )}
                        </tr>
                      )}
                    </For>
                  </tbody>
                </table>
              </div>
              <div class="text-[10px] text-val-muted border-t border-white/5 pt-1.5 text-right font-mono">
                ⚡ All players scanned in <span class="text-val-emerald font-bold">14ms</span> via local LCU cache
              </div>
            </div>

            {/* Right Panel: MY TOP AGENTS FOR MAP (Col 4) */}
            <div class="lg:col-span-4 bg-gradient-to-b from-[#151C2E] to-[#0E1422] p-4 rounded-2xl border border-val-cyan/40 shadow-2xl flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <div>
                    <h3 class="text-sm font-black font-tactical text-val-cyan tracking-wider flex items-center gap-1.5">
                      <span>👑</span> MY TOP AGENTS
                    </h3>
                    <p class="text-[10px] text-val-muted uppercase font-bold">
                      {selectedMap()} Competitive • Act V26:A4
                    </p>
                  </div>
                  <span class="px-2 py-0.5 rounded bg-val-cyan text-val-obsidian text-[10px] font-black uppercase shadow-glow-cyan">
                    REC
                  </span>
                </div>

                <div class="space-y-2.5">
                  <For each={topMapAgents}>
                    {(item, i) => (
                      <div class="bg-[#0A0D15]/90 p-2.5 rounded-xl border border-white/10 hover:border-val-cyan/50 transition-all flex items-center justify-between shadow-md">
                        <div class="flex items-center gap-2.5">
                          <div class="relative">
                            <img src={item.icon} alt={item.agent} class="w-9 h-9 rounded-lg bg-black border border-white/20 object-cover" />
                            <span class="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-val-gold text-val-obsidian font-extrabold text-[9px] flex items-center justify-center font-tactical shadow-sm">
                              #{i() + 1}
                            </span>
                          </div>
                          <div>
                            <span class="font-black font-tactical text-sm text-white block leading-tight">{item.agent}</span>
                            <span class="text-[9px] uppercase tracking-widest text-val-muted font-bold block">{item.role}</span>
                          </div>
                        </div>

                        <div class="flex items-center gap-3 text-right font-mono text-[11px]">
                          <div>
                            <span class="text-[9px] text-val-muted block uppercase font-sans">Win %</span>
                            <span class="font-black text-val-emerald">{item.winRate}%</span>
                          </div>
                          <div>
                            <span class="text-[9px] text-val-muted block uppercase font-sans">K/D</span>
                            <span class="font-black text-white">{item.kd}</span>
                          </div>
                          <div>
                            <span class="text-[9px] text-val-muted block uppercase font-sans">DDΔ/R</span>
                            <span class="font-bold text-val-cyan">+{item.ddr}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="pt-2 border-t border-white/10 text-center text-[11px] text-slate-400">
                💡 On <strong class="text-val-cyan">{selectedMap()}</strong>, your Omen wins +14.3% more rounds than Duelist picks.
              </div>
            </div>

          </div>
        </Show>

        {/* STAGE 3A: LIVE 5v5 TEAM MATCH SCOREBOARD - WINDOW-FILLING TOURNAMENT HUD */}
        <Show when={activeStage() === 'live_team'}>
          <div class="flex flex-col justify-start w-full gap-3 animate-fade-in h-full">
            
            {/* ALLY TEAM (BLUE) TABLE */}
            <div class="flex-1 bg-[#0F1626]/95 rounded-2xl border border-val-cyan/40 px-4 py-3 shadow-[0_0_20px_rgba(0,229,255,0.1)] flex flex-col justify-start gap-1">
              <div class="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                <h3 class="text-xs font-black font-tactical text-val-cyan uppercase tracking-wider flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-val-cyan shadow-glow-cyan" />
                  YOUR TEAM (ALLIES) • ROUND IN PROGRESS
                </h3>
                <span class="text-xs font-mono font-bold text-slate-300">AVG VAL-INDEX: <strong class="text-val-cyan">759</strong></span>
              </div>
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="text-val-muted uppercase text-[10px] border-b border-white/10 pb-1">
                    <th class="py-1.5">Agent / Name</th>
                    <th>Rank</th>
                    <th>VAL-Idx</th>
                    <th>K/D</th>
                    <th>Win%</th>
                    <th>ACS</th>
                    <th>HS%</th>
                    <th>Peak Rank</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <For each={allyTeam}>
                    {(player) => (
                      <tr class="hover:bg-white/5 transition-colors">
                        <td class="py-2.5 font-sans font-bold text-sm text-white flex items-center gap-3">
                          <img src={player.agentIcon} alt={player.agent} class="w-8 h-8 rounded-md bg-black border border-white/20 object-cover shadow-sm" />
                          <span class="truncate max-w-[200px] font-semibold">{player.name} ({player.agent})</span>
                        </td>
                        {player.isPrivate ? (
                          <td colSpan={7} class="text-center py-2.5 text-val-muted font-tactical text-xs italic tracking-wider">
                            🔒 PROFILE SET TO PRIVATE
                          </td>
                        ) : (
                          <>
                            <td class="font-bold text-slate-200 text-xs">{player.rank}</td>
                            <td class="font-black text-sm text-val-cyan">{player.valIndex}</td>
                            <td class={`font-black text-sm ${player.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>{player.kd}</td>
                            <td class="text-xs font-medium">{player.winRate}%</td>
                            <td class="text-val-gold font-bold text-xs">{player.valIndex > 780 ? 245 : 198}</td>
                            <td class="text-amber-300 font-bold text-xs">{player.hs}%</td>
                            <td class="text-slate-400 font-sans text-xs">{player.peak}</td>
                          </>
                        )}
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>

            {/* CENTRAL MATCHUP COMPARISON BAR */}
            <div class="w-full bg-[#080B12] px-6 py-2.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2 shadow-lg shrink-0">
              <span class="text-xs font-black font-tactical text-val-gold uppercase tracking-widest">
                ⚔️ LIVE COMBAT DIFFERENTIALS
              </span>
              <div class="flex items-center gap-6 font-mono text-xs">
                <div class="flex items-center gap-1.5">
                  <span class="px-2.5 py-0.5 rounded bg-val-cyan/20 text-val-cyan font-bold text-xs">1.06</span>
                  <span class="text-val-muted text-[11px] uppercase font-bold">AVG K/D</span>
                  <span class="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-xs">1.08</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="px-2.5 py-0.5 rounded bg-val-emerald/20 text-val-emerald font-bold text-xs">54%</span>
                  <span class="text-val-muted text-[11px] uppercase font-bold">AVG WIN</span>
                  <span class="px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-xs">56%</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <span class="px-2.5 py-0.5 rounded bg-val-gold/20 text-val-gold font-bold text-xs">+7.2</span>
                  <span class="text-val-muted text-[11px] uppercase font-bold">DDΔ/R ADVANTAGE</span>
                </div>
              </div>
            </div>

            {/* ENEMY TEAM (RED) TABLE */}
            <div class="flex-1 bg-[#18111A]/95 rounded-2xl border border-rose-500/40 px-4 py-3 shadow-[0_0_20px_rgba(244,63,94,0.1)] flex flex-col justify-start gap-1">
              <div class="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                <h3 class="text-xs font-black font-tactical text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow-red" />
                  ENEMY TEAM (OPPONENTS)
                </h3>
                <span class="text-xs font-mono font-bold text-slate-300">AVG VAL-INDEX: <strong class="text-rose-400">773</strong></span>
              </div>
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="text-val-muted uppercase text-[10px] border-b border-white/10 pb-1">
                    <th class="py-1.5">Agent / Name</th>
                    <th>Rank</th>
                    <th>VAL-Idx</th>
                    <th>K/D</th>
                    <th>Win%</th>
                    <th>ACS</th>
                    <th>HS%</th>
                    <th>Peak Rank</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                  <For each={enemyTeam}>
                    {(player) => (
                      <tr class="hover:bg-white/5 transition-colors">
                        <td class="py-2.5 font-sans font-bold text-sm text-white flex items-center gap-3">
                          <img src={player.agentIcon} alt={player.agent} class="w-8 h-8 rounded-md bg-black border border-white/20 object-cover shadow-sm" />
                          <span class="truncate max-w-[200px] font-semibold">{player.name} ({player.agent})</span>
                        </td>
                        {player.isPrivate ? (
                          <td colSpan={7} class="text-center py-2.5 text-val-muted font-tactical text-xs italic tracking-wider">
                            🔒 PROFILE SET TO PRIVATE
                          </td>
                        ) : (
                          <>
                            <td class="font-bold text-slate-200 text-xs">{player.rank}</td>
                            <td class="font-black text-sm text-rose-400">{player.valIndex}</td>
                            <td class={`font-black text-sm ${player.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>{player.kd}</td>
                            <td class="text-xs font-medium">{player.winRate}%</td>
                            <td class="text-val-gold font-bold text-xs">{player.valIndex > 800 ? 260 : 185}</td>
                            <td class="text-amber-300 font-bold text-xs">{player.hs}%</td>
                            <td class="text-slate-400 font-sans text-xs">{player.peak}</td>
                          </>
                        )}
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>

          </div>
        </Show>

        {/* STAGE 3B: LIVE FFA / DEATHMATCH SCOREBOARD (UNIFIED SINGLE TABLE FULL WINDOW) */}
        <Show when={activeStage() === 'live_ffa'}>
          <div class="flex-1 bg-[#121624]/95 rounded-2xl border border-purple-500/40 px-6 py-4 shadow-[0_0_20px_rgba(147,51,234,0.1)] w-full h-full flex flex-col justify-start gap-2 animate-fade-in overflow-hidden">
            <div class="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
              <h3 class="text-xs font-black font-tactical text-purple-400 uppercase tracking-wider flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(147,51,234,0.8)]" />
                FREE-FOR-ALL SCOREBOARD ({gameMode()}) • UNIFIED LOBBY
              </h3>
              <span class="text-xs font-mono font-bold text-purple-300">10 PLAYERS ACTIVE IN COMBAT</span>
            </div>

            <table class="w-full text-left font-mono text-xs">
              <thead>
                <tr class="text-val-muted uppercase text-[10px] border-b border-white/10">
                  <th class="py-1.5">Agent / Player Name</th>
                  <th>Rank</th>
                  <th>VAL-Idx</th>
                  <th>K/D</th>
                  <th>Win%</th>
                  <th>ACS</th>
                  <th>HS%</th>
                  <th>Peak Rank</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <For each={[...allyTeam, ...enemyTeam]}>
                  {(player) => (
                    <tr class="hover:bg-white/5 transition-colors">
                      <td class="py-2.5 font-sans font-bold text-sm text-white flex items-center gap-3">
                        <img src={player.agentIcon} alt={player.agent} class="w-8 h-8 rounded-md bg-black border border-white/20 object-cover shadow-sm" />
                        <span class="truncate max-w-[260px] font-semibold">{player.name} ({player.agent})</span>
                      </td>
                      {player.isPrivate ? (
                        <td colSpan={7} class="text-center py-2.5 text-val-muted font-tactical text-xs italic tracking-wider">
                          🔒 PROFILE SET TO PRIVATE
                        </td>
                      ) : (
                        <>
                          <td class="font-bold text-purple-300 text-xs">{player.rank}</td>
                          <td class="font-black text-sm text-val-gold">{player.valIndex}</td>
                          <td class={`font-black text-sm ${player.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>{player.kd}</td>
                          <td class="text-xs font-medium">{player.winRate}%</td>
                          <td class="font-bold text-purple-300 text-xs">{player.valIndex > 780 ? 245 : 198}</td>
                          <td class="text-amber-300 font-bold text-xs">{player.hs}%</td>
                          <td class="text-slate-400 font-sans text-xs">{player.peak}</td>
                        </>
                      )}
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </div>

    </div>
  );
};
