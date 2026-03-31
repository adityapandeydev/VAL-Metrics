import { Component, For } from 'solid-js';

interface Props {
  selectedQueue: string;
  onSelectQueue: (queue: string) => void;
  selectedAct: string;
  onSelectAct: (act: string) => void;
}

const QUEUES = ['Competitive', 'Unrated', 'Deathmatch', 'Swiftplay', 'Skirmish 2v2'];
const ACTS = ['V26: A4', 'All Acts'];

export const TacticalFilterBar: Component<Props> = (props) => {
  return (
    <div class="w-full bg-[#0D121C] border border-white/10 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
      {/* Platform Indicator */}
      <div class="flex items-center gap-2 bg-black/60 p-1 rounded-xl border border-white/5">
        <span class="px-4 py-1.5 rounded-lg bg-val-card text-white text-xs font-bold font-tactical tracking-wider shadow-inner">
          PC PLATFORM
        </span>
        <span class="px-4 py-1.5 rounded-lg text-val-muted text-xs font-medium hover:text-white cursor-pointer transition-colors font-tactical">
          CONSOLE
        </span>
      </div>

      {/* Mode Selector Console */}
      <div class="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 flex-1 max-w-2xl justify-center">
        <For each={QUEUES}>
          {(queue) => (
            <button
              onClick={() => props.onSelectQueue(queue)}
              class={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-extrabold transition-all font-tactical uppercase tracking-wider ${
                props.selectedQueue === queue
                  ? 'bg-val-red text-white shadow-glow-red scale-[1.02]'
                  : 'text-val-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {queue}
            </button>
          )}
        </For>
      </div>

      {/* Act Selector Console */}
      <div class="flex items-center gap-1.5 bg-black/60 p-1 rounded-xl border border-white/5">
        <For each={ACTS}>
          {(act) => (
            <button
              onClick={() => props.onSelectAct(act)}
              class={`px-4 py-2 rounded-lg text-xs font-black font-tactical tracking-widest uppercase transition-all ${
                props.selectedAct === act
                  ? 'bg-val-cyan text-val-obsidian shadow-glow-cyan'
                  : 'text-val-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {act}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};
