import { Component, For, createSignal, createMemo } from 'solid-js';
import { AdvancedPlayerMetrics, WeaponLethality } from '../../../types/analytics';
import { ALL_WEAPONS, WeaponData } from '../../../data/weapons';

interface Props {
  stats: AdvancedPlayerMetrics;
}

export const WeaponsTab: Component<Props> = (props) => {
  const [selectedCategory, setSelectedCategory] = createSignal<string>('ALL');

  const armoryLookup = createMemo(() => {
    const map = new Map<string, WeaponLethality>();
    (props.stats.weaponArmory || []).forEach(w => {
      map.set(w.weaponName.toLowerCase(), w);
    });
    return map;
  });

  const filteredWeapons = createMemo(() => {
    return ALL_WEAPONS.filter(w => {
      if (selectedCategory() === 'ALL') return true;
      if (selectedCategory() === 'RIFLES') return w.category === 'Rifles';
      if (selectedCategory() === 'SIDEARMS') return w.category === 'Sidearms';
      if (selectedCategory() === 'SNIPERS') return w.category === 'Sniper Rifles';
      if (selectedCategory() === 'SMGS') return w.category === 'SMGs';
      if (selectedCategory() === 'SHOTGUNS') return w.category === 'Shotguns';
      if (selectedCategory() === 'HEAVY') return w.category === 'Heavy Weapons';
      if (selectedCategory() === 'MELEE') return w.category === 'Melee';
      return true;
    });
  });

  return (
    <div class="space-y-6 animate-fade-in">
      
      {/* Category Filter Pills */}
      <div class="glass-card rounded-3xl p-5 flex items-center justify-between gap-4 overflow-x-auto">
        <div class="glass-pill p-1 rounded-xl flex items-center gap-1 min-w-max">
          <button
            onClick={() => setSelectedCategory('ALL')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory() === 'ALL' ? 'bg-white/20 text-white' : 'text-val-muted hover:text-white'
            }`}
          >
            ALL ARMORY ({ALL_WEAPONS.length})
          </button>
          <button
            onClick={() => setSelectedCategory('RIFLES')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory() === 'RIFLES' ? 'bg-val-red text-white' : 'text-val-muted hover:text-white'
            }`}
          >
            RIFLES (4)
          </button>
          <button
            onClick={() => setSelectedCategory('SIDEARMS')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory() === 'SIDEARMS' ? 'bg-val-cyan text-val-obsidian font-black' : 'text-val-muted hover:text-white'
            }`}
          >
            SIDEARMS (5)
          </button>
          <button
            onClick={() => setSelectedCategory('SNIPERS')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory() === 'SNIPERS' ? 'bg-val-gold text-val-obsidian font-black' : 'text-val-muted hover:text-white'
            }`}
          >
            SNIPERS (3)
          </button>
          <button
            onClick={() => setSelectedCategory('SMGS')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory() === 'SMGS' ? 'bg-val-emerald text-val-obsidian font-black' : 'text-val-muted hover:text-white'
            }`}
          >
            SMGs (2)
          </button>
          <button
            onClick={() => setSelectedCategory('SHOTGUNS')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory() === 'SHOTGUNS' ? 'bg-val-purple text-white' : 'text-val-muted hover:text-white'
            }`}
          >
            SHOTGUNS (2)
          </button>
          <button
            onClick={() => setSelectedCategory('HEAVY')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory() === 'HEAVY' ? 'bg-amber-600 text-white' : 'text-val-muted hover:text-white'
            }`}
          >
            HEAVY (2)
          </button>
          <button
            onClick={() => setSelectedCategory('MELEE')}
            class={`px-3.5 py-1.5 rounded-lg text-xs font-black font-tactical uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory() === 'MELEE' ? 'bg-slate-400 text-val-obsidian font-black' : 'text-val-muted hover:text-white'
            }`}
          >
            MELEE (1)
          </button>
        </div>
      </div>

      {/* Weapons 19 Grid */}
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <For each={filteredWeapons()}>
          {(weapon) => {
            const telemetry = armoryLookup().get(weapon.name.toLowerCase());
            const hasKills = !!telemetry && telemetry.totalKills > 0;

            return (
              <div class="glass-card glass-card-hover rounded-3xl p-6 flex flex-col justify-between space-y-4 group">
                
                {/* Weapon Header */}
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-2xl font-black font-tactical text-white tracking-wide group-hover:text-val-cyan transition-colors">
                      {weapon.name}
                    </h3>
                    <span class="text-[10px] font-mono text-val-muted uppercase tracking-wider">
                      {weapon.category} • {weapon.cost > 0 ? `${weapon.cost} Credits` : 'Free Sidearm'}
                    </span>
                  </div>

                  {hasKills ? (
                    <div class="bg-val-red/15 px-3 py-1 rounded-xl border border-val-red/30 text-right">
                      <span class="text-[9px] font-mono text-val-muted uppercase block">LETHALITY</span>
                      <span class="text-sm font-black font-tactical text-val-red leading-none">
                        {telemetry?.totalKills} KILLS
                      </span>
                    </div>
                  ) : (
                    <span class="text-[10px] font-mono text-slate-500 bg-white/5 px-2.5 py-1 rounded-lg">
                      RESERVE ARMORY
                    </span>
                  )}
                </div>

                {/* Gun Silhouette Visual */}
                <div class="h-28 w-full bg-black/40 rounded-2xl border border-white/5 p-4 flex items-center justify-center relative overflow-hidden">
                  <img 
                    src={weapon.iconUrl} 
                    alt={weapon.name} 
                    class="max-h-full max-w-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-transform" 
                  />
                </div>

                {/* Performance Hit Split or Gun Specifications */}
                {hasKills && telemetry ? (
                  <div class="space-y-2 font-tactical">
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-val-red font-bold">Head: {telemetry.headshotPercent}%</span>
                      <span class="text-val-cyan font-bold">Body: {telemetry.bodyshotPercent}%</span>
                      <span class="text-slate-400 font-bold">Legs: {telemetry.legshotPercent}%</span>
                    </div>

                    <div class="h-2 w-full bg-white/5 rounded-full overflow-hidden flex shadow-inner">
                      <div class="h-full bg-val-red" style={{ width: `${telemetry.headshotPercent}%` }} />
                      <div class="h-full bg-val-cyan" style={{ width: `${telemetry.bodyshotPercent}%` }} />
                      <div class="h-full bg-slate-600" style={{ width: `${telemetry.legshotPercent}%` }} />
                    </div>
                  </div>
                ) : (
                  <div class="grid grid-cols-3 gap-2 bg-black/30 p-3 rounded-xl border border-white/5 text-center font-tactical text-xs">
                    <div>
                      <span class="text-[9px] text-val-muted block uppercase">Fire Rate</span>
                      <span class="font-black text-white">{weapon.fireRate}</span>
                    </div>
                    <div>
                      <span class="text-[9px] text-val-muted block uppercase">Mag Size</span>
                      <span class="font-black text-white">{weapon.magazineSize}</span>
                    </div>
                    <div>
                      <span class="text-[9px] text-val-muted block uppercase">Wall Pen</span>
                      <span class="font-black text-val-cyan">{weapon.wallPenetration}</span>
                    </div>
                  </div>
                )}

                {/* Damage Stats Row */}
                <div class="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-tactical text-val-muted">
                  <span>Damage (0-30m):</span>
                  <span class="font-mono text-white">
                    <strong class="text-val-red">{weapon.damage.head}</strong> / <strong class="text-val-cyan">{weapon.damage.body}</strong> / <strong class="text-slate-400">{weapon.damage.legs}</strong>
                  </span>
                </div>

              </div>
            );
          }}
        </For>
      </div>

    </div>
  );
};
