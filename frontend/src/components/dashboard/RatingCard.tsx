import { Component } from 'solid-js';

interface Props {
  currentRating?: string;
  level?: number;
  recordString?: string;
  peakRating?: string;
  peakAct?: string;
}

export const RatingCard: Component<Props> = (props) => {
  return (
    <div class="glass-panel rounded-2xl p-5 border border-white/10 space-y-5 shadow-xl relative overflow-hidden group">
      <div class="absolute -right-8 -top-8 w-32 h-32 bg-val-red/10 rounded-full blur-2xl pointer-events-none group-hover:bg-val-red/20 transition-all" />
      
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <span class="text-xs font-extrabold text-val-muted font-tactical uppercase tracking-widest flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-val-cyan animate-ping" />
          Current Standing
        </span>
        <span class="text-xs font-mono text-val-muted px-2 py-0.5 rounded bg-black/40 border border-white/5">
          Level {props.level || 31}
        </span>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div class="space-y-1">
          <h3 class="text-3xl font-black text-white font-tactical tracking-wide">
            {props.currentRating || "Unranked"}
          </h3>
          <p class="text-xs text-val-emerald font-bold tracking-wider">
            Placement Phase • Active Act
          </p>
        </div>

        <div class="w-16 h-16 rounded-2xl border-2 border-val-cyan/40 bg-val-cyan/10 flex flex-col items-center justify-center font-tactical text-center p-2 shadow-glow-cyan">
          <span class="text-sm font-black text-white leading-none">{props.recordString || "2 W"}</span>
          <span class="text-[10px] font-extrabold text-val-cyan mt-0.5">0 L</span>
        </div>
      </div>

      {/* Peak Rating Banner */}
      <div class="bg-[#0A0D14] p-3.5 rounded-xl border border-white/5 flex items-center justify-between hover:border-val-gold/30 transition-all">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-val-gold/40 flex items-center justify-center text-lg shadow-inner">
            🛡️
          </div>
          <div>
            <span class="text-[10px] font-semibold text-val-muted uppercase block leading-tight">Peak Career Standing</span>
            <span class="text-base font-extrabold text-white font-tactical">{props.peakRating || "Silver 2"}</span>
          </div>
        </div>
        <span class="text-[10px] font-black font-tactical px-2 py-1 rounded bg-val-gold/15 text-val-gold border border-val-gold/30">
          {props.peakAct || "V26: ACT III"}
        </span>
      </div>
    </div>
  );
};
