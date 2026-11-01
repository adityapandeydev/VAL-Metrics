import { Component, For, Show, createMemo, createSignal } from 'solid-js';
import { Encounter, impactScore, PlayerView } from './model';

export type TrendMetric = 'acs' | 'kd' | 'hs';
const number = (v: number, places=0) => Number.isFinite(v) ? v.toFixed(places) : '—';
export const ScoreDial: Component<{matches:Encounter[]; onExplain:()=>void}> = p => {
  const value = createMemo(()=>impactScore(p.matches));
  return <section class="arena-score arena-surface" aria-labelledby="impact-heading">
    <div class="arena-panel-heading"><h2 id="impact-heading">Impact Rating</h2><button class="arena-info" onClick={p.onExplain} aria-label="How Impact Rating is calculated">?</button></div>
    <div class="arena-dial"><svg viewBox="0 0 210 210" role="img" aria-label={value()==null?'Impact unavailable':`Impact ${number(value()!,1)} out of 100`}>
      <circle class="arena-dial-outer" cx="105" cy="105" r="98"/>
      <circle class="arena-dial-track" cx="105" cy="105" r="85"/>
      <circle class="arena-dial-fill" cx="105" cy="105" r="85" pathLength="100" stroke-dasharray={`${value() || 0} 100`} transform="rotate(-90 105 105)"/>
      <For each={[0,25,50,75]}>{v=><text class="arena-dial-tick" x={v===0?105:v===25?198:v===50?105:12} y={v===0?15:v===50?201:109} text-anchor="middle">{v}</text>}</For>
    </svg><div class="arena-dial-value"><strong>{value()==null?'—':number(value()!,1)}</strong><span>of 100</span><small>Experimental</small></div></div>
    <p class="arena-score-caption">Your contribution across {p.matches.length} matches.</p>
    <div class="arena-score-key"><span>Damage <b>40%</b></span><span>Participation <b>35%</b></span><span>Openings <b>25%</b></span></div>
    <button class="rl-text-button" onClick={p.onExplain}>Explore the formula</button>
  </section>;
};

export const PerformanceGraph: Component<{matches:Encounter[]; onReview:(m:Encounter)=>void}> = p => {
  const [metric,setMetric]=createSignal<TrendMetric>('acs');
  const [active,setActive]=createSignal<string>();
  let chart: SVGSVGElement | undefined;
  const changeMetric=(next:TrendMetric)=>{
    if(next===metric())return;
    setMetric(next);
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches && !document.body.classList.contains('keyboard-input'))
      chart?.animate([{opacity:.65,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'cubic-bezier(.23,1,.32,1)'});
  };
  const chronological=createMemo(()=>p.matches.slice().reverse());
  const value=(m:Encounter)=>metric()==='kd'?m.k/Math.max(1,m.d):m[metric() as 'acs'|'hs'];
  const ceiling=createMemo(()=>metric()==='hs'?100:metric()==='kd'?Math.max(2,Math.ceil(Math.max(0,...p.matches.map(value)))):Math.max(300,Math.ceil(Math.max(0,...p.matches.map(value))/100)*100));
  const point=(m:Encounter,i:number)=>({x:42+i*(550/Math.max(1,chronological().length-1)),y:162-value(m)/ceiling()*132});
  const line=createMemo(()=>chronological().map((m,i)=>`${i?'L':'M'}${point(m,i).x},${point(m,i).y}`).join(' '));
  const selected=createMemo(()=>chronological().find(m=>m.id===active()) || p.matches[0]);
  const label=()=>metric()==='acs'?'Combat score':metric()==='kd'?'K/D ratio':'Headshot rate';
  const average=()=>p.matches.length?p.matches.reduce((sum,m)=>sum+value(m),0)/p.matches.length:0;
  return <section class="arena-trajectory arena-surface"><div class="arena-panel-heading"><div><h2>Performance trajectory</h2><p>Combat, aim and consistency across your history.</p></div><div class="arena-metric-switch" aria-label="Graph metric"><For each={[['acs','Combat'],['kd','K/D'],['hs','Headshots']] as const}>{m=><button classList={{'is-active':metric()===m[0]}} aria-pressed={metric()===m[0]} onClick={()=>changeMetric(m[0])}>{m[1]}</button>}</For></div></div>
    <Show when={p.matches.length>=2} fallback={<div class="arena-graph-empty"><p>Two matches are needed to show a trajectory.</p></div>}>
      <div class="arena-graph-summary"><strong>{number(average(),metric()==='kd'?2:1)}<small>{metric()==='hs'?'%':''}</small></strong><span>Mean match {label().toLowerCase()}<small>Oldest to newest</small></span><Show when={selected()}>{m=><button class="arena-selected-match" onClick={()=>p.onReview(m())}><span>{m().map}</span><strong>{number(value(m()),metric()==='kd'?2:0)}{metric()==='hs'?'%':''}</strong><small>{m().win?'Win':'Loss'} / {m().score}</small></button>}</Show></div>
      <div class="arena-chart-wrap"><div class="arena-y-axis" aria-hidden="true"><For each={[0,1,2,3]}>{i=><span>{number(ceiling()*(1-i/3),metric()==='kd'?1:0)}</span>}</For></div><div class="arena-chart-canvas"><svg ref={chart} class="arena-line-chart" viewBox="0 0 630 196" preserveAspectRatio="none" role="img" aria-label={`${label()} across ${p.matches.length} matches, oldest to newest. Select a match below for full values.`}>
        <For each={[0,1,2,3]}>{i=><g><line class="arena-chart-grid" x1="42" x2="592" y1={30+i*44} y2={30+i*44}/></g>}</For>
        <path class="arena-chart-area" d={`${line()} L592,162 L42,162 Z`}/><path class="arena-chart-line" d={line()}/>

      </svg><For each={chronological()}>{(m,i)=><span aria-hidden="true" class="arena-chart-dot" classList={{'is-selected':selected()?.id===m.id}} style={{left:`${point(m,i()).x/630*100}%`,top:`${point(m,i()).y/196*100}%`}}/>}</For></div></div>
      <div class="arena-graph-matches" aria-label="Explore graph matches"><For each={chronological()}>{(m,i)=><button classList={{'is-selected':selected()?.id===m.id,'is-loss':!m.win}} onFocus={()=>setActive(m.id)} onPointerEnter={()=>setActive(m.id)} onClick={()=>p.onReview(m)} aria-label={`Review match ${i()+1}, ${m.map}, ${m.win?'win':'loss'}, ${label()} ${number(value(m),1)}`}><span>{m.win?'W':'L'}</span><small>{i()+1}</small></button>}</For></div>
      <p class="arena-chart-note">Hover or focus a result to inspect. Select it to review the match.</p>
    </Show>
  </section>;
};

