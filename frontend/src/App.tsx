import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { LiveMatchOverlay } from './components/overlay/LiveMatchOverlay';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { checkBackendHealth, auditLCUConnection, checkAuthStatus, isBackendOnline, authSession, fetchLiveOverlayTelemetry } from './services/telemetry';
import { OverlayTelemetryPayload } from './types/valorant';

export const App: Component = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = createSignal<boolean>(false);
  const [liveTelemetry, setLiveTelemetry] = createSignal<OverlayTelemetryPayload | undefined>(undefined);

  // Detect if running inside Desktop/Tauri runtime or test overlay mode
  const isDesktop = () => {
    if (typeof window === 'undefined') return false;
    return '__TAURI_INTERNALS__' in window || '__TAURI__' in window || navigator.userAgent.includes('Tauri') || window.location.search.includes('mode=overlay');
  };

  // Automatically adjust body class when running as Desktop Overlay
  createEffect(() => {
    if (isDesktop()) {
      document.body.classList.add('transparent-overlay-mode');
    } else {
      document.body.classList.remove('transparent-overlay-mode');
    }
  });

  onMount(async () => {
    await checkBackendHealth();
    await auditLCUConnection();
    await checkAuthStatus();

    const interval = setInterval(async () => {
      // In desktop overlay mode, poll live telemetry; in web mode, check basic server health quietly every 30 seconds
      if (isDesktop() && authSession().riotId) {
        const stats = await fetchLiveOverlayTelemetry(authSession().riotId!);
        if (stats) setLiveTelemetry(stats);
      } else {
        await checkBackendHealth();
      }
    }, 30000);

    onCleanup(() => clearInterval(interval));
  });

  // If executing inside Tauri desktop runtime or tested via ?mode=overlay, serve ONLY the tactical gaming HUD
  if (isDesktop()) {
    return (
      <main class="w-full min-h-screen bg-transparent select-none overflow-hidden">
        <LiveMatchOverlay initialData={liveTelemetry()} />
      </main>
    );
  }

  // Otherwise, serve ONLY the comprehensive analytical web platform without duplicate overlay controls
  return (
    <div class="min-h-screen flex flex-col">
      {/* Interactive Riot Account Connection Modal */}
      <AuthModal isOpen={isAuthModalOpen()} onClose={() => setIsAuthModalOpen(false)} />

      {/* Top Professional Navigation Console (Dedicated strictly to Web Analytics) */}
      <header class="sticky top-0 z-50 w-full bg-[#0B0E14]/95 backdrop-blur-md border-b border-val-border px-4 sm:px-8 py-3.5 shadow-2xl">
        <div class="max-w-[1880px] w-full mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Universal DB Badge */}
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-val-red via-rose-600 to-amber-500 p-0.5 flex items-center justify-center font-tactical font-extrabold text-white text-xl shadow-glow-red">
              <div class="w-full h-full bg-[#0B0E14] rounded-[6px] flex items-center justify-center text-val-red">
                V
              </div>
            </div>
            <div>
              <span class="font-extrabold text-xl tracking-wider text-white font-tactical">VAL<span class="text-val-red">-</span>METRICS</span>
              <span class="ml-2 text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-[#1A2338] text-val-cyan border border-val-cyan/30">
                Universal DB v3.0
              </span>
            </div>
          </div>

          {/* Riot Account Login & Server Status */}
          <div class="flex flex-wrap items-center justify-center gap-4 text-xs font-tactical">
            
            {/* Single Clear Riot Login / Authenticated Badge */}
            {authSession().authenticated && authSession().riotId ? (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#141E33] to-[#0D1524] border border-val-gold/50 shadow-glow-gold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                title="Click to manage your connected Riot Account or log out"
              >
                <span class="text-val-gold font-bold text-sm">👑 {authSession().riotId}</span>
                <span class="text-[10px] bg-val-gold/20 text-val-gold px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                  LOGGED IN
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                class="flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-val-red via-rose-600 to-amber-500 text-white font-tactical font-black text-xs hover:brightness-110 active:scale-95 shadow-glow-red transition-all uppercase tracking-wider cursor-pointer"
              >
                <span class="text-base">⚔️</span>
                <span>LOG IN WITH RIOT ACCOUNT</span>
              </button>
            )}

            {/* Database & Server Status Pill */}
            <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141A29] border border-white/10 shadow-inner">
              <div class={`w-2 h-2 rounded-full ${isBackendOnline() ? 'bg-val-emerald shadow-[0_0_8px_#10B981]' : 'bg-rose-500 animate-pulse'}`} />
              <span class="text-val-muted font-medium uppercase text-[11px]">DB ENGINE:</span>
              <span class={isBackendOnline() ? 'text-white font-black uppercase text-[11px]' : 'text-rose-400 font-bold uppercase text-[11px]'}>
                {isBackendOnline() ? 'SNAPPYSTORE CONNECTED' : 'OFFLINE'}
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container - Exclusive Analytics Dashboard */}
      <main class="flex-1 w-full">
        <AnalyticsDashboard />
      </main>
    </div>
  );
};
