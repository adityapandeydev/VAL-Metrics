import { Component, For } from 'solid-js';
import { WeaponLethality } from '../../types/analytics';

interface Props {
  weapons?: WeaponLethality[];
}

export const WeaponArmoryList: Component<Props> = (props) => {
  const armory: WeaponLethality[] = props.weapons && props.weapons.length > 0 ? props.weapons : [
    { weaponName: "Vandal", category: "Assault Rifles", totalKills: 39, headshotPercent: 21.0, bodyshotPercent: 79.0, legshotPercent: 0.0 },
    { weaponName: "Ghost", category: "Sidearms", totalKills: 5, headshotPercent: 12.0, bodyshotPercent: 88.0, legshotPercent: 0.0 },
    { weaponName: "Bandit", category: "Sidearms", totalKills: 3, headshotPercent: 22.0, bodyshotPercent: 78.0, legshotPercent: 0.0 }
  ];

  return (
    <div class="glass-panel rounded-2xl p-5 border border-white/10 space-y-5 shadow-xl">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <span class="text-xs font-black text-val-muted font-tactical uppercase tracking-widest flex items-center gap-2">
          Top Lethal Weapons
        </span>
        <span class="text-xs font-extrabold text-val-cyan hover:underline cursor-pointer font-tactical uppercase">
          View All Armory →
        </span>
      </div>

      <div class="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-center">
        <span class="text-[10px] font-bold font-mono text-rose-400 uppercase tracking-widest">
          Disclaimer: Waiting for production API to properly implement these features.
        </span>
      </div>

      <div class="space-y-3">
        <For each={armory}>
          {(w) => (
            <div class="bg-[#0B0E14] p-4 rounded-xl border border-white/5 hover:border-val-red/30 transition-all space-y-2.5 group">
              
              <div class="flex items-center justify-between">
                <div>
                  <h5 class="text-lg font-black text-white font-tactical tracking-wide group-hover:text-val-red transition-colors">
                    {w.weaponName}
                  </h5>
                  <span class="text-[10px] font-semibold text-val-muted uppercase tracking-wider block">
                    {w.category}
                  </span>
                </div>

                <div class="text-right flex items-center gap-4">
                  <div class="text-[11px] font-tactical">
                    <span class="text-val-red font-bold block">Head {w.headshotPercent}%</span>
                    <span class="text-val-cyan font-bold block">Body {w.bodyshotPercent}%</span>
                  </div>
                  <div class="bg-black/60 px-3 py-1.5 rounded-lg border border-white/10 text-center">
                    <span class="text-[10px] text-val-muted uppercase block leading-none">Kills</span>
                    <span class="text-xl font-black text-white font-tactical block mt-0.5">{w.totalKills}</span>
                  </div>
                </div>
              </div>

              {/* Segmented Marksmanship Progress Bar */}
              <div class="w-full h-2.5 bg-black rounded-full overflow-hidden flex border border-white/5 shadow-inner">
                <div class="bg-val-red transition-all" style={{ width: `${w.headshotPercent}%` }} title={`Head: ${w.headshotPercent}%`} />
                <div class="bg-val-cyan transition-all" style={{ width: `${w.bodyshotPercent}%` }} title={`Body: ${w.bodyshotPercent}%`} />
                <div class="bg-slate-700 transition-all" style={{ width: `${w.legshotPercent}%` }} title={`Legs: ${w.legshotPercent}%`} />
              </div>

            </div>
          )}
        </For>
      </div>
    </div>
  );
};
