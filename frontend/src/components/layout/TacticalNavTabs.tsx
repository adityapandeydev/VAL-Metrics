import { Component, For } from 'solid-js';

export type TabType = 'Overview' | 'Matches' | 'Performance' | 'Agents' | 'Maps' | 'Weapons' | 'HUD Overlay';

interface Props {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string; badge?: string }[] = [
  { id: 'Overview', label: 'OVERVIEW' },
  { id: 'Matches', label: 'MATCH LOG' },
  { id: 'Performance', label: 'PERFORMANCE' },
  { id: 'Agents', label: 'AGENTS' },
  { id: 'Maps', label: 'MAPS' },
  { id: 'Weapons', label: 'ARMORY' },
  { id: 'HUD Overlay', label: 'HUD OVERLAY', badge: 'LIVE' },
];

export const TacticalNavTabs: Component<Props> = (props) => {
  return (
    <nav class="w-full flex items-center justify-start overflow-x-auto no-scrollbar py-2">
      <div class="glass-pill p-1.5 rounded-2xl flex items-center gap-1 shadow-lg">
        <For each={TABS}>
          {(tab) => {
            const isActive = props.activeTab === tab.id;
            return (
              <button
                onClick={() => props.onSelectTab(tab.id)}
                class={`relative px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black font-tactical uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-2 select-none ${
                  isActive
                    ? 'bg-val-red text-white shadow-glow-red font-black'
                    : 'text-val-muted hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span class={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-val-cyan/20 text-val-cyan border border-val-cyan/30'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          }}
        </For>
      </div>
    </nav>
  );
};
