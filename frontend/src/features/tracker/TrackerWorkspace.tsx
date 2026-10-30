import { Component, For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { fetchHistoricalAnalytics, triggerPlayerSync } from '../../services/telemetry';
import { asset, Encounter, fromServer, impactParts, impactScore, PlayerView } from './model';
import { demoPlayer } from './demo';
import { CombatOverview, AccuracyRoles, AgentTable, WeaponTable, MapTable, FormLab, Coverage } from './CombatAnalysis';
import './tracker.css';

type Page = 'Overview'|'Matches'|'Performance'|'Agents'|'Maps'|'Weapons'|'Roadmap';
const pages: Page[] = ['Overview','Matches','Performance','Agents','Maps','Weapons','Roadmap'];
const paths = ['M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z','M4 5h16M4 12h16M4 19h16','M3 18l5-7 5 3 8-10','M12 3l8 5v8l-8 5-8-5V8z M8 10h8M12 10v7','M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z M9 3v15M15 6v15','M3 10h13l5-4v8l-5-1H9l-2 6H4l2-6H3z'];
const Icon: Component<{path:string}> = p => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={p.path}/></svg>;
const Arrow = () => <Icon path="M5 12h14M13 6l6 6-6 6"/>;
const fmt = (v: number, digits=0) => Number.isFinite(v) ? v.toFixed(digits) : '—';

export const TrackerWorkspace: Component = () => {
  const [page, setPage] = createSignal<Page>('Overview');
  const [sample, setSample] = createSignal(true);
  const [count, setCount] = createSignal(10);
  const [server, setServer] = createSignal<PlayerView>();
  const [serverQueue, setServerQueue] = createSignal('');
  const [queue, setQueue] = createSignal('Competitive');
  const [filter, setFilter] = createSignal('All results');
  const [agentFilter,setAgentFilter] = createSignal('All agents');
  const [mapFilter,setMapFilter] = createSignal('All maps');
  const [query, setQuery] = createSignal('');
  const [loading, setLoading] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [selected, setSelected] = createSignal<Encounter>();
  const [method, setMethod] = createSignal(false);
  const player = createMemo(() => sample() ? demoPlayer(count()) : server());
  const hasDataset = createMemo(() => Boolean(player()) && (sample() ? queue() === 'Competitive' : serverQueue() === queue()));
  const matches = createMemo(() => hasDataset() ? player()?.matches || [] : []);
  const visible = createMemo(() => matches().filter(m => filter()==='All results' || m.win === (filter()==='Wins')).filter(m=>(agentFilter()==='All agents'||m.agent===agentFilter())&&(mapFilter()==='All maps'||m.map===mapFilter())));
  const score = createMemo(() => impactScore(matches()));
  createEffect(() => {
    const history = matches();
    if (agentFilter() !== 'All agents' && !history.some(m=>m.agent===agentFilter())) setAgentFilter('All agents');
    if (mapFilter() !== 'All maps' && !history.some(m=>m.map===mapFilter())) setMapFilter('All maps');
  });
  let review!: HTMLDialogElement;
  let search!: HTMLDialogElement;
  let methodology!: HTMLDialogElement;
  let searchInput!: HTMLInputElement;
  let request = 0;
  const openSearch = () => { search.showModal(); searchInput.focus(); };
  const navigate = (p: Page) => { setPage(p); window.history.replaceState(null,'',`#${p.toLowerCase()}`); };
  const showDemo = () => { request++; setLoading(false); setSample(true); setQueue('Competitive'); setMessage(''); };
  const lookup = async (sync=false, reload=false) => {
    const id = sync || reload ? server()?.name || query().trim() : query().trim();
    if (!id || !/^[^#]+#[^#]+$/.test(id)) { setMessage('Enter a Riot ID with its tag, like Ghost#PLAY.'); return; }
    const ticket = ++request;
    const requestedQueue = queue();
    setLoading(true); setMessage('');
    try {
      if (sync) { const result = await triggerPlayerSync(id); if (!result) throw new Error('Sync could not reach the server. Check the backend and try again.'); }
      const data = await fetchHistoricalAnalytics(id, requestedQueue);
      if (ticket !== request) return;
      if (!data) throw new Error('No player data returned. Check your Riot ID, backend connection, and API access, then retry.');
      setServer(fromServer(data)); setServerQueue(requestedQueue); setSample(false); search.close();
    } catch (error) {
      if (ticket === request) {
        const reason = error instanceof Error ? error.message : 'Unable to load this player. Try again.';
        if (reload && serverQueue()) { setQueue(serverQueue()); setMessage(`Could not load ${requestedQueue}. Still showing ${serverQueue()}. ${reason}`); }
        else setMessage(reason);
      }
    }
    finally { if (ticket === request) setLoading(false); }
  };
  createEffect(() => { if (selected()) review.showModal(); });
  createEffect(() => { if (method()) methodology.showModal(); });
  onMount(() => {
    document.body.classList.add('roundline-body');
    const initial = pages.find(p => `#${p.toLowerCase()}` === location.hash);
    if (initial) setPage(initial);
    const key = (e: KeyboardEvent) => {
      document.body.classList.add('keyboard-input');
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase()==='k') { e.preventDefault(); if (!search.open && !review.open && !methodology.open) openSearch(); }
    };
    const pointer = () => document.body.classList.remove('keyboard-input');
    window.addEventListener('keydown',key); window.addEventListener('pointerdown',pointer);
    onCleanup(() => { request++; document.body.classList.remove('roundline-body','keyboard-input'); window.removeEventListener('keydown',key); window.removeEventListener('pointerdown',pointer); });
  });
  const Stat: Component<{label:string; value:string; note:string; accent?:boolean}> = p => <div class="rl-stat"><span>{p.label}</span><strong classList={{'rl-accent':p.accent}}>{p.value}</strong><small>{p.note}</small></div>;
  const Empty: Component<{title:string; text:string}> = p => <div class="rl-empty"><Icon path="M4 5h16v14H4zM8 9h8M8 14h4"/><h3>{p.title}</h3><p>{p.text}</p><Show when={sample() && queue()!=='Competitive'}><button class="rl-button" onClick={() => setQueue('Competitive')}>View competitive sample</button></Show></div>;
  const MatchList = () => <section class="rl-match-panel">
    <div class="rl-section-head"><div><h2>Match history <span>{matches().length}</span></h2><p>Results, combat stats and contribution.</p></div><label class="rl-sr" for="result-filter">Filter results</label><select id="result-filter" value={filter()} onChange={e => setFilter(e.currentTarget.value)}><option>All results</option><option>Wins</option><option>Losses</option></select></div>
    <div class="ca-match-filters"><select aria-label="Filter match agent" value={agentFilter()} onChange={e=>setAgentFilter(e.currentTarget.value)}><option>All agents</option><For each={[...new Set(matches().map(m=>m.agent))]}>{a=><option>{a}</option>}</For></select><select aria-label="Filter match map" value={mapFilter()} onChange={e=>setMapFilter(e.currentTarget.value)}><option>All maps</option><For each={[...new Set(matches().map(m=>m.map))]}>{m=><option>{m}</option>}</For></select></div><div class="rl-table-head"><span>Match / agent</span><span>Score</span><span>K / D / A</span><span>ACS / HS</span><span>Impact</span><span/></div>
    <Show when={visible().length} fallback={<Empty title="No matches in this view" text={matches().length?"Try another result filter or queue. Your other matches are still available.":"No recent encounters were returned. Other available profile statistics remain accessible."}/>}>
      <div class="rl-match-list"><For each={visible()}>{m => <button class="rl-match" onClick={() => setSelected(m)} aria-label={`Review ${m.map}, ${m.win?'win':'loss'}, ${m.score}`}>
        <div class="rl-match-identity"><div class="rl-map-thumb" style={{'background-image':`url("${asset(m.map)}")`}}><img src={m.icon || asset(m.agent)} alt="" onError={e => { e.currentTarget.style.visibility='hidden'; }}/></div><div><strong>{m.map}</strong><small>{m.agent} <span>· {m.time}</span></small></div></div>
        <div class="rl-result"><span classList={{'is-win':m.win,'is-loss':!m.win}}>{m.win?'Win':'Loss'}</span><b>{m.score}</b></div>
        <div class="rl-kda"><strong>{m.k}<em> / {m.d} / </em>{m.a}</strong><small>{fmt(m.k/Math.max(1,m.d),2)} K/D</small></div>
        <span class="rl-acs">{m.acs}<small>{m.hs}% HS</small></span><span class="rl-impact-cell">{impactParts(m) ? fmt(impactParts(m)!.total,1) : '—'}</span><span class="rl-row-arrow"><Arrow/></span>
      </button>}</For></div>
    </Show><div class="rl-table-foot">{visible().length} of {matches().length} available matches <span>Most recent first</span></div>
  </section>;
  const Impact = () => <section class="rl-impact-panel"><div class="rl-section-head"><h2>Impact Rating</h2><button class="rl-icon-button" aria-label="How Impact Rating works" onClick={() => setMethod(true)}><Icon path="M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0"/></button></div><div class="rl-rating"><strong>{score()==null?'—':fmt(score()!,1)}</strong><span>/ 100<br/><b>Experimental model</b></span></div><p>Damage. Participation. Opening duels.<br/>A clearer picture of your contribution.</p><div class="rl-impact-scale"><i style={{width:`${score() || 0}%`}}/></div><div class="rl-scale-label"><span>Building</span><span>High contribution</span></div><button class="rl-text-button" onClick={() => setMethod(true)}>See the breakdown <Arrow/></button></section>;
  return <div class="tracker-app" classList={{'is-overview':page()==='Overview'}}>
    <a class="rl-skip" href="#main-content">Skip to player stats</a>
    <aside class="rl-sidebar"><a href="#overview" class="rl-brand" onClick={e => {e.preventDefault();navigate('Overview');}}><svg width="32" height="31" viewBox="0 0 32 31" fill="none" aria-hidden="true"><path d="M2 3h8l6 12 6-12h8L16 29z" fill="currentColor"/><path d="M2 3l14 26L10 3z" fill="#ff6747"/></svg><span>VAL<span class="rl-brand-light">METRICS</span></span></a>
      <div class="rl-sidebar-caption">VALORANT analytics</div><nav aria-label="Player analytics"><For each={pages}>{(p,i) => <button classList={{'is-active':page()===p}} onClick={() => navigate(p)} aria-label={p} title={p} aria-current={page()===p?'page':undefined}><Icon path={paths[i()] || paths[0]}/><span>{p}</span><Show when={page()===p}><span class="rl-nav-mark"/></Show></button>}</For></nav><select class="rl-mobile-nav" aria-label="Analytics section" value={page()} onChange={e=>navigate(e.currentTarget.value as Page)}><For each={pages}>{p=><option value={p}>{p}</option>}</For></select>
      <div class="rl-sidebar-bottom"><div class="rl-dev-label">Developer preview</div><a class="rl-overlay-link" href="?mode=overlay" target="_blank" rel="noopener"><Icon path="M3 4h18v13H3zM8 21h8M12 17v4"/><span>Desktop HUD preview<small>Interface demo only</small></span><Arrow/></a><p>Not affiliated with Riot Games.<br/>VALORANT artwork © Riot Games.</p></div>
    </aside>
    <div class="rl-workspace"><header class="rl-topbar"><div class="rl-breadcrumb">Player intelligence <span>/</span> <b>{page()}</b></div><button class="rl-search-trigger" onClick={openSearch}><Icon path="M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0"/><span>Find a player</span><kbd>Ctrl K</kbd></button><span class="rl-avatar">G</span></header>
      <main id="main-content" tabindex="-1"><div class="rl-demo-banner"><span><i/>{sample()?'You’re exploring sample data.':'Server data · '+(player()?.source || 'unavailable')}</span><button onClick={() => sample()?openSearch():showDemo()}>{sample()?'Look up a player':'Explore sample data'} <Arrow/></button></div>
        <section class="rl-player-heading"><div class="rl-profile-stage" aria-hidden="true"><i/><img src={asset('omen-portrait')} alt=""/></div><div class="rl-profile"><div class="rl-profile-image"><img src={asset('omen')} alt=""/></div><div><h1>{player()?.name.split('#')[0] || 'Player'}<span>#{player()?.name.split('#')[1] || '—'}</span></h1><div class="rl-player-meta">VALORANT <span>·</span> {sample()?'Demo profile':'Player profile'}</div><p>{sample()?'Competitive · PC · Synthetic demonstration profile':'Review the data available from your connected backend.'}</p></div></div><div class="rl-rank-state"><svg width="32" height="38" viewBox="0 0 32 38" fill="none" aria-hidden="true"><path d="M16 2 29 15 16 36 3 15z" stroke="currentColor" stroke-width="2"/><path d="m16 10 6 7-6 10-6-10z" fill="currentColor"/></svg><div><strong>{sample()?'Ascendant 2':'Rank unavailable'}</strong><small>{sample()?'Illustrative sample rank':'Ranked snapshots not supplied'}</small></div></div><button class="rl-button rl-sync" disabled={loading()} onClick={() => sample()?openSearch():void lookup(true)}><Icon path="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1"/>{loading()?'Loading…':sample()?'Find your profile':'Sync matches'}</button></section>
        <Show when={message() && !search?.open}><p class="rl-error" role="alert">{message()}</p></Show>
        <div class="rl-view-controls"><div class="rl-page-tabs" aria-label="Quick views"><button classList={{'is-selected':page()==='Overview'}} onClick={() => navigate('Overview')}>Overview</button><button classList={{'is-selected':page()==='Matches'}} onClick={() => navigate('Matches')}>Match history</button><button classList={{'is-selected':page()==='Performance'}} onClick={() => navigate('Performance')}>Performance</button></div><div class="rl-filters"><label><span class="rl-sr">Queue</span><select aria-label="Queue" value={queue()} disabled={loading()} onChange={e => {setQueue(e.currentTarget.value);if(!sample())void lookup(false,true);}}><option>Competitive</option><option>Unrated</option></select></label><Show when={sample()}><label><span class="rl-sr">Sample size</span><select aria-label="Sample size" value={count()} onChange={e => setCount(Number(e.currentTarget.value))}><option value="10">Last 10 matches</option><option value="6">Last 6 matches</option></select></label></Show></div></div>
        <Show when={hasDataset()} fallback={<Empty title={loading()?"Loading matches...":"No games in this queue yet"} text={sample()?"The sample contains competitive matches. Switch queues to explore the full profile.":"No match history was returned for this queue. Try another queue or sync your matches."}/>}>
          <Show when={page()==='Overview' || page()==='Performance'}><section class="rl-stats" aria-label="Player summary"><Stat label="Win rate" value={`${fmt(player()!.summary.total ? player()!.summary.wins/player()!.summary.total*100:0)}%`} note={`${player()!.summary.wins} wins / ${player()!.summary.total-player()!.summary.wins} losses`} accent/><Stat label="K/D ratio" value={fmt(player()!.summary.kd,2)} note="Kills per death"/><Stat label="Damage / round" value={fmt(player()!.summary.adr)} note="Average damage dealt"/><Stat label="Headshots" value={`${fmt(player()!.summary.hs,1)}%`} note={sample()?'Mean match hit rate':'Of recorded hits'}/><Stat label="Combat score" value={fmt(player()!.summary.acs)} note="Average per round"/></section></Show>
          <Show when={matches().length && (page()==='Overview' || page()==='Matches')}><section class="rl-roundline"><div class="rl-roundline-copy"><h2>Your roundline</h2><p>Recent results, connected.</p></div><div class="rl-result-track"><For each={matches().slice().reverse()}>{m => <button classList={{'is-win':m.win,'is-loss':!m.win}} onClick={() => setSelected(m)} aria-label={`Open ${m.map}, ${m.win?'win':'loss'}, ${m.score}`}><span>{m.win?'W':'L'}</span><small>{m.map}</small><i/></button>}</For><div class="rl-now"><i/><small>Latest</small></div></div></section></Show>
          <Show when={page()==='Overview'}><CombatOverview player={player()!}/></Show><Show when={page()==='Overview' || page()==='Matches'}><div class="rl-content-grid"><MatchList/><aside class="rl-insights"><AccuracyRoles player={player()!}/><Impact/><section class="rl-agent-spotlight"><div class="rl-section-head"><h2>Most played</h2><button class="rl-text-button" onClick={() => navigate('Agents')}>Agents <Arrow/></button></div><Show when={player()!.agents.length} fallback={<p>No agent data available.</p>}><img class="rl-agent-art" src={asset(player()!.agents.slice().sort((a,b)=>b.matches-a.matches)[0]?.name === 'Omen' ? 'omen-portrait' : player()!.agents.slice().sort((a,b)=>b.matches-a.matches)[0]?.name || 'omen')} alt="" onError={e => {e.currentTarget.style.visibility='hidden';}}/><div class="rl-agent-copy"><strong>{player()!.agents.slice().sort((a,b)=>b.matches-a.matches)[0]?.name}</strong><span>{player()!.agents.slice().sort((a,b)=>b.matches-a.matches)[0]?.matches} matches in this view</span><button class="rl-button" onClick={() => navigate('Agents')}>Agent breakdown <Arrow/></button></div></Show></section></aside></div></Show>
          <Show when={page()==='Performance'}><CombatOverview player={player()!}/><FormLab matches={matches()} onReview={setSelected}/><AccuracyRoles player={player()!}/></Show>
          <Show when={page()==='Agents'}><AgentTable player={player()!}/></Show>
          <Show when={page()==='Maps'}><MapTable player={player()!} onReview={setSelected}/></Show>
          <Show when={page()==='Weapons'}><WeaponTable player={player()!}/></Show>
          <Show when={page()==='Roadmap'}><Coverage/></Show>
        </Show>
        <footer class="rl-footer"><span>VAL-Metrics <b>·</b> Post-match intelligence.</span><span>{sample()?'Synthetic data · not your Riot profile.':'Data availability depends on backend and Riot access.'}</span><a class="rl-mobile-overlay" href="?mode=overlay" target="_blank" rel="noopener">Desktop HUD interface preview</a></footer>
      </main>
    </div>
    <dialog ref={search} class="rl-dialog rl-search-dialog" onClick={e => {if(e.target===search)search.close();}} aria-labelledby="search-title"><form onSubmit={e=>{e.preventDefault();void lookup();}}><div class="rl-section-head"><h2 id="search-title">Find your player</h2><button type="button" class="rl-icon-button" aria-label="Close search" onClick={()=>search.close()}><Icon path="M6 6l12 12M18 6 6 18"/></button></div><p>Use your full Riot ID. Availability depends on API access and the connected backend.</p><label for="riot-id">Riot ID</label><input ref={searchInput} id="riot-id" placeholder="Player#TAG" value={query()} onInput={e=>setQuery(e.currentTarget.value)} autocomplete="off" required/><Show when={message()}><p class="rl-error" role="alert">{message()}</p></Show><button class="rl-button rl-primary" disabled={loading()} type="submit">{loading()?'Loading player…':'Load player'} <Arrow/></button><button class="rl-text-button" type="button" onClick={()=>{showDemo();search.close();}}>Explore sample profile</button></form></dialog>
    <dialog ref={review} class="rl-dialog rl-review" onClose={()=>setSelected(undefined)} onClick={e=>{if(e.target===review)review.close();}} aria-labelledby="review-title"><Show when={selected()}>{m => <><div class="rl-review-art" style={{'background-image':`url("${asset(m().map)}")`}}><button class="rl-close rl-icon-button" aria-label="Close match review" onClick={()=>review.close()}><Icon path="M6 6l12 12M18 6 6 18"/></button><span class="rl-review-result" classList={{'is-win':m().win,'is-loss':!m().win}}>{m().win?'Victory':'Defeat'}</span><h2 id="review-title">{m().map}</h2><p>{queue()} · {m().time}{sample()?' · Sample match':''}</p></div><div class="rl-review-body"><div class="rl-review-score"><div><img src={m().icon || asset(m().agent)} alt=""/><div><strong>{m().agent}</strong><small>Your agent</small></div></div><strong>{m().score}</strong></div><div class="rl-review-stats"><Stat label="K / D / A" value={`${m().k} / ${m().d} / ${m().a}`} note="Match totals"/><Stat label="Combat score" value={`${m().acs}`} note="Average per round"/><Stat label="Headshots" value={`${m().hs}%`} note="Of recorded hits"/></div><h3>Impact breakdown</h3><Show when={impactParts(m())} fallback={<p>Impact Rating needs per-match damage, KAST, and opening duel data. This server response doesn’t include those inputs.</p>}>{parts=><><div class="rl-breakdown"><For each={[{name:'Damage',value:parts().damage,weight:'40%',detail:`${m().adr} damage / round`},{name:'Participation',value:parts().participation,weight:'35%',detail:`${m().kast}% KAST`},{name:'Opening duels',value:parts().openings,weight:'25%',detail:`${m().openingWins} of ${m().openingAttempts} won`}]}>{p=><div><div><strong>{p.name}</strong><span>{p.detail}</span></div><div class="rl-meter"><i style={{width:`${p.value}%`}}/></div><b>{fmt(p.value)}</b><small>{p.weight}</small></div>}</For></div><div class="rl-review-total"><span>Impact Rating <small>Experimental · model 0.1</small></span><strong>{fmt(parts().total,1)}<small> / 100</small></strong></div><p class="rl-fineprint">A descriptive score from available match stats. Not a rank, percentile, or Riot rating.</p></>}</Show></div></>}</Show></dialog>
    <dialog ref={methodology} class="rl-dialog rl-method" onClose={()=>setMethod(false)} onClick={e=>{if(e.target===methodology)methodology.close();}} aria-labelledby="method-title"><div class="rl-section-head"><h2 id="method-title">What goes into Impact?</h2><button class="rl-icon-button" aria-label="Close methodology" onClick={()=>methodology.close()}><Icon path="M6 6l12 12M18 6 6 18"/></button></div><p>Impact Rating is an experimental, transparent summary of contribution. Model 0.1 combines three normalized inputs:</p><ul><li><strong>40% damage:</strong> damage per round divided by 200, capped at 100%.</li><li><strong>35% participation:</strong> your KAST percentage.</li><li><strong>25% opening duels:</strong> opening duels won divided by attempted.</li></ul><p>The history score weights each match by rounds played. A match needs all three inputs; missing inputs show an unavailable rating.</p><p class="rl-fineprint">These weights are provisional and aren’t calibrated against ranks or roles. The score does not measure utility value, strategy, or every contribution. It is not a Riot rating.</p></dialog>
  </div>;
};
