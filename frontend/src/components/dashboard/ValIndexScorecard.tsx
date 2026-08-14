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
  // Calculate stroke dasharray for the circular progress (circumference = 2 * Math.PI * r)
  // r = 80, circumference ≈ 502.6
  const circumference = 502.6;
  const strokeDashoffset = createMemo(() => {
    const percentage = Math.min(Math.max(props.valIndexScore / 1000, 0), 1);
    return circumference - (percentage * circumference);
  });

  return (
    <div class="card p-6 flex flex-col items-center justify-center space-y-6 h-full">
      {/* Circular Gauge */}
      <div class="relative w-48 h-48 flex items-center justify-center">
        {/* Background Circle */}
        <svg class="absolute inset-0 w-full h-full transform -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="80"
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.05)"
            stroke-width="8"
          />
          {/* Progress Circle */}
          <circle
            cx="96"
            cy="96"
            r="80"
            fill="transparent"
            stroke="currentColor"
            stroke-width="8"
            stroke-dasharray={circumference}
            stroke-dashoffset={strokeDashoffset()}
            class="text-accent transition-all duration-1000 ease-out"
            stroke-linecap="round"
          />
        </svg>
        
        {/* Center Text */}
        <div class="flex flex-col items-center text-center">
          <span class="text-4xl font-bold text-txt-primary tracking-tight">{props.valIndexScore}</span>
          <span class="text-xs font-semibold text-txt-muted uppercase tracking-widest mt-1">/ 1000</span>
        </div>
      </div>

      {/* Grade Text */}
      <div class="text-center space-y-1">
        <h3 class="text-xs font-bold text-txt-muted uppercase tracking-widest">VAL-INDEX</h3>
        <p class="text-lg font-bold text-txt-primary">{props.valIndexGrade}</p>
      </div>

      {/* 2x2 Metric Grid */}
      <div class="w-full grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-border">
        {/* Round Win % */}
        <div class="bg-surface-0 rounded-xl p-3 border border-border flex items-center justify-between group">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center text-accent font-bold text-xs">
              {Math.round(props.roundWinRate)}
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Round Win</span>
              <span class="text-sm font-bold text-txt-primary">{props.roundWinRate}%</span>
            </div>
          </div>
        </div>

        {/* KAST */}
        <div class="bg-surface-0 rounded-xl p-3 border border-border flex items-center justify-between group">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success font-bold text-xs">
              {Math.round(props.kastPercent)}
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-txt-muted uppercase tracking-wider">KAST</span>
              <span class="text-sm font-bold text-txt-primary">{props.kastPercent}%</span>
            </div>
          </div>
        </div>

        {/* ACS */}
        <div class="bg-surface-0 rounded-xl p-3 border border-border flex items-center justify-between group">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-warn/20 flex items-center justify-center text-warn font-bold text-xs">
              {Math.round(props.acs)}
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-txt-muted uppercase tracking-wider">ACS</span>
              <span class="text-sm font-bold text-txt-primary">{props.acs}</span>
            </div>
          </div>
        </div>

        {/* DDΔ */}
        <div class="bg-surface-0 rounded-xl p-3 border border-border flex items-center justify-between group">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
              {props.damageDelta}
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] font-bold text-txt-muted uppercase tracking-wider">DDΔ / R</span>
              <span class="text-sm font-bold text-txt-primary">{props.damageDelta > 0 ? `+${props.damageDelta}` : props.damageDelta}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
