import { Component } from 'solid-js';

interface Props {
  headshotPercent?: number;
  bodyshotPercent?: number;
  legshotPercent?: number;
  totalHits?: number;
}

export const AccuracySilhouette: Component<Props> = (props) => {
  const hs = props.headshotPercent || 14.6;
  const body = props.bodyshotPercent || 81.9;
  const legs = props.legshotPercent || 3.5;

  return (
    <div class="glass-panel rounded-2xl p-5 border border-white/10 space-y-5 shadow-xl relative overflow-hidden group">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <span class="text-xs font-black text-val-muted font-tactical uppercase tracking-widest flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-val-red shadow-glow-red" />
          Marksmanship Hit Silhouette
        </span>
        <span class="text-[10px] font-mono text-val-muted">Last 2 Matches</span>
      </div>

      <div class="flex items-center justify-between gap-6 px-2">
        
        {/* SVG Tactical Body Armor Silhouette */}
        <div class="w-24 h-44 relative flex items-center justify-center bg-black/60 rounded-2xl border border-white/5 p-3 shadow-inner">
          <svg viewBox="0 0 100 200" class="w-full h-full drop-shadow-[0_0_10px_rgba(0,229,255,0.3)]">
            {/* Head (Red if high HS%, Cyan default) */}
            <circle cx="50" cy="24" r="14" fill={hs >= 20 ? "#FF4655" : "#00E5FF"} class="animate-pulse" />
            {/* Torso / Body */}
            <path d="M26 44 H74 L68 115 H32 Z" fill="#00E5FF" opacity="0.85" />
            {/* Left Arm */}
            <path d="M12 44 H22 L18 100 H10 Z" fill="#00E5FF" opacity="0.75" />
            {/* Right Arm */}
            <path d="M78 44 H88 L90 100 H82 Z" fill="#00E5FF" opacity="0.75" />
            {/* Left Leg */}
            <path d="M34 120 H46 L42 190 H30 Z" fill="#4A5568" opacity="0.9" />
            {/* Right Leg */}
            <path d="M54 120 H66 L70 190 H58 Z" fill="#4A5568" opacity="0.9" />
          </svg>
          
          <div class="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(0,229,255,0.05)_50%,transparent_60%)] animate-scan pointer-events-none" />
        </div>

        {/* Hit Distribution Stats Table */}
        <div class="flex-1 space-y-4 font-tactical">
          
          <div class="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-val-red/40 transition-all">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-val-red" />
              <span class="text-xs font-extrabold text-white uppercase tracking-wider">Head</span>
            </div>
            <div class="text-right">
              <span class="text-lg font-black text-white block leading-none">{hs}%</span>
              <span class="text-[10px] text-slate-400 font-mono">25 Hits</span>
            </div>
          </div>

          <div class="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-val-cyan/40 transition-all">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-val-cyan" />
              <span class="text-xs font-extrabold text-white uppercase tracking-wider">Body</span>
            </div>
            <div class="text-right">
              <span class="text-lg font-black text-val-cyan block leading-none">{body}%</span>
              <span class="text-[10px] text-slate-400 font-mono">140 Hits</span>
            </div>
          </div>

          <div class="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 hover:border-slate-500 transition-all">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span class="text-xs font-extrabold text-white uppercase tracking-wider">Legs</span>
            </div>
            <div class="text-right">
              <span class="text-lg font-black text-slate-400 block leading-none">{legs}%</span>
              <span class="text-[10px] text-slate-400 font-mono">6 Hits</span>
            </div>
          </div>

        </div>

      </div>

      {/* Average HS% Progression Graph Card */}
      <div class="bg-[#0A0D14] p-4 rounded-xl border border-white/5 space-y-2">
        <div class="flex items-center justify-between text-[11px] text-val-muted font-tactical">
          <span class="font-extrabold uppercase tracking-wider text-white" title="Tracking match-by-match headshot percentage stability and growth over recent encounters">
            RECENT HS% TRAJECTORY
          </span>
          <span class="text-val-red font-bold">+5.0% Precision Growth</span>
        </div>
        
        {/* Tactical Curve Sim */}
        <div class="h-12 w-full bg-gradient-to-t from-val-red/10 to-transparent relative rounded-lg border-b-2 border-val-red overflow-hidden flex items-end">
          <svg class="w-full h-10 stroke-val-red fill-none" viewBox="0 0 300 50">
            <path d="M0 45 Q 75 40, 150 28 T 300 10" stroke-width="3" stroke-linecap="round" />
          </svg>
        </div>

        <div class="flex justify-between text-[9px] font-mono text-slate-500 px-1">
          <span>Prev Match (12.0%)</span>
          <span class="text-val-red font-bold">Latest Match (17.0%) 🎯</span>
        </div>
      </div>

    </div>
  );
};
