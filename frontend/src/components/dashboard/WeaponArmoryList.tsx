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
    <div class="tactical-panel rounded-2xl p-5 border border-white/10 shadow-xl h-full flex flex-col justify-between">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <span class="text-xs font-black text-val-muted font-tactical uppercase tracking-widest flex items-center gap-2">
          Top Weapons
        </span>
        <span class="text-xs font-extrabold text-val-cyan hover:underline cursor-pointer font-tactical uppercase">
          View All Armory →
        </span>
      </div>

      <div class="space-y-3">
        <For each={armory.slice(0, 1)}>
          {(w) => (
            <div class="bg-[#0B0E14] p-5 rounded-xl border border-white/5 hover:border-val-red/30 transition-all space-y-4 group">
              
              <div class="flex items-start justify-between">
                <div>
                  <h4 class="text-xl font-black text-white font-tactical">{w.weaponName}</h4>
                  <span class="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{w.category}</span>
                </div>
                
                <div class="flex items-center gap-5 text-right">
                  <div class="space-y-1.5">
                    <div class="text-[9px] font-black font-tactical text-val-red">Head {w.headshotPercent}%</div>
                    <div class="text-[9px] font-black font-tactical text-val-cyan">Body {w.bodyshotPercent}%</div>
                    <div class="text-[9px] font-black font-tactical text-slate-400">Legs {w.legshotPercent}%</div>
                  </div>
                  
                  <div class="w-14 h-14 rounded-lg bg-[#0A0D14] border border-white/10 flex flex-col items-center justify-center">
                    <span class="text-[8px] font-bold text-val-muted uppercase font-tactical">KILLS</span>
                    <span class="text-base font-black text-white font-tactical leading-none">{w.totalKills}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div class="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div class="h-full bg-val-red" style={{ width: `${w.headshotPercent}%` }} />
                <div class="h-full bg-val-cyan" style={{ width: `${w.bodyshotPercent}%` }} />
                <div class="h-full bg-slate-600" style={{ width: `${w.legshotPercent}%` }} />
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
};
