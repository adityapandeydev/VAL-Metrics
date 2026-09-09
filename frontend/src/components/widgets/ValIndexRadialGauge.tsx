import { Component, createMemo } from 'solid-js';

interface Props {
  valIndexScore: number;
  valIndexGrade: string;
  acs: number;
  kastPercent: number;
  damageDelta: number;
  roundWinRate: number;
}

export const ValIndexRadialGauge: Component<Props> = (props) => {
  // Score percentage for SVG ring (0 to 100)
  const scorePercent = createMemo(() => {
    return Math.min(Math.max((props.valIndexScore || 0) / 10, 0), 100);
  });

  // Calculate the 4 algorithmic sub-components
  const acsContribution = createMemo(() => Math.min(350, Math.round((props.acs / 300) * 350)));
  const kastContribution = createMemo(() => Math.min(300, Math.round((props.kastPercent / 80) * 300)));
  const ddContribution = createMemo(() => Math.min(200, Math.max(0, Math.round(((props.damageDelta + 50) / 100) * 200))));
  const winContribution = createMemo(() => Math.min(150, Math.round((props.roundWinRate / 60) * 150)));

  return (
    <div class="glass-card glass-card-hover rounded-3xl p-6 sm:p-7 flex flex-col justify-between h-full group">
      
      {/* Top Header */}
      <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div class="flex items-center gap-2.5">
          <div class="w-2.5 h-2.5 rounded-full bg-val-cyan shadow-[0_0_10px_#00E5FF] animate-pulse" />
          <span class="text-xs font-black font-tactical tracking-widest text-white uppercase">
            VAL-INDEX EVALUATION
          </span>
        </div>
        <span class="text-[10px] font-mono px-2.5 py-1 rounded-full bg-val-cyan/10 text-val-cyan border border-val-cyan/30 uppercase font-bold tracking-wider">
          PROPRIETARY V4.0
        </span>
      </div>

      {/* Central Hologram Ring */}
      <div class="my-6 flex flex-col items-center justify-center">
        <div class="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
          
          {/* Subtle Ambient Radial Glow */}
          <div class="absolute inset-4 rounded-full bg-gradient-to-tr from-val-cyan/15 via-val-red/10 to-transparent blur-xl pointer-events-none" />

          {/* SVG Concentric Cybernetic Rings */}
          <svg class="w-full h-full transform -rotate-90">
            {/* Outer dotted tick ring */}
            <circle
              cx="50%" cy="50%" r="46%"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.1)"
              stroke-width="1.5"
              stroke-dasharray="3 7"
            />
            {/* Inner background track */}
            <circle
              cx="50%" cy="50%" r="39%"
              fill="transparent"
              stroke="rgba(255, 255, 255, 0.05)"
              stroke-width="7"
            />
            {/* Active animated progress arc with glowing stroke */}
            <circle
              cx="50%" cy="50%" r="39%"
              fill="transparent"
              stroke="url(#valIndexGradient)"
              stroke-width="7"
              stroke-linecap="round"
              pathLength="100"
              stroke-dasharray="100"
              stroke-dashoffset={100 - scorePercent()}
              class="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="valIndexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#00E5FF" />
                <stop offset="50%" stop-color="#38BDF8" />
                <stop offset="100%" stop-color="#FF4655" />
              </linearGradient>
            </defs>
          </svg>

          {/* Core Telemetry Readout */}
          <div class="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span class="text-5xl sm:text-6xl font-black font-tactical text-white tracking-tight leading-none drop-shadow-md">
              {props.valIndexScore || 750}
            </span>
            <span class="text-[10px] font-black font-tactical text-val-cyan tracking-widest uppercase mt-1">
              POINTS / 1000
            </span>
          </div>

        </div>

        {/* Grade Badge */}
        <div class="mt-3 text-center">
          <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-val-cyan/15 via-white/5 to-val-red/15 border border-white/10 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-val-cyan" />
            <span class="text-xs sm:text-sm font-black font-tactical text-white uppercase tracking-wider">
              {props.valIndexGrade || "A • Elite Combatant"}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Algorithmic Breakdown */}
      <div class="space-y-3 pt-3 border-t border-white/[0.08] text-xs font-tactical">
        <div class="text-[10px] uppercase font-bold text-val-muted tracking-wider mb-2">
          Algorithmic Metric Vectors:
        </div>

        {/* ACS */}
        <div class="space-y-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-300 font-semibold uppercase">Combat Score (ACS)</span>
            <span class="font-mono text-val-gold font-bold">{acsContribution()} / 350 pts</span>
          </div>
          <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div class="h-full bg-val-gold progress-animate rounded-full" style={{ width: `${(acsContribution() / 350) * 100}%` }} />
          </div>
        </div>

        {/* KAST */}
        <div class="space-y-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-300 font-semibold uppercase">KAST Consistency</span>
            <span class="font-mono text-val-emerald font-bold">{kastContribution()} / 300 pts</span>
          </div>
          <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div class="h-full bg-val-emerald progress-animate rounded-full" style={{ width: `${(kastContribution() / 300) * 100}%` }} />
          </div>
        </div>

        {/* Damage Delta */}
        <div class="space-y-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-300 font-semibold uppercase">Damage Delta (DDΔ)</span>
            <span class="font-mono text-val-cyan font-bold">{ddContribution()} / 200 pts</span>
          </div>
          <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div class="h-full bg-val-cyan progress-animate rounded-full" style={{ width: `${(ddContribution() / 200) * 100}%` }} />
          </div>
        </div>

        {/* Round Win Conversion */}
        <div class="space-y-1">
          <div class="flex justify-between items-center text-[11px]">
            <span class="text-slate-300 font-semibold uppercase">Round Conversion</span>
            <span class="font-mono text-val-red font-bold">{winContribution()} / 150 pts</span>
          </div>
          <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div class="h-full bg-val-red progress-animate rounded-full" style={{ width: `${(winContribution() / 150) * 100}%` }} />
          </div>
        </div>
      </div>

    </div>
  );
};
