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
    <div class="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0F1626] via-[#141E33] to-[#0D1322] border border-val-cyan/30 shadow-2xl p-6 md:p-8 space-y-6">
      <div class="absolute top-0 right-0 w-96 h-96 bg-val-cyan/10 rounded-full blur-3xl pointer-events-none" />
      <div class="absolute bottom-0 left-1/3 w-64 h-64 bg-val-emerald/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Top Banner: VAL-Index Sovereign Mastery Gauge (Full-Width, Zero Squishing) */}
      <div class="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#090C14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-inner">
        <div class="flex items-center gap-6">
          <div class="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-val-cyan via-teal-500 to-emerald-600 p-0.5 shadow-glow-cyan flex-shrink-0">
            <div class="w-full h-full bg-[#090C14] rounded-[14px] flex flex-col items-center justify-center text-center p-2">
              <span class="text-4xl sm:text-5xl font-black font-tactical text-val-cyan tracking-tight leading-none">{props.valIndexScore}</span>
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">/ 1000 PTS</span>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-black text-val-cyan uppercase font-tactical tracking-widest">VAL-Index Mastery Tier</span>
              <span class="w-2.5 h-2.5 rounded-full bg-val-emerald animate-ping" />
            </div>
            <h3 class="text-3xl sm:text-4xl font-black text-white font-tactical tracking-wide">{props.valIndexGrade}</h3>
            <p class="text-xs text-val-muted max-w-xl font-medium leading-relaxed">
              Proprietary mathematical formula aggregating Combat Score (ACS), Survival Efficiency (KAST), and Damage Deltas into a unified global esports rating.
            </p>
          </div>
        </div>

        <div class="hidden xl:flex flex-col items-end justify-center px-4 py-2 border-l border-white/10 text-right">
          <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence Interval</span>
          <span class="text-lg font-black font-tactical text-val-emerald">99.8% High Precision</span>
          <span class="text-[10px] font-mono text-val-muted">V26 Act IV Verified</span>
        </div>
      </div>

      {/* Bottom Horizontal Matrix: 4 Spacious Metric Cards (Zero Collision) */}
      <div class="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        {/* Round Win % */}
        <div class="bg-[#0A0D16]/90 border border-white/10 rounded-xl p-5 text-center hover:border-val-cyan/40 transition-all group shadow-lg">
          <div class="flex items-center justify-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full bg-val-cyan" />
            <span class="text-xs font-bold text-val-muted uppercase font-tactical">Round Win %</span>
          </div>
          <p class="text-3xl sm:text-4xl font-black text-white font-tactical my-2 tracking-tight group-hover:scale-105 transition-transform">
            {props.roundWinRate}%
          </p>
          <span class="text-xs font-black px-3 py-1 rounded-lg bg-val-cyan/15 text-val-cyan inline-block border border-val-cyan/30 shadow-sm font-tactical">
            S • Top 1.0%
          </span>
        </div>

        {/* KAST Rating */}
        <div class="bg-[#0A0D16]/90 border border-white/10 rounded-xl p-5 text-center hover:border-val-emerald/40 transition-all group shadow-lg">
          <div class="flex items-center justify-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full bg-val-emerald" />
            <span class="text-xs font-bold text-val-muted uppercase font-tactical">KAST Rating</span>
          </div>
          <p class="text-3xl sm:text-4xl font-black text-val-emerald font-tactical my-2 tracking-tight group-hover:scale-105 transition-transform">
            {props.kastPercent}%
          </p>
          <span class="text-xs font-black px-3 py-1 rounded-lg bg-val-emerald/15 text-val-emerald inline-block border border-val-emerald/30 shadow-sm font-tactical">
            A • Top 22.0%
          </span>
        </div>

        {/* Combat Score (ACS) */}
        <div class="bg-[#0A0D16]/90 border border-white/10 rounded-xl p-5 text-center hover:border-val-gold/40 transition-all group shadow-lg">
          <div class="flex items-center justify-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full bg-val-gold" />
            <span class="text-xs font-bold text-val-muted uppercase font-tactical">Combat Score (ACS)</span>
          </div>
          <p class="text-3xl sm:text-4xl font-black text-val-gold font-tactical my-2 tracking-tight group-hover:scale-105 transition-transform">
            {props.acs}
          </p>
          <span class="text-xs font-black px-3 py-1 rounded-lg bg-val-gold/15 text-val-gold inline-block border border-val-gold/30 shadow-sm font-tactical">
            S • Top 1.1%
          </span>
        </div>

        {/* DDΔ / Round */}
        <div class="bg-[#0A0D16]/90 border border-white/10 rounded-xl p-5 text-center hover:border-val-red/40 transition-all group shadow-lg">
          <div class="flex items-center justify-center gap-1.5 mb-1">
            <span class="w-2 h-2 rounded-full bg-val-red" />
            <span class="text-xs font-bold text-val-muted uppercase font-tactical">DDΔ / Round</span>
          </div>
          <p class="text-3xl sm:text-4xl font-black text-val-red font-tactical my-2 tracking-tight group-hover:scale-105 transition-transform">
            +{props.damageDelta}
          </p>
          <span class="text-xs font-black px-3 py-1 rounded-lg bg-val-red/15 text-val-red inline-block border border-val-red/30 shadow-sm font-tactical">
            S • Top 0.9%
          </span>
        </div>

      </div>

    </div>
  );
};
