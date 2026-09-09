import { Component, createMemo } from 'solid-js';
import { AdvancedPlayerMetrics } from '../../../types/analytics';

interface Props {
  stats: AdvancedPlayerMetrics;
}

export const PerformanceTab: Component<Props> = (props) => {
  // Compute normalized 0-100 scores for the 5 tactical pillars
  const fraggingScore = createMemo(() => Math.min(100, Math.round(((props.stats.averageCombatScore || 250) / 320) * 100)));
  const survivalScore = createMemo(() => Math.min(100, Math.round(((props.stats.kastPercent || 70) / 85) * 100)));
  const damageScore = createMemo(() => Math.min(100, Math.max(20, Math.round((((props.stats.damageDeltaPerRound || 30) + 40) / 90) * 100))));
  const utilityScore = createMemo(() => Math.min(100, Math.round((((props.stats.assists || 40) + (props.stats.firstBloods || 15) * 2) / 100) * 100)));
  const objectiveScore = createMemo(() => Math.min(100, Math.round(((props.stats.roundWinRate || 55) / 65) * 100)));

  // SVG Radar Polygon coordinates
  const radarPoints = createMemo(() => {
    // 5 vertices on unit circle: 0, 72, 144, 216, 288 degrees
    const center = 110;
    const radius = 90;
    const scores = [
      fraggingScore() / 100,
      survivalScore() / 100,
      damageScore() / 100,
      utilityScore() / 100,
      objectiveScore() / 100,
    ];

    return scores.map((val, i) => {
      const angle = (i * 72 - 90) * (Math.PI / 180);
      const r = radius * Math.max(0.2, val);
      const x = Math.round(center + r * Math.cos(angle));
      const y = Math.round(center + r * Math.sin(angle));
      return `${x},${y}`;
    }).join(' ');
  });

  return (
    <div class="space-y-6 animate-fade-in">
      
      {/* Top Section: 5-Pillar Attribute Radar (Left) + Damage Benchmark (Right) */}
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left (5 Cols): Holographic Attribute Radar */}
        <div class="xl:col-span-5 glass-card glass-card-hover rounded-3xl p-6 sm:p-7 flex flex-col justify-between">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-val-cyan shadow-[0_0_10px_#00E5FF] animate-pulse" />
              <span class="text-xs font-black font-tactical tracking-widest text-white uppercase">
                TACTICAL ATTRIBUTE RADAR
              </span>
            </div>
            <span class="text-[10px] font-mono text-val-cyan font-bold px-2 py-0.5 rounded-full bg-val-cyan/10 border border-val-cyan/30">
              5-PILLAR VMS
            </span>
          </div>

          {/* SVG Radar Visualization */}
          <div class="my-6 flex items-center justify-center relative">
            <svg class="w-60 h-60 overflow-visible" viewBox="0 0 220 220">
              {/* Concentric Web Polygons */}
              <polygon points="110,20 196,82 163,183 57,183 24,82" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
              <polygon points="110,47 168,88 145,155 75,155 52,88" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
              <polygon points="110,74 139,95 128,128 92,128 81,95" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1" />

              {/* Axis Spoke Lines */}
              <line x1="110" y1="110" x2="110" y2="20" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2 4" />
              <line x1="110" y1="110" x2="196" y2="82" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2 4" />
              <line x1="110" y1="110" x2="163" y2="183" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2 4" />
              <line x1="110" y1="110" x2="57" y2="183" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2 4" />
              <line x1="110" y1="110" x2="24" y2="82" stroke="rgba(255,255,255,0.1)" stroke-dasharray="2 4" />

              {/* Player Attribute Polygon */}
              <polygon
                points={radarPoints()}
                fill="rgba(0, 229, 255, 0.25)"
                stroke="#00E5FF"
                stroke-width="2.5"
                class="transition-all duration-700 ease-out drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]"
              />

              {/* Vertex Labels */}
              <text x="110" y="10" fill="#FFF" font-size="10" font-weight="bold" font-family="Rajdhani" text-anchor="middle">FRAGGING ({fraggingScore()})</text>
              <text x="205" y="86" fill="#10B981" font-size="10" font-weight="bold" font-family="Rajdhani" text-anchor="start">SURVIVAL ({survivalScore()})</text>
              <text x="170" y="200" fill="#00E5FF" font-size="10" font-weight="bold" font-family="Rajdhani" text-anchor="middle">DAMAGE ({damageScore()})</text>
              <text x="50" y="200" fill="#FF4655" font-size="10" font-weight="bold" font-family="Rajdhani" text-anchor="middle">OBJECTIVE ({objectiveScore()})</text>
              <text x="15" y="86" fill="#EAA630" font-size="10" font-weight="bold" font-family="Rajdhani" text-anchor="end">UTILITY ({utilityScore()})</text>
            </svg>
          </div>

          <div class="pt-3 border-t border-white/[0.08] text-center text-xs font-tactical text-val-muted">
            Computed across all matches in <strong class="text-white">{props.stats.selectedAct || "V26: A4"}</strong>
          </div>
        </div>

        {/* Right (7 Cols): Damage Delta Benchmark Comparison */}
        <div class="xl:col-span-7 glass-card glass-card-hover rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full bg-val-gold shadow-[0_0_10px_#EAA630]" />
              <span class="text-xs font-black font-tactical tracking-widest text-white uppercase">
                DAMAGE DELTA (DDΔ) BENCHMARKING
              </span>
            </div>
            <span class="text-[10px] font-mono text-val-muted">
              COMPARED TO REGIONAL TIER AVERAGES
            </span>
          </div>

          {/* Player DDΔ Callout */}
          <div class="bg-black/40 p-5 rounded-2xl border border-white/5 flex items-center justify-between">
            <div>
              <span class="text-[11px] font-bold text-val-muted font-tactical uppercase">YOUR DAMAGE DELTA PER ROUND</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="text-3xl sm:text-4xl font-black font-tactical text-val-cyan leading-none">
                  +{props.stats.damageDeltaPerRound || 48.0}
                </span>
                <span class="text-xs font-mono font-bold text-val-emerald">TOP 0.8% RADIANT THRESHOLD</span>
              </div>
            </div>
            <div class="text-right font-tactical">
              <span class="text-xs text-val-muted block">AVG DAMAGE DEALT</span>
              <span class="text-lg font-black text-white">{props.stats.damagePerRound || 168.4} ADR</span>
            </div>
          </div>

          {/* Tier Comparison Bars */}
          <div class="space-y-3 font-tactical text-xs">
            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-white font-bold">You (Immortal 2)</span>
                <span class="text-val-cyan font-mono font-bold">+{props.stats.damageDeltaPerRound || 48} DDΔ</span>
              </div>
              <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-val-cyan rounded-full" style={{ width: '88%' }} />
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-slate-400">Radiant Average</span>
                <span class="text-val-gold font-mono">+52 DDΔ</span>
              </div>
              <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-val-gold rounded-full" style={{ width: '92%' }} />
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-slate-400">Ascendant Average</span>
                <span class="text-slate-300 font-mono">+18 DDΔ</span>
              </div>
              <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-slate-500 rounded-full" style={{ width: '62%' }} />
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between text-[11px]">
                <span class="text-slate-400">Diamond Average</span>
                <span class="text-slate-300 font-mono">+4 DDΔ</span>
              </div>
              <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-slate-600 rounded-full" style={{ width: '48%' }} />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Row 2: Clutch Conversion Matrix & Opening Duel Success */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Clutch Conversion Matrix */}
        <div class="glass-card glass-card-hover rounded-3xl p-6 sm:p-7 space-y-4">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span class="text-xs font-black font-tactical text-val-emerald uppercase tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-val-emerald" />
              CLUTCH CONVERSION PROFILE
            </span>
            <span class="text-[10px] font-mono text-val-muted">
              {props.stats.clutches || 7} CLUTCHES SECURED
            </span>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-tactical">
            <div class="bg-black/40 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] font-bold text-val-muted uppercase block">1v1 Clutch</span>
              <span class="text-2xl font-black text-val-emerald mt-1 block">67%</span>
              <span class="text-[9px] font-mono text-slate-400 block mt-0.5">4 Won / 6</span>
            </div>
            <div class="bg-black/40 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] font-bold text-val-muted uppercase block">1v2 Clutch</span>
              <span class="text-2xl font-black text-val-cyan mt-1 block">38%</span>
              <span class="text-[9px] font-mono text-slate-400 block mt-0.5">2 Won / 5</span>
            </div>
            <div class="bg-black/40 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] font-bold text-val-muted uppercase block">1v3 Clutch</span>
              <span class="text-2xl font-black text-val-gold mt-1 block">25%</span>
              <span class="text-[9px] font-mono text-slate-400 block mt-0.5">1 Won / 4</span>
            </div>
            <div class="bg-black/40 p-3 rounded-xl border border-white/5">
              <span class="text-[10px] font-bold text-val-muted uppercase block">1v4 Clutch</span>
              <span class="text-2xl font-black text-slate-400 mt-1 block">0%</span>
              <span class="text-[9px] font-mono text-slate-400 block mt-0.5">0 Won / 2</span>
            </div>
          </div>
        </div>

        {/* Opening Duel (First Blood) Mastery */}
        <div class="glass-card glass-card-hover rounded-3xl p-6 sm:p-7 space-y-4">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span class="text-xs font-black font-tactical text-val-red uppercase tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-val-red" />
              OPENING DUEL (FIRST BLOOD) SUCCESS
            </span>
            <span class="text-[10px] font-mono text-val-muted">
              {props.stats.firstBloods || 28} FIRST BLOODS
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4 font-tactical">
            <div class="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
              <span class="text-[10px] font-bold text-val-muted uppercase block">Attack Side Opening Duels</span>
              <span class="text-3xl font-black text-val-red block">62.5%</span>
              <span class="text-[10px] font-mono text-slate-400 block">15 Won / 9 First Deaths</span>
            </div>

            <div class="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
              <span class="text-[10px] font-bold text-val-muted uppercase block">Defense Side Opening Duels</span>
              <span class="text-3xl font-black text-val-cyan block">72.2%</span>
              <span class="text-[10px] font-mono text-slate-400 block">13 Won / 5 First Deaths</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
