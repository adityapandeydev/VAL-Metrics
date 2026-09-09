import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { LiveMatchOverlay } from './components/overlay/LiveMatchOverlay';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { GlobalHeader } from './components/layout/GlobalHeader';
import { CommandPalette } from './components/layout/CommandPalette';
import { AuthModal } from './components/auth/AuthModal';
import { checkBackendHealth, auditLCUConnection, checkAuthStatus, isBackendOnline, authSession, fetchLiveOverlayTelemetry, BACKEND_URL } from './services/telemetry';
import { OverlayTelemetryPayload } from './types/valorant';

export const App: Component = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = createSignal<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = createSignal<boolean>(false);
  const [activePlayerId, setActivePlayerId] = createSignal<string>("");
  const [liveTelemetry, setLiveTelemetry] = createSignal<OverlayTelemetryPayload | undefined>(undefined);
  const [dbVersion, setDbVersion] = createSignal("SnappyStore v4.0");

  // Detect if running inside Desktop (Wails v3 / Tauri) runtime or test overlay mode
  const isDesktop = () => {
    if (typeof window === 'undefined') return false;
    const w = window as any;
    return (
      Boolean(w._wails?.environment?.OS) ||
      Boolean(w._wails && (w.chrome?.webview || w.webkit?.messageHandlers)) ||
      Boolean(w.wails) ||
      navigator.userAgent.includes('Wails') ||
      '__TAURI_INTERNALS__' in window ||
      '__TAURI__' in window ||
      navigator.userAgent.includes('Tauri') ||
      window.location.search.includes('mode=overlay')
    );
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

    fetch(`${BACKEND_URL}/system/info`)
      .then(res => res.json())
      .then(data => {
        if (data && data.universal_db_version) {
          setDbVersion(data.universal_db_version);
        }
      })
      .catch(err => console.error("Could not fetch DB version:", err));

    // Global keyboard listener for search palette trigger
    const handleGlobalKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
      if (e.key === '/' && !isSearchOpen() && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeydown);
    onCleanup(() => window.removeEventListener('keydown', handleGlobalKeydown));

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

  // If executing inside Wails desktop runtime or tested via ?mode=overlay, serve ONLY the tactical gaming HUD
  if (isDesktop()) {
    return (
      <main class="w-full min-h-screen bg-transparent select-none overflow-hidden">
        <LiveMatchOverlay initialData={liveTelemetry()} />
      </main>
    );
  }

  // Otherwise, serve the comprehensive analytical web platform
  return (
    <div class="min-h-screen flex flex-col bg-[#070A10] text-slate-100 selection:bg-val-red/30 selection:text-white">
      {/* Interactive Riot Account Connection Modal */}
      <AuthModal isOpen={isAuthModalOpen()} onClose={() => setIsAuthModalOpen(false)} />

      {/* Spotlight Command Palette / Omni-Search */}
      <CommandPalette
        isOpen={isSearchOpen()}
        onClose={() => setIsSearchOpen(false)}
        onSelectPlayer={(id) => {
          setActivePlayerId(id);
        }}
      />

      {/* Master Esports-Grade Navigation Console */}
      <GlobalHeader
        dbVersion={dbVersion()}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Container - Exclusive Analytics Dashboard */}
      <main class="flex-1 w-full">
        <AnalyticsDashboard
          initialSearchId={activePlayerId()}
          onSearchChange={setActivePlayerId}
        />
      </main>
    </div>
  );
};
