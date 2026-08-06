import { Component, For, createSignal } from 'solid-js';
import { MatchEncounterSummary } from '../../types/analytics';

interface Props {
  encounters?: MatchEncounterSummary[];
}

const FILTERS = ['All Agents', 'All Maps', 'All Weapons', 'All Teammates', 'All Dates', 'All Kills', '+4 More'];

export const MatchEncounterLog: Component<Props> = (props) => {
  const [selectedFilter, setSelectedFilter] = createSignal('All Agents');

  // Realistic mock dataset of matches grouped by date with standardized alignment
  const aug4Matches = [
    {
      matchId: "AUG4-SPLIT", timeAgo: "1d ago", mapName: "Split", queueMode: "Competitive", placement: "7th",
      agentName: "Sage", agentIcon: "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
      score: "14 : 16", didWin: false, valRatingScore: 614, badges: ["4k", "1v1 Clutch x2", "3k"],
      kd: 1.11, kdaString: "20 / 18 / 7", dda: "+27", hsPercent: 31, acs: 201, rankTier: "Diamond 3"
    }
  ];

  const aug3Matches = [
    {
      matchId: "AUG3-SPLIT", timeAgo: "2d ago", mapName: "Split", queueMode: "Competitive", placement: "10th",
      agentName: "Sova", agentIcon: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
      score: "11 : 13", didWin: false, valRatingScore: 326, badges: ["3k"],
      kd: 0.70, kdaString: "10 / 15 / 7", dda: "-23", hsPercent: 23, acs: 131, rankTier: "Diamond 3"
    },
    {
      matchId: "AUG3-LOTUS", timeAgo: "2d ago", mapName: "Lotus", queueMode: "Competitive", placement: "1st",
      agentName: "Skye", agentIcon: "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png",
      score: "13 : 8", didWin: true, valRatingScore: 842, badges: ["MATCH MVP", "4k", "First Blood x3"],
      kd: 1.78, kdaString: "24 / 13 / 11", dda: "+64", hsPercent: 35, acs: 289, rankTier: "Immortal 1"
    },
    {
      matchId: "AUG3-BIND", timeAgo: "3d ago", mapName: "Bind", queueMode: "Competitive", placement: "2nd",
      agentName: "Sova", agentIcon: "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
      score: "13 : 5", didWin: true, valRatingScore: 710, badges: ["TEAM MVP", "Flawless x2"],
      kd: 1.54, kdaString: "19 / 12 / 8", dda: "+41", hsPercent: 28, acs: 245, rankTier: "Immortal 1"
    }
  ];

  return (
    <div class="space-y-6">
      
      {/* Table Header */}
      <div class="flex items-center justify-between">
        <h3 class="text-xl sm:text-2xl font-black font-tactical text-white uppercase tracking-wider">
          LAST 20 MATCHES
        </h3>
        <span class="text-xs font-bold text-val-cyan hover:underline cursor-pointer font-tactical uppercase">
          Refresh Match Archives
        </span>
      </div>

      {/* Interactive Filter Pill Bar (Clean Text Buttons, ZERO Locks or Emojis) */}
      <div class="flex flex-wrap items-center gap-2 bg-[#0A0E17] p-2.5 rounded-2xl border border-white/10 shadow-lg">
        <For each={FILTERS}>
          {(filter, i) => (
            <button 
              onClick={() => setSelectedFilter(filter)}
              class={`px-4 py-2 rounded-xl text-xs font-extrabold font-tactical uppercase tracking-wider transition-all ${
                selectedFilter() === filter || i() === 0
                  ? 'bg-val-red text-white shadow-glow-red font-black'
                  : 'bg-[#151D2C] text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
              }`}
            >
              {filter}
            </button>
          )}
        </For>
      </div>

      {/* Summary Stats & Top Agents Banner */}
      <div class="bg-gradient-to-r from-[#0F1626] via-[#162036] to-[#0F1626] p-6 rounded-2xl border border-white/15 shadow-2xl flex flex-col xl:flex-row items-center justify-between gap-8">
        
        {/* Left Side: Total Record & K/D / ADR summary */}
        <div class="w-full xl:w-72 flex-shrink-0 flex flex-col justify-center space-y-2">
          <div class="flex items-center gap-2 font-tactical">
            <span class="text-2xl sm:text-3xl font-black text-val-emerald tracking-wide">12W</span>
            <span class="text-2xl sm:text-3xl font-black text-white">-</span>
            <span class="text-2xl sm:text-3xl font-black text-val-red tracking-wide">8L</span>
            <span class="text-lg sm:text-xl font-bold text-slate-300 ml-1.5">(60%)</span>
          </div>

          {/* Win/Loss Split Bar */}
          <div class="w-full h-2.5 rounded-full bg-val-red/60 overflow-hidden flex">
            <div class="h-full bg-val-emerald w-[60%] shadow-glow-cyan" />
            <div class="h-full bg-val-red w-[40%]" />
          </div>

          <div class="pt-1 text-sm sm:text-base font-black font-tactical tracking-wide text-val-cyan flex items-center gap-2">
            <span>1.22 K/D</span>
            <span class="text-white/30">|</span>
            <span class="text-white">163 ADR</span>
          </div>
        </div>

        {/* Right Side: Top Agents Played Breakdown (Fixed equal-width Grid Columns) */}
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full border-t xl:border-t-0 border-white/10 pt-4 xl:pt-0">
          
          {/* Sova Card */}
          <div class="flex items-center gap-3 bg-black/40 p-3.5 rounded-xl border border-white/10">
            <img src="https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png" class="w-12 h-12 rounded-lg bg-black object-cover border border-val-cyan/50 shadow-md flex-shrink-0" alt="Sova" />
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex justify-between items-center text-xs font-black font-tactical truncate">
                <span class="text-white">5W - 1L</span>
                <span class="text-val-emerald font-mono">(83%)</span>
              </div>
              <div class="w-full h-1.5 rounded bg-val-red/50 overflow-hidden">
                <div class="h-full bg-val-cyan w-[83%]" />
              </div>
              <span class="text-[11px] font-mono font-bold text-slate-400 block">K/D 1.11</span>
            </div>
          </div>

          {/* Sage Card */}
          <div class="flex items-center gap-3 bg-black/40 p-3.5 rounded-xl border border-white/10">
            <img src="https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png" class="w-12 h-12 rounded-lg bg-black object-cover border border-teal-500/50 shadow-md flex-shrink-0" alt="Sage" />
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex justify-between items-center text-xs font-black font-tactical truncate">
                <span class="text-white">3W - 2L</span>
                <span class="text-teal-400 font-mono">(60%)</span>
              </div>
              <div class="w-full h-1.5 rounded bg-val-red/50 overflow-hidden">
                <div class="h-full bg-teal-400 w-[60%]" />
              </div>
              <span class="text-[11px] font-mono font-bold text-slate-400 block">K/D 1.41</span>
            </div>
          </div>

          {/* Skye Card */}
          <div class="flex items-center gap-3 bg-black/40 p-3.5 rounded-xl border border-white/10">
            <img src="https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png" class="w-12 h-12 rounded-lg bg-black object-cover border border-emerald-500/50 shadow-md flex-shrink-0" alt="Skye" />
            <div class="flex-1 min-w-0 space-y-1.5">
              <div class="flex justify-between items-center text-xs font-black font-tactical truncate">
                <span class="text-white">2W - 1L</span>
                <span class="text-val-emerald font-mono">(67%)</span>
              </div>
              <div class="w-full h-1.5 rounded bg-val-red/50 overflow-hidden">
                <div class="h-full bg-val-emerald w-[67%]" />
              </div>
              <span class="text-[11px] font-mono font-bold text-slate-400 block">K/D 1.78</span>
            </div>
          </div>

        </div>

      </div>

      {/* MATCH HISTORY TABLES BY DATE */}
      <div class="space-y-6">
        
        {/* AUG 4 SECTION */}
        <div class="space-y-2.5">
          <div class="flex items-center justify-between text-xs sm:text-sm font-black font-tactical text-slate-300 uppercase px-1">
            <div class="flex items-center gap-2">
              <span class="text-white text-base">Aug 4</span>
              <span class="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-xs">1</span>
              <span class="text-val-cyan hover:underline cursor-pointer ml-4">
                View Report
              </span>
            </div>
            <div class="flex items-center gap-2 font-bold text-sm">
              <span class="text-val-red">0 W</span>
              <span class="text-slate-600">//</span>
              <span class="text-white">1 L</span>
            </div>
          </div>

          <div class="space-y-2">
            <For each={aug4Matches}>
              {(m) => (
                <div class={`bg-[#0B0F19] border-l-4 ${m.didWin ? 'border-l-val-emerald' : 'border-l-rose-500'} border-t border-r border-b border-white/10 p-3.5 sm:p-4 rounded-2xl hover:bg-[#111827] transition-all flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-6 shadow-xl group`}>
                  
                  {/* Agent & Map Info (Fixed Width: 220px) */}
                  <div class="flex items-center gap-3.5 w-full sm:w-[220px] flex-shrink-0">
                    <div class="relative flex-shrink-0">
                      <img src={m.agentIcon} alt={m.agentName} class="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-black object-cover border border-white/15 group-hover:scale-105 transition-transform shadow-md" />
                      <span class="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-black font-tactical uppercase bg-black text-white border border-white/20">
                        {m.agentName}
                      </span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <span class="text-[11px] font-bold text-val-muted block font-tactical truncate">{m.timeAgo} // {m.queueMode}</span>
                      <h4 class="text-lg sm:text-xl font-black font-tactical text-white tracking-wide flex items-center gap-2 truncate">
                        <span>{m.mapName}</span>
                        <span class="text-xs text-slate-400 font-normal">({m.placement})</span>
                      </h4>
                    </div>
                  </div>

                  {/* Score & VAL Rating Badge (Fixed Width: 180px) */}
                  <div class="w-full sm:w-[180px] flex-shrink-0 flex items-center justify-center gap-4 bg-black/50 px-3 py-2 rounded-xl border border-white/5">
                    <div class="text-center">
                      <span class="text-[10px] text-val-muted font-bold block uppercase font-tactical">Score</span>
                      <span class={`text-lg font-black font-tactical tracking-wider ${m.didWin ? 'text-val-emerald' : 'text-rose-400'}`}>
                        {m.score}
                      </span>
                    </div>
                    
                    <div class="h-6 w-px bg-white/10" />

                    <div class="flex items-center gap-2">
                      <span class="px-1.5 py-0.5 rounded bg-val-cyan/20 border border-val-cyan/40 text-val-cyan text-[10px] font-black font-tactical uppercase">
                        TRS
                      </span>
                      <div>
                        <span class="text-[10px] text-val-muted font-bold block uppercase font-tactical">Rating</span>
                        <span class="text-base font-black font-tactical text-white">{m.valRatingScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Console (Flex-1 Fluid Middle Area) */}
                  <div class="flex flex-wrap items-center justify-start xl:justify-center gap-1.5 flex-1 min-w-0 w-full xl:w-auto px-1">
                    <For each={m.badges}>
                      {(b) => (
                        <span class={`px-2.5 py-1 rounded-lg text-[10px] font-black font-tactical uppercase tracking-wider border ${
                          b.includes('MVP') ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-glow-gold' :
                          b.includes('4k') || b.includes('Flawless') || b.includes('First Blood') ? 'bg-val-cyan/20 text-val-cyan border-val-cyan/40 shadow-glow-cyan' :
                          'bg-white/10 text-white border-white/20'
                        }`}>
                          {b}
                        </span>
                      )}
                    </For>
                  </div>

                  {/* K/D, KDA, DDA, HS%, ACS Table Columns (Rigid Fixed Width: 480px) */}
                  <div class="w-full xl:w-[480px] flex-shrink-0 grid grid-cols-5 gap-2 items-center bg-[#0D1220] px-4 py-2.5 rounded-xl border border-white/10 text-center">
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">K/D</span>
                      <span class={`text-base sm:text-lg font-black font-tactical block ${m.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>
                        {m.kd.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">K/D/A</span>
                      <span class="text-xs font-black text-white block font-mono whitespace-nowrap">{m.kdaString}</span>
                      <span class="text-[9px] font-bold text-slate-400 block font-tactical">{m.kd} K/D/A</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">DDΔ</span>
                      <span class={`text-sm sm:text-base font-black font-tactical block ${m.dda.startsWith('+') ? 'text-val-cyan' : 'text-rose-400'}`}>
                        {m.dda}
                      </span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">HS %</span>
                      <span class="text-sm sm:text-base font-black font-tactical text-white block">{m.hsPercent}%</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">ACS</span>
                      <span class="text-sm sm:text-base font-black font-tactical text-val-gold block">{m.acs}</span>
                    </div>
                  </div>

                  {/* Options menu button */}
                  <button class="hidden xl:block text-val-muted hover:text-white px-1 text-lg font-black" title="Match details and replay telems">
                    ⋮
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* AUG 3 SECTION */}
        <div class="space-y-2.5 pt-2">
          <div class="flex items-center justify-between text-xs sm:text-sm font-black font-tactical text-slate-300 uppercase px-1">
            <div class="flex items-center gap-2">
              <span class="text-white text-base">Aug 3</span>
              <span class="px-2 py-0.5 rounded bg-white/10 text-white font-mono text-xs">3</span>
            </div>
            <div class="flex items-center gap-2 font-bold text-sm">
              <span class="text-val-emerald">2 W</span>
              <span class="text-slate-600">//</span>
              <span class="text-white">1 L</span>
            </div>
          </div>

          <div class="space-y-2">
            <For each={aug3Matches}>
              {(m) => (
                <div class={`bg-[#0B0F19] border-l-4 ${m.didWin ? 'border-l-val-emerald' : 'border-l-rose-500'} border-t border-r border-b border-white/10 p-3.5 sm:p-4 rounded-2xl hover:bg-[#111827] transition-all flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 sm:gap-6 shadow-xl group`}>
                  
                  {/* Agent & Map Info (Fixed Width: 220px) */}
                  <div class="flex items-center gap-3.5 w-full sm:w-[220px] flex-shrink-0">
                    <div class="relative flex-shrink-0">
                      <img src={m.agentIcon} alt={m.agentName} class="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-black object-cover border border-white/15 group-hover:scale-105 transition-transform shadow-md" />
                      <span class="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[9px] font-black font-tactical uppercase bg-black text-white border border-white/20">
                        {m.agentName}
                      </span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <span class="text-[11px] font-bold text-val-muted block font-tactical truncate">{m.timeAgo} // {m.queueMode}</span>
                      <h4 class="text-lg sm:text-xl font-black font-tactical text-white tracking-wide flex items-center gap-2 truncate">
                        <span>{m.mapName}</span>
                        <span class="text-xs text-slate-400 font-normal">({m.placement})</span>
                      </h4>
                    </div>
                  </div>

                  {/* Score & VAL Rating Badge (Fixed Width: 180px) */}
                  <div class="w-full sm:w-[180px] flex-shrink-0 flex items-center justify-center gap-4 bg-black/50 px-3 py-2 rounded-xl border border-white/5">
                    <div class="text-center">
                      <span class="text-[10px] text-val-muted font-bold block uppercase font-tactical">Score</span>
                      <span class={`text-lg font-black font-tactical tracking-wider ${m.didWin ? 'text-val-emerald' : 'text-rose-400'}`}>
                        {m.score}
                      </span>
                    </div>
                    
                    <div class="h-6 w-px bg-white/10" />

                    <div class="flex items-center gap-2">
                      <span class="px-1.5 py-0.5 rounded bg-val-cyan/20 border border-val-cyan/40 text-val-cyan text-[10px] font-black font-tactical uppercase">
                        TRS
                      </span>
                      <div>
                        <span class="text-[10px] text-val-muted font-bold block uppercase font-tactical">Rating</span>
                        <span class="text-base font-black font-tactical text-white">{m.valRatingScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badges Console (Flex-1 Fluid Middle Area) */}
                  <div class="flex flex-wrap items-center justify-start xl:justify-center gap-1.5 flex-1 min-w-0 w-full xl:w-auto px-1">
                    <For each={m.badges}>
                      {(b) => (
                        <span class={`px-2.5 py-1 rounded-lg text-[10px] font-black font-tactical uppercase tracking-wider border ${
                          b.includes('MVP') ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-glow-gold' :
                          b.includes('4k') || b.includes('Flawless') || b.includes('First Blood') ? 'bg-val-cyan/20 text-val-cyan border-val-cyan/40 shadow-glow-cyan' :
                          'bg-white/10 text-white border-white/20'
                        }`}>
                          {b}
                        </span>
                      )}
                    </For>
                  </div>

                  {/* K/D, KDA, DDA, HS%, ACS Table Columns (Rigid Fixed Width: 480px) */}
                  <div class="w-full xl:w-[480px] flex-shrink-0 grid grid-cols-5 gap-2 items-center bg-[#0D1220] px-4 py-2.5 rounded-xl border border-white/10 text-center">
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">K/D</span>
                      <span class={`text-base sm:text-lg font-black font-tactical block ${m.kd >= 1.0 ? 'text-val-emerald' : 'text-rose-400'}`}>
                        {m.kd.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">K/D/A</span>
                      <span class="text-xs font-black text-white block font-mono whitespace-nowrap">{m.kdaString}</span>
                      <span class="text-[9px] font-bold text-slate-400 block font-tactical">{m.kd} K/D/A</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">DDΔ</span>
                      <span class={`text-sm sm:text-base font-black font-tactical block ${m.dda.startsWith('+') ? 'text-val-cyan' : 'text-rose-400'}`}>
                        {m.dda}
                      </span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">HS %</span>
                      <span class="text-sm sm:text-base font-black font-tactical text-white block">{m.hsPercent}%</span>
                    </div>
                    <div>
                      <span class="text-[10px] font-bold text-val-muted block uppercase font-tactical">ACS</span>
                      <span class="text-sm sm:text-base font-black font-tactical text-val-gold block">{m.acs}</span>
                    </div>
                  </div>

                  {/* Options menu button */}
                  <button class="hidden xl:block text-val-muted hover:text-white px-1 text-lg font-black" title="Match details and replay telems">
                    ⋮
                  </button>
                </div>
              )}
            </For>
          </div>
        </div>

      </div>

    </div>
  );
};
