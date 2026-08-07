import { Component, For } from 'solid-js';
import { AgentPerformance } from '../../types/analytics';

interface Props {
  agents?: AgentPerformance[];
}

export const TopAgentsTable: Component<Props> = (props) => {
  const list: AgentPerformance[] = props.agents && props.agents.length > 0 ? props.agents : [
    {
      agentName: "Raze", role: "Duelist", matchesPlayed: 1, playtimeHours: 0.5, winRate: 100.0,
      kdRatio: 1.31, adr: 192.3, acs: 276.4, damageDelta: 58, bestMapName: "Sunset", bestMapWinRate: 100.0,
      agentIconUrl: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png"
    },
    {
      agentName: "Phoenix", role: "Duelist", matchesPlayed: 1, playtimeHours: 0.6, winRate: 100.0,
      kdRatio: 2.00, adr: 230.2, acs: 365.0, damageDelta: 84, bestMapName: "Sunset", bestMapWinRate: 100.0,
      agentIconUrl: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png"
    }
  ];

  return (
    <div class="glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl space-y-5">
      
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-2.5">
          <span class="w-3 h-5 bg-val-cyan rounded-sm shadow-glow-cyan" />
          <span class="text-xs font-black text-val-muted font-tactical uppercase tracking-widest flex items-center gap-2">
            TOP AGENTS
          </span>
        </div>
        <span class="text-xs font-bold text-val-muted font-tactical uppercase">
          Based on total playtime during V26: A4 • <span class="text-val-red hover:underline cursor-pointer">All Agents →</span>
        </span>
      </div>

      <div class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-center">
        <span class="text-[11px] font-bold font-mono text-rose-400 uppercase tracking-widest">
          Disclaimer: Waiting for production API to properly implement these features.
        </span>
      </div>

      {/* Roster Table */}
      <div class="overflow-x-auto">
        <table class="w-full text-left font-tactical border-separate border-spacing-y-3">
          <thead>
            <tr class="text-[11px] font-bold text-val-muted uppercase tracking-wider border-b border-white/10 px-4">
              <th class="pb-2 pl-4">Agent Roster</th>
              <th class="pb-2 text-center">Matches</th>
              <th class="pb-2 text-center">Win %</th>
              <th class="pb-2 text-center">K/D</th>
              <th class="pb-2 text-center">ADR</th>
              <th class="pb-2 text-center">ACS</th>
              <th class="pb-2 text-center">DDΔ</th>
              <th class="pb-2 text-right pr-4">Best Map Performance</th>
            </tr>
          </thead>
          <tbody>
            <For each={list.slice(0, 3)}>
              {(agent) => (
                <tr class="bg-[#0A0D14] hover:bg-[#111726] transition-all rounded-xl shadow-lg border border-white/5 text-sm font-extrabold group">
                  
                  {/* Agent Info */}
                  <td class="py-3.5 pl-4 rounded-l-xl">
                    <div class="flex items-center gap-3.5">
                      <img 
                        src={agent.agentIconUrl} 
                        alt={agent.agentName} 
                        class="w-12 h-12 rounded-xl object-cover bg-black/80 border border-white/10 shadow-md group-hover:scale-105 transition-transform" 
                      />
                      <div>
                        <span class="text-lg font-black text-white block tracking-wide group-hover:text-val-cyan transition-colors">{agent.agentName}</span>
                        <span class="text-[11px] font-medium text-val-muted">{agent.playtimeHours} hours logged</span>
                      </div>
                    </div>
                  </td>

                  {/* Matches */}
                  <td class="text-center text-base text-white">{agent.matchesPlayed}</td>

                  {/* Win Rate */}
                  <td class="text-center text-val-emerald font-black text-base">{agent.winRate}%</td>

                  {/* K/D */}
                  <td class="text-center text-white text-base font-black">{agent.kdRatio}</td>

                  {/* ADR */}
                  <td class="text-center text-slate-300 text-base">{agent.adr}</td>

                  {/* ACS */}
                  <td class="text-center text-val-gold font-black text-base">{agent.acs}</td>

                  {/* DDΔ */}
                  <td class="text-center text-val-cyan font-black text-base">+{agent.damageDelta}</td>

                  {/* Best Map Badge */}
                  <td class="py-3.5 pr-4 rounded-r-xl text-right">
                    <div class="inline-flex items-center justify-between w-[170px] bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
                      <span class="text-white font-black truncate">{agent.bestMapName}</span>
                      <span class="text-[11px] font-extrabold px-2 py-0.5 rounded bg-val-cyan/20 text-val-cyan border border-val-cyan/30 font-mono">
                        {agent.bestMapWinRate}% WR
                      </span>
                    </div>
                  </td>

                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>

    </div>
  );
};
