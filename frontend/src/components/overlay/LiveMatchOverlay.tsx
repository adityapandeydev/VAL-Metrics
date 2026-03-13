import { createSignal, createEffect, onMount, onCleanup, Show, Component } from "solid-js";
import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { OverlayTelemetryPayload } from "../../types/valorant";

export const LiveMatchOverlay: Component = () => {
  // --- Zero VDOM Reactive Signals ---
  const [telemetry, setTelemetry] = createSignal<OverlayTelemetryPayload | null>(null);
  const [isClickThrough, setIsClickThrough] = createSignal<boolean>(true);
  const [connectionStatus, setConnectionStatus] = createSignal<"CONNECTED" | "SYNCING" | "OFFLINE">("SYNCING");
  let unlistenTelemetry: UnlistenFn | undefined;
  let unlistenStatus: UnlistenFn | undefined;

  onMount(async () => {
    try {
      // 1. Listen for real-time sub-kilobyte telemetry updates from Go Backend / Tauri IPC
      unlistenTelemetry = await listen<OverlayTelemetryPayload>("valorant-telemetry-tick", (event) => {
        setTelemetry(event.payload);
        setConnectionStatus("CONNECTED");
      });

      // 2. Listen for hardware global hotkey (Alt+X) click-through mode flips from Rust
      unlistenStatus = await listen<boolean>("click-through-status-changed", (event) => {
        setIsClickThrough(event.payload);
      });
    } catch (e) {
      console.info("Running in Web Preview Mode (non-Tauri environment):", e);
    }

    // Seed mock initial state for immediate browser & desktop development testing
    setTelemetry({
      timestamp: Date.now(),
      matchState: {
        matchId: "VAL-AP-992184",
        mapName: "Ascent",
        mode: "Competitive",
        serverRegion: "AP - Mumbai",
        playerTeam: "BLUE",
        teamScore: 9,
        enemyScore: 7,
        roundNumber: 17,
        phase: "COMBAT"
      },
      playerStats: {
        puuid: "4b56445b-670f-46ab-977d-dfc4a90f2f46",
        riotId: "Vanguard#KILL",
        agentName: "Jett",
        agentIconUrl: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e68d520de472/displayicon.png",
        kills: 18,
        deaths: 11,
        assists: 4,
        kdRatio: 1.64,
        combatScore: 285,
        economyCredits: 4200,
        currentTierName: "Immortal 1",
        currentTierIconUrl: "https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/24/largeicon.png",
        rankingRating: 78,
        rrChangeLastMatch: 22,
        mapWinRate: 68.4,
        historicalMatchesOnMap: 41
      }
    });
  });

  onCleanup(() => {
    if (unlistenTelemetry) unlistenTelemetry();
    if (unlistenStatus) unlistenStatus();
  });

  // Toggle mode via user click when in interactive state
  const handleToggleMode = async () => {
    try {
      const nextState = !isClickThrough();
      await invoke("toggle_click_through", { enable: nextState });
      setIsClickThrough(nextState);
    } catch (err) {
      console.warn("Tauri native invoke not found (Web preview fallback):", err);
      setIsClickThrough(!isClickThrough());
    }
  };

  return (
    <div 
      class="select-none font-mono text-white antialiased transition-all duration-200"
      style={{
        width: "380px",
        "background-color": isClickThrough() ? "rgba(11, 15, 23, 0.78)" : "rgba(15, 20, 30, 0.94)",
        "backdrop-filter": "blur(12px)",
        border: isClickThrough() ? "1px solid rgba(0, 255, 135, 0.25)" : "1px solid rgba(0, 229, 255, 0.85)",
        "border-radius": "10px",
        "box-shadow": isClickThrough() ? "0 4px 24px rgba(0, 0, 0, 0.6)" : "0 0 25px rgba(0, 229, 255, 0.25)",
        overflow: "hidden"
      }}
    >
      {/* --- Overlay Header & Mode Banner --- */}
      <div 
        class="flex items-center justify-between px-3 py-1.5 text-xs font-semibold tracking-wider"
        style={{
          background: isClickThrough() 
            ? "linear-gradient(90deg, rgba(16, 185, 129, 0.2) 0%, rgba(0,0,0,0) 100%)" 
            : "linear-gradient(90deg, rgba(0, 229, 255, 0.35) 0%, rgba(0, 100, 255, 0.2) 100%)",
          "border-bottom": "1px solid rgba(255,255,255,0.08)"
        }}
      >
        <div class="flex items-center space-x-2">
          <span 
            class="inline-block h-2 w-2 rounded-full animate-pulse" 
            style={{ "background-color": isClickThrough() ? "#00FF87" : "#00E5FF" }} 
          />
          <span class="uppercase tracking-widest text-[10px] text-zinc-300">
            {isClickThrough() ? "GHOST OVERLAY [ALT+X TO UNLOCK]" : "INTERACTIVE HUD [UNLOCKED]"}
          </span>
        </div>
        <Show when={!isClickThrough()}>
          <button 
            onClick={handleToggleMode}
            class="cursor-pointer rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] text-cyan-300 hover:bg-cyan-500/40 transition"
          >
            LOCK
          </button>
        </Show>
      </div>

      {/* --- Live Telemetry Content --- */}
      <Show when={telemetry()} fallback={<div class="p-4 text-center text-xs text-zinc-400">Waiting for Go telemetry stream...</div>}>
        {(data) => (
          <div class="p-3 space-y-3">
            {/* Match Info & Score Bar */}
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2.5">
                <div class="relative h-10 w-10 overflow-hidden rounded border border-zinc-700 bg-zinc-800/80">
                  <img src={data().playerStats.agentIconUrl} alt="Agent" class="h-full w-full object-cover scale-110" />
                </div>
                <div>
                  <div class="flex items-center space-x-1.5">
                    <span class="font-bold text-sm text-zinc-100">{data().playerStats.agentName}</span>
                    <span class="text-[11px] text-zinc-400">({data().playerStats.riotId})</span>
                  </div>
                  <div class="text-[10px] text-emerald-400 font-medium">
                    {data().matchState.mapName} • {data().matchState.mode} • R{data().matchState.roundNumber}
                  </div>
                </div>
              </div>

              {/* Live Match Scoreboard Tag */}
              <div class="flex flex-col items-end">
                <div class="flex items-center space-x-1.5 rounded bg-zinc-900/90 px-2 py-1 border border-zinc-700/60">
                  <span class="text-cyan-400 font-extrabold text-sm">{data().matchState.teamScore}</span>
                  <span class="text-zinc-500 text-xs">:</span>
                  <span class="text-rose-500 font-extrabold text-sm">{data().matchState.enemyScore}</span>
                </div>
                <span class="text-[9px] text-zinc-400 uppercase mt-0.5">{data().matchState.phase.replace("_", " ")}</span>
              </div>
            </div>

            {/* Tactical Metrics Grid (K/D, Map Win Rate, Combat Score) */}
            <div class="grid grid-cols-3 gap-2 py-1">
              {/* K/D Metric */}
              <div class="rounded-lg bg-zinc-900/60 p-2 border border-zinc-800/80 flex flex-col items-center justify-center">
                <span class="text-[9px] text-zinc-400 uppercase font-semibold">Realtime K/D</span>
                <span class={`text-lg font-black my-0.5 ${
                  data().playerStats.kdRatio >= 1.2 ? "text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" : 
                  data().playerStats.kdRatio >= 1.0 ? "text-amber-400" : "text-rose-400"
                }`}>
                  {data().playerStats.kdRatio.toFixed(2)}
                </span>
                <span class="text-[10px] text-zinc-400 font-sans">
                  {data().playerStats.kills}K / {data().playerStats.deaths}D / {data().playerStats.assists}A
                </span>
              </div>

              {/* Map Win Rate Metric */}
              <div class="rounded-lg bg-zinc-900/60 p-2 border border-zinc-800/80 flex flex-col items-center justify-center">
                <span class="text-[9px] text-zinc-400 uppercase font-semibold">Map Win Rate</span>
                <span class="text-lg font-black text-cyan-400 my-0.5 drop-shadow-[0_0_8px_rgba(0,229,255,0.4)]">
                  {data().playerStats.mapWinRate}%
                </span>
                <span class="text-[10px] text-zinc-400 font-sans">
                  Across {data().playerStats.historicalMatchesOnMap} Acts
                </span>
              </div>

              {/* Avg Combat Score / Econ Metric */}
              <div class="rounded-lg bg-zinc-900/60 p-2 border border-zinc-800/80 flex flex-col items-center justify-center">
                <span class="text-[9px] text-zinc-400 uppercase font-semibold">Combat Score</span>
                <span class="text-lg font-black text-purple-400 my-0.5 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                  {data().playerStats.combatScore}
                </span>
                <span class="text-[10px] text-emerald-400 font-mono font-bold">
                  ◈ {data().playerStats.economyCredits}
                </span>
              </div>
            </div>

            {/* Act Rank Progression Bar */}
            <div class="rounded bg-zinc-900/80 p-2 border border-zinc-800/90">
              <div class="flex items-center justify-between text-[11px] mb-1">
                <div class="flex items-center space-x-1.5">
                  <span class="text-zinc-200 font-bold">{data().playerStats.currentTierName}</span>
                  <span class="text-xs font-black text-emerald-400">
                    ({data().playerStats.rrChangeLastMatch >= 0 ? `+${data().playerStats.rrChangeLastMatch}` : data().playerStats.rrChangeLastMatch} last)
                  </span>
                </div>
                <span class="font-mono font-extrabold text-xs text-zinc-300">
                  <span class="text-cyan-400">{data().playerStats.rankingRating}</span> / 100 RR
                </span>
              </div>
              <div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div 
                  class="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500 shadow-[0_0_10px_#00FF87]" 
                  style={{ width: `${data().playerStats.rankingRating}%` }} 
                />
              </div>
            </div>
          </div>
        )}
      </Show>
    </div>
  );
};