export const AccuracyDiagram: Component<{player:PlayerView}> = p => {
  const d=()=>p.player.details;
  return <section class="arena-accuracy arena-surface"><div class="arena-panel-heading"><h2>Precision profile</h2><span>{d()?.totalHits || 0} hits</span></div><Show when={d()?.totalHits} fallback={<p>Hit locations are unavailable for this profile.</p>}>
    <div class="arena-precision-body"><svg viewBox="0 0 110 180" role="img" aria-label={`Head ${number(d()!.headshotPercent,1)} percent, body ${number(d()!.bodyshotPercent,1)} percent, legs ${number(d()!.legshotPercent,1)} percent`}>
      <circle class="arena-target-ring" cx="55" cy="24" r="21"/><circle class="arena-target-head" cx="55" cy="24" r="12"/>
      <path class="arena-target-body" d="M34 46h42l13 49-10 4-11-29v41H42V70L31 99l-10-4z"/>
      <path class="arena-target-legs" d="M42 116h11v52H39zm15 0h11l3 52H57z"/>
      <path class="arena-target-guide" d="M77 24h28M83 78h22M74 145h31"/>
    </svg><div class="arena-precision-values"><For each={[
      {name:'Head',value:d()?.headshotPercent,hits:d()?.headshots,kind:'head'},
      {name:'Body',value:d()?.bodyshotPercent,hits:d()?.bodyshots,kind:'body'},
      {name:'Legs',value:d()?.legshotPercent,hits:d()?.legshots,kind:'legs'},
    ]}>{r=><div class={`arena-precision-row ${r.kind}`}><span>{r.name}<small>{r.hits} hits</small></span><strong>{number(r.value || 0,1)}<small>%</small></strong></div>}</For></div></div>
    <div class="arena-shot-bar" aria-label="Hit distribution"><i class="head" style={{width:`${d()!.headshotPercent}%`}}/><i class="body" style={{width:`${d()!.bodyshotPercent}%`}}/><i class="legs" style={{width:`${d()!.legshotPercent}%`}}/></div>
  </Show></section>;
};

export const RecentAgents: Component<{player:PlayerView;onAgents:()=>void}> = p => <section class="arena-picks arena-surface"><div class="arena-panel-heading"><h2>Agent rotation</h2><button class="rl-text-button" onClick={p.onAgents}>All agents</button></div><For each={p.player.agents.slice().sort((a,b)=>b.matches-a.matches).slice(0,3)}>{a=><div class="arena-pick"><img src={`/tracker/${['Omen','Sova','Cypher'].includes(a.name)?a.name.toLowerCase()+'.png':'unknown.svg'}`} alt="" onError={e => {e.currentTarget.src='/tracker/unknown.svg';}}/><div><strong>{a.name}</strong><span>{a.matches} matches</span></div><div><strong>{number(a.winRate)}%</strong><span>Win rate</span></div><div class="arena-agent-meter"><i style={{transform:`scaleX(${Math.min(1,a.winRate/100)})`}}/></div></div>}</For></section>;
