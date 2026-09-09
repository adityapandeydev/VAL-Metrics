import { Component, For } from 'solid-js';
import { AdvancedPlayerMetrics } from '../../../types/analytics';
import { ValIndexRadialGauge } from '../../widgets/ValIndexRadialGauge';
import { HolographicSilhouette } from '../../widgets/HolographicSilhouette';

interface Props {
  stats: AdvancedPlayerMetrics;
  onNavigateTab: (tab: any) => void;
}

export const OverviewTab: Component<Props> = (props) => {
  const topAgents = () => (props.stats.agentLeaderboard || []).slice(0, 3);
  const topMaps = () => (props.stats.mapDomination || []).slice(0, 3);
  const topWeapons = () => (props.stats.weaponArmory || []).slice(0, 3);

  return (
    <div class="space-y-6 animate-fade-in">
      
      {/* Top Hero Section: VAL-Index & Career Standing (Left) + Combat KPIs & Hit Anatomy (Right) */}
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column (5 Cols on XL): VAL-Index Radial Gauge + Standing */}
        <div class="xl:col-span-5 flex flex-col gap-6">
          
          {/* Hero VAL-Index Radial Gauge */}
          <div class="flex-1">
            <ValIndexRadialGauge
              valIndexScore={props.stats.valIndexScore || 785}
              valIndexGrade={props.stats.valIndexGrade || "S • Top 1.2% Elite"}
              acs={props.stats.averageCombatScore || 285}
              kastPercent={props.stats.kastPercent || 74.5}
              damageDelta={props.stats.damageDeltaPerRound || 48}
              roundWinRate={props.stats.roundWinRate || 58.2}
            />
          </div>

          {/* Current Rating & Placement Card */}
          <div class="glass-card glass-card-hover rounded-3xl p-6 space-y-4">
            <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <span class="text-xs font-black font-tactical text-val-muted uppercase tracking-widest flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-val-gold shadow-[0_0_8px_#EAA630]" />
                CURRENT STANDING & RANK TIER
              </span>
              <span class="text-[11px] font-mono text-val-gold font-bold uppercase">
                {props.stats.selectedQueue || "Competitive"}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <div>
                <h3 class="text-2xl sm:text-3xl font-black font-tactical text-white uppercase tracking-wide">
                  IMMORTAL 2
                </h3>
                <span class="text-[11px] font-mono font-bold text-val-emerald uppercase tracking-wider block mt-0.5">
                  64 RR • Top 0.8% Regional Leaderboard
                </span>
              </div>

              {/* Record Pill */}
              <div class="bg-black/50 px-4 py-2 rounded-2xl border border-white/10 text-center">
                <span class="text-xs font-mono font-bold text-val-muted block">RECORD</span>
                <span class="text-base sm:text-lg font-black font-tactical text-val-emerald">
                  {props.stats.wins || 12}W <span class="text-slate-500 font-normal">-</span> <span class="text-val-red">{props.stats.losses || 6}L</span>
                </span>
              </div>
            </div>

            {/* Win/Loss Proportional Bar */}
            <div class="space-y-1.5 pt-1">
              <div class="flex justify-between text-[11px] font-tactical font-bold">
                <span class="text-val-emerald">{props.stats.winRate || 66.7}% WIN RATE</span>
                <span class="text-slate-400 font-mono">{props.stats.totalMatches || 18} MATCHES ANALYZED</span>
              </div>
              <div class="h-2 w-full bg-val-red/60 rounded-full overflow-hidden flex shadow-inner">
                <div 
                  class="h-full bg-val-emerald progress-animate shadow-[0_0_10px_#10B981]" 
                  style={{ width: `${props.stats.winRate || 66.7}%` }} 
                />
                <div class="h-full bg-val-red flex-1" />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (7 Cols on XL): Primary KPIs & Holographic Hit Anatomy */}
        <div class="xl:col-span-7 flex flex-col gap-6">
          
          {/* Primary 4 Hero KPIs */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* ADR */}
            <div class="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
              <span class="text-[10px] font-black font-tactical text-val-muted uppercase tracking-wider block mb-1">
                DAMAGE / ROUND (ADR)
              </span>
              <span class="text-2xl sm:text-3xl font-black font-tactical text-white block leading-none">
                {props.stats.damagePerRound || 168.4}
              </span>
              <span class="text-[10px] font-bold text-val-cyan font-tactical uppercase tracking-wider mt-2 block">
                Top 1.2% Sovereign
              </span>
            </div>

            {/* K/D */}
            <div class="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
              <span class="text-[10px] font-black font-tactical text-val-muted uppercase tracking-wider block mb-1">
                K/D RATIO
              </span>
              <span class="text-2xl sm:text-3xl font-black font-tactical text-val-emerald block leading-none">
                {props.stats.kdRatio || 1.42}
              </span>
              <span class="text-[10px] font-bold text-val-emerald font-tactical uppercase tracking-wider mt-2 block">
                {props.stats.kills || 184} Kills / {props.stats.deaths || 130} D
              </span>
            </div>

            {/* HS% */}
            <div class="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
              <span class="text-[10px] font-black font-tactical text-val-muted uppercase tracking-wider block mb-1">
                HEADSHOT %
              </span>
              <span class="text-2xl sm:text-3xl font-black font-tactical text-white block leading-none">
                {props.stats.headshotPercent || 22.4}%
              </span>
              <span class="text-[10px] font-bold text-val-red font-tactical uppercase tracking-wider mt-2 block">
                {props.stats.headshots || 64} Head Hits
              </span>
            </div>

            {/* Win % */}
            <div class="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 border border-white/[0.08]">
              <span class="text-[10px] font-black font-tactical text-val-muted uppercase tracking-wider block mb-1">
                WIN RATIO
              </span>
              <span class="text-2xl sm:text-3xl font-black font-tactical text-val-gold block leading-none">
                {props.stats.winRate || 66.7}%
              </span>
              <span class="text-[10px] font-bold text-val-gold font-tactical uppercase tracking-wider mt-2 block">
                {props.stats.wins || 12} Victories
              </span>
            </div>

          </div>

          {/* Secondary Telemetry Grid (ACS, KAST, DDΔ, First Bloods, Clutches, Aces) */}
          <div class="glass-card rounded-2xl p-5 border border-white/[0.08] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center font-tactical">
            
            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[9px] font-bold text-val-muted uppercase block">COMBAT SCORE (ACS)</span>
              <span class="text-xl font-black text-val-gold mt-1 block">{props.stats.averageCombatScore || 278}</span>
            </div>

            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[9px] font-bold text-val-muted uppercase block">KAST RATING</span>
              <span class="text-xl font-black text-val-emerald mt-1 block">{props.stats.kastPercent || 74.5}%</span>
            </div>

            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[9px] font-bold text-val-muted uppercase block">DDΔ / ROUND</span>
              <span class="text-xl font-black text-val-cyan mt-1 block">
                {props.stats.damageDeltaPerRound > 0 ? `+${props.stats.damageDeltaPerRound}` : props.stats.damageDeltaPerRound || '+48'}
              </span>
            </div>

            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[9px] font-bold text-val-muted uppercase block">FIRST BLOODS</span>
              <span class="text-xl font-black text-val-red mt-1 block">{props.stats.firstBloods || 28}</span>
            </div>

            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[9px] font-bold text-val-muted uppercase block">CLUTCHES WON</span>
              <span class="text-xl font-black text-amber-400 mt-1 block">{props.stats.clutches || 7}</span>
            </div>

            <div class="bg-black/30 p-3 rounded-xl border border-white/5">
              <span class="text-[9px] font-bold text-val-muted uppercase block">ACES SCORED</span>
              <span class="text-xl font-black text-purple-400 mt-1 block">{props.stats.aces || 2}</span>
            </div>

          </div>

          {/* Holographic Silhouette Hit Anatomy */}
          <div class="flex-1">
            <HolographicSilhouette
              headshotPercent={props.stats.headshotPercent}
              bodyshotPercent={props.stats.bodyshotPercent}
              legshotPercent={props.stats.legshotPercent}
              totalHits={props.stats.totalHits}
              headshots={props.stats.headshots}
              bodyshots={props.stats.bodyshots}
              legshots={props.stats.legshots}
            />
          </div>

        </div>

      </div>

      {/* Row 2: Intelligence Pods (Top Agents, Top Maps, Top Weapons) */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Top Agents Pod */}
        <div class="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span class="text-xs font-black font-tactical text-val-cyan uppercase tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-val-cyan" />
              TOP COMBAT AGENTS
            </span>
            <button 
              onClick={() => props.onNavigateTab('Agents')}
              class="text-xs font-mono font-bold text-val-muted hover:text-white transition-colors cursor-pointer"
            >
              VIEW ALL →
            </button>
          </div>

          <div class="space-y-3 flex-1">
            <For each={topAgents()}>
              {(agent) => (
                <div class="bg-black/40 p-3 rounded-2xl border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3">
                    <img src={agent.agentIconUrl} alt={agent.agentName} class="w-10 h-10 rounded-xl bg-black object-cover border border-white/10" />
                    <div>
                      <span class="text-sm font-black font-tactical text-white block leading-none">{agent.agentName}</span>
                      <span class="text-[10px] text-val-muted font-mono">{agent.matchesPlayed} Matches • {agent.role}</span>
                    </div>
                  </div>
                  <div class="text-right font-tactical">
                    <span class="text-sm font-black text-val-emerald block leading-none">{agent.winRate}% WR</span>
                    <span class="text-[10px] text-val-cyan font-mono">{agent.kdRatio} K/D</span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Top Maps Pod */}
        <div class="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span class="text-xs font-black font-tactical text-val-gold uppercase tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-val-gold" />
              MAP DOMINATION
            </span>
            <button 
              onClick={() => props.onNavigateTab('Maps')}
              class="text-xs font-mono font-bold text-val-muted hover:text-white transition-colors cursor-pointer"
            >
              VIEW ALL →
            </button>
          </div>

          <div class="space-y-3 flex-1">
            <For each={topMaps()}>
              {(m) => (
                <div class="bg-black/40 p-3 rounded-2xl border border-white/5 hover:border-white/15 transition-all flex items-center justify-between gap-3">
                  <div>
                    <span class="text-sm font-black font-tactical text-white block leading-none uppercase">{m.mapName}</span>
                    <span class="text-[10px] text-val-muted font-mono">{m.matchesPlayed} Matches Analyzed</span>
                  </div>
                  <div class="text-right font-tactical">
                    <span class="text-sm font-black text-val-emerald block leading-none">{m.winRate}% WR</span>
                    <span class="text-[10px] text-val-gold font-mono">{m.recordString}</span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Top Weapons Pod */}
        <div class="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span class="text-xs font-black font-tactical text-val-red uppercase tracking-widest flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-val-red" />
              ARMORY LETHALITY
            </span>
            <button 
              onClick={() => props.onNavigateTab('Weapons')}
              class="text-xs font-mono font-bold text-val-muted hover:text-white transition-colors cursor-pointer"
            >
              VIEW ALL →
            </button>
          </div>

          <div class="space-y-3 flex-1">
            <For each={topWeapons()}>
              {(w) => (
                <div class="bg-black/40 p-3 rounded-2xl border border-white/5 hover:border-white/15 transition-all space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-sm font-black font-tactical text-white block leading-none">{w.weaponName}</span>
                      <span class="text-[10px] text-val-muted font-mono uppercase">{w.category}</span>
                    </div>
                    <span class="text-xs font-black font-tactical text-val-red">{w.totalKills} KILLS</span>
                  </div>
                  <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                    <div class="h-full bg-val-red" style={{ width: `${w.headshotPercent}%` }} />
                    <div class="h-full bg-val-cyan" style={{ width: `${w.bodyshotPercent}%` }} />
                    <div class="h-full bg-slate-600" style={{ width: `${w.legshotPercent}%` }} />
                  </div>
                </div>
              )}
            </For>
          </div>
        </div>

      </div>

    </div>
  );
};
