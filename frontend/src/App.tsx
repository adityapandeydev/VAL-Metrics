import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { LiveMatchOverlay } from './components/overlay/LiveMatchOverlay';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { checkBackendHealth, auditLCUConnection, isBackendOnline, isLiveRiotApiActive, lcuStatus, fetchLiveOverlayTelemetry } from './services/telemetry';
import { OverlayTelemetryPayload } from './types/valorant';

export const App: Component = () => {
  const [activeView, setActiveView] = createSignal<'dashboard' | 'overlay'>('dashboard');
  const [liveTelemetry, setLiveTelemetry] = createSignal<OverlayTelemetryPayload | undefined>(undefined);

  // Automatically adjust body class when entering or leaving desktop overlay mode
  createEffect(() => {
    if (activeView() === 'overlay') {
      document.body.classList.add('transparent-overlay-mode');
    } else {
      document.body.classList.remove('transparent-overlay-mode');
    }
  });

  onMount(async () => {
    await checkBackendHealth();
    await auditLCUConnection();

    const interval = setInterval(async () => {
      const online = await checkBackendHealth();
      if (online) {
        const lcu = await auditLCUConnection();
        if (lcu.connected || activeView() === 'overlay') {
          const stats = await fetchLiveOverlayTelemetry("Vanguard#KILL");
          if (stats) setLiveTelemetry(stats);
        }
      }
    }, 4000);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="min-h-screen flex flex-col">
      {/* Top Professional Navigation & Diagnostic Console */}
      {activeView() === 'dashboard' ? (
        <header class="sticky top-0 z-50 w-full bg-[#0B0E14]/95 backdrop-blur-md border-b border-val-border px-6 py-3.5 shadow-2xl">
          <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Brand Logo */}
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-val-red via-rose-600 to-amber-500 p-0.5 flex items-center justify-center font-tactical font-extrabold text-white text-xl shadow-glow-red">
                <div class="w-full h-full bg-[#0B0E14] rounded-[6px] flex items-center justify-center text-val-red">
                  V
                </div>
              </div>
              <div>
                <span class="font-extrabold text-xl tracking-wider text-white font-tactical">VAL<span class="text-val-red">-</span>METRICS</span>
                <span class="ml-2 text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-val-card text-val-cyan border border-val-cyan/20">
                  Live Riot Cloud v2.5
                </span>
              </div>
            </div>

            {/* System Status Indicators & Mode Selector */}
            <div class="flex flex-wrap items-center justify-center gap-2.5 text-xs font-tactical">
              {/* Live Riot Cloud API Status Pill */}
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141A29] border border-white/10 shadow-inner">
                <div class={`w-2 h-2 rounded-full ${isLiveRiotApiActive() ? 'bg-val-cyan shadow-[0_0_8px_#00E5FF]' : 'bg-amber-400'}`} />
                <span class="text-val-muted font-medium uppercase text-[11px]">RIOT API:</span>
                <span class={isLiveRiotApiActive() ? 'text-val-cyan font-black uppercase text-[11px]' : 'text-amber-400 font-bold uppercase text-[11px]'}>
                  {isLiveRiotApiActive() ? '⚡ LIVE CLOUD LINKED' : '🛡️ VAULT SIMULATION'}
                </span>
              </div>

              {/* Backend Indicator Pill */}
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141A29] border border-white/10 shadow-inner">
                <div class={`w-2 h-2 rounded-full ${isBackendOnline() ? 'bg-val-emerald shadow-[0_0_8px_#10B981]' : 'bg-rose-500 animate-pulse'}`} />
                <span class="text-val-muted font-medium uppercase text-[11px]">SERVER:</span>
                <span class={isBackendOnline() ? 'text-white font-black uppercase text-[11px]' : 'text-rose-400 font-bold uppercase text-[11px]'}>
                  {isBackendOnline() ? 'CONNECTED (:8080)' : 'OFFLINE'}
                </span>
              </div>

              {/* VALORANT LCU Indicator Pill */}
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141A29] border border-white/10 shadow-inner">
                <div class={`w-2 h-2 rounded-full ${lcuStatus().connected ? 'bg-val-cyan shadow-[0_0_8px_#00E5FF]' : 'bg-amber-400/80'}`} />
                <span class="text-val-muted font-medium uppercase text-[11px]">CLIENT:</span>
                <span class={lcuStatus().connected ? 'text-val-cyan font-black uppercase text-[11px]' : 'text-amber-400 font-semibold uppercase text-[11px]'}>
                  {lcuStatus().connected ? `LINKED (${lcuStatus().pid})` : 'STANDBY'}
                </span>
              </div>

              {/* Mode Switcher */}
              <div class="flex bg-[#07090D] p-1 rounded-xl border border-val-border ml-1">
                <button
                  onClick={() => setActiveView('dashboard')}
                  class={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 ${
                    activeView() === 'dashboard'
                      ? 'bg-val-red text-white shadow-glow-red font-bold'
                      : 'text-val-muted hover:text-white'
                  }`}
                >
                  <span>📊</span> ANALYTICS HUB
                </button>
                <button
                  onClick={() => setActiveView('overlay')}
                  class={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 ${
                    activeView() === 'overlay'
                      ? 'bg-val-cyan text-val-obsidian font-extrabold shadow-glow-cyan'
                      : 'text-val-muted hover:text-white'
                  }`}
                >
                  <span>🎯</span> IN-GAME HUD
                </button>
              </div>
            </div>
          </div>
        </header>
      ) : (
        /* Minimal Floating Control Pill for Overlay Mode (Keeps HUD totally unobstructed) */
        <div class="fixed top-3 right-4 z-[9999] flex items-center gap-2">
          <button
            onClick={() => setActiveView('dashboard')}
            class="px-4 py-2 rounded-xl bg-val-obsidian/90 border border-val-red/50 text-white font-bold text-xs shadow-glass hover:bg-val-red transition-all flex items-center gap-2 group"
          >
            <span>◀ RETURN TO DASHBOARD</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <main class="flex-1 w-full">
        {activeView() === 'dashboard' ? (
          <AnalyticsDashboard />
        ) : (
          <LiveMatchOverlay initialData={liveTelemetry()} />
        )}
      </main>
    </div>
  );
};
