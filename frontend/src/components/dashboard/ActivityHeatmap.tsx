import { Component, For, createSignal } from 'solid-js';

export const ActivityHeatmap: Component = () => {
  const [activeTab, setActiveTab] = createSignal<'Playtime' | 'K/D' | 'Win Ratio'>('Playtime');

  // Generate 7 rows (days) across 8 weeks (columns) simulating July - August activity
  const matrix: number[][] = [
    [0, 1, 2, 4, 1, 0, 3, 2], // Sun
    [0, 0, 1, 3, 2, 1, 4, 1], // Mon
    [1, 2, 0, 4, 4, 3, 2, 3], // Tue
    [2, 3, 1, 2, 3, 4, 1, 2], // Wed
    [0, 1, 4, 3, 1, 2, 0, 4], // Thu
    [3, 4, 2, 1, 3, 4, 3, 1], // Fri
    [4, 4, 3, 2, 4, 4, 2, 4]  // Sat
  ];

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getCellColor = (val: number) => {
    switch(val) {
      case 0: return 'bg-[#181E29] border-white/5';
      case 1: return 'bg-val-red/30 border-val-red/20';
      case 2: return 'bg-val-red/60 border-val-red/40';
      case 3: return 'bg-val-red/80 border-val-red/60 shadow-sm';
      case 4: return 'bg-val-red text-white border-white/20 shadow-glow-red font-bold';
      default: return 'bg-[#181E29] border-white/5';
    }
  };

  return (
    <div class="space-y-6">
      {/* Activity Heatmap Card */}
      <div class="glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl space-y-4 bg-[#0B0F17]">
        <div class="flex items-baseline justify-between border-b border-white/10 pb-3">
          <div class="flex items-baseline gap-2">
            <h3 class="text-base font-black font-tactical text-white uppercase tracking-wider">
              ACTIVITY
            </h3>
            <span class="text-[11px] text-val-muted font-medium">Last 60 days.</span>
          </div>
          
          <div class="flex items-center gap-4 text-xs font-tactical font-bold">
            <button 
              onClick={() => setActiveTab('Playtime')}
              class={`pb-1 transition-all ${activeTab() === 'Playtime' ? 'text-white border-b-2 border-val-red' : 'text-val-muted hover:text-white'}`}
            >
              Playtime
            </button>
            <button 
              onClick={() => setActiveTab('K/D')}
              class={`pb-1 transition-all ${activeTab() === 'K/D' ? 'text-white border-b-2 border-val-red' : 'text-val-muted hover:text-white'}`}
            >
              K/D
            </button>
            <button 
              onClick={() => setActiveTab('Win Ratio')}
              class={`pb-1 transition-all ${activeTab() === 'Win Ratio' ? 'text-white border-b-2 border-val-red' : 'text-val-muted hover:text-white'}`}
            >
              Win Ratio
            </button>
          </div>
        </div>

        {/* Month Column Labels */}
        <div class="flex justify-around text-[11px] text-slate-400 font-tactical uppercase font-bold pl-8">
          <span>Jul</span>
          <span>Aug</span>
        </div>

        {/* Heatmap Grid Matrix */}
        <div class="flex gap-2 items-center justify-center">
          <div class="flex flex-col gap-1.5 text-[10px] text-slate-400 font-tactical uppercase font-bold text-right pr-1">
            <For each={days}>
              {(day) => <span class="h-4 flex items-center">{day}</span>}
            </For>
          </div>

          <div class="grid grid-flow-col gap-1.5 flex-1">
            <For each={matrix[0].map((_, colIdx) => matrix.map(row => row[colIdx]))}>
              {(col) => (
                <div class="flex flex-col gap-1.5">
                  <For each={col}>
                    {(val) => (
                      <div 
                        class={`w-4 h-4 rounded-md border transition-transform hover:scale-125 cursor-pointer ${getCellColor(val)}`} 
                        title={`Matches Activity Intensity: ${val} (Active telemetry cycle)`} 
                      />
                    )}
                  </For>
                </div>
              )}
            </For>
          </div>
        </div>

        {/* Legend */}
        <div class="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] font-mono text-val-muted">
          <span>Matches Played</span>
          <div class="flex items-center gap-1.5">
            <span>0</span>
            <span class="w-3.5 h-3.5 rounded bg-[#181E29] inline-block border border-white/5" />
            <span class="w-3.5 h-3.5 rounded bg-val-red/30 inline-block border border-val-red/20" />
            <span class="w-3.5 h-3.5 rounded bg-val-red/60 inline-block border border-val-red/40" />
            <span class="w-3.5 h-3.5 rounded bg-val-red/80 inline-block border border-val-red/60" />
            <span class="w-3.5 h-3.5 rounded bg-val-red inline-block shadow-glow-red border border-white/20" />
            <span>9+</span>
          </div>
        </div>
      </div>

      {/* TEAMMATES PANEL */}
      <div class="glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl space-y-3 bg-[#0B0F17]">
        <div class="flex items-baseline gap-2 border-b border-white/10 pb-3">
          <h3 class="text-base font-black font-tactical text-white uppercase tracking-wider">
            TEAMMATES
          </h3>
          <span class="text-[11px] text-val-muted font-medium">Matches played together.</span>
        </div>

        <div class="space-y-2.5 pt-1">
          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
            <div class="flex items-center gap-3">
              <img src="https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png" class="w-9 h-9 rounded-lg bg-black object-cover border border-val-cyan/40" alt="Viper" />
              <div>
                <h4 class="text-sm font-black font-tactical text-white">Viperain<span class="text-val-muted font-mono text-xs">#007</span></h4>
                <span class="text-[11px] text-val-emerald font-bold font-tactical">18 Matches Together</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-black font-tactical text-val-emerald block">66.7% WIN</span>
              <span class="text-[10px] text-val-muted font-mono">12W - 6L</span>
            </div>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer">
            <div class="flex items-center gap-3">
              <img src="https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png" class="w-9 h-9 rounded-lg bg-black object-cover border border-amber-500/40" alt="Jett" />
              <div>
                <h4 class="text-sm font-black font-tactical text-white">JettMain<span class="text-val-muted font-mono text-xs">#NA1</span></h4>
                <span class="text-[11px] text-amber-400 font-bold font-tactical">12 Matches Together</span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-sm font-black font-tactical text-white block">58.3% WIN</span>
              <span class="text-[10px] text-val-muted font-mono">7W - 5L</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
