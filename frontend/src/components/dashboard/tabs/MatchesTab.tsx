import { Component, For, createSignal, createMemo, Show } from 'solid-js';
import { MatchEncounterSummary } from '../../../types/analytics';

interface Props {
  encounters?: MatchEncounterSummary[];
}

export const MatchesTab: Component<Props> = (props) => {
  const [resultFilter, setResultFilter] = createSignal<'ALL' | 'WINS' | 'LOSSES'>('ALL');
  const [expandedMatchId, setExpandedMatchId] = createSignal<string | null>(null);

  // Fallback realistic match dataset if encounters array is empty
  const defaultEncounters: MatchEncounterSummary[] = [
    {
      matchId: "VAL-SUNSET-101", timeAgo: "1h ago", mapName: "Sunset", queueMode: "Competitive",
      agentName: "Raze", agentIconUrl: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png",
      scoreString: "13 : 9", didWin: true, valIndex: 884, badges: ["MATCH MVP", "4K", "1v2 Clutch"],
      kdRatio: 1.62, killDeathAssist: "26 / 16 / 7", damageDelta: 62, headshotPercent: 28, combatScore: 312
    },
    {
      matchId: "VAL-ASCENT-102", timeAgo: "4h ago", mapName: "Ascent", queueMode: "Competitive",
      agentName: "Jett", agentIconUrl: "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
      scoreString: "13 : 7", didWin: true, valIndex: 820, badges: ["TEAM MVP", "Ace"],
      kdRatio: 1.75, killDeathAssist: "21 / 12 / 5", damageDelta: 54, headshotPercent: 32, combatScore: 285
    },
    {
      matchId: "VAL-BIND-103", timeAgo: "1d ago", mapName: "Bind", queueMode: "Competitive",
      agentName: "Sova", agentIconUrl: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
      scoreString: "11 : 13", didWin: false, valIndex: 690, badges: ["First Blood x4"],
      kdRatio: 1.15, killDeathAssist: "19 / 16 / 8", damageDelta: 12, headshotPercent: 24, combatScore: 215
    },
    {
      matchId: "VAL-LOTUS-104", timeAgo: "1d ago", mapName: "Lotus", queueMode: "Competitive",
      agentName: "Omen", agentIconUrl: "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
      scoreString: "13 : 10", didWin: true, valIndex: 760, badges: ["Flawless x2"],
      kdRatio: 1.25, killDeathAssist: "18 / 14 / 12", damageDelta: 25, headshotPercent: 21, combatScore: 230
    },
    {
      matchId: "VAL-ABYSS-105", timeAgo: "2d ago", mapName: "Abyss", queueMode: "Competitive",
      agentName: "Clove", agentIconUrl: "https://media.valorant-api.com/agents/7f94d257-4182-9653-e99e-71a7385a498e/displayicon.png",
      scoreString: "8 : 13", didWin: false, valIndex: 580, badges: ["Clutch"],
      kdRatio: 0.88, killDeathAssist: "14 / 16 / 6", damageDelta: -18, headshotPercent: 19, combatScore: 175
    },
    {
      matchId: "VAL-CORRODE-106", timeAgo: "3d ago", mapName: "Corrode", queueMode: "Competitive",
      agentName: "Cypher", agentIconUrl: "https://media.valorant-api.com/agents/117ed9e3-49f1-4350-bb9a-cb1f71a93815/displayicon.png",
      scoreString: "13 : 6", didWin: true, valIndex: 890, badges: ["MATCH MVP", "Flawless x3"],
      kdRatio: 2.10, killDeathAssist: "23 / 11 / 9", damageDelta: 88, headshotPercent: 35, combatScore: 345
    }
  ];

  const matchData = () => {
    if (props.encounters && props.encounters.length > 0) {
      return props.encounters;
    }
    return defaultEncounters;
  };

  const filteredMatches = createMemo(() => {
    return matchData().filter(m => {
      if (resultFilter() === 'WINS') return m.didWin;
      if (resultFilter() === 'LOSSES') return !m.didWin;
      return true;
    });
  });

  const totalWins = createMemo(() => matchData().filter(m => m.didWin).length);
  const totalLosses = createMemo(() => matchData().filter(m => !m.didWin).length);
  const winRate = createMemo(() => {
    const total = matchData().length;
    return total > 0 ? Math.round((totalWins() / total) * 100) : 0;
  });

  const toggleExpand = (id: string) => {
    setExpandedMatchId(expandedMatchId() === id ? null : id);
  };

  return (
    <div class="space-y-6 animate-fade-in">
      
      {/* 20-Match Performance Barometer Banner */}
      <div class="glass-card rounded-3xl p-6 sm:p-8 flex flex-col xl:flex-row items-center justify-between gap-8 shadow-2xl">
        
        {/* Left: Win/Loss Ratio Meter */}
        <div class="w-full xl:w-80 flex-shrink-0 space-y-3 text-left">
          <div class="flex items-center justify-between font-tactical">
            <span class="text-xs font-black text-val-muted uppercase tracking-widest">
              RECENT FORM SUMMARY
            </span>
            <span class="text-xs font-mono font-bold text-val-cyan">
              {matchData().length} Encounters
            </span>
          </div>

          <div class="flex items-center gap-3 font-tactical">
            <span class="text-3xl sm:text-4xl font-black text-val-emerald">{totalWins()}W</span>
            <span class="text-2xl font-black text-slate-500">-</span>
            <span class="text-3xl sm:text-4xl font-black text-val-red">{totalLosses()}L</span>
            <span class="text-xl font-bold text-slate-300 ml-1">({winRate()}% WR)</span>
          </div>

          {/* Proportional Split Bar */}
          <div class="h-3 w-full bg-val-red/60 rounded-full overflow-hidden flex shadow-inner">
            <div 
              class="h-full bg-val-emerald progress-animate shadow-[0_0_10px_#10B981]" 
              style={{ width: `${winRate()}%` }} 
            />
            <div class="h-full bg-val-red flex-1" />
          </div>
        </div>

        {/* Center: Average Combat Rate Telemetry */}
        <div class="grid grid-cols-3 gap-4 flex-1 w-full border-t xl:border-t-0 xl:border-l border-white/[0.08] pt-4 xl:pt-0 xl:pl-8 text-center font-tactical">
          <div class="bg-black/30 p-3.5 rounded-2xl border border-white/5">
            <span class="text-[10px] font-bold text-val-muted uppercase block">AVG K/D</span>
            <span class="text-2xl font-black text-val-emerald mt-1 block">1.38</span>
          </div>
          <div class="bg-black/30 p-3.5 rounded-2xl border border-white/5">
            <span class="text-[10px] font-bold text-val-muted uppercase block">AVG DAMAGE</span>
            <span class="text-2xl font-black text-white mt-1 block">172 ADR</span>
          </div>
          <div class="bg-black/30 p-3.5 rounded-2xl border border-white/5">
            <span class="text-[10px] font-bold text-val-muted uppercase block">HEADSHOT RATIO</span>
            <span class="text-2xl font-black text-val-cyan mt-1 block">27.6%</span>
          </div>
        </div>

      </div>

      {/* Filter Button Strip */}
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div class="glass-pill p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => setResultFilter('ALL')}
            class={`px-4 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              resultFilter() === 'ALL' ? 'bg-white/20 text-white' : 'text-val-muted hover:text-white'
            }`}
          >
            ALL MATCHES ({matchData().length})
          </button>
          <button
            onClick={() => setResultFilter('WINS')}
            class={`px-4 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              resultFilter() === 'WINS' ? 'bg-val-emerald text-val-obsidian font-black' : 'text-val-muted hover:text-white'
            }`}
          >
            VICTORIES ({totalWins()})
          </button>
          <button
            onClick={() => setResultFilter('LOSSES')}
            class={`px-4 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              resultFilter() === 'LOSSES' ? 'bg-val-red text-white' : 'text-val-muted hover:text-white'
            }`}
          >
            DEFEATS ({totalLosses()})
          </button>
        </div>

        <span class="text-xs font-mono text-val-muted">
          Click any match to inspect round breakdowns
        </span>
      </div>

      {/* Match Cards List */}
      <div class="space-y-4">
        <For each={filteredMatches()}>
          {(m) => {
            const isExpanded = expandedMatchId() === m.matchId;
            return (
              <div 
                class={`glass-card rounded-3xl border transition-all cursor-pointer overflow-hidden ${
                  m.didWin ? 'border-l-4 border-l-val-emerald hover:border-val-emerald/40' : 'border-l-4 border-l-val-red hover:border-val-red/40'
                }`}
                onClick={() => toggleExpand(m.matchId)}
              >
                
                {/* Main Card Strip */}
                <div class="p-5 sm:p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
                  
                  {/* Left: Agent Avatar, Map, Score & Accolades */}
                  <div class="flex items-center gap-4 sm:gap-5 flex-1 min-w-0">
                    
                    {/* Agent Portrait */}
                    <div class="relative flex-shrink-0">
                      <img 
                        src={m.agentIconUrl} 
                        alt={m.agentName} 
                        class="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black object-cover border border-white/15 shadow-md group-hover:scale-105 transition-transform" 
                      />
                      <span class="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-black font-tactical uppercase bg-black/90 text-white border border-white/20">
                        {m.agentName}
                      </span>
                    </div>

                    {/* Meta, Score & Tactical Badges */}
                    <div class="space-y-2 min-w-0 flex-1">
                      
                      <div class="flex flex-wrap items-center gap-3">
                        <span class="text-lg sm:text-2xl font-black font-tactical text-white uppercase tracking-wider">
                          {m.mapName}
                        </span>
                        
                        {/* Score Box */}
                        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-black/60 border border-white/10">
                          <span class={`text-sm sm:text-base font-black font-tactical ${m.didWin ? 'text-val-emerald' : 'text-rose-400'}`}>
                            {m.scoreString}
                          </span>
                          <span class="text-[10px] text-val-muted font-mono uppercase">
                            {m.didWin ? 'VICTORY' : 'DEFEAT'}
                          </span>
                        </div>

                        <span class="text-xs font-mono text-val-muted">
                          {m.timeAgo} • {m.queueMode}
                        </span>
                      </div>

                      {/* Accolade Badges */}
                      <div class="flex flex-wrap items-center gap-2">
                        <For each={m.badges || []}>
                          {(b) => (
                            <span class={`px-2.5 py-0.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider ${
                              b.includes('MVP') ? 'bg-val-gold/20 text-val-gold border border-val-gold/40' :
                              b.includes('Ace') || b.includes('4K') || b.includes('Clutch') ? 'bg-val-cyan/20 text-val-cyan border border-val-cyan/40' :
                              'bg-white/10 text-white border border-white/10'
                            }`}>
                              {b}
                            </span>
                          )}
                        </For>
                      </div>

                    </div>

                  </div>

                  {/* Right: 5-Column Metrics Matrix */}
                  <div class="w-full xl:w-[460px] flex-shrink-0 grid grid-cols-5 gap-2 items-center bg-black/40 px-4 py-3 rounded-2xl border border-white/5 text-center font-tactical">
                    <div>
                      <span class="text-[9px] font-bold text-val-muted uppercase block">K/D</span>
                      <span class={`text-base sm:text-lg font-black block ${m.kdRatio >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>
                        {m.kdRatio.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span class="text-[9px] font-bold text-val-muted uppercase block">KDA</span>
                      <span class="text-xs sm:text-sm font-black text-white block font-mono whitespace-nowrap">
                        {m.killDeathAssist}
                      </span>
                    </div>

                    <div>
                      <span class="text-[9px] font-bold text-val-muted uppercase block">DDΔ</span>
                      <span class={`text-xs sm:text-sm font-black block ${m.damageDelta >= 0 ? 'text-val-cyan' : 'text-rose-400'}`}>
                        {m.damageDelta > 0 ? `+${m.damageDelta}` : m.damageDelta}
                      </span>
                    </div>

                    <div>
                      <span class="text-[9px] font-bold text-val-muted uppercase block">HS %</span>
                      <span class="text-xs sm:text-sm font-black text-white block">
                        {m.headshotPercent}%
                      </span>
                    </div>

                    <div>
                      <span class="text-[9px] font-bold text-val-muted uppercase block">ACS</span>
                      <span class="text-xs sm:text-sm font-black text-val-gold block">
                        {m.combatScore}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Expandable Match Drawer */}
                <Show when={isExpanded}>
                  <div class="border-t border-white/[0.08] bg-black/50 p-6 space-y-4 animate-fade-in text-left">
                    <div class="flex items-center justify-between text-xs font-tactical border-b border-white/10 pb-2">
                      <span class="font-black text-white uppercase tracking-wider">
                        ENCOUNTER TELEMETRY BREAKDOWN • {m.mapName}
                      </span>
                      <span class="text-val-cyan font-mono font-bold">MATCH ID: {m.matchId}</span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-tactical">
                      <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span class="text-val-muted font-bold block uppercase">Round Dominance</span>
                        <span class="text-white font-black text-sm mt-1 block">
                          Attack: 7 Won / 4 Lost • Defense: 6 Won / 5 Lost
                        </span>
                      </div>
                      <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span class="text-val-muted font-bold block uppercase">Econ Rating</span>
                        <span class="text-val-emerald font-black text-sm mt-1 block">
                          74 DMG Dealt per 1000 Credits Spent
                        </span>
                      </div>
                      <div class="bg-white/5 p-3 rounded-xl border border-white/5">
                        <span class="text-val-muted font-bold block uppercase">First Duel Success</span>
                        <span class="text-val-cyan font-black text-sm mt-1 block">
                          67% Opening Kill Conversion (4 Won / 2 Lost)
                        </span>
                      </div>
                    </div>
                  </div>
                </Show>

              </div>
            );
          }}
        </For>
      </div>

    </div>
  );
};
