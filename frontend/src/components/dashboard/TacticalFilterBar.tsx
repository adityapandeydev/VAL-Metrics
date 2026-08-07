import { Component, For, createSignal, onCleanup, onMount } from 'solid-js';

interface Props {
  selectedQueue: string;
  onSelectQueue: (queue: string) => void;
  selectedAct: string;
  onSelectAct: (act: string) => void;
}

const PRIMARY_QUEUES = ['Competitive', 'Unrated', 'Deathmatch', 'Swiftplay', 'TDM', 'Escalation', 'Skirmish 2v2'];
const OVERFLOW_QUEUES = ['Premier', 'AROS', 'Snowball Fight', 'Replication'];

const HISTORICAL_ACTS = [
  'V26: A4', 'All Acts',
  'V26: A3', 'V26: A2', 'V26: A1',
  'V25: A6', 'V25: A5', 'V25: A4', 'V25: A3', 'V25: A2', 'V25: A1',
  'E9: A3', 'E9: A2', 'E9: A1',
  'E8: A3', 'E8: A2', 'E8: A1',
  'E7: A3', 'E7: A2', 'E7: A1',
  'E6: A3', 'E6: A2', 'E6: A1',
  'E5: A3', 'E5: A2', 'E5: A1',
  'E4: A3', 'E4: A2', 'E4: A1',
  'E3: A3', 'E3: A2', 'E3: A1',
  'E2: A3', 'E2: A2', 'E2: A1',
  'E1: A3', 'E1: A2', 'E1: A1'
];

