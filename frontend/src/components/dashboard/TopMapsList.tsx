import { Component, For } from 'solid-js';
import { MapRecord } from '../../types/analytics';

interface Props {
  maps?: MapRecord[];
}

export const TopMapsList: Component<Props> = (props) => {
  const maps: MapRecord[] = props.maps && props.maps.length > 0 ? props.maps : [
    { mapName: "Sunset", matchesPlayed: 2, winRate: 100.0, recordString: "2W - 0L" }
  ];

  return (
    <div class="glass-panel rounded-2xl p-5 border border-white/10 space-y-4 shadow-xl">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <span class="text-xs font-black text-val-muted font-tactical uppercase tracking-widest flex items-center gap-2">
          Top Tournament Maps
        </span>
        <span class="text-xs font-extrabold text-val-gold hover:underline cursor-pointer font-tactical uppercase">
          View All Maps →
        </span>
      </div>

      <div class="space-y-3">
        <For each={maps}>
          {(m) => (
            <div class="bg-gradient-to-r from-[#0B0E14] via-[#121824] to-[#0B0E14] p-4 rounded-xl border border-white/5 hover:border-val-gold/40 transition-all flex items-center justify-between group">
              
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl bg-val-gold/15 border border-val-gold/40 flex items-center justify-center text-sm font-black font-tactical text-val-gold shadow-glow-gold group-hover:scale-105 transition-transform">
                  MAP
                </div>
                <div>
                  <h5 class="text-xl font-black text-white font-tactical uppercase tracking-wide group-hover:text-val-gold transition-colors">
                    {m.mapName}
                  </h5>
                  <span class="text-[11px] font-semibold text-slate-400 font-mono block">
                    {m.matchesPlayed} {m.matchesPlayed === 1 ? 'Match' : 'Matches'} Analyzed
                  </span>
                </div>
              </div>

              <div class="text-right">
                <span class="text-2xl font-black font-tactical text-val-emerald block leading-none">{m.winRate}%</span>
                <span class="text-xs font-extrabold font-tactical text-val-gold bg-val-gold/10 px-2 py-0.5 rounded border border-val-gold/20 block mt-1">
                  {m.recordString}
                </span>
              </div>

            </div>
          )}
        </For>
      </div>
    </div>
  );
};
