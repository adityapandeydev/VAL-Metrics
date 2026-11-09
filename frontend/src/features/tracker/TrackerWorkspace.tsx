import { Component, For, Match as SMatch, Show, Switch, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import { fetchHistoricalAnalytics, triggerPlayerSync } from '../../services/telemetry';
import { sampleProfile } from './data/demo';
import { fromServer } from './data/server';
import { rankName, rankHue, agentPortrait } from './data/assets';
import { fmt } from './data/stats';
import { CountUp, installSpotlight, reducedMotion } from './motion';
import { Ring } from './charts';
import { Icon, ICONS, Img, RankBadge, tw } from './ui';
import { PAGES, Page, QueueFilter, store } from './store';
import { Overview } from './pages/Overview';
import { Matches, MatchDrawer } from './pages/Matches';
import { Performance } from './pages/Performance';
import { Agents, Maps, Weapons } from './pages/Arsenal';
import { Seasons } from './pages/Seasons';
import { DataCoverage } from './pages/DataCoverage';

const Logo: Component<{ size?: number; class?: string }> = p =>
  <svg class={p.class} width={p.size ?? 30} height={p.size ?? 30} viewBox="0 0 40 40" aria-hidden="true">
    <path class="fill-ink" d="M4 6h9l7 16 7-16h9L20 36z" />
    <path class="fill-accent" d="M4 6l16 30-3.6-.2L4 9z" />
  </svg>;

const Boot: Component = () => <div class="fx-boot fixed inset-0 z-50 grid place-content-center justify-items-center gap-3.5 bg-bg" role="status" aria-label="Loading profile">
  <Logo size={64} class="fx-boot-logo" />
  <div class="animate-rise font-display text-[22px] font-bold tracking-[.32em] [animation-delay:.2s]">VAL<span class="text-accent">METRICS</span></div>
  <div class="h-0.5 w-[180px] overflow-hidden bg-line-2"><i class="fx-boot-bar block h-full bg-linear-to-r from-accent to-accent-2" /></div>
  <small class="animate-pulse font-display text-[11px] font-medium uppercase tracking-[.2em] text-muted">Syncing combat telemetry</small>
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

    onCleanup(() => { clearTimeout(t); off(); window.removeEventListener('keydown', key); window.removeEventListener('resize', moveIndicator);  });
  });

  const go = (p: Page) => { store.setPage(p); window.scrollTo({ top: Math.min(window.scrollY, (document.querySelector('[data-tabs]') as HTMLElement)?.offsetTop - 8 || 0), behavior: reducedMotion() ? 'auto' : 'smooth' }); };
  const p = store.profile;
  const s = () => store.stats().summary;

  const shellX = 'mx-auto max-w-[1320px] px-4 md:px-6';
  const inset = 'mx-4 md:mx-auto md:max-w-[1272px]';
  return <div class="relative isolate min-h-screen overflow-x-clip font-body text-[13.5px] leading-[1.45] text-ink md:text-sm">
    <div class="fixed inset-0 -z-1 overflow-hidden bg-[radial-gradient(120%_80%_at_70%_-10%,#1a1020_0%,transparent_55%),var(--color-bg)]" aria-hidden="true">
      <i class="fx-orb absolute -top-40 -right-20 size-[520px] rounded-full bg-accent opacity-18 blur-[90px]" />
      <i class="fx-orb absolute -bottom-50 -left-30 size-[460px] rounded-full bg-[#3a4cff] opacity-14 blur-[90px] [animation-duration:32s]" />
      <i class="fx-orb absolute top-[40%] left-[55%] size-[300px] rounded-full bg-win opacity-7 blur-[90px] [animation-duration:38s]" />
      <div class="fx-floor absolute inset-0 opacity-45 [mask-image:radial-gradient(80%_60%_at_50%_0%,#000_0%,transparent_75%)]" />
      <div class="fx-scan absolute inset-x-0 h-40 bg-linear-to-b from-transparent via-accent/5 to-transparent" />
    </div>
    <Show when={booting()}><Boot /></Show>
    <Show when={!booting()}>
      <a class="absolute top-2 -left-[999px] z-100 bg-accent px-3 py-2 text-white focus:left-4" href="#hub-main">Skip to statistics</a>
      <header class={`${shellX} flex animate-rise flex-wrap items-center gap-2.5 pt-[18px] md:flex-nowrap md:gap-[18px]`}>
        <a class="group flex items-center gap-2.5 font-display text-[17px] font-bold tracking-[.18em] text-ink no-underline" href="#overview" onClick={e => { e.preventDefault(); go('overview'); }}>
          <Logo class="group-hover:animate-[pop_.5s_var(--ease-spring)]" /><span class="hidden md:inline">VAL<b class="font-bold text-accent">METRICS</b></span>
        </a>
        <button class="ml-auto flex flex-1 items-center gap-2.5 rounded-md border border-line-2 bg-surface/70 px-3 py-[9px] text-muted backdrop-blur-md transition duration-200 ease-out-expo hover:-translate-y-px hover:border-accent hover:text-ink md:min-w-[280px] md:flex-none" onClick={openSearch}>
          <Icon d={ICONS.search} /><span>Search a Riot ID</span><kbd class="ml-auto hidden rounded border border-line-2 px-1.5 py-0.5 font-display text-[11px] font-medium md:inline">Ctrl K</kbd>
        </button>
        <div class="flex items-center gap-2.5">
          <span class="inline-flex items-center gap-[7px] rounded-full border px-2.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[.1em]"
            classList={{ 'border-accent-2/30 bg-accent-2/8 text-accent-2': store.isSample(), 'border-win/30 bg-win/10 text-win': !store.isSample() }} title={p().sourceNote}>
            <i class="size-[7px] animate-pulse-ring rounded-full bg-current" />{store.isSample() ? 'Sample data' : 'Server data'}
          </span>
          <a class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12.5px] text-ink-2 no-underline transition-colors hover:bg-surface-2 hover:text-ink" href="?mode=overlay" target="_blank" rel="noopener" title="Desktop HUD preview (simulated)"><Icon d={ICONS.monitor} /><span class="hidden md:inline">HUD preview</span></a>
        </div>
      </header>

      {/* ── Player hero ── */}
      <section class={`${shellX} relative mt-[18px]`} aria-label="Player">
        <div class="absolute inset-y-0 inset-x-4 -z-1 animate-rise rounded-[10px] border border-line-2 bg-[linear-gradient(105deg,rgb(16_19_27/.96)_0%,rgb(16_19_27/.85)_45%,rgb(40_14_24/.55)_100%)] [animation-delay:.05s] md:inset-x-6" />
        <div class="pointer-events-none absolute inset-y-0 right-4 -z-1 w-full overflow-hidden rounded-r-[10px] opacity-60 [mask-image:linear-gradient(90deg,transparent_0%,#000_40%)] md:right-6 md:w-[56%] md:opacity-100" aria-hidden="true">
          <Img class="absolute -top-[18%] -right-[4%] w-[78%] max-w-none min-w-[520px] animate-hero-in opacity-55 saturate-110 [animation-delay:.15s]" src={agentPortrait(p().bannerAgent)} loading="eager" />
        </div>
        <div class="flex flex-wrap items-center justify-between gap-6 px-[18px] pt-[22px] pb-3.5 md:px-[34px] md:pt-[34px] md:pb-[18px]">
          <div class="flex animate-rise items-center gap-3.5 [animation-delay:.15s] md:gap-[22px]">
            <div class="relative size-[76px] flex-none overflow-hidden rounded-[10px] border border-line-2 bg-linear-160 from-[#2a1420] to-surface md:size-[108px]">
              <Img class="-mt-[6%] -ml-[40%] w-[180%] max-w-none" src={agentPortrait(p().bannerAgent)} loading="eager" />
              <span class="absolute bottom-1.5 left-1/2 -translate-x-1/2 rounded-full border border-line-2 bg-bg px-2 py-px font-display text-[11px] font-bold"><CountUp value={p().level} duration={900} /></span>
            </div>
            <div>
              <div class="flex gap-3 font-display text-[11px] font-semibold uppercase tracking-[.14em] text-muted"><span>{p().region}</span><Show when={p().title}><span class="before:mr-3 before:text-line-2 before:content-['/']">“{p().title}”</span></Show></div>
              <h1 class="mt-1.5 mb-2.5 flex items-baseline gap-2.5 font-display text-[clamp(34px,5vw,56px)] leading-none font-extrabold tracking-[-.01em]">
                <span class="fx-glitch relative inline-block" data-text={p().name}>{p().name}</span><em class="text-[.42em] font-semibold not-italic text-muted">#{p().tag}</em>
              </h1>
              <div class="flex flex-wrap gap-[22px] text-[13px] text-ink-2 [&_b]:mr-[3px] [&_b]:font-display [&_b]:text-base [&_b]:font-bold [&_b]:text-ink">
                <span><b><CountUp value={s().matches} /></b> matches</span>
                <span><b><CountUp value={s().playtimeH} digits={0} /></b>h played</span>
                <span><b><CountUp value={s().winRate} digits={1} suffix="%" /></b> win rate</span>
              </div>
            </div>
          </div>
          <div class="flex w-full animate-rise flex-col gap-3.5 [animation-delay:.3s] md:w-auto md:flex-row md:flex-wrap [&_strong]:mt-0.5 [&_strong]:block [&_strong]:font-display [&_strong]:text-xl [&_strong]:font-bold">
            <div class="flex items-center gap-4 rounded-lg border border-line bg-bg/55 py-3.5 pr-[18px] pl-3.5 backdrop-blur-md" style={{ '--rank-c': rankHue(p().tier) }}>
              <Ring value={p().rr} max={100} size={112} stroke={6} color="var(--rank-c)" glow label={`${rankName(p().tier)}, ${p().rr} RR`}>
                <RankBadge tier={p().tier} size={62} />
              </Ring>
              <div>
                <span class={tw.kicker}>Current rank</span>
                <strong>{p().tier ? rankName(p().tier) : 'Unavailable'}</strong>
                <span class="font-display text-sm font-semibold text-ink-2"><CountUp value={p().rr} /> <small class="text-[11px] text-muted">/ 100 RR</small></span>
              </div>
            </div>
            <div class="flex items-center gap-4 rounded-lg border border-line bg-bg/55 py-3.5 pr-[18px] pl-3.5 backdrop-blur-md">
              <RankBadge tier={p().peakTier} size={40} />
              <div><span class={tw.kicker}>Peak rank</span><strong>{p().peakTier ? rankName(p().peakTier) : '—'}</strong><small class="text-xs text-muted">{p().peakAct}</small></div>
            </div>
          </div>
        </div>
        <div class="flex animate-rise flex-wrap items-center justify-between gap-3 px-[18px] pb-[18px] [animation-delay:.4s] md:px-[34px] md:pb-6">
          <div class={tw.segWrap} role="radiogroup" aria-label="Queue">
            <For each={['Competitive', 'Unrated', 'Premier', 'All'] as QueueFilter[]}>{q =>
              <button role="radio" aria-checked={store.queue() === q} class={`${tw.seg} ${store.queue() === q ? tw.segOn : ''}`} disabled={!store.isSample() && store.loading()}
                onClick={() => { store.setQueue(q); if (!store.isSample()) void lookup(true); }}>{q === 'All' ? 'All queues' : q}</button>}
            </For>
          </div>
          <button class={`${tw.btn} ${tw.primary}`} disabled={store.loading()} onClick={() => store.isSample() ? openSearch() : void lookup(true)}>
            <Icon d={store.isSample() ? ICONS.search : ICONS.sync} />{store.loading() ? 'Loading…' : store.isSample() ? 'Find your profile' : 'Sync matches'}
          </button>
        </div>
      </section>

      <nav data-tabs class={`${inset} sticky top-0 z-20 mt-3 flex animate-rise gap-0.5 overflow-x-auto rounded-[10px] border border-line bg-[#0a0c12]/78 p-1.5 backdrop-blur-lg backdrop-saturate-130 [scrollbar-width:none] [animation-delay:.45s] md:mt-4`} aria-label="Profile sections"
        ref={el => { navEl = el; const ro = new ResizeObserver(moveIndicator); ro.observe(el); onCleanup(() => ro.disconnect()); requestAnimationFrame(moveIndicator); }}>
        <For each={PAGES}>{pg => <button data-page={pg.id} class="relative z-1 flex items-center gap-2 rounded-[7px] px-4 py-2.5 font-display text-[12.5px] font-semibold uppercase tracking-[.08em] whitespace-nowrap transition-colors duration-200 hover:text-ink"
          classList={{ 'text-ink [&>svg]:text-accent': store.page() === pg.id, 'text-muted': store.page() !== pg.id }} aria-current={store.page() === pg.id ? 'page' : undefined} onClick={() => go(pg.id)}>
          <Icon d={ICONS[pg.id]} size={16} /><span>{pg.label}</span></button>}
        </For>
        <i class="pointer-events-none absolute top-1.5 bottom-1.5 left-0 rounded-[7px] border border-accent/35 bg-linear-to-b from-accent/16 to-accent/6 transition-[transform,width] duration-500 ease-spring after:absolute after:inset-x-[20%] after:-bottom-px after:h-0.5 after:rounded-sm after:bg-accent after:shadow-[0_0_12px_var(--color-accent)]"
          style={{ transform: `translateX(${ind().x}px)`, width: `${ind().w}px` }} />
      </nav>

      <Show when={store.message() && !searchDlg?.open}><p class={`${inset} mt-3.5 animate-rise rounded-md border border-loss/40 bg-loss/8 px-3.5 py-2.5 text-[13px] text-[#ffc2cd]`} role="alert">{store.message()}</p></Show>
      <Show when={store.isSample()}><div class={`${inset} mt-3.5 flex animate-rise items-start gap-2.5 rounded-md border border-accent-2/20 bg-accent-2/6 px-3.5 py-2.5 text-[12.5px] text-ink-2 [animation-delay:.5s]`}><Icon d={ICONS.info} size={15} class="mt-0.5 text-accent-2" /><span>You're viewing a <b class="font-semibold text-accent-2">synthetic sample profile</b>. Every figure is generated from a fixed seed to demonstrate the experience before Riot production API access. It is not a real player.</span></div></Show>

      <main id="hub-main" class={`${shellX} pt-[18px] pb-10 outline-none`} tabindex="-1">
        <Show when={`${store.page()}|${store.queue()}|${p().name}`} keyed>{_k =>
          <div class="animate-page-in">
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

      <footer class={`${inset} mt-2.5 mb-[30px] grid gap-2 border-t border-line pt-[18px] text-xs text-muted`}>
        <div class="flex items-center gap-2 font-display tracking-[.06em] text-ink-2"><Logo size={22} /><span>VAL-Metrics · post-match intelligence for VALORANT</span></div>
        <p class="max-w-[900px]">VAL-Metrics was created under Riot Games' “Legal Jibber Jabber” policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project. {store.isSample() ? 'All statistics shown are synthetic sample data.' : `Data source: ${p().sourceNote}.`}</p>
      </footer>

      <MatchDrawer />
    </Show>

    <dialog ref={searchDlg} class="m-auto w-[min(520px,calc(100vw-32px))] rounded-xl border border-line-2 bg-[#0e1018] p-0 font-body text-ink shadow-[0_40px_80px_-30px_#000] open:animate-dialog-in" onClick={e => { if (e.target === searchDlg) searchDlg.close(); }} aria-labelledby="search-h">
      <form class="grid gap-3.5 p-[22px]" onSubmit={e => { e.preventDefault(); void lookup(); }}>
        <div class="flex items-center justify-between"><h2 id="search-h" class="font-display text-[22px] font-extrabold uppercase tracking-[.04em]">Find a player</h2><button type="button" class={tw.iconBtn} aria-label="Close" onClick={() => searchDlg.close()}><Icon d={ICONS.close} /></button></div>
        <p class="text-[13px] text-ink-2">Players appear after they connect with Riot Sign-On. Live lookups activate once production API access is approved.</p>
        <label class="flex items-center gap-2.5 rounded-lg border border-line-2 bg-surface-2 px-3.5 py-3 text-muted transition focus-within:border-accent focus-within:shadow-[0_0_0_4px_rgb(255_70_85/.15)]"><Icon d={ICONS.search} /><input ref={searchInput} class="flex-1 bg-transparent font-body text-[15px] font-medium text-ink outline-none" placeholder="Riot ID  e.g. Ghost#PLAY" value={query()} onInput={e => setQuery(e.currentTarget.value)} autocomplete="off" aria-label="Riot ID" /></label>
        <Show when={store.message()}><p class="rounded-md border border-loss/40 bg-loss/8 px-3.5 py-2.5 text-[13px] text-[#ffc2cd]" role="alert">{store.message()}</p></Show>
        <div class="flex flex-wrap justify-between gap-2.5">
          <button type="button" class={`${tw.btn} ${tw.ghost}`} onClick={useSample}>Explore sample profile</button>
          <button class={`${tw.btn} ${tw.primary}`} type="submit" disabled={store.loading()}>{store.loading() ? 'Searching…' : 'Look up'}<Icon d={ICONS.arrow} /></button>
        </div>
      </form>
    </dialog>
  </div>;
};

export { fmt };
