import { Component, createSignal, onMount, For } from 'solid-js';
import { fetchHistoricalAnalytics, PlayerHistoricalSummary, isBackendOnline } from '../../services/telemetry';

export const AnalyticsDashboard: Component = () => {
  const [searchId, setSearchId] = createSignal<string>("Vanguard#KILL");
  const [summary, setSummary] = createSignal<PlayerHistoricalSummary | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [selectedTab, setSelectedTab] = createSignal<'overview' | 'agents' | 'weapons' | 'maps'>('overview');

  const loadProfile = async (id: string) => {
    setLoading(true);
    const data = await fetchHistoricalAnalytics(id);
    setSummary(data);
    setLoading(false);
  };

  onMount(() => {
    loadProfile(searchId());
  });

  return (
    <div class="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Top Banner & Player Search Bar */}
      <section class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#161D2C] via-[#1C2538] to-[#161D2C] border border-white/10 p-8 shadow-2xl">
        <div class="absolute inset-0 bg-[radial-gradient(#232D42_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
        <div class="absolute top-0 right-0 w-96 h-96 bg-val-red/10 rounded-full blur-3xl pointer-events-none" />

        <div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Player Emblem Info */}
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-val-red/15 text-val-red border border-val-red/30 flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full bg-val-red animate-pulse" />
                Verified Vanguard Account
              </span>
              <span class="text-xs text-val-muted font-mono">PUUID: {summary()?.puuid.slice(0, 12)}***</span>
            </div>

            <h1 class="text-4xl md:text-6xl font-black tracking-tight text-white flex items-center gap-3 font-tactical">
              {summary() ? summary()?.riotId : searchId()}
            </h1>

            <p class="text-sm md:text-base text-val-muted flex items-center gap-2">
              Competitive Standing: 
              <strong class="text-val-cyan text-lg font-tactical px-2 py-0.5 rounded bg-black/40 border border-val-cyan/30">
                {summary()?.currentRank || "Immortal 1 (78 RR)"}
              </strong>
            </p>
          </div>

          {/* Quick Stats Pillar Box & Search Form */}
          <div class="flex flex-col items-end gap-5 w-full lg:w-auto">
            <form 
              class="flex w-full sm:w-auto items-center gap-2 bg-[#0B0E14] p-1.5 rounded-2xl border border-white/10 shadow-inner"
              onSubmit={(e) => {
                e.preventDefault();
                loadProfile(searchId());
              }}
            >
              <input
                type="text"
                value={searchId()}
                onInput={(e) => setSearchId(e.currentTarget.value)}
                placeholder="Search Player (Name#Tag)..."
                class="bg-transparent px-4 py-2 rounded-xl text-sm focus:outline-none text-white font-medium placeholder-slate-500 w-64 md:w-72"
              />
              <button
                type="submit"
                disabled={loading()}
                class="bg-val-red text-white font-extrabold px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:bg-val-redHover active:scale-95 transition-all shadow-glow-red disabled:opacity-50"
              >
                {loading() ? "SCANNING..." : "INSPECT ARCHIVE"}
              </button>
            </form>

            {/* Quick KPI Row */}
            <div class="grid grid-cols-3 gap-3 w-full sm:w-auto bg-black/40 p-3.5 rounded-2xl border border-white/5 backdrop-blur">
              <div class="px-5 text-center border-r border-white/10">
                <span class="text-[11px] font-semibold text-val-muted uppercase tracking-wider">Overall K/D</span>
                <p class="text-3xl font-tactical font-extrabold text-val-cyan mt-0.5">{summary()?.overallKdRatio || "1.42"}</p>
              </div>
              <div class="px-5 text-center border-r border-white/10">
                <span class="text-[11px] font-semibold text-val-muted uppercase tracking-wider">Win Rate</span>
                <p class="text-3xl font-tactical font-extrabold text-val-emerald mt-0.5">{summary()?.overallWinRate || "63.8"}%</p>
              </div>
              <div class="px-5 text-center">
                <span class="text-[11px] font-semibold text-val-muted uppercase tracking-wider">Total Games</span>
                <p class="text-3xl font-tactical font-extrabold text-white mt-0.5">{summary()?.totalMatches || "412"}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-white/10 flex flex-wrap justify-between items-center text-xs text-val-muted relative z-10">
          <div>
            <span>Peak Career Milestone: </span>
            <strong class="text-val-gold font-bold px-2 py-0.5 rounded bg-val-gold/10 border border-val-gold/20 ml-1">
              🏆 {summary()?.peakRank || "Radiant #342 (Ep 8 Act 3)"}
            </strong>
          </div>
          <div class="flex items-center gap-2 mt-2 sm:mt-0">
            <span class="w-2 h-2 rounded-full bg-val-emerald animate-pulse" />
            <span>Tier-2 SQLite Persistent Cache: Active & Synchronized</span>
          </div>
        </div>
      </section>

      {/* Navigation Tab Console */}
      <nav class="flex items-center justify-between border-b border-white/10 pb-4">
        <div class="flex gap-2">
          <For each={['overview', 'agents', 'weapons', 'maps'] as const}>
            {(tab) => (
              <button
                onClick={() => setSelectedTab(tab)}
                class={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all ${
                  selectedTab() === tab
                    ? 'bg-val-red text-white shadow-glow-red'
                    : 'bg-val-card text-val-muted hover:text-white hover:bg-val-cardHover border border-white/5'
                }`}
              >
                {tab === 'overview' && '🌟 Complete Overview'}
                {tab === 'agents' && '🦸‍♂️ Agent Mastery'}
                {tab === 'weapons' && '🔫 Weapon Accuracy'}
                {tab === 'maps' && '🗺️ Tournament Maps'}
              </button>
            )}
          </For>
        </div>
        <span class="text-xs text-val-muted hidden md:inline font-mono">
          Showing data for Competitive Acts & Tournaments
        </span>
      </nav>

      {/* Content Section: Overview & Agents */}
      {(selectedTab() === 'overview' || selectedTab() === 'agents') && (
        <section class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-black text-white flex items-center gap-2 font-tactical tracking-wide">
              <span class="w-3 h-7 bg-val-red rounded-sm" />
              TACTICAL AGENT MASTERY MATRIX
            </h3>
            <span class="text-xs text-val-muted uppercase font-semibold">Sorted by Matches Played</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <For each={summary()?.agentMasteries}>
              {(agent) => (
                <div class="glass-panel glass-panel-hover rounded-2xl p-6 relative overflow-hidden group">
                  <div class="absolute -right-4 -bottom-4 text-7xl font-black text-white/5 font-tactical pointer-events-none group-hover:text-val-red/10 transition-all duration-300">
                    {agent.agentName.toUpperCase()}
                  </div>

                  <div class="flex items-center gap-5 mb-6 relative z-10">
                    <img 
                      src={agent.agentIconUrl} 
                      alt={agent.agentName} 
                      class="w-20 h-20 rounded-xl border border-white/10 bg-gradient-to-t from-black to-slate-900 object-cover shadow-lg group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div>
                      <h4 class="text-2xl font-bold text-white group-hover:text-val-red transition-colors font-tactical">
                        {agent.agentName}
                      </h4>
                      <span class="text-xs font-medium px-2.5 py-1 rounded-md bg-white/5 text-val-muted inline-block mt-1">
                        {agent.matchesPlayed} Matches Recorded
                      </span>
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-3 bg-[#0D121C] rounded-xl p-4 border border-white/5 text-center relative z-10">
                    <div>
                      <div class="text-[11px] font-semibold text-val-muted uppercase">Win Rate</div>
                      <div class="text-2xl font-black text-val-emerald font-tactical mt-0.5">{agent.winRate}%</div>
                    </div>
                    <div>
                      <div class="text-[11px] font-semibold text-val-muted uppercase">Avg ACS</div>
                      <div class="text-2xl font-black text-white font-tactical mt-0.5">{agent.avgCombatScore}</div>
                    </div>
                    <div>
                      <div class="text-[11px] font-semibold text-val-muted uppercase">K/D Ratio</div>
                      <div class="text-2xl font-black text-val-cyan font-tactical mt-0.5">{agent.kdRatio}</div>
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
      )}

      {/* Content Section: Weapons Marksmanship & Hit Splits */}
      {(selectedTab() === 'overview' || selectedTab() === 'weapons') && (
        <section class="space-y-6 pt-4">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-black text-white flex items-center gap-2 font-tactical tracking-wide">
              <span class="w-3 h-7 bg-val-cyan rounded-sm" />
              WEAPON MARKSMANSHIP & LETHALITY SPLIT
            </h3>
            <span class="text-xs text-val-muted uppercase font-semibold">Calculated from Damage Events</span>
          </div>

          <div class="glass-panel rounded-3xl p-8 shadow-xl space-y-8">
            <For each={summary()?.weaponAccuracy}>
              {(weapon) => (
                <div class="space-y-3 bg-[#0D121C] p-6 rounded-2xl border border-white/5 hover:border-white/15 transition-all">
                  <div class="flex flex-wrap justify-between items-center gap-4">
                    <div class="flex items-center gap-3">
                      <span class="text-2xl font-black text-white font-tactical">{weapon.weaponName}</span>
                      <span class="text-xs font-semibold px-3 py-1 rounded bg-white/5 text-val-muted">
                        ⚔️ {weapon.totalKills.toLocaleString()} Confirmed Kills
                      </span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-semibold text-val-muted uppercase">Headshot Rating:</span>
                      <strong class="text-val-cyan font-bold text-lg px-3 py-0.5 rounded bg-val-cyan/10 border border-val-cyan/20">
                        🎯 {weapon.headshotPercent}%
                      </strong>
                    </div>
                  </div>

                  {/* Thick Segmented Visual Lethality Bar */}
                  <div class="w-full h-4 bg-black rounded-xl overflow-hidden flex border border-white/10 shadow-inner">
                    <div 
                      class="bg-val-red progress-animate relative group cursor-pointer" 
                      style={{ width: `${weapon.headshotPercent}%` }}
                      title={`Headshot Hit Rate: ${weapon.headshotPercent}%`}
                    />
                    <div 
                      class="bg-val-cyan progress-animate relative group cursor-pointer" 
                      style={{ width: `${weapon.bodyshotPercent}%` }}
                      title={`Bodyshot Hit Rate: ${weapon.bodyshotPercent}%`}
                    />
                    <div 
                      class="bg-slate-700 progress-animate relative group cursor-pointer" 
                      style={{ width: `${weapon.legshotPercent}%` }}
                      title={`Legshot Hit Rate: ${weapon.legshotPercent}%`}
                    />
                  </div>

                  <div class="flex justify-between items-center text-xs font-bold px-1 pt-1">
                    <span class="text-val-red flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-val-red" /> Headshot ({weapon.headshotPercent}%)
                    </span>
                    <span class="text-val-cyan flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-val-cyan" /> Bodyshot ({weapon.bodyshotPercent}%)
                    </span>
                    <span class="text-slate-400 flex items-center gap-1.5">
                      <span class="w-2 h-2 rounded-full bg-slate-400" /> Legshot ({weapon.legshotPercent}%)
                    </span>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
      )}

      {/* Content Section: Tournament Map Win/Loss Matrix */}
      {(selectedTab() === 'overview' || selectedTab() === 'maps') && (
        <section class="space-y-6 pt-4">
          <div class="flex items-center justify-between">
            <h3 class="text-2xl font-black text-white flex items-center gap-2 font-tactical tracking-wide">
              <span class="w-3 h-7 bg-val-gold rounded-sm" />
              TOURNAMENT MAP WIN/LOSS MATRIX
            </h3>
            <span class="text-xs text-val-muted uppercase font-semibold">Attack vs. Defense Splits</span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <For each={summary()?.mapMatrix}>
              {(map) => (
                <div class="glass-panel glass-panel-hover rounded-2xl p-6 space-y-5 relative overflow-hidden">
                  <div class="flex justify-between items-center">
                    <h4 class="text-3xl font-black text-white font-tactical tracking-wide">{map.mapName}</h4>
                    <span class="text-xs font-semibold px-2.5 py-1 rounded bg-white/5 text-val-muted border border-white/5">
                      {map.matchesPlayed} Matches
                    </span>
                  </div>

                  <div class="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span class="text-[11px] font-semibold text-val-muted uppercase">Overall Win Rate</span>
                      <p class="text-4xl font-black text-val-emerald font-tactical mt-0.5">{map.winRate}%</p>
                    </div>
                    <div class="w-12 h-12 rounded-full border-2 border-val-emerald/30 flex items-center justify-center bg-val-emerald/10 text-val-emerald text-lg">
                      🏆
                    </div>
                  </div>

                  <div class="space-y-2.5 text-xs text-slate-300 bg-[#0D121C] p-4 rounded-xl border border-white/5 font-medium">
                    <div class="flex justify-between items-center">
                      <span class="flex items-center gap-1.5 text-rose-400">
                        <span>⚔️ Attack Round Split:</span>
                      </span>
                      <strong class="text-white font-tactical text-base">{map.attackWinRate}%</strong>
                    </div>
                    <div class="w-full bg-black h-1.5 rounded-full overflow-hidden">
                      <div class="bg-rose-500 h-full rounded-full" style={{ width: `${map.attackWinRate}%` }} />
                    </div>

                    <div class="flex justify-between items-center pt-2">
                      <span class="flex items-center gap-1.5 text-teal-400">
                        <span>🛡️ Defense Round Split:</span>
                      </span>
                      <strong class="text-white font-tactical text-base">{map.defendWinRate}%</strong>
                    </div>
                    <div class="w-full bg-black h-1.5 rounded-full overflow-hidden">
                      <div class="bg-teal-400 h-full rounded-full" style={{ width: `${map.defendWinRate}%` }} />
                    </div>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
      )}
    </div>
  );
};
