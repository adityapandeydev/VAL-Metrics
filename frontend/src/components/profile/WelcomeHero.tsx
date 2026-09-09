import { Component, For, createSignal } from 'solid-js';

interface Props {
  onSearch: (riotId: string) => void;
}

const FEATURED_PROS = [
  { name: "TenZ#0505", role: "Duelist", rank: "Radiant", team: "Sentinels" },
  { name: "aspas#LEV", role: "Duelist", rank: "Radiant", team: "Leviatán" },
  { name: "Boaster#FNC", role: "Controller", rank: "Radiant", team: "Fnatic" },
  { name: "yay#BLEED", role: "Duelist", rank: "Radiant", team: "Bleed Esports" },
];

export const WelcomeHero: Component<Props> = (props) => {
  const [inputVal, setInputVal] = createSignal("");

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (inputVal() && inputVal().includes('#')) {
      props.onSearch(inputVal().trim());
    }
  };

  return (
    <div class="max-w-4xl mx-auto py-12 px-4 space-y-10 text-center animate-fade-in">
      
      {/* Hero Header */}
      <div class="space-y-4">
        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-val-cyan/10 border border-val-cyan/30 text-val-cyan text-[11px] font-black font-tactical uppercase tracking-widest">
          <span class="w-1.5 h-1.5 rounded-full bg-val-cyan shadow-[0_0_8px_#00E5FF] animate-pulse" />
          UNIVERSAL SNAPPYSTORE ENGINE ONLINE
        </div>

        <h1 class="text-4xl sm:text-6xl font-black font-tactical text-white tracking-tight leading-none uppercase">
          TACTICAL RECONNAISSANCE & <br />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-val-red via-rose-500 to-amber-500">
            COMBAT TELEMETRY
          </span>
        </h1>

        <p class="text-sm sm:text-base text-val-muted max-w-xl mx-auto leading-relaxed">
          Deep-dive algorithmic performance analysis, proprietary VAL-Index scoring, and sub-millisecond match archives for competitive VALORANT.
        </p>
      </div>

      {/* Direct Search Bar */}
      <form onSubmit={handleSubmit} class="max-w-xl mx-auto">
        <div class="glass-card rounded-2xl p-2 flex items-center gap-2 border border-white/15 focus-within:border-val-cyan transition-all shadow-2xl">
          <input
            type="text"
            value={inputVal()}
            onInput={(e) => setInputVal(e.currentTarget.value)}
            placeholder="Enter Riot ID (e.g. TenZ#0505)..."
            required
            class="flex-1 bg-transparent px-4 py-3 text-sm sm:text-base font-semibold text-white placeholder-slate-500 focus:outline-none font-tactical"
          />
          <button
            type="submit"
            class="px-6 py-3 rounded-xl bg-gradient-to-r from-val-red to-rose-600 text-white font-tactical font-black text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 shadow-glow-red transition-all cursor-pointer whitespace-nowrap"
          >
            ANALYZE PROFILE
          </button>
        </div>
      </form>

      {/* One-Click Pro Player Quick-Load Roster */}
      <div class="space-y-3">
        <span class="text-xs font-black font-tactical text-val-muted uppercase tracking-widest block">
          OR EXPLORE VERIFIED PRO TELEMETRY:
        </span>
        <div class="flex flex-wrap items-center justify-center gap-3">
          <For each={FEATURED_PROS}>
            {(pro) => (
              <button
                onClick={() => props.onSearch(pro.name)}
                class="glass-card glass-card-hover px-4 py-2.5 rounded-2xl border border-white/10 hover:border-val-cyan/50 flex items-center gap-3 cursor-pointer group"
              >
                <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-val-red/20 to-val-cyan/20 border border-white/10 flex items-center justify-center text-xs font-black font-tactical text-white">
                  {pro.name.charAt(0)}
                </div>
                <div class="text-left">
                  <span class="text-xs font-black font-tactical text-white group-hover:text-val-cyan transition-colors block leading-none">
                    {pro.name}
                  </span>
                  <span class="text-[10px] text-val-muted font-mono block mt-0.5">
                    {pro.team} • {pro.role}
                  </span>
                </div>
              </button>
            )}
          </For>
        </div>
      </div>

      {/* 3 Architecture Pillars */}
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 text-left">
        
        <div class="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2">
          <div class="w-8 h-8 rounded-xl bg-val-cyan/15 border border-val-cyan/30 flex items-center justify-center text-val-cyan font-tactical font-black text-xs">
            01
          </div>
          <h4 class="text-sm font-black font-tactical text-white uppercase tracking-wider">
            VAL-INDEX METRICS
          </h4>
          <p class="text-xs text-val-muted leading-relaxed">
            Composite 1,000-point rating weighing Combat ACS, KAST round consistency, Damage Delta, and round win conversion.
          </p>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2">
          <div class="w-8 h-8 rounded-xl bg-val-emerald/15 border border-val-emerald/30 flex items-center justify-center text-val-emerald font-tactical font-black text-xs">
            02
          </div>
          <h4 class="text-sm font-black font-tactical text-white uppercase tracking-wider">
            SNAPPYSTORE ARCHIVE
          </h4>
          <p class="text-xs text-val-muted leading-relaxed">
            Sub-millisecond RAM-indexed caching paired with background cloud sync for instant search query responses.
          </p>
        </div>

        <div class="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-2">
          <div class="w-8 h-8 rounded-xl bg-val-red/15 border border-val-red/30 flex items-center justify-center text-val-red font-tactical font-black text-xs">
            03
          </div>
          <h4 class="text-sm font-black font-tactical text-white uppercase tracking-wider">
            VANGUARD COMPLIANT
          </h4>
          <p class="text-xs text-val-muted leading-relaxed">
            Zero memory injection or game process hooks. Uses authorized local client loopback and official cloud endpoints only.
          </p>
        </div>

      </div>

    </div>
  );
};