export const TacticalFilterBar: Component<Props> = (props) => {
  const [showQueueDropdown, setShowQueueDropdown] = createSignal(false);
  const [showActDropdown, setShowActDropdown] = createSignal(false);

  const closeDropdowns = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.dropdown-container')) {
      setShowQueueDropdown(false);
      setShowActDropdown(false);
    }
  };

  onMount(() => document.addEventListener('click', closeDropdowns));
  onCleanup(() => document.removeEventListener('click', closeDropdowns));

  return (
    <div class="w-full bg-[#0B0F17] border border-white/10 rounded-2xl p-3 flex flex-wrap xl:flex-nowrap items-center justify-between gap-4 shadow-xl relative z-40">
      
      {/* Automatic Platform Indicator (PC default) */}
      <div class="flex items-center gap-2 bg-[#182234] px-4 py-2.5 rounded-xl border border-white/10 shadow-inner flex-shrink-0">
        <span class="w-2 h-2 rounded-full bg-val-emerald animate-pulse shadow-[0_0_8px_#10B981]" />
        <span class="text-xs font-extrabold font-tactical uppercase tracking-wider text-white">
          PC PLATFORM
        </span>
      </div>

      {/* Primary Mode Buttons + Overflow Mode Dropdown */}
      <div class="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/5 flex-1 relative dropdown-container overflow-x-auto min-w-0 custom-scrollbar">
        <For each={PRIMARY_QUEUES}>
          {(queue) => (
            <button
              onClick={() => props.onSelectQueue(queue)}
              class={`flex-1 whitespace-nowrap px-3 lg:px-4 py-2 rounded-lg text-xs font-black transition-all font-tactical uppercase tracking-wider text-center ${
                props.selectedQueue === queue
                  ? 'bg-val-red text-white shadow-glow-red'
                  : 'text-val-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {queue}
            </button>
          )}
        </For>

        {/* Overflow Modes Button */}
        <div class="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowQueueDropdown(!showQueueDropdown());
              setShowActDropdown(false);
            }}
            class={`px-3 py-2 rounded-lg text-xs font-black transition-all font-tactical border ${
              OVERFLOW_QUEUES.includes(props.selectedQueue) || showQueueDropdown()
                ? 'bg-val-red text-white border-val-red shadow-glow-red'
                : 'bg-white/5 text-val-muted hover:text-white border-white/10 hover:bg-white/10'
            }`}
            title="More Game Modes (Premier, AROS, Snowball)"
          >
            ⋮
          </button>

          {/* Modes Popup Menu */}
          {showQueueDropdown() && (
            <div class="absolute right-0 mt-2 w-52 bg-[#0F1626] border border-white/20 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl">
              <div class="px-3 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase font-tactical border-b border-white/10 mb-1">
                Additional Modes Archive
              </div>
              <For each={OVERFLOW_QUEUES}>
                {(queue) => (
                  <button
                    onClick={() => {
                      props.onSelectQueue(queue);
                      setShowQueueDropdown(false);
                    }}
                    class={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-extrabold font-tactical tracking-wide transition-all flex items-center justify-between ${
                      props.selectedQueue === queue
                        ? 'bg-val-red text-white shadow-glow-red'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{queue}</span>
                    {props.selectedQueue === queue && <span>✓</span>}
                  </button>
                )}
              </For>
            </div>
          )}
        </div>
      </div>

      {/* Act & Episode Archive Selector with Scrollable History Dropdown */}
      <div class="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/5 relative dropdown-container">
        
        {/* Quick Button: Active Act (V26: A4) */}
        <button
          onClick={() => props.onSelectAct('V26: A4')}
          class={`px-4 py-2 rounded-lg text-xs font-black font-tactical tracking-widest uppercase transition-all ${
            props.selectedAct === 'V26: A4'
              ? 'bg-val-cyan text-val-obsidian shadow-glow-cyan'
              : 'text-val-muted hover:text-white hover:bg-white/5'
          }`}
        >
          V26: A4
        </button>

        {/* Quick Button: All Acts */}
        <button
          onClick={() => props.onSelectAct('All Acts')}
          class={`px-4 py-2 rounded-lg text-xs font-black font-tactical tracking-widest uppercase transition-all ${
            props.selectedAct === 'All Acts'
              ? 'bg-val-cyan text-val-obsidian shadow-glow-cyan'
              : 'text-val-muted hover:text-white hover:bg-white/5'
          }`}
        >
          ALL ACTS
        </button>

        {/* Historical Acts Dropdown Trigger */}
        <div class="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActDropdown(!showActDropdown());
              setShowQueueDropdown(false);
            }}
            class={`px-2.5 py-2 rounded-lg text-sm font-black transition-all border ${
              (!['V26: A4', 'All Acts'].includes(props.selectedAct) || showActDropdown())
                ? 'bg-val-cyan text-val-obsidian border-val-cyan shadow-glow-cyan'
                : 'bg-white/5 text-val-muted hover:text-white border-white/10 hover:bg-white/10'
            }`}
            title="Complete VALORANT Historical Acts & Episodes Archive (E1 to V26)"
          >
            ⋮
          </button>

          {/* Scrollable Acts Archive Popup Menu */}
          {showActDropdown() && (
            <div class="absolute right-0 mt-2 w-64 bg-[#0D1322] border border-val-cyan/40 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
              <div class="flex items-center justify-between px-3 py-2 text-xs font-black text-val-cyan uppercase font-tactical border-b border-white/10 mb-2">
                <span>Historical Act Archive</span>
                <span class="text-[10px] text-slate-400 font-mono">E1 → V26</span>
              </div>
              
              <div class="max-h-72 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                <For each={HISTORICAL_ACTS}>
                  {(act) => (
                    <button
                      onClick={() => {
                        props.onSelectAct(act);
                        setShowActDropdown(false);
                      }}
                      class={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-black font-tactical tracking-wider transition-all flex items-center justify-between ${
                        props.selectedAct === act
                          ? 'bg-gradient-to-r from-val-cyan to-teal-500 text-val-obsidian shadow-md'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span class="flex items-center gap-2">
                        <span class={`w-1.5 h-1.5 rounded-full ${act.startsWith('V26') || act.startsWith('V25') ? 'bg-val-red' : 'bg-slate-500'}`} />
                        {act}
                      </span>
                      {props.selectedAct === act && <span class="font-bold">LIVE</span>}
                    </button>
                  )}
                </For>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
