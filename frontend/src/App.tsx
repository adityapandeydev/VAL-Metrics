import { Component, createSignal, onMount, onCleanup, createEffect } from 'solid-js';
import { LiveMatchOverlay } from './components/overlay/LiveMatchOverlay';
import { TrackerWorkspace } from './features/tracker/TrackerWorkspace';
import { checkBackendHealth, auditLCUConnection, checkAuthStatus, authSession, fetchLiveOverlayTelemetry } from './services/telemetry';
import { OverlayTelemetryPayload } from './types/valorant';

export const App: Component = () => {
  const [liveTelemetry, setLiveTelemetry] = createSignal<OverlayTelemetryPayload | undefined>(undefined);

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

  onMount(() => {
    if (!isDesktop()) return;
    let disposed = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    onCleanup(() => {
      disposed = true;
      if (interval) clearInterval(interval);
    });
    void (async () => {
      await checkBackendHealth();
      await auditLCUConnection();
      await checkAuthStatus();
      if (disposed) return;
      interval = setInterval(async () => {
        // Desktop telemetry uses the existing native connection and authenticated Riot ID.
        if (isDesktop() && authSession().riotId) {
          const stats = await fetchLiveOverlayTelemetry(authSession().riotId!);
          if (stats && !disposed) setLiveTelemetry(stats);
        } else {
          await checkBackendHealth();
        }
      }, 30000);
    })();
  });

  // If executing inside Wails desktop runtime or tested via ?mode=overlay, serve ONLY the tactical gaming HUD
  if (isDesktop()) {
    return (
      <main class="w-full min-h-screen bg-transparent select-none overflow-hidden">
        <LiveMatchOverlay initialData={liveTelemetry()} />
      </main>
    );
  }

  return <TrackerWorkspace />;
};
