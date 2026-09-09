import { Component } from 'solid-js';
import { LiveMatchOverlay } from '../../overlay/LiveMatchOverlay';

export const OverlayPreviewTab: Component = () => {
  return (
    <div class="space-y-6 animate-fade-in">
      
      {/* HUD Info Banner */}
      <div class="glass-card rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-val-cyan shadow-[0_0_10px_#00E5FF] animate-pulse" />
            <h2 class="text-2xl sm:text-3xl font-black font-tactical text-white uppercase tracking-wide">
              TOURNAMENT HUD OVERLAY SIMULATOR
            </h2>
          </div>
          <p class="text-xs sm:text-sm text-val-muted mt-1 font-tactical max-w-2xl leading-relaxed">
            In Wails v3 / Tauri desktop mode, this zero-scroll tactical HUD renders directly on top of VALORANT via native transparent Win32 windows with sub-millisecond click-through (Ghost Mode).
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-xl bg-val-emerald/15 text-val-emerald border border-val-emerald/30 text-xs font-mono font-bold uppercase">
            VANGUARD COMPLIANT
          </span>
        </div>
      </div>

      {/* Live Embedded Overlay Container */}
      <div class="relative w-full rounded-3xl overflow-hidden border border-white/15 bg-black/90 shadow-2xl min-h-[720px] flex flex-col">
        <LiveMatchOverlay />
      </div>

    </div>
  );
};
