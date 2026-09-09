import { Component, For, createSignal, createMemo } from 'solid-js';
import { AdvancedPlayerMetrics, AgentPerformance } from '../../../types/analytics';
import { ALL_AGENTS, AgentData, AgentRole } from '../../../data/agents';

interface Props {
  stats: AdvancedPlayerMetrics;
}

export const AgentsTab: Component<Props> = (props) => {
  const [selectedRole, setSelectedRole] = createSignal<string>('ALL');
  const [searchQuery, setSearchQuery] = createSignal<string>('');

  // Map of played agents from telemetry
  const playedAgentMap = createMemo(() => {
    const map = new Map<string, AgentPerformance>();
    (props.stats.agentLeaderboard || []).forEach(a => {
      map.set(a.agentName.toLowerCase(), a);
    });
    return map;
  });

  // Filter and sort agents: played agents first, then unplayed
  const filteredAgents = createMemo(() => {
    const list = ALL_AGENTS.filter(agent => {
      if (selectedRole() !== 'ALL' && agent.role.toUpperCase() !== selectedRole()) {
        return false;
      }
      if (searchQuery() && !agent.name.toLowerCase().includes(searchQuery().toLowerCase())) {
        return false;
      }
      return true;
    });

    // Sort: played agents first by matches/winrate, then unplayed alphabetically
    return list.sort((a, b) => {
      const aPlayed = playedAgentMap().has(a.name.toLowerCase());
      const bPlayed = playedAgentMap().has(b.name.toLowerCase());
      if (aPlayed && !bPlayed) return -1;
      if (!aPlayed && bPlayed) return 1;
      if (aPlayed && bPlayed) {
        const aStats = playedAgentMap().get(a.name.toLowerCase())!;
        const bStats = playedAgentMap().get(b.name.toLowerCase())!;
        return bStats.matchesPlayed - aStats.matchesPlayed;
      }
      return a.name.localeCompare(b.name);
    });
  });

  const getRoleBadgeStyle = (role: AgentRole) => {
    switch (role) {
      case 'Duelist': return 'bg-val-red/15 text-val-red border-val-red/30';
      case 'Initiator': return 'bg-val-cyan/15 text-val-cyan border-val-cyan/30';
      case 'Controller': return 'bg-val-gold/15 text-val-gold border-val-gold/30';
      case 'Sentinel': return 'bg-val-emerald/15 text-val-emerald border-val-emerald/30';
    }
  };

  return (
    <div class="space-y-6 animate-fade-in">
      
      {/* Top Controls: Role Filter Pills & Agent Search Input */}
      <div class="glass-card rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Role Filter Pills */}
        <div class="glass-pill p-1 rounded-xl flex items-center gap-1 overflow-x-auto max-w-full">
          <button
            onClick={() => setSelectedRole('ALL')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole() === 'ALL' ? 'bg-white/20 text-white' : 'text-val-muted hover:text-white'
            }`}
          >
            ALL ROLES ({ALL_AGENTS.length})
          </button>
          <button
            onClick={() => setSelectedRole('DUELIST')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole() === 'DUELIST' ? 'bg-val-red text-white' : 'text-val-muted hover:text-white'
            }`}
          >
            DUELISTS (8)
          </button>
          <button
            onClick={() => setSelectedRole('INITIATOR')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole() === 'INITIATOR' ? 'bg-val-cyan text-val-obsidian font-black' : 'text-val-muted hover:text-white'
            }`}
          >
            INITIATORS (7)
          </button>
          <button
            onClick={() => setSelectedRole('CONTROLLER')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole() === 'CONTROLLER' ? 'bg-val-gold text-val-obsidian font-black' : 'text-val-muted hover:text-white'
            }`}
          >
            CONTROLLERS (7)
          </button>
          <button
            onClick={() => setSelectedRole('SENTINEL')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedRole() === 'SENTINEL' ? 'bg-val-emerald text-val-obsidian font-black' : 'text-val-muted hover:text-white'
            }`}
          >
            SENTINELS (7)
          </button>
        </div>

        {/* Quick Search */}
        <div class="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery()}
            onInput={(e) => setSearchQuery(e.currentTarget.value)}
            placeholder="Filter by agent name..."
            class="w-full bg-black/50 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-tactical text-white placeholder-slate-500 focus:outline-none focus:border-val-cyan"
          />
        </div>

      </div>

      {/* Agents Roster Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <For each={filteredAgents()}>
          {(agent) => {
            const telemetry = playedAgentMap().get(agent.name.toLowerCase());
            const hasPlayed = !!telemetry;

            return (
              <div class="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between space-y-4 group">
                
                {/* Agent Header: Avatar, Name, Role Badge */}
                <div class="flex items-start justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="relative w-14 h-14 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform shadow-md">
                      <img src={agent.iconUrl} alt={agent.name} class="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 class="text-xl font-black font-tactical text-white tracking-wide group-hover:text-val-cyan transition-colors">
                        {agent.name}
                      </h3>
                      <span class={`text-[10px] font-black font-tactical uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block mt-0.5 ${getRoleBadgeStyle(agent.role)}`}>
                        {agent.role} • {agent.origin}
                      </span>
                    </div>
                  </div>

                  {hasPlayed ? (
                    <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-val-emerald/10 text-val-emerald border border-val-emerald/30 uppercase">
                      ACTIVE FORM
                    </span>
                  ) : (
                    <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 uppercase">
                      UNPLAYED THIS ACT
                    </span>
                  )}
                </div>

                {/* Telemetry Statistics or Ability Blueprint */}
                {hasPlayed && telemetry ? (
                  <div class="space-y-3 font-tactical">
                    <div class="grid grid-cols-4 gap-2 text-center bg-black/40 p-3 rounded-2xl border border-white/5">
                      <div>
                        <span class="text-[9px] font-bold text-val-muted uppercase block">MATCHES</span>
                        <span class="text-base font-black text-white">{telemetry.matchesPlayed}</span>
                      </div>
                      <div>
                        <span class="text-[9px] font-bold text-val-muted uppercase block">WIN RATE</span>
                        <span class="text-base font-black text-val-emerald">{telemetry.winRate}%</span>
                      </div>
                      <div>
                        <span class="text-[9px] font-bold text-val-muted uppercase block">K/D</span>
                        <span class="text-base font-black text-val-cyan">{telemetry.kdRatio}</span>
                      </div>
                      <div>
                        <span class="text-[9px] font-bold text-val-muted uppercase block">ACS</span>
                        <span class="text-base font-black text-val-gold">{telemetry.acs}</span>
                      </div>
                    </div>

                    <div class="flex items-center justify-between text-xs pt-1">
                      <span class="text-val-muted">Best Map Performance:</span>
                      <span class="font-bold text-white uppercase font-mono">
                        {telemetry.bestMapName} ({telemetry.bestMapWinRate}% WR)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div class="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-2 text-xs font-tactical">
                    <p class="text-slate-400 line-clamp-2 leading-relaxed">
                      {agent.description}
                    </p>
                    <div class="flex items-center justify-between pt-1 text-[11px] border-t border-white/5">
                      <span class="text-val-muted">Signature: <strong class="text-white">{agent.signatureAbility}</strong></span>
                      <span class="text-val-muted">Ultimate: <strong class="text-val-cyan">{agent.ultimateAbility}</strong></span>
                    </div>
                  </div>
                )}

              </div>
            );
          }}
        </For>
      </div>

    </div>
  );
};
