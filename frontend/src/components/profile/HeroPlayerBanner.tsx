import { Component, createSignal, For } from 'solid-js';

interface Props {
  riotId: string;
  currentRating?: string;
  peakRating?: string;
  peakAct?: string;
  level?: number;
  selectedQueue: string;
  onSelectQueue: (queue: string) => void;
  selectedAct: string;
  onSelectAct: (act: string) => void;
  syncing: boolean;
  onSync: () => void;
  primaryAgentIcon?: string;
}

const PRIMARY_QUEUES = ['Competitive', 'Unrated', 'Deathmatch', 'Swiftplay', 'Premier'];
const ACTS = ['V26: A4', 'V26: A3', 'V26: A2', 'V26: A1', 'All Acts'];

export const HeroPlayerBanner: Component<Props> = (props) => {
  const [copied, setCopied] = createSignal(false);
  const [showActMenu, setShowActMenu] = createSignal(false);

  const getGameName = () => {
    const id = props.riotId || "Player#VAL";
    const idx = id.indexOf('#');
    return idx !== -1 ? id.substring(0, idx) : id;
  };

  const getTagLine = () => {
    const id = props.riotId || "Player#VAL";
    const idx = id.indexOf('#');
    return idx !== -1 ? id.substring(idx) : "#VAL";
  };

  const copyRiotId = () => {
    navigator.clipboard.writeText(props.riotId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section class="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl space-y-6">
      
      {/* Dynamic Ambient Glow Behind Banner */}
      <div class="absolute -right-16 -top-16 w-80 h-80 bg-gradient-to-br from-val-cyan/15 via-val-red/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div class="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />

      {/* Top Row: Identity & Primary Actions */}
      <div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        
        {/* Identity Block */}
        <div class="flex items-center gap-5 sm:gap-6">
          
          {/* Agent Avatar or Val Emblem */}
          <div class="relative flex-shrink-0">
            <div class="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-val-red via-rose-600 to-amber-500 p-1 shadow-glow-red flex items-center justify-center">
              <div class="w-full h-full bg-[#070A10] rounded-[22px] overflow-hidden flex items-center justify-center">
                {props.primaryAgentIcon ? (
                  <img src={props.primaryAgentIcon} alt="Main Agent" class="w-full h-full object-cover" />
                ) : (
                  <span class="font-tactical font-black text-2xl sm:text-3xl text-white">VAL</span>
                )}
              </div>
            </div>
            <span class="absolute -bottom-2 -right-1 text-[9px] font-black font-tactical uppercase tracking-wider px-2 py-0.5 rounded-full bg-val-emerald text-val-obsidian shadow-md">
              LVL {props.level || 42}
            </span>
          </div>

          {/* Name, Tagline & Career Peak */}
          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="text-3xl sm:text-5xl font-black font-tactical text-white tracking-tight flex items-center gap-2">
                <span>{getGameName()}</span>
                <span class="text-lg sm:text-2xl px-2.5 py-0.5 rounded-xl bg-white/[0.06] text-val-cyan border border-val-cyan/30 font-bold">
                  {getTagLine()}
                </span>
              </h1>

              {/* Quick Copy Button */}
              <button
                onClick={copyRiotId}
                class="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                title="Copy Riot ID"
              >
                {copied() ? (
                  <span class="text-[10px] font-mono text-val-emerald font-bold">COPIED!</span>
                ) : (
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Standing & Peak Career Info */}
            <div class="flex flex-wrap items-center gap-3 text-xs font-tactical">
              <span class="px-2.5 py-0.5 rounded-md bg-val-gold/15 text-val-gold border border-val-gold/30 font-bold uppercase tracking-wider">
                PEAK: {props.peakRating || "Immortal 2"} ({props.peakAct || "E7: A3"})
              </span>
              <span class="text-slate-400 font-mono text-[11px]">
                ● GLOBAL SNAPPYSTORE ARCHIVE
              </span>
            </div>
          </div>

        </div>

        {/* Action Toolbar */}
        <div class="flex items-center gap-3 w-full lg:w-auto justify-end">
          
          {/* Sync Now Button */}
          <button
            onClick={props.onSync}
            disabled={props.syncing}
            class="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-val-cyan/20 to-teal-500/20 border border-val-cyan/40 text-val-cyan hover:bg-val-cyan hover:text-val-obsidian font-tactical font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-glow-cyan disabled:opacity-50"
            title="Pull latest match telemetry from Riot Cloud"
          >
            <svg class={`w-4 h-4 ${props.syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{props.syncing ? 'SYNCING...' : 'SYNC NOW'}</span>
          </button>

          {/* Share Button */}
          <button
            onClick={copyRiotId}
            class="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white transition-all cursor-pointer"
            title="Share Profile"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

      </div>

      {/* Bottom Row: Tactical Mode & Act Filter Controls */}
      <div class="relative z-10 pt-4 border-t border-white/[0.08] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Segmented Queue Controller */}
        <div class="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/[0.08] overflow-x-auto max-w-full">
          <For each={PRIMARY_QUEUES}>
            {(queue) => (
              <button
                onClick={() => props.onSelectQueue(queue)}
                class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  props.selectedQueue === queue
                    ? 'bg-val-red text-white shadow-glow-red'
                    : 'text-val-muted hover:text-white hover:bg-white/5'
                }`}
              >
                {queue}
              </button>
            )}
          </For>
        </div>

        {/* Act Selector Dropdown */}
        <div class="relative">
          <button
            onClick={() => setShowActMenu(!showActMenu())}
            class="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-black/50 border border-white/[0.08] hover:border-white/20 text-xs font-tactical font-black text-white tracking-wider cursor-pointer"
          >
            <span class="text-val-muted font-normal uppercase">ACT:</span>
            <span class="text-val-cyan">{props.selectedAct}</span>
            <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showActMenu() && (
            <div class="absolute right-0 mt-2 w-36 glass-card rounded-xl border border-white/15 p-1 shadow-2xl z-30 space-y-0.5 animate-fade-in">
              <For each={ACTS}>
                {(act) => (
                  <button
                    onClick={() => {
                      props.onSelectAct(act);
                      setShowActMenu(false);
                    }}
                    class={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-tactical font-bold uppercase transition-all ${
                      props.selectedAct === act
                        ? 'bg-val-cyan text-val-obsidian font-black'
                        : 'text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {act}
                  </button>
                )}
              </For>
            </div>
          )}
        </div>

      </div>

    </section>
  );
};
