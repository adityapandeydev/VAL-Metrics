import { Component, createMemo } from 'solid-js';

interface Props {
  valIndexScore: number;
  valIndexGrade: string;
  roundWinRate: number;
  kastPercent: number;
  acs: number;
  damageDelta: number;
}

export const ValIndexScorecard: Component<Props> = (props) => {
  // Score percentage for the SVG path length (0 to 100)
  const scorePercent = createMemo(() => {
    return Math.min(Math.max(props.valIndexScore / 10, 0), 100);
  });

  return (
    <div class="relative bg-gradient-to-br from-val-dark via-[#141E33] to-[#0D1322] border border-val-cyan/20 shadow-glass rounded-2xl p-5 space-y-5 flex flex-col h-full overflow-hidden">
      {/* Background glow */}
      <div class="absolute top-0 right-0 w-64 h-64 bg-val-cyan/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Section: Score Square & Grade */}
      <div class="relative z-10 flex flex-col items-center justify-center space-y-4 flex-1 mt-2">
        
        {/* Circular Score Box */}
        <div class="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center shadow-glow-cyan rounded-full bg-val-obsidian/80 backdrop-blur-md shrink-0">
          {/* SVG Circular Progress */}
          <svg class="absolute inset-0 w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="50%"
              cy="50%"
              r="calc(50% - 6px)"
              fill="transparent"
              stroke="rgba(0, 229, 255, 0.1)"
              stroke-width="6"
            />
            {/* Progress Circle */}
            <circle
              cx="50%"
              cy="50%"
              r="calc(50% - 6px)"
              fill="transparent"
              stroke="#00E5FF"
              stroke-width="6"
              pathLength="100"
              stroke-dasharray="100"
              stroke-dashoffset={100 - scorePercent()}
              stroke-linecap="round"
              class="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Inner Text */}
          <div class="flex flex-col items-center text-center z-10 mt-1">
            <span class="text-4xl sm:text-5xl font-black font-tactical text-val-cyan tracking-tight leading-none drop-shadow-md">
              {props.valIndexScore}
            </span>
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              / 1000 PTS
            </span>
          </div>
        </div>

        {/* Text Details */}
        <div class="text-center space-y-1">
          <div class="flex items-center justify-center gap-2">
            <span class="text-[10px] font-black text-val-cyan uppercase font-tactical tracking-widest">
              VAL-Index Mastery Tier
            </span>
            <span class="w-2 h-2 rounded-full bg-val-emerald shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          </div>
          <h3 class="text-xl sm:text-2xl font-black text-white font-tactical tracking-wide leading-tight px-2">
            {props.valIndexGrade}
          </h3>
        </div>

      </div>

      {/* 2x2 Metric Grid (Compact & Futuristic) */}
      <div class="relative z-10 grid grid-cols-2 gap-3 pt-2 border-t border-val-border/50">
        
        {/* Round Win % */}
        <div class="bg-val-obsidian/50 rounded-lg p-3 sm:p-4 border border-val-border hover:border-val-cyan/40 transition-colors shadow-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-1 h-3 rounded-sm bg-val-cyan shadow-[0_0_6px_rgba(0,229,255,0.6)]" />
            <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-tactical">
              Round Win %
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-xl sm:text-2xl font-black text-white font-tactical tracking-tight">{props.roundWinRate}%</span>
            <span class="text-[9px] font-bold text-val-cyan px-2 py-0.5 rounded bg-val-cyan/10 border border-val-cyan/20 self-start mt-1 shadow-sm">
              S • Top 1.0%
            </span>
          </div>
        </div>

        {/* KAST */}
        <div class="bg-val-obsidian/50 rounded-lg p-3 sm:p-4 border border-val-border hover:border-val-emerald/40 transition-colors shadow-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-1 h-3 rounded-sm bg-val-emerald shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
            <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-tactical">
              KAST Rating
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-xl sm:text-2xl font-black text-val-emerald font-tactical tracking-tight">{props.kastPercent}%</span>
            <span class="text-[9px] font-bold text-val-emerald px-2 py-0.5 rounded bg-val-emerald/10 border border-val-emerald/20 self-start mt-1 shadow-sm">
              A • Top 22.0%
            </span>
          </div>
        </div>

        {/* ACS */}
        <div class="bg-val-obsidian/50 rounded-lg p-3 sm:p-4 border border-val-border hover:border-val-gold/40 transition-colors shadow-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-1 h-3 rounded-sm bg-val-gold shadow-[0_0_6px_rgba(234,166,48,0.6)]" />
            <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-tactical">
              Combat Score
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-xl sm:text-2xl font-black text-val-gold font-tactical tracking-tight">{props.acs}</span>
            <span class="text-[9px] font-bold text-val-gold px-2 py-0.5 rounded bg-val-gold/10 border border-val-gold/20 self-start mt-1 shadow-sm">
              S • Top 1.1%
            </span>
          </div>
        </div>

        {/* DDΔ */}
        <div class="bg-val-obsidian/50 rounded-lg p-3 sm:p-4 border border-val-border hover:border-val-red/40 transition-colors shadow-lg">
          <div class="flex items-center gap-2 mb-2">
            <span class="w-1 h-3 rounded-sm bg-val-red shadow-[0_0_6px_rgba(255,70,85,0.6)]" />
            <span class="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest font-tactical">
              DDΔ / Round
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-xl sm:text-2xl font-black text-val-red font-tactical tracking-tight">
              {props.damageDelta > 0 ? `+${props.damageDelta}` : props.damageDelta}
            </span>
            <span class="text-[9px] font-bold text-val-red px-2 py-0.5 rounded bg-val-red/10 border border-val-red/20 self-start mt-1 shadow-sm">
              S • Top 0.9%
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
