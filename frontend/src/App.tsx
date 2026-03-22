import { Component, createSignal, onMount, onCleanup } from 'solid-js';
import { LiveMatchOverlay } from './components/overlay/LiveMatchOverlay';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { checkBackendHealth, auditLCUConnection, isBackendOnline, lcuStatus, fetchLiveOverlayTelemetry } from './services/telemetry';
import { OverlayTelemetryPayload } from './types/valorant';

export const App: Component = () => {
  const [activeView, setActiveView] = createSignal<'overlay' | 'dashboard'>('dashboard');
  const [liveTelemetry, setLiveTelemetry] = createSignal<OverlayTelemetryPayload | undefined>(undefined);

  // Periodic heartbeat polling to inspect Go Backend & Local VALORANT PC lockfile status
  onMount(async () => {
    await checkBackendHealth();
    await auditLCUConnection();

    const interval = setInterval(async () => {
      const online = await checkBackendHealth();
      if (online) {
        const lcu = await auditLCUConnection();
        // If LCU lockfile confirms player just entered an active VALORANT match, hydrate live HUD
        if (lcu.connected || activeView() === 'overlay') {
          const stats = await fetchLiveOverlayTelemetry("Vanguard#KILL");
          if (stats) setLiveTelemetry(stats);
        }
      }
    }, 4000);

    onCleanup(() => clearInterval(interval));
  });

  return (
    <div class="min-h-screen">
      {/* Top Floating System Indicator Bar */}
      <div class="fixed top-0 left-1/2 -translate-x-1/2 z-[100] bg-val-navy/90 border-b border-x border-val-emerald/30 rounded-b-xl px-4 py-1.5 flex items-center gap-4 shadow-lg backdrop-blur text-[11px] font-mono">
        <div class="flex items-center gap-1.5">
          <span class={`w-2 h-2 rounded-full ${isBackendOnline() ? 'bg-val-emerald shadow-[0_0_8px_#00FF87]' : 'bg-rose-500'}`} />
          <span class="text-slate-300">SERVER: <strong class={isBackendOnline() ? 'text-white' : 'text-rose-400'}>{isBackendOnline() ? 'ONLINE (:8080)' : 'DISCONNECTED'}</strong></span>
        </div>

        <div class="h-3 w-px bg-slate-700" />

        <div class="flex items-center gap-1.5">
          <span class={`w-2 h-2 rounded-full ${lcuStatus().connected ? 'bg-teal-400 shadow-[0_0_8px_#2dd4bf]' : 'bg-amber-400'}`} />
          <span class="text-slate-300">VALORANT LCU: <strong class={lcuStatus().connected ? 'text-teal-400' : 'text-amber-400'}>{lcuStatus().connected ? `LINKED (PID ${lcuStatus().pid})` : 'STANDBY'}</strong></span>
        </div>

        <div class="h-3 w-px bg-slate-700" />

        <div class="flex gap-1 bg-black/60 p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setActiveView('dashboard')}
            class={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
              activeView() === 'dashboard' ? 'bg-val-emerald text-val-navy shadow-[0_0_8px_#00FF87]' : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 FULL DASHBOARD
          </button>
          <button
            onClick={() => setActiveView('overlay')}
            class={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
              activeView() === 'overlay' ? 'bg-val-emerald text-val-navy shadow-[0_0_8px_#00FF87]' : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 IN-GAME HUD (SUB-KB)
          </button>
        </div>
      </div>

      {/* Main View Port */}
      <div class="pt-12">
        {activeView() === 'dashboard' ? (
          <AnalyticsDashboard />
        ) : (
          <LiveMatchOverlay initialData={liveTelemetry()} />
        )}
      </div>
    </div>
  );
};
