import { Component, createMemo } from 'solid-js';

interface Props {
  headshotPercent?: number;
  bodyshotPercent?: number;
  legshotPercent?: number;
  totalHits?: number;
  headshots?: number;
  bodyshots?: number;
  legshots?: number;
}

export const HolographicSilhouette: Component<Props> = (props) => {
  const hs = createMemo(() => props.headshotPercent ?? 18.5);
  const body = createMemo(() => props.bodyshotPercent ?? 74.2);
  const legs = createMemo(() => props.legshotPercent ?? 7.3);

  const headCount = createMemo(() => props.headshots ?? Math.round(((props.totalHits || 210) * hs()) / 100));
  const bodyCount = createMemo(() => props.bodyshots ?? Math.round(((props.totalHits || 210) * body()) / 100));
  const legCount = createMemo(() => props.legshots ?? Math.round(((props.totalHits || 210) * legs()) / 100));

  return (
    <div class="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between h-full group">
      
      {/* Header */}
      <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-2.5 h-2.5 rounded-full bg-val-red shadow-[0_0_10px_#FF4655]" />
          <span class="text-xs font-black font-tactical tracking-widest text-white uppercase">
            HOLOGRAPHIC HIT ANATOMY
          </span>
        </div>
        <span class="text-[10px] font-mono text-val-muted">
          {props.totalHits || 210} TOTAL BULLETS CONNECTED
        </span>
      </div>

      {/* Center Silhouette & Hit Distribution */}
      <div class="my-5 flex items-center justify-between gap-6">
        
        {/* Holographic Wireframe Agent Target */}
        <div class="relative w-28 h-52 sm:w-32 sm:h-56 bg-gradient-to-b from-[#0B0F1A] to-[#06080E] rounded-2xl border border-white/[0.08] p-3 flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
          
          {/* Subtle Cybernetic Grid Pattern */}
          <div class="absolute inset-0 bg-tactical-grid opacity-30 pointer-events-none" />

          {/* SVG Body Target */}
          <svg viewBox="0 0 100 210" class="w-full h-full drop-shadow-[0_0_12px_rgba(0,229,255,0.25)]">
            {/* Head */}
            <circle
              cx="50" cy="26" r="16"
              fill={hs() >= 20 ? "#FF4655" : "#00E5FF"}
              opacity={hs() >= 20 ? "0.95" : "0.85"}
              class="transition-colors duration-500"
            />
            {/* Torso / Armor Plate */}
            <path
              d="M24 48 H76 L70 120 H30 Z"
              fill="#00E5FF"
              opacity="0.8"
            />
            {/* Left Arm */}
            <path
              d="M10 48 H20 L16 108 H6 Z"
              fill="#38BDF8"
              opacity="0.65"
            />
            {/* Right Arm */}
            <path
              d="M80 48 H90 L94 108 H84 Z"
              fill="#38BDF8"
              opacity="0.65"
            />
            {/* Left Leg */}
            <path
              d="M32 126 H46 L42 202 H28 Z"
              fill="#64748B"
              opacity="0.75"
            />
            {/* Right Leg */}
            <path
              d="M54 126 H68 L72 202 H58 Z"
              fill="#64748B"
              opacity="0.75"
            />
          </svg>

          {/* Animated Scanning Beam */}
          <div class="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-val-cyan to-transparent animate-pulse pointer-events-none opacity-70" />
        </div>

        {/* Tactical Hit Data Rows */}
        <div class="flex-1 space-y-3 font-tactical">
          
          {/* Head */}
          <div class="bg-black/40 p-3 rounded-2xl border border-white/5 hover:border-val-red/40 transition-all flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-val-red shadow-[0_0_8px_#FF4655]" />
              <div>
                <span class="text-xs font-black text-white uppercase tracking-wider block leading-none">HEADSHOT</span>
                <span class="text-[10px] text-val-muted font-mono">{headCount()} Hits</span>
              </div>
            </div>
            <span class="text-xl font-black font-tactical text-val-red">{hs()}%</span>
          </div>

          {/* Body */}
          <div class="bg-black/40 p-3 rounded-2xl border border-white/5 hover:border-val-cyan/40 transition-all flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-val-cyan shadow-[0_0_8px_#00E5FF]" />
              <div>
                <span class="text-xs font-black text-white uppercase tracking-wider block leading-none">BODYSHOT</span>
                <span class="text-[10px] text-val-muted font-mono">{bodyCount()} Hits</span>
              </div>
            </div>
            <span class="text-xl font-black font-tactical text-val-cyan">{body()}%</span>
          </div>

          {/* Legs */}
          <div class="bg-black/40 p-3 rounded-2xl border border-white/5 hover:border-slate-500/40 transition-all flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <div>
                <span class="text-xs font-black text-white uppercase tracking-wider block leading-none">LEGSHOT</span>
                <span class="text-[10px] text-val-muted font-mono">{legCount()} Hits</span>
              </div>
            </div>
            <span class="text-xl font-black font-tactical text-slate-400">{legs()}%</span>
          </div>

        </div>

      </div>

      {/* Recoil & Precision Trajectory Bar */}
      <div class="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-tactical">
        <span class="text-[10px] uppercase font-bold text-val-muted tracking-wider">
          Crosshair Placement Index:
        </span>
        <span class="font-mono text-val-emerald font-black text-[11px]">
          {hs() >= 20 ? "+8.4% HIGH LETHALITY" : "DISCIPLINED SPREAD"}
        </span>
      </div>

    </div>
  );
};
