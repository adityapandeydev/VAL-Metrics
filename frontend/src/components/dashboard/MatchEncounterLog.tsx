import { Component, For } from 'solid-js';
import { MatchEncounterSummary } from '../../types/analytics';

interface Props {
  encounters?: MatchEncounterSummary[];
}

const FILTERS = ['All Agents', 'All Maps', 'All Weapons', 'All Teammates', 'All Dates', 'All Kills', '+4 More'];

export const MatchEncounterLog: Component<Props> = (props) => {
  const encounters: MatchEncounterSummary[] = props.encounters && props.encounters.length > 0 ? props.encounters : [
    {
      matchId: "VAL-MATCH-SUNSET-002", timeAgo: "3w ago", mapName: "Sunset", queueMode: "Competitive",
      agentName: "Phoenix", agentIconUrl: "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png",
      scoreString: "13 : 10", didWin: true, valIndex: 902, badges: ["MVP", "4k"],
      kdRatio: 2.00, killDeathAssist: "28 / 14 / 8", damageDelta: 84, headshotPercent: 17, combatScore: 365
    },
    {
      matchId: "VAL-MATCH-SUNSET-001", timeAgo: "1mo ago", mapName: "Sunset", queueMode: "Competitive",
      agentName: "Raze", agentIconUrl: "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png",
      scoreString: "13 : 9", didWin: true, valIndex: 754, badges: ["MVP", "4k", "1v1 Lost"],
      kdRatio: 1.31, killDeathAssist: "21 / 16 / 5", damageDelta: 58, headshotPercent: 12, combatScore: 276
    }
  ];

  return (
    <div class="glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl space-y-6">
      
      <div class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex items-center gap-2.5">
          <span class="w-3 h-5 bg-val-red rounded-sm shadow-glow-red" />
          <h3 class="text-xl font-black font-tactical text-white uppercase tracking-wider">
            LAST 2 COMPETITIVE ENCOUNTERS
          </h3>
        </div>
        <span class="text-xs font-bold text-val-red hover:underline cursor-pointer font-tactical uppercase">
          All Match Archives →
        </span>
      </div>

      {/* Filter Pills Console */}
      <div class="flex flex-wrap items-center gap-2 bg-[#0A0D14] p-3 rounded-xl border border-white/5">
        <For each={FILTERS}>
          {(f, i) => (
            <button class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wide transition-all ${
              i() < 2 ? 'bg-val-red/20 text-val-red border border-val-red/40 shadow-sm' : 'bg-val-card text-val-muted hover:text-white border border-white/5'
            }`}>
              {f} {i() < 4 && '🔒'}
            </button>
          )}
        </For>
        <span class="ml-auto text-[11px] font-mono text-slate-400">Showing 100% Win Rate Streak</span>
      </div>

      {/* Quick Record Banners (3w ago 13:10 | 1mo ago 13:9) */}
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <For each={encounters}>
          {(enc) => (
            <div class="bg-gradient-to-r from-teal-900/40 via-val-card to-val-card p-4 rounded-xl border border-val-emerald/40 text-center relative overflow-hidden shadow-lg">
              <div class="absolute inset-x-0 top-0 h-1 bg-val-emerald shadow-glow-cyan" />
              <span class="text-[11px] text-slate-400 font-tactical uppercase">{enc.timeAgo} • {enc.mapName}</span>
              <p class="text-3xl font-black font-tactical text-white my-1 tracking-widest">{enc.scoreString}</p>
              <span class="text-xs font-bold text-val-cyan font-tactical">K/D {enc.kdRatio.toFixed(1)} • {enc.didWin ? 'VICTORY' : 'DEFEAT'}</span>
            </div>
          )}
        </For>
      </div>

      {/* Comprehensive Match Row Cards */}
      <div class="space-y-3 pt-2">
        <For each={encounters}>
          {(match) => (
            <div class="bg-[#0A0D14] border-l-4 border-l-val-emerald border-t border-r border-b border-white/10 p-5 rounded-xl hover:bg-[#101622] transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-xl group">
              
              {/* Agent Icon & Match Meta */}
              <div class="flex items-center gap-4">
                <img 
                  src={match.agentIconUrl} 
                  alt={match.agentName} 
                  class="w-14 h-14 rounded-xl bg-black border border-white/10 object-cover shadow-md group-hover:scale-105 transition-transform" 
                />
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-val-muted font-tactical uppercase">{match.timeAgo} // {match.queueMode}</span>
                  </div>
                  <h4 class="text-2xl font-black font-tactical text-white uppercase tracking-wide flex items-center gap-2">
                    {match.mapName} 
                    <span class="text-[10px] font-black px-2 py-0.5 rounded bg-val-gold text-val-obsidian shadow-glow-gold">
                      MVP 👑
                    </span>
                  </h4>
                </div>
              </div>

              {/* Score & VAL-Index Rating Badge */}
              <div class="flex items-center gap-6 bg-black/40 px-6 py-3 rounded-xl border border-white/5">
                <div class="text-center">
                  <span class="text-[10px] text-val-muted font-semibold uppercase block">Score</span>
                  <span class="text-2xl font-black font-tactical text-val-emerald tracking-wider">{match.scoreString}</span>
                </div>

                <div class="h-8 w-px bg-white/10" />

                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg bg-val-cyan/15 border border-val-cyan/30 flex items-center justify-center text-val-cyan text-sm font-black font-tactical shadow-glow-cyan">
                    💠
                  </div>
                  <div>
                    <span class="text-[10px] text-val-muted font-semibold uppercase block">VAL-Index</span>
                    <span class="text-xl font-black font-tactical text-white">{match.valIndex}</span>
                  </div>
                </div>
              </div>

              {/* Badges Console (4k, 1v1 Lost, etc.) */}
              <div class="flex flex-wrap items-center gap-1.5">
                <For each={match.badges}>
                  {(b) => (
                    <span class={`text-[10px] font-black font-tactical px-2.5 py-1 rounded border uppercase tracking-wider ${
                      b === 'MVP' ? 'bg-val-gold/20 text-val-gold border-val-gold/40 shadow-glow-gold' :
                      b === '4k' ? 'bg-val-cyan/20 text-val-cyan border-val-cyan/40 shadow-glow-cyan' :
                      'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}>
                      {b}
                    </span>
                  )}
                </For>
              </div>

              {/* Advanced KD/A, DDA, HS%, ACS Metrics */}
              <div class="grid grid-cols-4 gap-4 text-center bg-[#0D121C] p-3.5 rounded-xl border border-white/5 w-full lg:w-auto">
                <div>
                  <span class="text-[10px] font-bold text-val-muted block uppercase">K/D Ratio</span>
                  <span class="text-lg font-black font-tactical text-val-emerald block">{match.kdRatio.toFixed(2)}</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-val-muted block uppercase">DDΔ</span>
                  <span class="text-lg font-black font-tactical text-val-cyan block">+{match.damageDelta}</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-val-muted block uppercase">HS %</span>
                  <span class="text-lg font-black font-tactical text-white block">{match.headshotPercent}%</span>
                </div>
                <div>
                  <span class="text-[10px] font-bold text-val-muted block uppercase">ACS</span>
                  <span class="text-lg font-black font-tactical text-val-gold block">{match.combatScore}</span>
                </div>
              </div>

            </div>
          )}
        </For>
      </div>

      <div class="text-center pt-2">
        <span class="text-xs font-tactical text-val-muted uppercase font-semibold border border-white/10 px-6 py-2 rounded-xl bg-black/40 inline-block">
          End of Recent VAL-Match V1 Results
        </span>
      </div>

    </div>
  );
};
