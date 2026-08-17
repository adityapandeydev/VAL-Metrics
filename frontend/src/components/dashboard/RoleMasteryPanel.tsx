import { Component } from 'solid-js';
import { RoleStats } from '../../types/analytics';

interface Props {
  roleStats?: Record<string, RoleStats>;
}

export const RoleMasteryPanel: Component<Props> = (props) => {
  const duelist = props.roleStats?.["Duelist"] || {
    roleName: "Duelist",
    matches: 2,
    winRate: 100.0,
    kdRatio: 1.63,
    adr: 211.6
  };

  return (
    <div class="tactical-panel rounded-2xl p-5 border border-white/10 space-y-4 shadow-xl">
      <div class="flex items-center justify-between border-b border-white/10 pb-3">
        <span class="text-xs font-black text-val-muted font-tactical uppercase tracking-widest flex items-center gap-2">
          Role Domination Profile
        </span>
        <span class="text-[10px] text-val-muted font-mono">Best Role</span>
      </div>

      <div class="bg-[#0D121C] p-4 rounded-xl border border-white/5 flex items-center justify-between hover:border-val-cyan/40 transition-all group">
        
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-xl bg-val-cyan/15 border border-val-cyan/40 flex items-center justify-center text-xs font-black font-tactical text-val-cyan shadow-glow-cyan group-hover:scale-110 transition-transform uppercase">
            ROLE
          </div>
          <div>
            <h4 class="text-xl font-black text-white font-tactical uppercase tracking-wide">{duelist.roleName}</h4>
            <span class="text-[11px] font-bold text-val-emerald bg-val-emerald/10 px-2 py-0.5 rounded border border-val-emerald/20 inline-block mt-1">
              WR {duelist.winRate}% • 2W - 0L
            </span>
          </div>
        </div>

        <div class="text-right space-y-0.5">
          <span class="text-sm font-black text-white font-tactical block">KDA 2.07</span>
          <span class="text-[11px] font-mono text-val-cyan block">{duelist.kdRatio} K/D | {duelist.adr} ADR</span>
          <span class="text-[10px] text-slate-400 font-mono">49 / 30 / 13</span>
        </div>

      </div>

      <div class="space-y-2 pt-2">
        <div class="bg-[#0A0D14] p-3.5 border-l-2 border-slate-700 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity group/role">
          <div class="flex items-center gap-3">
            <span class="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-[10px] font-tactical text-slate-400 group-hover/role:text-white transition-colors">
              C
            </span>
            <span class="text-xs font-bold text-slate-400 font-tactical uppercase tracking-widest group-hover/role:text-white transition-colors">
              Controller
            </span>
          </div>
          <span class="text-[10px] font-tactical text-slate-500 tracking-widest">0 MATCHES</span>
        </div>

        <div class="bg-[#0A0D14] p-3.5 border-l-2 border-slate-700 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity group/role">
          <div class="flex items-center gap-3">
            <span class="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-[10px] font-tactical text-slate-400 group-hover/role:text-white transition-colors">
              I
            </span>
            <span class="text-xs font-bold text-slate-400 font-tactical uppercase tracking-widest group-hover/role:text-white transition-colors">
              Initiator
            </span>
          </div>
          <span class="text-[10px] font-tactical text-slate-500 tracking-widest">0 MATCHES</span>
        </div>

        <div class="bg-[#0A0D14] p-3.5 border-l-2 border-slate-700 flex items-center justify-between opacity-50 hover:opacity-100 transition-opacity group/role">
          <div class="flex items-center gap-3">
            <span class="w-6 h-6 bg-slate-800 rounded flex items-center justify-center text-[10px] font-tactical text-slate-400 group-hover/role:text-white transition-colors">
              S
            </span>
            <span class="text-xs font-bold text-slate-400 font-tactical uppercase tracking-widest group-hover/role:text-white transition-colors">
              Sentinel
            </span>
          </div>
          <span class="text-[10px] font-tactical text-slate-500 tracking-widest">0 MATCHES</span>
        </div>
      </div>
    </div>
  );
};
