import { Component } from 'solid-js';
import { isBackendOnline, authSession } from '../../services/telemetry';

interface Props {
  dbVersion: string;
  onOpenSearch: () => void;
  onOpenAuth: () => void;
}

export const GlobalHeader: Component<Props> = (props) => {
  return (
    <header class="sticky top-0 z-50 w-full bg-[#070A10]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 py-3 shadow-2xl transition-all">
      <div class="max-w-[1880px] w-full mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Brand Monogram & Engine Badge */}
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-val-red via-rose-600 to-amber-500 p-0.5 flex items-center justify-center font-tactical font-black text-white text-xl shadow-glow-red select-none">
            <div class="w-full h-full bg-[#070A10] rounded-[10px] flex items-center justify-center text-val-red font-tactical">
              V
            </div>
          </div>

          <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
            <span class="font-extrabold text-xl tracking-wider text-white font-tactical">
              VAL<span class="text-val-red">-</span>METRICS
            </span>
            <span class="text-[9px] uppercase tracking-widest font-mono font-bold px-2 py-0.5 rounded-full bg-val-cyan/10 text-val-cyan border border-val-cyan/30 self-start sm:self-auto">
              {props.dbVersion || "SnappyStore v4.0"}
            </span>
          </div>
        </div>

        {/* Center: Command Palette / Omni-Search Trigger */}
        <div class="flex-1 max-w-xl hidden md:block">
          <button
            onClick={props.onOpenSearch}
            class="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-val-cyan/50 hover:bg-white/[0.07] text-slate-400 hover:text-white transition-all text-xs font-tactical cursor-pointer group shadow-inner"
          >
            <div class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-slate-400 group-hover:text-val-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span class="font-semibold tracking-wide">Search any Riot ID (e.g. TenZ#0505)...</span>
            </div>
            <kbd class="px-2 py-0.5 text-[10px] font-mono font-bold bg-white/10 rounded border border-white/10 text-slate-400 group-hover:text-white">
              ⌘K / /
            </kbd>
          </button>
        </div>

        {/* Right: Clean Minimal Status Indicator & Auth Pill */}
        <div class="flex items-center gap-3 sm:gap-4 text-xs font-tactical">
          
          {/* Mobile Search Button */}
          <button
            onClick={props.onOpenSearch}
            class="md:hidden p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white hover:bg-white/10"
            title="Search Player"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Minimalist Status Indicator: Active (Green) / Offline (Red) */}
          <div class="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] select-none">
            <span class={`w-2 h-2 rounded-full transition-all ${isBackendOnline() ? 'bg-val-emerald shadow-[0_0_8px_#10B981] animate-pulse' : 'bg-val-red shadow-[0_0_8px_#FF4655]'}`} />
            <span class={`font-mono text-[11px] font-black uppercase tracking-wider ${isBackendOnline() ? 'text-white' : 'text-val-red'}`}>
              {isBackendOnline() ? 'ACTIVE' : 'OFFLINE'}
            </span>
          </div>

          {/* Riot Login / Authenticated Pill */}
          {authSession().authenticated && authSession().riotId ? (
            <button
              onClick={props.onOpenAuth}
              class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-val-surface to-[#0D1524] border border-val-gold/50 shadow-glow-gold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              title="Manage connected Riot Account"
            >
              <span class="w-2 h-2 rounded-full bg-val-gold shadow-[0_0_6px_#EAA630]" />
              <span class="text-val-gold font-bold text-xs sm:text-sm tracking-wide">{authSession().riotId}</span>
            </button>
          ) : (
            <button
              onClick={props.onOpenAuth}
              class="flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-val-red via-rose-600 to-amber-500 text-white font-tactical font-black text-xs hover:brightness-110 active:scale-95 shadow-glow-red transition-all uppercase tracking-wider cursor-pointer whitespace-nowrap"
            >
              <span>CONNECT RIOT</span>
            </button>
          )}

        </div>

      </div>
    </header>
  );
};
