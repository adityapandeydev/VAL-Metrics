import { Component } from 'solid-js';
import { AdvancedPlayerMetrics } from '../../types/analytics';

interface Props {
  stats?: AdvancedPlayerMetrics;
}

export const CombatOverviewGrid: Component<Props> = (props) => {
  return (
    <div class="tactical-panel rounded-2xl p-6 border border-white/10 shadow-xl space-y-6">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-val-red shadow-glow-red" />
          <h3 class="text-lg font-black font-tactical text-white uppercase tracking-wider">
            {props.stats?.selectedAct || "V26: A4"} COMPETITIVE GUNPLAY OVERVIEW
          </h3>
        </div>
        <span class="text-xs text-val-muted font-tactical font-semibold">
          {props.stats?.playtimeHours || "1.2"}h Playtime • {props.stats?.totalMatches || "2"} Matches Analyzed
        </span>
      </div>

      {/* Primary KPI Row (ADR, K/D, HS%, Win%) */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div class="bg-[#0B0E14] p-4 rounded-xl border border-white/5 relative group hover:border-val-cyan/40 transition-all">
          <span class="text-[9px] font-bold text-val-muted font-tactical uppercase tracking-widest block mb-1">Damage / Round (ADR)</span>
          <div class="flex items-end justify-between">
            <span class="text-3xl font-black text-white font-tactical leading-none">{props.stats?.damagePerRound || "211.6"}</span>
          </div>
          <span class="text-[9px] font-bold text-val-cyan font-tactical uppercase tracking-widest mt-2 block">Top 0.9% Sovereign</span>
        </div>

        <div class="bg-[#0A0D14] rounded-lg p-3 sm:p-4 border border-white/5">
          <span class="text-[9px] font-bold text-val-muted font-tactical uppercase tracking-widest block mb-1">K/D Ratio</span>
          <span class="text-2xl font-black text-val-emerald font-tactical block">{props.stats?.kdRatio || "1.63"}</span>
          <span class="text-[9px] font-bold text-val-emerald font-tactical uppercase tracking-widest mt-2 block">Top 1.0% Lethal</span>
        </div>

        <div class="bg-[#0A0D14] rounded-lg p-3 sm:p-4 border border-white/5">
          <span class="text-[9px] font-bold text-val-muted font-tactical uppercase tracking-widest block mb-1">Headshot %</span>
          <span class="text-2xl font-black text-white font-tactical block">{props.stats?.headshotPercent || "14.6"}%</span>
          <span class="text-[9px] font-bold text-val-red font-tactical uppercase tracking-widest mt-2 block">25 Head Hits</span>
        </div>

        <div class="bg-[#0A0D14] rounded-lg p-3 sm:p-4 border border-white/5">
          <span class="text-[9px] font-bold text-val-muted font-tactical uppercase tracking-widest block mb-1">Win Percentage</span>
          <span class="text-2xl font-black text-val-gold font-tactical block">{props.stats?.winRate || "100.0"}%</span>
          <span class="text-[9px] font-bold text-val-gold font-tactical uppercase tracking-widest mt-2 block">Top 0.1% Undefeated</span>
        </div>

      </div>

      {/* Secondary Depth Metrics Matrix */}
      <div class="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4 pt-2 bg-black/30 p-5 rounded-2xl border border-white/5 text-xs font-medium text-val-muted">
        
        <div>
          <span class="uppercase block text-[10px] font-bold text-slate-400">Wins Record</span>
          <p class="text-xl font-black text-white font-tactical mt-0.5">{props.stats?.wins || "2"}</p>
        </div>

        <div>
          <span class="uppercase block text-[10px] font-bold text-slate-400">KAST Percentage</span>
          <p class="text-xl font-black text-teal-400 font-tactical mt-0.5">{props.stats?.kastPercent || "73.3"}%</p>
          <span class="text-[9px] text-teal-500">Top 22.0%</span>
        </div>

        <div>
          <span class="uppercase block text-[10px] font-bold text-slate-400">DDΔ / Round</span>
          <p class="text-xl font-black text-val-red font-tactical mt-0.5">+{props.stats?.damageDeltaPerRound || "71"}</p>
          <span class="text-[9px] text-val-red">Top 0.9%</span>
        </div>

        <div>
          <span class="uppercase block text-[10px] font-bold text-slate-400">Kills / Deaths / Assists</span>
          <p class="text-xl font-black text-white font-tactical mt-0.5">
            {props.stats?.kills || "49"} <span class="text-slate-500 font-normal">/</span> <span class="text-rose-500">{props.stats?.deaths || "30"}</span> <span class="text-slate-500 font-normal">/</span> {props.stats?.assists || "13"}
          </p>
        </div>

        <div>
          <span class="uppercase block text-[10px] font-bold text-slate-400">Combat Score (ACS)</span>
          <p class="text-xl font-black text-val-gold font-tactical mt-0.5">{props.stats?.averageCombatScore || "321.7"}</p>
          <span class="text-[9px] text-val-gold">Top 1.1%</span>
        </div>

        <div>
          <span class="uppercase block text-[10px] font-bold text-slate-400">KAD Ratio</span>
          <p class="text-xl font-black text-white font-tactical mt-0.5">{props.stats?.kadRatio || "2.07"}</p>
        </div>

        <div>
          <span class="uppercase block text-[10px] font-bold text-slate-400">Kills / Round</span>
          <p class="text-xl font-black text-val-cyan font-tactical mt-0.5">{props.stats?.killsPerRound || "1.1"}</p>
        </div>

        <div class="flex items-center gap-4 border-l border-white/10 pl-4">
          <div>
            <span class="uppercase block text-[10px] text-val-red font-bold">First Bloods</span>
            <p class="text-xl font-black text-white font-tactical">{props.stats?.firstBloods || "11"}</p>
          </div>
          <div>
            <span class="uppercase block text-[10px] text-val-emerald font-bold">Flawless</span>
            <p class="text-xl font-black text-white font-tactical">{props.stats?.flawlessRounds || "1"}</p>
          </div>
          <div>
            <span class="uppercase block text-[10px] text-val-gold font-bold">Aces</span>
            <p class="text-xl font-black text-white font-tactical">{props.stats?.aces || "0"}</p>
          </div>
        </div>

      </div>
    </div>
  );
};
