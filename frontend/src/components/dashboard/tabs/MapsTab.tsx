import { Component, For, createMemo } from 'solid-js';
import { AdvancedPlayerMetrics, MapRecord } from '../../../types/analytics';
import { ALL_MAPS, MapData } from '../../../data/maps';

interface Props {
  stats: AdvancedPlayerMetrics;
}

export const MapsTab: Component<Props> = (props) => {
  const playedMapLookup = createMemo(() => {
    const map = new Map<string, MapRecord>();
    (props.stats.mapDomination || []).forEach(m => {
      map.set(m.mapName.toLowerCase(), m);
    });
    return map;
  });

  return (
    <div class="space-y-6 animate-fade-in">
      
      {/* Header Banner */}
      <div class="glass-card rounded-3xl p-6 sm:p-7 flex items-center justify-between shadow-2xl">
        <div>
          <h2 class="text-2xl sm:text-3xl font-black font-tactical text-white uppercase tracking-wide">
            MAP DOMINATION & ARCHITECTURE
          </h2>
          <p class="text-xs sm:text-sm text-val-muted mt-1 font-tactical">
            All 13 official VALORANT competitive & tactical environments with win-rate breakdowns.
          </p>
        </div>
        <div class="text-right hidden sm:block">
          <span class="text-2xl font-black font-tactical text-val-gold">13 MAPS</span>
          <span class="text-[10px] font-mono text-val-muted block uppercase">COMPLETE POOL</span>
        </div>
      </div>

      {/* 13 Maps Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <For each={ALL_MAPS}>
          {(mapItem) => {
            const telemetry = playedMapLookup().get(mapItem.name.toLowerCase());
            const hasPlayed = !!telemetry;

            return (
              <div class="glass-card glass-card-hover rounded-3xl overflow-hidden flex flex-col justify-between group">
                
                {/* Map Splash Thumbnail Header */}
                <div class="relative h-44 w-full overflow-hidden bg-black/80">
                  <img 
                    src={mapItem.splashUrl} 
                    alt={mapItem.name} 
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                  />
                  <div class="absolute inset-0 bg-gradient-to-t from-[#070A10] via-transparent to-black/40" />

                  {/* Top Map Badges */}
                  <div class="absolute top-4 left-4 right-4 flex items-center justify-between">
                    <span class="px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs font-black font-tactical text-white tracking-wider uppercase">
                      {mapItem.sites.length} SITES ({mapItem.sites.join(', ')})
                    </span>

                    {hasPlayed ? (
                      <span class="px-2.5 py-1 rounded-xl bg-val-emerald text-val-obsidian font-black text-xs font-tactical uppercase shadow-md">
                        {telemetry?.winRate}% WIN RATE
                      </span>
                    ) : (
                      <span class="px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md text-slate-400 font-mono text-[10px] uppercase">
                        UNPLAYED THIS ACT
                      </span>
                    )}
                  </div>

                  {/* Bottom Map Title */}
                  <div class="absolute bottom-3 left-4">
                    <h3 class="text-2xl font-black font-tactical text-white uppercase tracking-wider drop-shadow-md">
                      {mapItem.name}
                    </h3>
                    <span class="text-[11px] font-mono text-slate-300">
                      {mapItem.location}
                    </span>
                  </div>
                </div>

                {/* Map Body: Stats or Tactical Blueprint */}
                <div class="p-6 space-y-4 font-tactical flex-1 flex flex-col justify-between">
                  {hasPlayed && telemetry ? (
                    <div class="space-y-3">
                      <div class="grid grid-cols-2 gap-3 bg-black/40 p-3 rounded-2xl border border-white/5 text-center">
                        <div>
                          <span class="text-[9px] font-bold text-val-muted uppercase block">MATCHES PLAYED</span>
                          <span class="text-lg font-black text-white">{telemetry.matchesPlayed}</span>
                        </div>
                        <div>
                          <span class="text-[9px] font-bold text-val-muted uppercase block">MATCH RECORD</span>
                          <span class="text-lg font-black text-val-emerald">{telemetry.recordString}</span>
                        </div>
                      </div>

                      <div class="space-y-1 pt-1">
                        <div class="flex justify-between text-[11px]">
                          <span class="text-slate-400">Tactical Control Efficiency</span>
                          <span class="text-val-cyan font-mono font-bold">Optimal</span>
                        </div>
                        <div class="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div class="h-full bg-val-cyan rounded-full" style={{ width: `${telemetry.winRate}%` }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div class="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-2 text-xs">
                      <span class="text-[10px] uppercase font-bold text-val-muted tracking-wider block">
                        MAP MECHANIC & GIMMICK:
                      </span>
                      <p class="text-slate-300 leading-relaxed font-semibold">
                        {mapItem.gimmicks}
                      </p>
                    </div>
                  )}

                  <div class="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs text-val-muted">
                    <span>Pool Status:</span>
                    <span class={mapItem.isCompetitiveActive ? "text-val-emerald font-bold" : "text-slate-400"}>
                      {mapItem.isCompetitiveActive ? "Active Competitive Rotation" : "Reserve Tactical Pool"}
                    </span>
                  </div>
                </div>

              </div>
            );
          }}
        </For>
      </div>

    </div>
  );
};
