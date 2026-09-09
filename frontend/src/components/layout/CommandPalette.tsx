import { Component, createSignal, onMount, onCleanup, For, Show } from 'solid-js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (riotId: string) => void;
}

const PRO_PLAYERS = [
  { name: "TenZ#0505", role: "Duelist / Controller", team: "Sentinels" },
  { name: "aspas#LEV", role: "Duelist", team: "Leviatán" },
  { name: "Boaster#FNC", role: "Controller / IGL", team: "Fnatic" },
  { name: "yay#BLEED", role: "Duelist / Chamber", team: "Bleed Esports" },
  { name: "Chronicle#1337", role: "Initiator", team: "Fnatic" },
];

export const CommandPalette: Component<Props> = (props) => {
  const [query, setQuery] = createSignal("");
  const [recentSearches, setRecentSearches] = createSignal<string[]>([]);
  let inputRef: HTMLInputElement | undefined;

  onMount(() => {
    try {
      const saved = localStorage.getItem('val_recent_searches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        props.isOpen ? props.onClose() : null;
      }
      if (e.key === '/' && !props.isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
      }
      if (e.key === 'Escape' && props.isOpen) {
        props.onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  const handleSubmit = (riotId: string) => {
    const trimmed = riotId.trim();
    if (!trimmed || !trimmed.includes('#')) return;

    // Save to recents
    try {
      const updated = [trimmed, ...recentSearches().filter(s => s !== trimmed)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('val_recent_searches', JSON.stringify(updated));
    } catch {}

    props.onSelectPlayer(trimmed);
    setQuery("");
    props.onClose();
  };

  return (
    <Show when={props.isOpen}>
      <div 
        class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-md animate-fade-in"
        onClick={props.onClose}
      >
        <div 
          class="glass-card rounded-3xl w-full max-w-2xl border border-white/15 p-5 shadow-2xl space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Bar */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(query());
            }}
            class="flex items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/10 focus-within:border-val-cyan transition-all"
          >
            <svg class="w-5 h-5 text-val-cyan flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              autofocus
              type="text"
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              placeholder="Enter Riot ID with Tagline (e.g. TenZ#0505)..."
              class="w-full bg-transparent text-sm sm:text-base font-semibold text-white placeholder-slate-500 focus:outline-none font-tactical"
            />
            <button
              type="submit"
              class="px-4 py-1.5 rounded-xl bg-val-cyan text-val-obsidian font-black text-xs font-tactical uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-glow-cyan"
            >
              SEARCH
            </button>
          </form>

          {/* Instant Pro Player Chips */}
          <div class="space-y-2">
            <span class="text-[10px] font-black font-tactical text-val-muted uppercase tracking-wider block">
              Quick Telemetry Load (Verified Pros):
            </span>
            <div class="flex flex-wrap gap-2">
              <For each={PRO_PLAYERS}>
                {(pro) => (
                  <button
                    onClick={() => handleSubmit(pro.name)}
                    class="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-val-cyan/60 hover:bg-val-cyan/10 transition-all flex items-center gap-2 group text-left cursor-pointer"
                  >
                    <span class="text-xs font-black font-tactical text-white group-hover:text-val-cyan transition-colors">
                      {pro.name}
                    </span>
                    <span class="text-[10px] text-val-muted font-mono">
                      {pro.team}
                    </span>
                  </button>
                )}
              </For>
            </div>
          </div>

          {/* Recent Searches */}
          <Show when={recentSearches().length > 0}>
            <div class="space-y-2 pt-2 border-t border-white/5">
              <span class="text-[10px] font-black font-tactical text-val-muted uppercase tracking-wider block">
                Recent Profile Searches:
              </span>
              <div class="flex flex-wrap gap-2">
                <For each={recentSearches()}>
                  {(rec) => (
                    <button
                      onClick={() => handleSubmit(rec)}
                      class="px-3 py-1 rounded-lg bg-black/40 border border-white/5 hover:border-white/20 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      {rec}
                    </button>
                  )}
                </For>
              </div>
            </div>
          </Show>

          {/* Keyboard Hint Footer */}
          <div class="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5">
            <span>Press <kbd class="px-1 rounded bg-white/10 text-white">Enter</kbd> to inspect telemetry</span>
            <span>Press <kbd class="px-1 rounded bg-white/10 text-white">Esc</kbd> to close</span>
          </div>

        </div>
      </div>
    </Show>
  );
};
