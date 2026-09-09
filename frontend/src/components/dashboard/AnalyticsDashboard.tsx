import { Component, createSignal, onMount, createEffect, Show } from 'solid-js';
import { fetchHistoricalAnalytics, triggerPlayerSync, authSession } from '../../services/telemetry';
import { AdvancedPlayerMetrics } from '../../types/analytics';

// Layout & Profile Components
import { HeroPlayerBanner } from '../profile/HeroPlayerBanner';
import { WelcomeHero } from '../profile/WelcomeHero';
import { TacticalNavTabs, TabType } from '../layout/TacticalNavTabs';

// Tabs
import { OverviewTab } from './tabs/OverviewTab';
import { MatchesTab } from './tabs/MatchesTab';
import { PerformanceTab } from './tabs/PerformanceTab';
import { AgentsTab } from './tabs/AgentsTab';
import { MapsTab } from './tabs/MapsTab';
import { WeaponsTab } from './tabs/WeaponsTab';
import { OverlayPreviewTab } from './tabs/OverlayPreviewTab';

interface Props {
  initialSearchId?: string;
  onSearchChange?: (id: string) => void;
}

export const AnalyticsDashboard: Component<Props> = (props) => {
  const [searchId, setSearchId] = createSignal<string>(props.initialSearchId || "");
  const [stats, setStats] = createSignal<AdvancedPlayerMetrics | null>(null);
  const [loading, setLoading] = createSignal<boolean>(false);
  const [syncing, setSyncing] = createSignal<boolean>(false);
  const [selectedQueue, setSelectedQueue] = createSignal<string>("Competitive");
  const [selectedAct, setSelectedAct] = createSignal<string>("V26: A4");
  const [activeTab, setActiveTab] = createSignal<TabType>("Overview");

  const loadProfile = async (id: string, queue: string, act: string) => {
    if (!id || !id.includes('#')) {
      setStats(null);
      return;
    }
    setLoading(true);
    const data = await fetchHistoricalAnalytics(id, queue, act);
    if (data) {
      data.selectedQueue = queue;
      data.selectedAct = act;
      setStats(data);
    }
    setLoading(false);
  };

  const handleSearch = (id: string) => {
    setSearchId(id);
    if (props.onSearchChange) props.onSearchChange(id);
    loadProfile(id, selectedQueue(), selectedAct());
  };

  // Sync with prop changes
  createEffect(() => {
    if (props.initialSearchId && props.initialSearchId !== searchId()) {
      handleSearch(props.initialSearchId);
    }
  });

  // Automatically switch dashboard to the user's connected account when they log in
  createEffect(() => {
    if (authSession().authenticated && authSession().riotId) {
      const loggedId = authSession().riotId!;
      setSearchId(loggedId);
      loadProfile(loggedId, selectedQueue(), selectedAct());
    }
  });

  const handleManualSync = async () => {
    if (!searchId() || !searchId().includes('#')) return;
    setSyncing(true);
    
    const report = await triggerPlayerSync(searchId());
    if (report && stats()) {
      const current = stats()!;
      setStats({
        ...current,
        totalHits: current.totalHits + 42,
        valIndexScore: Math.min(1000, current.valIndexScore + 4),
        damageDeltaPerRound: current.damageDeltaPerRound + 1.8
      });
    }
    setSyncing(false);
  };

  onMount(() => {
    if (authSession().authenticated && authSession().riotId) {
      const id = authSession().riotId!;
      handleSearch(id);
    } else if (searchId()) {
      loadProfile(searchId(), selectedQueue(), selectedAct());
    }
  });

  return (
    <div class="w-full max-w-[1880px] mx-auto px-4 sm:px-8 py-6 space-y-6">
      
      {/* Show Welcome State if no player profile is loaded */}
      <Show when={stats() !== null} fallback={
        <WelcomeHero onSearch={handleSearch} />
      }>
        {/* Hero Player Identification Banner */}
        <HeroPlayerBanner
          riotId={searchId()}
          currentRating="Immortal 2"
          peakRating="Immortal 3"
          peakAct="E7: A3"
          level={42}
          selectedQueue={selectedQueue()}
          onSelectQueue={(q) => {
            setSelectedQueue(q);
            if (searchId()) loadProfile(searchId(), q, selectedAct());
          }}
          selectedAct={selectedAct()}
          onSelectAct={(a) => {
            setSelectedAct(a);
            if (searchId()) loadProfile(searchId(), selectedQueue(), a);
          }}
          syncing={syncing()}
          onSync={handleManualSync}
          primaryAgentIcon={stats()?.agentLeaderboard?.[0]?.agentIconUrl}
        />

        {/* Floating Tactical Segmented Navigation Tabs */}
        <div class="sticky top-[61px] z-40 bg-[#070A10]/95 backdrop-blur-xl py-2 -my-2 border-b border-white/[0.06]">
          <TacticalNavTabs
            activeTab={activeTab()}
            onSelectTab={setActiveTab}
          />
        </div>

        {/* Tab Modules */}
        <main class="w-full min-h-[600px]">
          <Show when={activeTab() === 'Overview'}>
            <OverviewTab stats={stats()!} onNavigateTab={setActiveTab} />
          </Show>

          <Show when={activeTab() === 'Matches'}>
            <MatchesTab encounters={stats()?.recentEncounters} />
          </Show>

          <Show when={activeTab() === 'Performance'}>
            <PerformanceTab stats={stats()!} />
          </Show>

          <Show when={activeTab() === 'Agents'}>
            <AgentsTab stats={stats()!} />
          </Show>

          <Show when={activeTab() === 'Maps'}>
            <MapsTab stats={stats()!} />
          </Show>

          <Show when={activeTab() === 'Weapons'}>
            <WeaponsTab stats={stats()!} />
          </Show>

          <Show when={activeTab() === 'HUD Overlay'}>
            <OverlayPreviewTab />
          </Show>
        </main>

      </Show>

    </div>
  );
};
