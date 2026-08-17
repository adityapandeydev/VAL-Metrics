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
    <div class="tactical-panel p-5 space-y-6 flex flex-col shrink-0 overflow-hidden group">
      
      {/* Background Pattern */}
      <div class="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPjwvc3ZnPg==')] opacity-20 pointer-events-none" />

      {/* Top Section: Score HUD */}
      <div class="relative z-10 flex flex-col items-center justify-center space-y-4 flex-1 mt-2">
        
        {/* Tactical HUD Ring */}
        <div class="relative w-36 h-36 flex items-center justify-center bg-[#0A0D14] rounded-full border border-val-cyan/10 shadow-[0_0_15px_rgba(0,229,255,0.1)] group-hover:shadow-[0_0_25px_rgba(0,229,255,0.2)] transition-shadow">
          <svg class="absolute inset-0 w-full h-full transform -rotate-90">
            {/* Background Track */}
            <circle
              cx="50%" cy="50%" r="calc(50% - 6px)"
              fill="transparent"
              stroke="rgba(0, 229, 255, 0.05)"
              stroke-width="2"
            />
            {/* Dashed outer ring */}
            <circle
              cx="50%" cy="50%" r="calc(50% - 2px)"
              fill="transparent"
              stroke="rgba(0, 229, 255, 0.2)"
              stroke-width="1"
              stroke-dasharray="4 6"
            />
            {/* Progress Bar */}
            <circle
              cx="50%" cy="50%" r="calc(50% - 6px)"
              fill="transparent"
              stroke="#00E5FF"
              stroke-width="4"
              pathLength="100"
              stroke-dasharray="100"
              stroke-dashoffset={100 - scorePercent()}
              stroke-linecap="butt"
              class="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
            />
          </svg>

          {/* Inner Data */}
          <div class="flex flex-col items-center text-center z-10 mt-2">
            <span class="text-5xl font-black font-tactical text-white tracking-tight leading-none">
              {props.valIndexScore}
            </span>
            <span class="text-[9px] font-bold text-val-cyan font-tactical uppercase tracking-widest mt-1">
              VAL-INDEX
            </span>
          </div>
        </div>

        {/* Grade */}
        <div class="text-center">
          <div class="inline-block border border-val-cyan/20 bg-val-cyan/5 px-4 py-1">
            <span class="text-lg font-black text-val-cyan font-tactical tracking-widest uppercase">
              {props.valIndexGrade}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Grid */}
      <div class="relative z-10 grid grid-cols-2 gap-3 pt-4 border-t border-val-border/50">
        
        {/* Win Rate */}
        <div class="bg-[#0A0D14] p-3 border-l-2 border-val-cyan group-hover:bg-val-cyan/5 transition-colors">
          <span class="text-[9px] font-bold text-val-muted font-tactical uppercase tracking-widest block mb-1">Win Rate</span>
          <div class="flex items-end justify-between">
            <span class="text-xl font-black text-white font-tactical leading-none">{props.roundWinRate}%</span>
            <span class="text-[9px] text-val-cyan font-tactical">TOP 1%</span>
          </div>
        </div>

        {/* KAST */}
        <div class="bg-[#0A0D14] p-3 border-l-2 border-val-emerald group-hover:bg-val-emerald/5 transition-colors">
          <span class="text-[9px] font-bold text-val-muted font-tactical uppercase tracking-widest block mb-1">KAST Rating</span>
          <div class="flex items-end justify-between">
            <span class="text-xl font-black text-white font-tactical leading-none">{props.kastPercent}%</span>
            <span class="text-[9px] text-val-emerald font-tactical">TOP 22%</span>
          </div>
        </div>

        {/* ACS */}
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
