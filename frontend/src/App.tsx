import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { LiveMatchOverlay } from './components/overlay/LiveMatchOverlay';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { checkBackendHealth, auditLCUConnection, checkAuthStatus, isBackendOnline, isLiveRiotApiActive, authSession, fetchLiveOverlayTelemetry } from './services/telemetry';
import { OverlayTelemetryPayload } from './types/valorant';

export const App: Component = () => {
  const [activeView, setActiveView] = createSignal<'dashboard' | 'overlay'>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = createSignal<boolean>(false);
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
    await checkAuthStatus();

    const interval = setInterval(async () => {
      const online = await checkBackendHealth();
      if (online) {
        const lcu = await auditLCUConnection();
        if (lcu.connected || activeView() === 'overlay') {
          const stats = await fetchLiveOverlayTelemetry("Aditya#INDI");
          if (stats) setLiveTelemetry(stats);
        }
      }
    }, 4000);

    onCleanup(() => clearInterval(interval));
  });

  const handleModeSwitch = (mode: 'dashboard' | 'overlay') => {
    if (mode === 'overlay' && (!authSession().authenticated || !authSession().isVerified)) {
      setIsAuthModalOpen(true);
      return;
    }
    setActiveView(mode);
  };

  return (
    <div class="min-h-screen flex flex-col">
      {/* Interactive Authentication Modal */}
      <AuthModal isOpen={isAuthModalOpen()} onClose={() => setIsAuthModalOpen(false)} />

      {/* Top Professional Navigation & User Management Console */}
      {activeView() === 'dashboard' ? (
        <header class="sticky top-0 z-50 w-full bg-[#0B0E14]/95 backdrop-blur-md border-b border-val-border px-6 py-3.5 shadow-2xl">
          <div class="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
            
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

            {/* User Authentication Buttons & Mode Selector */}
            <div class="flex flex-wrap items-center justify-center gap-2.5 text-xs font-tactical">
              
              {/* Login / Sign Up vs Authenticated Profile Badge */}
              {authSession().authenticated ? (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#141E33] to-[#0D1524] border border-val-gold/40 shadow-glow-gold hover:brightness-110 transition-all"
                  title="Click to view account sync details or sign out"
                >
                  <span class="text-val-gold font-bold">👑 {authSession().riotId || authSession().username}</span>
                  <span class="text-[10px] bg-val-gold/20 text-val-gold px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                    {authSession().isVerified ? "VERIFIED RIOT OWNER" : "UNVERIFIED SPECTATOR"}
                  </span>
                </button>
              ) : (
                <div class="flex items-center gap-2">
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    class="px-4 py-1.5 rounded-full bg-[#141A29] border border-white/20 text-white font-bold hover:bg-white/10 transition-all shadow-inner uppercase tracking-wider"
                  >
                    🔑 SIGN IN
                  </button>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    class="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-val-red to-rose-600 text-white font-black hover:brightness-110 shadow-glow-red transition-all uppercase tracking-wider"
                  >
                    <span>⚡ REGISTER & CONNECT RIOT ID</span>
                  </button>
                </div>
              )}

              {/* Database & Server Status Pill */}
              <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141A29] border border-white/10 shadow-inner">
                <div class={`w-2 h-2 rounded-full ${isBackendOnline() ? 'bg-val-emerald shadow-[0_0_8px_#10B981]' : 'bg-rose-500 animate-pulse'}`} />
                <span class="text-val-muted font-medium uppercase text-[11px]">DB ENGINE:</span>
                <span class={isBackendOnline() ? 'text-white font-black uppercase text-[11px]' : 'text-rose-400 font-bold uppercase text-[11px]'}>
                  {isBackendOnline() ? 'SNAPPYSTORE CONNECTED' : 'OFFLINE'}
                </span>
              </div>

              {/* Mode Switcher */}
              <div class="flex bg-[#07090D] p-1 rounded-xl border border-val-border ml-1">
                <button
                  onClick={() => handleModeSwitch('dashboard')}
                  class={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 ${
                    activeView() === 'dashboard'
                      ? 'bg-val-red text-white shadow-glow-red font-bold'
                      : 'text-val-muted hover:text-white'
                  }`}
                >
                  <span>📊</span> ANALYTICS HUB
                </button>
                <button
                  onClick={() => handleModeSwitch('overlay')}
                  class={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 ${
                    activeView() === 'overlay'
                      ? 'bg-val-cyan text-val-obsidian font-extrabold shadow-glow-cyan'
                      : 'text-val-muted hover:text-white'
                  }`}
                  title={authSession().isVerified ? "Launch tactical real-time gaming HUD overlay" : "Requires verified Riot account login"}
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
