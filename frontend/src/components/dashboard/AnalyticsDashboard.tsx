import { Component, createSignal, onMount, For } from 'solid-js';
import { fetchHistoricalAnalytics, isBackendOnline, isLiveRiotApiActive } from '../../services/telemetry';
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

const REGIONAL_SHARDS = [
  { code: 'na', label: 'North America (NA)' },
  { code: 'eu', label: 'Europe (EU)' },
  { code: 'ap', label: 'Asia Pacific & Mumbai (AP)' },
  { code: 'kr', label: 'Korea (KR)' },
  { code: 'br', label: 'Brazil (BR)' },
  { code: 'latam', label: 'Latin America (LATAM)' },
];

export const AnalyticsDashboard: Component = () => {
  const [searchId, setSearchId] = createSignal<string>("throwkarumga#6969");
  const [selectedShard, setSelectedShard] = createSignal<string>("na");
  const [stats, setStats] = createSignal<AdvancedPlayerMetrics | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [selectedQueue, setSelectedQueue] = createSignal<string>("Competitive");
  const [selectedAct, setSelectedAct] = createSignal<string>("V26: A4");

  const loadProfile = async (id: string, shard: string, queue: string, act: string) => {
    setLoading(true);
    const data = await fetchHistoricalAnalytics(id, shard, queue, act);
    if (data) {
      data.selectedQueue = queue;
      data.selectedAct = act;
      setStats(data);
    }
    setLoading(false);
  };

  onMount(() => {
    loadProfile(searchId(), selectedShard(), selectedQueue(), selectedAct());
  });

  const getDisplayedTag = () => {
    const id = stats()?.riotId || searchId();
    const idx = id.indexOf('#');
    if (idx !== -1) {
      return id.substring(idx);
    }
    return "#VAL";
  };

  const getDisplayedName = () => {
    const id = stats()?.riotId || searchId();
    const idx = id.indexOf('#');
    if (idx !== -1) {
      return id.substring(0, idx);
    }
    return id;
  };

  return (
    <div class="w-full max-w-7xl mx-auto px-6 py-8 space-y-8">
      
      {/* Top Profile Header & Live Cloud Search Console */}
      <section class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#121929] via-[#1A2338] to-[#121929] border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div class="absolute inset-0 bg-tactical-grid opacity-20 pointer-events-none" />
        <div class="absolute -right-20 -top-20 w-96 h-96 bg-val-cyan/10 rounded-full blur-3xl pointer-events-none" />

        <div class="relative z-10 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          
          {/* Player Identity Badge */}
          <div class="flex items-center gap-6">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-val-red via-rose-600 to-amber-500 p-1 shadow-glow-red flex items-center justify-center relative flex-shrink-0">
              <div class="w-full h-full bg-[#0B0E14] rounded-[14px] flex items-center justify-center font-tactical font-black text-white text-3xl">
                ⚔️
              </div>
              <span class="absolute -bottom-2 -right-2 text-[10px] font-extrabold px-2 py-0.5 rounded bg-val-emerald text-val-obsidian font-tactical uppercase">
                {selectedShard().toUpperCase()}
              </span>
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest bg-white/10 text-white font-tactical border border-white/10 flex items-center gap-1.5">
                  <span class={`w-2 h-2 rounded-full ${isLiveRiotApiActive() ? 'bg-val-cyan shadow-[0_0_8px_#00E5FF]' : 'bg-amber-400'}`} />
                  {isLiveRiotApiActive() ? "LIVE RIOT CLOUD TELEMETRY ACTIVE" : "AUTHENTIC SIMULATION / OFFLINE VAULT"}
                </span>
                <span class="text-xs text-val-muted font-mono hidden sm:inline">214 Views Today</span>
              </div>
              
              <h1 class="text-3xl md:text-5xl font-black tracking-tight text-white flex flex-wrap items-center gap-2 font-tactical">
                <span>{getDisplayedName()}</span>
                <span class="text-lg md:text-xl px-3 py-0.5 rounded-lg bg-black/60 text-val-cyan border border-val-cyan/40 font-tactical font-bold shadow-glow-cyan">
                  {getDisplayedTag()}
                </span>
              </h1>
            </div>
          </div>

          {/* Player Search Bar with Regional Shard Selector */}
          <form 
            class="flex flex-wrap w-full xl:w-auto items-center gap-2.5 bg-[#0A0D14]/90 p-2.5 rounded-2xl border border-white/15 shadow-inner"
            onSubmit={(e) => {
              e.preventDefault();
              loadProfile(searchId(), selectedShard(), selectedQueue(), selectedAct());
            }}
          >
            <div class="flex flex-1 sm:flex-initial items-center gap-2 min-w-[240px]">
              <input
                type="text"
                value={searchId()}
                onInput={(e) => setSearchId(e.currentTarget.value)}
                placeholder="Riot ID (e.g. TenZ#0505)..."
                class="bg-black/50 border border-white/10 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-val-cyan text-white font-semibold placeholder-slate-500 w-full"
              />
            </div>

            <div class="relative min-w-[150px]">
              <select
                value={selectedShard()}
                onChange={(e) => setSelectedShard(e.currentTarget.value)}
                class="w-full appearance-none bg-[#141C2E] border border-white/15 text-white font-tactical font-extrabold text-xs px-3 py-2.5 pr-8 rounded-xl focus:outline-none focus:border-val-cyan cursor-pointer uppercase tracking-wider"
              >
                <For each={REGIONAL_SHARDS}>
                  {(shard) => (
                    <option value={shard.code}>{shard.label}</option>
                  )}
                </For>
              </select>
              <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-val-cyan font-bold text-xs">
                ▼
              </div>
            </div>

            <button
              type="submit"
              disabled={loading()}
              class="w-full sm:w-auto bg-gradient-to-r from-val-cyan via-teal-400 to-val-emerald text-val-obsidian font-black px-6 py-2.5 rounded-xl text-xs uppercase font-tactical tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-glow-cyan disabled:opacity-50"
            >
              {loading() ? "SCANNING RIOT CLOUD..." : "⚡ ANALYZE PLAYER"}
            </button>
          </form>

        </div>
      </section>

      {/* Cybernetic Mode & Act Tactical Filter Bar */}
      <TacticalFilterBar
        selectedQueue={selectedQueue()}
        onSelectQueue={(q) => { 
          setSelectedQueue(q); 
          loadProfile(searchId(), selectedShard(), q, selectedAct()); 
        }}
        selectedAct={selectedAct()}
        onSelectAct={(a) => { 
          setSelectedAct(a); 
          loadProfile(searchId(), selectedShard(), selectedQueue(), a); 
        }}
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
