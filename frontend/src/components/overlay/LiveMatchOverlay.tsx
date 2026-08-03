import { Component, createSignal, onMount, Show, For } from 'solid-js';
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
  const [activeStage, setActiveStage] = createSignal<OverlayStage>('agent_select');
  const [lcuStatus, setLcuStatus] = createSignal<{ connected: boolean; pid?: number }>({ connected: false });
  const [selectedMap, setSelectedMap] = createSignal("Haven");
  const [gameMode, setGameMode] = createSignal("Competitive");

  onMount(async () => {
    const res = await auditLCUConnection();
    if (res.connected) setLcuStatus({ connected: true, pid: res.pid });
  });

  // Native Tauri Win32 IPC window manipulation handlers (minimize, maximize, close)
  const handleWindowControl = async (action: 'minimize' | 'maximize' | 'close') => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const win = getCurrentWindow();
      if (action === 'minimize') await win.minimize();
      if (action === 'maximize') await win.toggleMaximize();
      if (action === 'close') await win.close();
    } catch (err) {
      console.log(`Window control (${action}) is active exclusively inside native Tauri executable.`);
    }
  };

  // Mocked rich telemetry ready for Riot Production Key integration
  const allyTeam: TeammateStat[] = [
    { name: authSession().riotId || "Player 1 (Me)", agent: "Jett", agentIcon: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png", rank: "Diamond 1", valIndex: 824, kd: 1.18, winRate: 62, dpr: 164, ddr: 22, hs: 28, recent: "8W - 2L (2W Strk)", peak: "Ascendant 1", isPrivate: false },
    { name: "Vanguard#KILL", agent: "Phoenix", agentIcon: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png", rank: "Platinum 3", valIndex: 752, kd: 1.06, winRate: 54, dpr: 149, ddr: 8, hs: 22, recent: "7W - 3L (1L Strk)", peak: "Diamond 2", isPrivate: false },
    { name: "ShadowPulse#VAL", agent: "Omen", agentIcon: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png", rank: "Platinum 2", valIndex: 690, kd: 0.96, winRate: 48, dpr: 135, ddr: -5, hs: 19, recent: "5W - 5L (2L Strk)", peak: "Diamond 1", isPrivate: true },
    { name: "CypherGod#NA", agent: "Cypher", agentIcon: "https://media.valorant-api.com/agents/117ed9e3-49f1-5afd-a808-1111afee9015/displayicon.png", rank: "Diamond 2", valIndex: 810, kd: 1.12, winRate: 59, dpr: 151, ddr: 16, hs: 31, recent: "6W - 4L (3W Strk)", peak: "Ascendant 2", isPrivate: false },
    { name: "ClawMaster#EU", agent: "Sova", agentIcon: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png", rank: "Platinum 3", valIndex: 720, kd: 1.01, winRate: 51, dpr: 142, ddr: 3, hs: 24, recent: "6W - 4L (1W Strk)", peak: "Platinum 3", isPrivate: false },
  ];

  const enemyTeam: TeammateStat[] = [
    { name: "StrikerPro#AP", agent: "Reyna", agentIcon: "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png", rank: "Diamond 2", valIndex: 850, kd: 1.29, winRate: 67, dpr: 178, ddr: 34, hs: 36, recent: "9W - 1L (5W Strk)", peak: "Immortal 1", isPrivate: false },
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
    <div class="w-full min-h-screen bg-[#080C12] text-white font-sans flex flex-col select-none overflow-hidden border border-white/10">
      
      {/* CUSTOM WINDOW TITLE BAR WITH TAURI DRAG REGION & WIN32 WINDOW CONTROLS */}
      <header 
        data-tauri-drag-region="true"
        class="w-full h-12 bg-[#0B0E17] border-b border-white/10 flex items-center justify-between px-4 select-none shrink-0"
      >
        {/* Brand & Drag Handle */}
        <div data-tauri-drag-region="true" class="flex items-center gap-2.5 cursor-grab active:cursor-grabbing">
          <span data-tauri-drag-region="true" class="w-2.5 h-6 bg-val-cyan rounded-sm shadow-glow-cyan" />
          <span data-tauri-drag-region="true" class="font-extrabold font-tactical text-sm tracking-wider text-white">
            VAL-METRICS <span class="text-val-cyan font-normal text-xs">DESKTOP HUD (ALT + V TO HIDE)</span>
          </span>
          <span data-tauri-drag-region="true" class="ml-2 px-2 py-0.5 rounded bg-val-emerald/20 text-val-emerald text-[10px] font-bold uppercase tracking-wider">
            ● SNAPPY DB & LCU ONLINE
          </span>
        </div>

        {/* Native Window Action Control Buttons (Minimize, Maximize, Close) */}
        <div class="flex items-center gap-1">
          <button
            data-tauri-drag-region="false"
            onClick={() => handleWindowControl('minimize')}
            class="w-9 h-8 flex items-center justify-center rounded text-val-muted hover:bg-white/10 hover:text-white transition-all text-sm font-black cursor-pointer"
            title="Minimize window"
          >
            —
          </button>
          <button
            data-tauri-drag-region="false"
            onClick={() => handleWindowControl('maximize')}
            class="w-9 h-8 flex items-center justify-center rounded text-val-muted hover:bg-white/10 hover:text-white transition-all text-sm font-black cursor-pointer"
            title="Maximize or Restore window"
          >
            🗖
          </button>
          <button
            data-tauri-drag-region="false"
            onClick={() => handleWindowControl('close')}
            class="w-9 h-8 flex items-center justify-center rounded text-val-muted hover:bg-rose-600 hover:text-white transition-all text-sm font-bold cursor-pointer"
            title="Close HUD overlay"
          >
            ✕
          </button>
        </div>
      </header>

      {/* SUB-HEADER COMMAND CONSOLE & STAGE SWITCHER */}
      <div class="w-full bg-[#111726]/90 border-b border-white/5 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
        <div>
          <h2 class="text-xl font-black font-tactical tracking-wider flex items-center gap-2 text-white">
            <span>TACTICAL RECONNAISSANCE</span>
            <span class="text-val-gold text-sm font-mono">[{selectedMap()} • {gameMode()}]</span>
          </h2>
          <p class="text-xs text-val-muted font-mono mt-0.5">
            Real-time lockfile stream active • Vanguard safe (zero injection)
          </p>
        </div>

        {/* Stage Testing Simulator Navigation (Allows testing all in-game designs without Production Key!) */}
        <div class="flex flex-wrap items-center bg-[#070A0F] p-1.5 rounded-xl border border-white/10 gap-1 text-xs font-tactical">
          <button
            data-tauri-drag-region="false"
            onClick={() => { setActiveStage('home'); setGameMode('Idle Lobby'); }}
            class={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${activeStage() === 'home' ? 'bg-val-cyan text-val-obsidian shadow-glow-cyan font-black' : 'text-val-muted hover:text-white'}`}
          >
            🏡 HOME (LOBBY)
          </button>
          <button
            data-tauri-drag-region="false"
            onClick={() => { setActiveStage('agent_select'); setGameMode('Competitive'); }}
            class={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${activeStage() === 'agent_select' ? 'bg-val-gold text-val-obsidian font-black' : 'text-val-muted hover:text-white'}`}
          >
            🎭 AGENT SELECT
          </button>
          <button
            data-tauri-drag-region="false"
            onClick={() => { setActiveStage('live_team'); setGameMode('Competitive'); }}
            class={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${activeStage() === 'live_team' ? 'bg-val-red text-white shadow-glow-red font-black' : 'text-val-muted hover:text-white'}`}
          >
            ⚔️ LIVE 5V5 MATCH
          </button>
          <button
            data-tauri-drag-region="false"
            onClick={() => { setActiveStage('live_ffa'); setGameMode('Deathmatch'); }}
            class={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${activeStage() === 'live_ffa' ? 'bg-purple-600 text-white shadow-[0_0_12px_rgba(147,51,234,0.5)] font-black' : 'text-val-muted hover:text-white'}`}
          >
            🎯 DEATHMATCH / FFA
          </button>
        </div>
      </div>

      {/* SCROLLABLE MAIN CONTENT AREA */}
      <div class="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* STAGE 1: HOME (IDLE LOBBY STATE) */}
        <Show when={activeStage() === 'home'}>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in max-w-7xl mx-auto">
            {/* Main Identity Command Box */}
            <div class="lg:col-span-2 bg-gradient-to-br from-[#131B2E] via-[#0E1524] to-[#0A0F1A] p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[380px]">
              <div class="absolute top-0 right-0 w-64 h-64 bg-val-cyan/5 rounded-full blur-3xl pointer-events-none" />
              
              <div class="flex items-start justify-between">
                <div>
                  <span class="px-3 py-1 rounded-full text-xs font-black bg-val-cyan/20 text-val-cyan border border-val-cyan/40 tracking-widest font-tactical">
                    READY FOR MATCHMAKING
                  </span>
                  <h2 class="text-3xl md:text-5xl font-black font-tactical tracking-tight mt-4 text-white">
                    {authSession().riotId || "NOT LOGGED IN"}
                  </h2>
                  <p class="text-val-muted text-sm mt-1">
                    {authSession().authenticated ? "Vanguard security loopback locked & synced." : "Please log into the Web App to link your authentic Riot Account."}
                  </p>
                </div>

                <div class="flex flex-col items-end">
                  <span class="text-[11px] font-bold text-val-muted uppercase">Lobby Status</span>
                  <span class="text-xl font-black font-tactical text-val-emerald flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-val-emerald animate-ping" />
                    LISTENING FOR MATCH
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
                <div class="bg-[#0A0D14] p-4 rounded-2xl border border-white/5">
                  <span class="text-xs text-val-muted uppercase font-bold block">Current Rank</span>
                  <span class="text-2xl font-black font-tactical text-val-cyan">DIAMOND 1</span>
                </div>
                <div class="bg-[#0A0D14] p-4 rounded-2xl border border-white/5">
                  <span class="text-xs text-val-muted uppercase font-bold block">Peak Rank</span>
                  <span class="text-2xl font-black font-tactical text-purple-400">ASCENDANT 1</span>
                </div>
                <div class="bg-[#0A0D14] p-4 rounded-2xl border border-white/5">
                  <span class="text-xs text-val-muted uppercase font-bold block">VAL-Index Score</span>
                  <span class="text-2xl font-black font-tactical text-val-gold">824 / 1000</span>
                </div>
                <div class="bg-[#0A0D14] p-4 rounded-2xl border border-white/5">
                  <span class="text-xs text-val-muted uppercase font-bold block">Act Win Rate</span>
                  <span class="text-2xl font-black font-tactical text-val-emerald">62.0%</span>
                </div>
              </div>
            </div>

            {/* Quick Readiness Tracker */}
            <div class="bg-[#111726]/90 p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-xl">
              <div>
                <h3 class="text-lg font-bold font-tactical text-white flex items-center gap-2">
                  <span>🛡️</span> DESKTOP OVERLAY CAPABILITIES
                </h3>
                <ul class="mt-6 space-y-4 text-sm">
                  <li class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 text-val-muted">
                    <span class="text-val-cyan text-lg">✓</span>
                    <span><strong>Agent Select Scout:</strong> Instantly inspect team form and view your best map agents.</span>
                  </li>
                  <li class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 text-val-muted">
                    <span class="text-val-cyan text-lg">✓</span>
                    <span><strong>Live 5v5 Scoreboard:</strong> Real-time K/D & Damage Delta matchups in combat.</span>
                  </li>
                  <li class="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 text-val-muted">
                    <span class="text-val-cyan text-lg">✓</span>
                    <span><strong>Vanguard Compliant:</strong> Zero memory injection; operates via authorized LCU loopback.</span>
                  </li>
                </ul>
              </div>
              <div class="mt-6 p-4 rounded-xl bg-gradient-to-r from-val-red/20 via-rose-600/10 to-transparent border border-val-red/30 text-xs text-rose-300 font-mono">
                ⚡ READY FOR RIOT PRODUCTION API DEPLOYMENT
              </div>
            </div>
          </div>
        </Show>

        {/* STAGE 2: AGENT SELECT (PRE-GAME ROSTER & TOP MAP AGENTS) */}
        <Show when={activeStage() === 'agent_select'}>
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in max-w-7xl mx-auto">
            
            {/* Main Ally Roster Scout (Col 8) */}
            <div class="lg:col-span-8 bg-[#111726]/95 p-6 rounded-3xl border border-white/10 shadow-2xl overflow-x-auto">
              <div class="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-6 bg-val-gold rounded-full" />
                  <h3 class="text-lg font-black font-tactical text-white uppercase">TEAM ALLY SCOUT (PRE-GAME)</h3>
                </div>
                <span class="px-3 py-1 rounded-full bg-val-gold/20 text-val-gold text-xs font-bold uppercase tracking-wider">
                  MAP: {selectedMap()} • LOCKING IN
                </span>
              </div>

              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="text-val-muted uppercase text-[11px] border-b border-white/5 pb-2">
                    <th class="py-2">Player / Agent</th>
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
                        <td class="py-3.5 font-sans font-bold text-sm text-white flex items-center gap-3">
                          <img src={player.agentIcon} alt={player.agent} class="w-9 h-9 rounded-xl bg-black border border-white/20 object-cover shadow-sm" />
                          <div>
                            <span class="block">{player.name}</span>
                            <span class="text-[10px] text-val-cyan uppercase font-mono font-normal">Picking: {player.agent}</span>
                          </div>
                        </td>
                        {player.isPrivate ? (
                          <td colSpan={7} class="text-center py-3 text-val-muted font-tactical italic tracking-wider bg-black/20 rounded-lg">
                            🔒 PROFILE SET TO PRIVATE • RSO UNLINKED
                          </td>
                        ) : (
                          <>
                            <td class="font-bold text-slate-200">{player.rank}</td>
                            <td class="font-black font-tactical text-val-gold">{player.valIndex}</td>
                            <td class={`font-black ${player.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>{player.kd}</td>
                            <td class="text-white font-semibold">{player.winRate}%</td>
                            <td class={`font-bold ${player.ddr > 0 ? 'text-val-cyan' : 'text-slate-400'}`}>{player.ddr > 0 ? `+${player.ddr}` : player.ddr}</td>
                            <td class="text-amber-300 font-bold">{player.hs}%</td>
                            <td class="text-xs font-sans text-slate-300">{player.recent}</td>
                          </>
                        )}
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>

            {/* Right Panel: MY TOP AGENTS FOR MAP (Col 4) */}
            <div class="lg:col-span-4 bg-gradient-to-b from-[#151C2E] to-[#0E1422] p-6 rounded-3xl border border-val-cyan/40 shadow-2xl flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 class="text-lg font-black font-tactical text-val-cyan tracking-wider flex items-center gap-1.5">
                      <span>👑</span> MY TOP AGENTS
                    </h3>
                    <p class="text-[11px] text-val-muted uppercase font-bold">
                      {selectedMap()} Competitive Stats • Act V26:A4
                    </p>
                  </div>
                  <span class="px-2.5 py-1 rounded bg-val-cyan text-val-obsidian text-xs font-black uppercase shadow-glow-cyan">
                    REC
                  </span>
                </div>

                <div class="mt-4 space-y-3">
                  <For each={topMapAgents}>
                    {(item, i) => (
                      <div class="bg-[#0A0D15]/90 p-3.5 rounded-2xl border border-white/10 hover:border-val-cyan/50 transition-all flex items-center justify-between shadow-lg">
                        <div class="flex items-center gap-3">
                          <div class="relative">
                            <img src={item.icon} alt={item.agent} class="w-12 h-12 rounded-xl bg-black border border-white/20 object-cover" />
                            <span class="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-val-gold text-val-obsidian font-extrabold text-[10px] flex items-center justify-center font-tactical shadow-sm">
                              #{i() + 1}
                            </span>
                          </div>
                          <div>
                            <span class="font-black font-tactical text-base text-white block">{item.agent}</span>
                            <span class="text-[10px] uppercase tracking-widest text-val-muted font-bold block">{item.role}</span>
                          </div>
                        </div>

                        <div class="flex items-center gap-4 text-right font-mono text-xs">
                          <div>
                            <span class="text-[10px] text-val-muted block uppercase font-sans">Win %</span>
                            <span class="font-black text-val-emerald">{item.winRate}%</span>
                          </div>
                          <div>
                            <span class="text-[10px] text-val-muted block uppercase font-sans">K/D</span>
                            <span class="font-black text-white">{item.kd}</span>
                          </div>
                          <div>
                            <span class="text-[10px] text-val-muted block uppercase font-sans">DDΔ/R</span>
                            <span class="font-bold text-val-cyan">+{item.ddr}</span>
                          </div>
                          <div class="hidden sm:block">
                            <span class="text-[10px] text-val-muted block uppercase font-sans">KAST</span>
                            <span class="font-black text-val-gold">{item.kast}%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </div>

              <div class="mt-6 pt-4 border-t border-white/10 text-center">
                <p class="text-xs text-slate-400">
                  💡 <strong class="text-white">Tactical Advice:</strong> On <strong class="text-val-cyan">{selectedMap()}</strong>, your Controller impact (Omen) outpaces Duelist win rates by +14.3%.
                </p>
              </div>
            </div>

          </div>
        </Show>

        {/* STAGE 3A: LIVE 5v5 TEAM MATCH SCOREBOARD */}
        <Show when={activeStage() === 'live_team'}>
          <div class="flex flex-col gap-5 animate-fade-in max-w-7xl mx-auto w-full">
            
            {/* ALLY TEAM (BLUE) TABLE */}
            <div class="bg-[#0F1626]/95 rounded-3xl border border-val-cyan/40 p-6 shadow-[0_0_25px_rgba(0,229,255,0.1)] overflow-x-auto">
              <div class="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                <h3 class="text-base font-black font-tactical text-val-cyan uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-val-cyan shadow-glow-cyan" />
                  YOUR TEAM (ALLIES) • ROUND IN PROGRESS
                </h3>
                <span class="text-xs font-mono font-bold text-slate-300">AVG VAL-INDEX: <strong class="text-val-cyan">759</strong></span>
              </div>
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="text-val-muted uppercase text-[11px] border-b border-white/5 pb-2">
                    <th class="py-2">Agent / Name</th>
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
                        <td class="py-3 font-sans font-bold text-sm text-white flex items-center gap-3">
                          <img src={player.agentIcon} alt={player.agent} class="w-9 h-9 rounded-lg bg-black border border-white/20 object-cover" />
                          <span>{player.name} ({player.agent})</span>
                        </td>
                        {player.isPrivate ? (
                          <td colSpan={7} class="text-center py-2 text-val-muted font-tactical italic tracking-wider">
                            🔒 PROFILE SET TO PRIVATE
                          </td>
                        ) : (
                          <>
                            <td class="font-bold text-slate-200">{player.rank}</td>
                            <td class="font-black text-val-cyan">{player.valIndex}</td>
                            <td class={`font-black ${player.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>{player.kd}</td>
                            <td>{player.winRate}%</td>
                            <td class="text-val-gold font-bold">{player.valIndex > 780 ? 245 : 198}</td>
                            <td class="text-amber-300">{player.hs}%</td>
                            <td class="text-slate-400 font-sans">{player.peak}</td>
                          </>
                        )}
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>

            {/* CENTRAL MATCHUP COMPARISON BAR */}
            <div class="w-full bg-[#080B12] px-8 py-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-xl">
              <span class="text-sm font-black font-tactical text-val-gold uppercase tracking-widest">
                ⚔️ LIVE COMBAT DIFFERENTIALS
              </span>
              <div class="flex items-center gap-8 font-mono text-sm">
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded bg-val-cyan/20 text-val-cyan font-bold">1.06</span>
                  <span class="text-val-muted text-xs uppercase font-bold">AVG K/D</span>
                  <span class="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold">1.08</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded bg-val-emerald/20 text-val-emerald font-bold">54%</span>
                  <span class="text-val-muted text-xs uppercase font-bold">AVG WIN RATE</span>
                  <span class="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 font-bold">56%</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded bg-val-gold/20 text-val-gold font-bold">+7.2</span>
                  <span class="text-val-muted text-xs uppercase font-bold">DDΔ/R ADVANTAGE</span>
                  <span class="text-sm font-bold text-slate-500">—</span>
                </div>
              </div>
            </div>

            {/* ENEMY TEAM (RED) TABLE */}
            <div class="bg-[#18111A]/95 rounded-3xl border border-rose-500/40 p-6 shadow-[0_0_25px_rgba(244,63,94,0.1)] overflow-x-auto">
              <div class="flex items-center justify-between mb-3 pb-3 border-b border-white/10">
                <h3 class="text-base font-black font-tactical text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-glow-red" />
                  ENEMY TEAM (OPPONENTS)
                </h3>
                <span class="text-xs font-mono font-bold text-slate-300">AVG VAL-INDEX: <strong class="text-rose-400">773</strong></span>
              </div>
              <table class="w-full text-left font-mono text-xs">
                <thead>
                  <tr class="text-val-muted uppercase text-[11px] border-b border-white/5 pb-2">
                    <th class="py-2">Agent / Name</th>
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
                        <td class="py-3 font-sans font-bold text-sm text-white flex items-center gap-3">
                          <img src={player.agentIcon} alt={player.agent} class="w-9 h-9 rounded-lg bg-black border border-white/20 object-cover" />
                          <span>{player.name} ({player.agent})</span>
                        </td>
                        {player.isPrivate ? (
                          <td colSpan={7} class="text-center py-2 text-val-muted font-tactical italic tracking-wider">
                            🔒 PROFILE SET TO PRIVATE
                          </td>
                        ) : (
                          <>
                            <td class="font-bold text-slate-200">{player.rank}</td>
                            <td class="font-black text-rose-400">{player.valIndex}</td>
                            <td class={`font-black ${player.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>{player.kd}</td>
                            <td>{player.winRate}%</td>
                            <td class="text-val-gold font-bold">{player.valIndex > 800 ? 260 : 185}</td>
                            <td class="text-amber-300">{player.hs}%</td>
                            <td class="text-slate-400 font-sans">{player.peak}</td>
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

        {/* STAGE 3B: LIVE FFA / DEATHMATCH SCOREBOARD (UNIFIED NO TEAMS) */}
        <Show when={activeStage() === 'live_ffa'}>
          <div class="max-w-6xl mx-auto w-full bg-[#121624]/95 p-8 rounded-3xl border border-purple-500/40 shadow-[0_0_30px_rgba(147,51,234,0.15)] animate-fade-in overflow-x-auto">
            <div class="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div>
                <h3 class="text-xl font-black font-tactical text-purple-400 tracking-wider uppercase flex items-center gap-2.5">
                  <span>🎯</span> FREE-FOR-ALL SCOREBOARD ({gameMode()})
                </h3>
                <p class="text-xs text-val-muted uppercase font-bold mt-1">
                  No team segregation in Deathmatch & Escalation • Real-time Marksmanship
                </p>
              </div>
              <span class="px-3.5 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-tactical font-black text-xs">
                10 PLAYERS IN LOBBY
              </span>
            </div>

            <table class="w-full text-left font-mono text-sm">
              <thead>
                <tr class="text-val-muted uppercase text-xs border-b border-white/10 pb-3">
                  <th class="py-2.5">Rank / Agent</th>
                  <th>Player ID</th>
                  <th>VAL-Index</th>
                  <th>K/D</th>
                  <th>Win %</th>
                  <th>ACS</th>
                  <th>HS %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <For each={[...allyTeam, ...enemyTeam]}>
                  {(player, index) => (
                    <tr class="hover:bg-white/5 transition-colors">
                      <td class="py-3.5 font-sans font-bold text-sm text-white flex items-center gap-3">
                        <img src={player.agentIcon} alt={player.agent} class="w-10 h-10 rounded-xl bg-black border border-white/20 object-cover" />
                        <div>
                          <span class="block font-black text-purple-300">{player.rank}</span>
                          <span class="text-[11px] text-val-muted uppercase font-mono">{player.agent}</span>
                        </div>
                      </td>
                      <td class="font-bold text-white">{player.name}</td>
                      {player.isPrivate ? (
                        <td colSpan={6} class="text-center py-3.5 text-val-muted font-tactical italic tracking-wider bg-black/30 rounded-lg">
                          🔒 PROFILE SET TO PRIVATE
                        </td>
                      ) : (
                        <>
                          <td class="font-black font-tactical text-val-gold">{player.valIndex}</td>
                          <td class={`font-black ${player.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>{player.kd}</td>
                          <td class="text-slate-200">{player.winRate}%</td>
                          <td class="font-bold text-purple-300">{200 + index() * 15}</td>
                          <td class="font-black text-amber-400">{player.hs}%</td>
                          <td>
                            <span class="px-2.5 py-1 rounded bg-val-emerald/20 text-val-emerald text-xs font-bold uppercase">
                              VERIFIED
                            </span>
                          </td>
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
