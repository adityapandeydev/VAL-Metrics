import { Component, For, Match as SMatch, Show, Switch, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { fetchHistoricalAnalytics, triggerPlayerSync } from '../../services/telemetry';
import { sampleProfile } from './data/demo';
import { fromServer } from './data/server';
import { rankName, rankHue, agentPortrait } from './data/assets';
import { fmt } from './data/stats';
import { CountUp, installSpotlight, reducedMotion } from './motion';
import { Ring } from './charts';
import { Icon, ICONS, Img, RankBadge } from './ui';
import { PAGES, Page, QueueFilter, store } from './store';
import { Overview } from './pages/Overview';
import { Matches, MatchDrawer } from './pages/Matches';
import { Performance } from './pages/Performance';
import { Agents, Maps, Weapons } from './pages/Arsenal';
import { Seasons } from './pages/Seasons';
import { DataCoverage } from './pages/DataCoverage';
import './tracker.css';

const Logo: Component<{ size?: number }> = p =>
  <svg class="logo" width={p.size ?? 30} height={p.size ?? 30} viewBox="0 0 40 40" aria-hidden="true">
    <path class="logo-a" d="M4 6h9l7 16 7-16h9L20 36z" />
    <path class="logo-b" d="M4 6l16 30-3.6-.2L4 9z" />
  </svg>;

const Boot: Component = () => <div class="boot" role="status" aria-label="Loading profile">
  <Logo size={64} />
  <div class="boot-word">VAL<span>METRICS</span></div>
  <div class="boot-bar"><i /></div>
  <small>Syncing combat telemetry</small>
</div>;

export const TrackerWorkspace: Component = () => {
  const [booting, setBooting] = createSignal(!reducedMotion());
  const [query, setQuery] = createSignal('');
  let searchDlg!: HTMLDialogElement, searchInput!: HTMLInputElement;
  let navEl!: HTMLElement;
  const [ind, setInd] = createSignal({ x: 0, w: 0 });

  const openSearch = () => { searchDlg.showModal(); queueMicrotask(() => searchInput.focus()); };
  const lookup = async (sync = false) => {
    const id = sync ? `${store.profile().name}#${store.profile().tag}` : query().trim();
    if (!/^[^#]+#[^#]+$/.test(id)) { store.setMessage('Enter a full Riot ID with its tag, e.g. Ghost#PLAY.'); return; }
    store.setLoading(true); store.setMessage('');
    try {
      if (sync && !(await triggerPlayerSync(id))) throw new Error('Sync could not reach the VAL-Metrics server.');
      const q = store.queue() === 'All' ? 'Competitive' : store.queue();
      const data = await fetchHistoricalAnalytics(id, q);
      if (!data) throw new Error('No data returned yet — live lookups switch on once Riot production API access is granted. Explore the sample profile meanwhile.');
      store.setProfile(fromServer(data)); searchDlg.close(); store.setPage('overview');
    } catch (e) {
      store.setMessage(e instanceof Error ? e.message : 'Lookup failed.');
    } finally { store.setLoading(false); }
  };
  const useSample = () => { store.setProfile(sampleProfile()); store.setMessage(''); searchDlg?.close(); };

  const moveIndicator = () => {
    const btn = navEl?.querySelector<HTMLElement>(`[data-page="${store.page()}"]`);
    if (btn) setInd({ x: btn.offsetLeft, w: btn.offsetWidth });
  };
  createEffect(() => { store.page(); queueMicrotask(moveIndicator); });

  onMount(() => {
    const fromHash = PAGES.find(p => `#${p.id}` === location.hash);
    if (fromHash) store.setPage(fromHash.id);
    // Shareable match deep link: #match=<id>
    const deep = location.hash.match(/^#match=([^&]+)/);
    if (deep) { const m = store.profile().matches.find(x => x.id === decodeURIComponent(deep[1])); if (m) { store.setPendingTab(location.hash.match(/[#&]tab=(\w+)/)?.[1] || ''); store.setPage('matches'); setTimeout(() => store.setOpenMatch(m), 1300); } }
    const t = setTimeout(() => setBooting(false), 1250);
    const off = installSpotlight();
    const key = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (!searchDlg.open) openSearch(); } };
    window.addEventListener('keydown', key);
    window.addEventListener('resize', moveIndicator);
    document.fonts?.ready.then(moveIndicator);
    document.body.classList.add('hub-body');
    onCleanup(() => { clearTimeout(t); off(); window.removeEventListener('keydown', key); window.removeEventListener('resize', moveIndicator); document.body.classList.remove('hub-body'); });
  });

  const go = (p: Page) => { store.setPage(p); window.scrollTo({ top: Math.min(window.scrollY, (document.querySelector('.tabs') as HTMLElement)?.offsetTop - 8 || 0), behavior: reducedMotion() ? 'auto' : 'smooth' }); };
  const p = store.profile;
  const s = () => store.stats().summary;

  return <div class="hub">
    <div class="hub-bg" aria-hidden="true"><i class="orb o1" /><i class="orb o2" /><i class="orb o3" /><div class="grid-floor" /><div class="scan" /></div>
    <Show when={booting()}><Boot /></Show>
    <Show when={!booting()}>
      <a class="skip" href="#hub-main">Skip to statistics</a>
      <header class="topbar">
        <a class="brand" href="#overview" onClick={e => { e.preventDefault(); go('overview'); }}><Logo /><span>VAL<b>METRICS</b></span></a>
        <button class="search-trigger" onClick={openSearch}><Icon d={ICONS.search} /><span>Search a Riot ID</span><kbd>Ctrl K</kbd></button>
        <div class="topbar-right">
          <span class="source-pill" classList={{ sample: store.isSample() }} title={p().sourceNote}><i />{store.isSample() ? 'Sample data' : 'Server data'}</span>
          <a class="hud-link" href="?mode=overlay" target="_blank" rel="noopener" title="Desktop HUD preview (simulated)"><Icon d={ICONS.monitor} /><span>HUD preview</span></a>
        </div>
      </header>

      {/* ── Player hero ── */}
      <section class="hero" aria-label="Player">
        <div class="hero-art" aria-hidden="true"><Img src={agentPortrait(p().bannerAgent)} loading="eager" /></div>
        <div class="hero-inner">
          <div class="identity">
            <div class="avatar"><Img src={agentPortrait(p().bannerAgent)} loading="eager" /><span class="level"><CountUp value={p().level} duration={900} /></span></div>
            <div>
              <div class="eyebrow"><span>{p().region}</span><Show when={p().title}><span>“{p().title}”</span></Show></div>
              <h1 class="name"><span class="glitch" data-text={p().name}>{p().name}</span><em>#{p().tag}</em></h1>
              <div class="hero-meta">
                <span><b><CountUp value={s().matches} /></b> matches</span>
                <span><b><CountUp value={s().playtimeH} digits={0} /></b>h played</span>
                <span><b><CountUp value={s().winRate} digits={1} suffix="%" /></b> win rate</span>
              </div>
            </div>
          </div>
          <div class="rank-block">
            <div class="rank-now" style={{ '--rank-c': rankHue(p().tier) }}>
              <Ring value={p().rr} max={100} size={112} stroke={6} color="var(--rank-c)" label={`${rankName(p().tier)}, ${p().rr} RR`}>
                <RankBadge tier={p().tier} size={62} />
              </Ring>
              <div>
                <span class="kicker">Current rank</span>
                <strong>{p().tier ? rankName(p().tier) : 'Unavailable'}</strong>
                <span class="rr"><CountUp value={p().rr} /> <small>/ 100 RR</small></span>
              </div>
            </div>
            <div class="rank-peak">
              <RankBadge tier={p().peakTier} size={40} />
              <div><span class="kicker">Peak rank</span><strong>{p().peakTier ? rankName(p().peakTier) : '—'}</strong><small>{p().peakAct}</small></div>
            </div>
          </div>
        </div>
        <div class="hero-controls">
          <div class="segmented" role="radiogroup" aria-label="Queue">
            <For each={['Competitive', 'Unrated', 'Premier', 'All'] as QueueFilter[]}>{q =>
              <button role="radio" aria-checked={store.queue() === q} classList={{ on: store.queue() === q }} disabled={!store.isSample() && store.loading()}
                onClick={() => { store.setQueue(q); if (!store.isSample()) void lookup(true); }}>{q === 'All' ? 'All queues' : q}</button>}
            </For>
          </div>
          <button class="btn primary" disabled={store.loading()} onClick={() => store.isSample() ? openSearch() : void lookup(true)}>
            <Icon d={store.isSample() ? ICONS.search : ICONS.sync} />{store.loading() ? 'Loading…' : store.isSample() ? 'Find your profile' : 'Sync matches'}
          </button>
        </div>
      </section>

      <nav class="tabs" aria-label="Profile sections" ref={el => { navEl = el; const ro = new ResizeObserver(moveIndicator); ro.observe(el); onCleanup(() => ro.disconnect()); requestAnimationFrame(moveIndicator); }}>
        <For each={PAGES}>{pg => <button data-page={pg.id} classList={{ on: store.page() === pg.id }} aria-current={store.page() === pg.id ? 'page' : undefined} onClick={() => go(pg.id)}>
          <Icon d={ICONS[pg.id]} size={16} /><span>{pg.label}</span></button>}
        </For>
        <i class="tab-ind" style={{ transform: `translateX(${ind().x}px)`, width: `${ind().w}px` }} />
      </nav>

      <Show when={store.message() && !searchDlg?.open}><p class="alert" role="alert">{store.message()}</p></Show>
      <Show when={store.isSample()}><div class="sample-note"><Icon d={ICONS.info} size={15} /><span>You're viewing a <b>synthetic sample profile</b>. Every figure is generated from a fixed seed to demonstrate the experience before Riot production API access. It is not a real player.</span></div></Show>

      <main id="hub-main" class="page" tabindex="-1">
        <Show when={`${store.page()}|${store.queue()}|${p().name}`} keyed>{_k =>
          <div class="page-enter">
            <Switch>
              <SMatch when={store.page() === 'overview'}><Overview go={go} /></SMatch>
              <SMatch when={store.page() === 'matches'}><Matches /></SMatch>
              <SMatch when={store.page() === 'performance'}><Performance /></SMatch>
              <SMatch when={store.page() === 'agents'}><Agents /></SMatch>
              <SMatch when={store.page() === 'maps'}><Maps /></SMatch>
              <SMatch when={store.page() === 'weapons'}><Weapons /></SMatch>
              <SMatch when={store.page() === 'seasons'}><Seasons /></SMatch>
              <SMatch when={store.page() === 'data'}><DataCoverage /></SMatch>
            </Switch>
          </div>}
        </Show>
      </main>

      <footer class="footer">
        <div><Logo size={22} /><span>VAL-Metrics · post-match intelligence for VALORANT</span></div>
        <p>VAL-Metrics was created under Riot Games' “Legal Jibber Jabber” policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project. {store.isSample() ? 'All statistics shown are synthetic sample data.' : `Data source: ${p().sourceNote}.`}</p>
      </footer>

      <MatchDrawer />
    </Show>

    <dialog ref={searchDlg} class="dialog search" onClick={e => { if (e.target === searchDlg) searchDlg.close(); }} aria-labelledby="search-h">
      <form onSubmit={e => { e.preventDefault(); void lookup(); }}>
        <div class="dialog-head"><h2 id="search-h">Find a player</h2><button type="button" class="icon-btn" aria-label="Close" onClick={() => searchDlg.close()}><Icon d={ICONS.close} /></button></div>
        <p>Players appear after they connect with Riot Sign-On. Live lookups activate once production API access is approved.</p>
        <label class="field"><Icon d={ICONS.search} /><input ref={searchInput} placeholder="Riot ID  e.g. Ghost#PLAY" value={query()} onInput={e => setQuery(e.currentTarget.value)} autocomplete="off" aria-label="Riot ID" /></label>
        <Show when={store.message()}><p class="alert inline" role="alert">{store.message()}</p></Show>
        <div class="dialog-actions">
          <button type="button" class="btn ghost" onClick={useSample}>Explore sample profile</button>
          <button class="btn primary" type="submit" disabled={store.loading()}>{store.loading() ? 'Searching…' : 'Look up'}<Icon d={ICONS.arrow} /></button>
        </div>
      </form>
    </dialog>
  </div>;
};

export { fmt };
