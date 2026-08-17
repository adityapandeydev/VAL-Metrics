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
    <div class="tactical-panel p-5 space-y-5 shadow-xl relative group">
      
      {/* Top Banner */}
      <div class="flex items-center justify-between border-b border-val-border/50 pb-3">
        <span class="text-xs font-bold text-val-muted font-tactical uppercase tracking-widest flex items-center gap-2">
          <span class="w-1.5 h-1.5 bg-val-cyan shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
          Current Standing
        </span>
        <div class="relative group-hover:text-white transition-colors">
          <span class="absolute inset-0 bg-val-cyan/10 blur-sm scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span class="relative text-xs font-black font-tactical text-val-cyan tracking-widest uppercase">
            Level {props.level || 31}
          </span>
        </div>
      </div>

      {/* Main Data */}
      <div class="flex items-center justify-between gap-4">
        <div class="space-y-0.5">
          <h3 class="text-3xl font-black text-white font-tactical tracking-wide uppercase">
            {props.currentRating || "Unranked"}
          </h3>
          <p class="text-[10px] font-bold text-val-emerald font-tactical tracking-widest uppercase">
            Placement Phase • Active Act
          </p>
        </div>

        {/* Tactical W/L Box */}
        <div class="relative w-16 h-16 bg-[#0A0D14] flex flex-col items-center justify-center border border-val-cyan/20 group-hover:border-val-cyan/60 transition-colors">
          <div class="absolute top-0 left-0 w-2 h-2 border-t border-l border-val-cyan/80" />
          <div class="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-val-cyan/80" />
          
          <span class="text-lg font-black text-white font-tactical leading-none">{props.recordString ? props.recordString.split('-')[0].trim() : "2W"}</span>
          <span class="text-[10px] font-bold text-val-cyan font-tactical mt-0.5">{props.recordString && props.recordString.includes('-') ? props.recordString.split('-')[1].trim() : "0L"}</span>
        </div>
      </div>

      {/* Peak Rating Strip */}
      <div class="bg-gradient-to-r from-[#0A0D14] to-transparent p-3 border-l-2 border-val-gold flex items-center justify-between group-hover:bg-val-gold/5 transition-colors">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-val-gold/10 flex items-center justify-center text-[10px] font-black font-tactical text-val-gold">
            PEAK
          </div>
          <div>
            <span class="text-[9px] font-bold text-val-muted font-tactical uppercase tracking-widest block">Peak Career</span>
            <span class="text-base font-black text-white font-tactical uppercase">{props.peakRating || "Silver 2"}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-[10px] font-bold text-val-gold font-tactical uppercase tracking-wider">{props.peakAct || "E7: ACT III"}</span>
        </div>
      </div>
    </div>
  );
};
