import { Component, createSignal, onMount } from 'solid-js';
import { fetchHistoricalAnalytics, isBackendOnline } from '../../services/telemetry';
import { AdvancedPlayerMetrics } from '../../types/analytics';

// Import our newly engineered, uniquely styled analytical components
import { TacticalFilterBar } from './TacticalFilterBar';
import { RatingCard } from './RatingCard';
import { ValIndexScorecard } from './ValIndexScorecard';
import { CombatOverviewGrid } from './CombatOverviewGrid';
import { AccuracySilhouette } from './AccuracySilhouette';
import { RoleMasteryPanel } from './RoleMasteryPanel';
import { TopAgentsTable } from './TopAgentsTable';
import { WeaponArmoryList } from './WeaponArmoryList';
import { TopMapsList } from './TopMapsList';
import { MatchEncounterLog } from './MatchEncounterLog';

export const AnalyticsDashboard: Component = () => {
  const [searchId, setSearchId] = createSignal<string>("throwkarumga#6969");
  const [stats, setStats] = createSignal<AdvancedPlayerMetrics | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [selectedQueue, setSelectedQueue] = createSignal<string>("Competitive");
  const [selectedAct, setSelectedAct] = createSignal<string>("V26: A4");

  const loadProfile = async (id: string) => {
    setLoading(true);
    const data = await fetchHistoricalAnalytics(id);
    if (data) {
      data.selectedQueue = selectedQueue();
      data.selectedAct = selectedAct();
      setStats(data);
    }
    setLoading(false);
  };

  onMount(() => {
    loadProfile(searchId());
  });

  return (
    <div class="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      {/* Top Profile Header & Search Bar (Purely VALORANT, no multi-game bloat) */}
      <section class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#121929] via-[#1A2338] to-[#121929] border border-white/10 p-8 shadow-2xl">
        <div class="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />
        <div class="absolute -right-20 -top-20 w-96 h-96 bg-val-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div class="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          {/* Player Identity Badge */}
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-val-red via-rose-600 to-amber-500 p-1 shadow-glow-red flex items-center justify-center relative">
              <div class="w-full h-full bg-[#0B0E14] rounded-[14px] flex items-center justify-center font-tactical font-black text-white text-3xl">
                👊
              </div>
              <span class="absolute -bottom-2 -right-2 text-[10px] font-extrabold px-2 py-0.5 rounded bg-val-emerald text-val-obsidian font-tactical uppercase">
                IN
              </span>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-white/10 text-white font-tactical border border-white/10">
                  Verified Riot Vanguard Protocol
                </span>
                <span class="text-xs text-val-muted font-mono">107 Views Today</span>
              </div>
              
              <h1 class="text-4xl md:text-6xl font-black tracking-tight text-white flex items-center gap-3 font-tactical">
                {stats() ? stats()?.riotId : searchId()}
                <span class="text-xl px-3 py-0.5 rounded-lg bg-black/50 text-val-gold border border-val-gold/30 font-tactical font-bold shadow-glow-gold">
                  🔥 #6969
                </span>
              </h1>
            </div>
          </div>

          {/* Player Search Bar Console */}
          <form 
            class="flex w-full sm:w-auto items-center gap-2 bg-[#0A0D14] p-2 rounded-2xl border border-white/10 shadow-inner"
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
              class="bg-transparent px-4 py-2 rounded-xl text-sm focus:outline-none text-white font-medium placeholder-slate-500 w-64"
            />
            <button
              type="submit"
              disabled={loading()}
              class="bg-val-cyan text-val-obsidian font-black px-6 py-2.5 rounded-xl text-xs uppercase font-tactical tracking-wider hover:bg-val-cyan/90 active:scale-95 transition-all shadow-glow-cyan disabled:opacity-50"
            >
              {loading() ? "SCANNING..." : "INSPECT ARCHIVE"}
            </button>
          </form>

        </div>
      </section>

      {/* Cybernetic Mode & Act Tactical Filter Bar */}
      <TacticalFilterBar
        selectedQueue={selectedQueue()}
        onSelectQueue={(q) => { setSelectedQueue(q); loadProfile(searchId()); }}
        selectedAct={selectedAct()}
        onSelectAct={(a) => { setSelectedAct(a); loadProfile(searchId()); }}
      />

      {/* Master Grid: Left Column (35%) vs Right Column (65%) */}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Standing Card, Silhouette, Roles, Armory, & Maps */}
        <div class="lg:col-span-4 space-y-6">
          <RatingCard 
            currentRating="Unranked"
            level={31}
            recordString="2W - 0L"
            peakRating="Silver 2"
            peakAct="V26: ACT III"
          />

          <AccuracySilhouette 
            headshotPercent={stats()?.headshotPercent || 14.6}
            bodyshotPercent={stats()?.bodyshotPercent || 81.9}
            legshotPercent={stats()?.legshotPercent || 3.5}
            totalHits={stats()?.totalHits || 171}
          />

          <RoleMasteryPanel roleStats={stats()?.roleMastery} />

          <WeaponArmoryList weapons={stats()?.weaponArmory} />

          <TopMapsList maps={stats()?.mapDomination} />
        </div>

        {/* RIGHT COLUMN: VAL-Index Scorecard, Gunplay Grid, Top Agents, & Match Encounters */}
        <div class="lg:col-span-8 space-y-8">
          
          <ValIndexScorecard
            valIndexScore={stats()?.valIndexScore || 927}
            valIndexGrade={stats()?.valIndexGrade || "S • Top 1.0% Sovereign"}
            roundWinRate={stats()?.roundWinRate || 57.8}
            kastPercent={stats()?.kastPercent || 73.3}
            acs={stats()?.averageCombatScore || 321.7}
            damageDelta={intDelta(stats()?.damageDeltaPerRound || 71)}
          />

          <CombatOverviewGrid stats={stats() || undefined} />

          <TopAgentsTable agents={stats()?.agentLeaderboard} />

          <MatchEncounterLog encounters={stats()?.recentEncounters} />

        </div>

      </div>

    </div>
  );
};

function intDelta(val: number): number {
  return Math.round(val);
}
