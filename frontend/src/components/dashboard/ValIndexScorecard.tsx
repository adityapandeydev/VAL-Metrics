import { Component } from 'solid-js';

interface Props {
  valIndexScore: number;
  valIndexGrade: string;
  roundWinRate: number;
  kastPercent: number;
  acs: number;
  damageDelta: number;
}

export const ValIndexScorecard: Component<Props> = (props) => {
  return (
    <div class="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#101726] via-[#152136] to-[#101726] border border-val-cyan/30 shadow-2xl p-6">
      <div class="absolute top-0 right-0 w-80 h-80 bg-val-cyan/10 rounded-full blur-3xl pointer-events-none" />
      
      <div class="relative z-10 flex flex-col xl:flex-row items-center justify-between gap-6">
        
        {/* Left Badge: VAL-Index Sovereign Gauge */}
        <div class="flex items-center gap-6 bg-[#0B0E14]/90 p-5 rounded-2xl border border-white/10 shadow-xl w-full xl:w-auto">
          <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-val-cyan via-teal-500 to-emerald-600 p-0.5 shadow-glow-cyan flex items-center justify-center">
            <div class="w-full h-full bg-[#0B0E14] rounded-[14px] flex flex-col items-center justify-center text-center p-2">
              <span class="text-3xl font-black font-tactical text-val-cyan tracking-tight leading-none">{props.valIndexScore}</span>
              <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">/ 1000</span>
            </div>
          </div>

          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-val-cyan uppercase font-tactical tracking-widest">VAL-Index Mastery</span>
              <span class="w-2 h-2 rounded-full bg-val-emerald animate-pulse" />
            </div>
            <h3 class="text-2xl font-black text-white font-tactical tracking-wide">{props.valIndexGrade}</h3>
            <p class="text-[11px] text-val-muted">Proprietary mathematical aggregation of Combat Score, Survival, & Deltas.</p>
          </div>
        </div>

        {/* Right Pillar Breakdown (Round Win %, KAST, ACS, DDA) */}
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto flex-1">
          
          {/* Round Win % */}
          <div class="bg-black/40 border border-white/5 rounded-xl p-4 text-center hover:border-val-cyan/30 transition-all">
            <span class="text-[11px] font-bold text-val-muted uppercase font-tactical block">Round Win %</span>
            <p class="text-2xl font-black text-white font-tactical my-1">{props.roundWinRate}%</p>
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-val-cyan/15 text-val-cyan inline-block">
              S • Top 1.0%
            </span>
          </div>

          {/* KAST */}
          <div class="bg-black/40 border border-white/5 rounded-xl p-4 text-center hover:border-val-emerald/30 transition-all">
            <span class="text-[11px] font-bold text-val-muted uppercase font-tactical block">KAST Rating 🛡️</span>
            <p class="text-2xl font-black text-val-emerald font-tactical my-1">{props.kastPercent}%</p>
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-val-emerald/15 text-val-emerald inline-block">
              A • Top 22.0%
            </span>
          </div>

          {/* ACS */}
          <div class="bg-black/40 border border-white/5 rounded-xl p-4 text-center hover:border-val-gold/30 transition-all">
            <span class="text-[11px] font-bold text-val-muted uppercase font-tactical block">Combat Score (ACS)</span>
            <p class="text-2xl font-black text-val-gold font-tactical my-1">{props.acs}</p>
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-val-gold/15 text-val-gold inline-block">
              S • Top 1.1%
            </span>
          </div>

          {/* DDA Delta */}
          <div class="bg-black/40 border border-white/5 rounded-xl p-4 text-center hover:border-val-red/30 transition-all">
            <span class="text-[11px] font-bold text-val-muted uppercase font-tactical block">DDΔ / Round ⚔️</span>
            <p class="text-2xl font-black text-val-red font-tactical my-1">+{props.damageDelta}</p>
            <span class="text-[10px] font-extrabold px-2 py-0.5 rounded bg-val-red/15 text-val-red inline-block">
              S • Top 0.9%
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
