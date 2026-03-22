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
    <div class="min-h-screen bg-val-navy text-val-light p-6 font-mono selection:bg-val-emerald selection:text-val-navy">
      {/* Top Navigation & Profile Search */}
      <header class="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center bg-val-navy/90 border border-val-emerald/30 rounded-xl p-4 shadow-lg shadow-val-emerald/5 mb-8 backdrop-blur">
        <div class="flex items-center gap-3 mb-4 md:mb-0">
          <div class="w-4 h-4 bg-val-emerald animate-pulse rounded-sm shadow-[0_0_12px_#00FF87]" />
          <h1 class="text-2xl font-black tracking-wider bg-gradient-to-r from-val-emerald to-teal-400 bg-clip-text text-transparent">
            VAL-METRICS <span class="text-xs font-normal text-slate-400">ANALYTICS VAULT</span>
          </h1>
        </div>

        <form 
          class="flex w-full md:w-auto items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            loadProfile(searchId());
          }}
        >
          <input
            type="text"
            value={searchId()}
            onInput={(e) => setSearchId(e.currentTarget.value)}
            placeholder="Enter Riot ID (Name#Tag)..."
            class="bg-black/50 border border-val-emerald/40 px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-val-emerald focus:ring-1 focus:ring-val-emerald w-64 transition-all placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={loading()}
            class="bg-val-emerald text-val-navy font-bold px-5 py-2 rounded-lg text-sm hover:bg-val-emerald/90 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,135,0.25)] disabled:opacity-50"
          >
            {loading() ? "SCANNING..." : "INSPECT ARCHIVE"}
          </button>
        </form>
      </header>

      {/* Main Content Area */}
      <main class="max-w-6xl mx-auto">
        {!summary() ? (
          <div class="text-center py-20 border border-dashed border-slate-700 rounded-xl p-8">
            <p class="text-lg text-slate-400">
              {isBackendOnline() ? "Loading statistical profile archives..." : "Go Telemetry Server offline. Please ensure npm run dev:backend is executing."}
            </p>
          </div>
        ) : (
          <div class="space-y-6">
            {/* Player Emblem & Career Overview Banner */}
            <section class="bg-gradient-to-br from-slate-900/90 via-val-navy to-slate-900 border border-val-emerald/25 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div class="absolute -right-12 -top-12 w-64 h-64 bg-val-emerald/5 rounded-full blur-3xl pointer-events-none" />

              <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                <div class="space-y-1">
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded bg-val-emerald/10 text-val-emerald border border-val-emerald/30 uppercase tracking-widest">
                      Verified Riot Vanguard Protocol
                    </span>
                    <span class="text-xs text-slate-400">PUUID Prefix: {summary()?.puuid.slice(0, 8)}***</span>
                  </div>
                  <h2 class="text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
                    {summary()?.riotId}
                  </h2>
                  <p class="text-sm text-slate-300">
                    Current Competitive Standing: <span class="text-val-emerald font-bold">{summary()?.currentRank}</span>
                  </p>
                </div>

                <div class="grid grid-cols-3 gap-4 bg-black/40 border border-slate-800 rounded-xl p-4 w-full lg:w-auto">
                  <div class="text-center px-4 border-r border-slate-800">
                    <span class="text-xs text-slate-400 uppercase">Overall K/D</span>
                    <p class="text-2xl font-black text-val-emerald mt-1">{summary()?.overallKdRatio}</p>
                  </div>
                  <div class="text-center px-4 border-r border-slate-800">
                    <span class="text-xs text-slate-400 uppercase">Win Rate</span>
                    <p class="text-2xl font-black text-teal-400 mt-1">{summary()?.overallWinRate}%</p>
                  </div>
                  <div class="text-center px-4">
                    <span class="text-xs text-slate-400 uppercase">Total Games</span>
                    <p class="text-2xl font-black text-white mt-1">{summary()?.totalMatches}</p>
                  </div>
                </div>
              </div>

              <div class="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                <span>Peak Career Achievement: <strong class="text-yellow-400">{summary()?.peakRank}</strong></span>
                <span>Last Synchronized from Tier-2 SQLite Vault: {new Date(summary()?.lastUpdated || '').toLocaleTimeString()}</span>
              </div>
            </section>

            {/* Navigation Tabs */}
            <nav class="flex gap-2 border-b border-slate-800 pb-2">
              <For each={['overview', 'agents', 'weapons', 'maps'] as const}>
                {(tab) => (
                  <button
                    onClick={() => setSelectedTab(tab)}
                    class={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      selectedTab() === tab
                        ? 'bg-val-emerald/20 text-val-emerald border border-val-emerald/40 shadow-[0_0_10px_rgba(0,255,135,0.15)]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    {tab}
                  </button>
                )}
              </For>
            </nav>

            {/* Tab: Overview & Agent Showcase */}
            {(selectedTab() === 'overview' || selectedTab() === 'agents') && (
              <section class="space-y-4">
                <h3 class="text-lg font-bold text-val-emerald border-l-4 border-val-emerald pl-3">
                  Tactical Agent Mastery Matrix
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <For each={summary()?.agentMasteries}>
                    {(agent) => (
                      <div class="bg-slate-900/80 border border-slate-800 hover:border-val-emerald/40 rounded-xl p-5 transition-all group relative overflow-hidden shadow-lg">
                        <div class="absolute right-2 bottom-2 text-6xl font-extrabold text-white/5 select-none pointer-events-none group-hover:text-val-emerald/10 transition-colors">
                          {agent.agentName.toUpperCase()}
                        </div>
                        <div class="flex items-center gap-4 mb-4">
                          <img src={agent.agentIconUrl} alt={agent.agentName} class="w-14 h-14 rounded-lg border border-slate-700 bg-black/60 object-cover" />
                          <div>
                            <h4 class="text-xl font-bold text-white group-hover:text-val-emerald transition-colors">{agent.agentName}</h4>
                            <span class="text-xs text-slate-400">{agent.matchesPlayed} Matches Recorded</span>
                          </div>
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-center bg-black/40 rounded-lg p-3 text-xs border border-slate-800">
                          <div>
                            <div class="text-slate-400">WIN RATE</div>
                            <div class="font-bold text-teal-400 mt-1">{agent.winRate}%</div>
                          </div>
                          <div>
                            <div class="text-slate-400">AVG ACS</div>
                            <div class="font-bold text-white mt-1">{agent.avgCombatScore}</div>
                          </div>
                          <div>
                            <div class="text-slate-400">K/D</div>
                            <div class="font-bold text-val-emerald mt-1">{agent.kdRatio}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            )}

            {/* Tab: Weapon Marksmanship Accuracy */}
            {(selectedTab() === 'overview' || selectedTab() === 'weapons') && (
              <section class="space-y-4 pt-4">
                <h3 class="text-lg font-bold text-val-emerald border-l-4 border-val-emerald pl-3">
                  Weapon Marksmanship & Lethality Breakdown
                </h3>
                <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
                  <For each={summary()?.weaponAccuracy}>
                    {(weapon) => (
                      <div class="space-y-2">
                        <div class="flex justify-between items-center text-sm font-bold">
                          <span class="text-white text-base">{weapon.weaponName} <span class="text-xs font-normal text-slate-400">({weapon.totalKills} Confirmed Kills)</span></span>
                          <span class="text-val-emerald">Headshot Accuracy: {weapon.headshotPercent}%</span>
                        </div>
                        {/* Split Progress Bar */}
                        <div class="w-full h-3 bg-black rounded-full overflow-hidden flex border border-slate-800">
                          <div class="bg-val-emerald transition-all" style={{ width: `${weapon.headshotPercent}%` }} title={`Head: ${weapon.headshotPercent}%`} />
                          <div class="bg-teal-600 transition-all" style={{ width: `${weapon.bodyshotPercent}%` }} title={`Body: ${weapon.bodyshotPercent}%`} />
                          <div class="bg-slate-600 transition-all" style={{ width: `${weapon.legshotPercent}%` }} title={`Leg: ${weapon.legshotPercent}%`} />
                        </div>
                        <div class="flex justify-between text-[11px] text-slate-400 px-1">
                          <span class="text-val-emerald">● Head ({weapon.headshotPercent}%)</span>
                          <span class="text-teal-400">● Body ({weapon.bodyshotPercent}%)</span>
                          <span class="text-slate-400">● Legs ({weapon.legshotPercent}%)</span>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            )}

            {/* Tab: Tournament Map Performance */}
            {(selectedTab() === 'overview' || selectedTab() === 'maps') && (
              <section class="space-y-4 pt-4">
                <h3 class="text-lg font-bold text-val-emerald border-l-4 border-val-emerald pl-3">
                  Tournament Map Win/Loss Matrix
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <For each={summary()?.mapMatrix}>
                    {(map) => (
                      <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
                        <div class="flex justify-between items-center">
                          <h4 class="text-lg font-bold text-white">{map.mapName}</h4>
                          <span class="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">{map.matchesPlayed} Matches</span>
                        </div>
                        <div class="text-2xl font-black text-val-emerald">
                          {map.winRate}% <span class="text-xs font-normal text-slate-400">Win Rate</span>
                        </div>
                        <div class="space-y-1 text-xs text-slate-300 bg-black/40 p-3 rounded-lg border border-slate-800">
                          <div class="flex justify-between">
                            <span>Attack Win Split:</span>
                            <strong class="text-teal-400">{map.attackWinRate}%</strong>
                          </div>
                          <div class="flex justify-between">
                            <span>Defense Win Split:</span>
                            <strong class="text-emerald-400">{map.defendWinRate}%</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
