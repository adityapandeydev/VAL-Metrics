import { Component, JSX, Show, createSignal, splitProps } from 'solid-js';
import { reveal, CountUp } from './motion';
import { FALLBACK, agentIcon, rankHue, rankIcon, rankName } from './data/assets';

export const Card: Component<JSX.HTMLAttributes<HTMLElement> & { as?: 'section' | 'article' | 'div'; i?: number; flush?: boolean }> = props => {
  const [p, rest] = splitProps(props, ['as', 'i', 'class', 'children', 'flush', 'style']);
  const style = () => ({ '--d': `${(p.i ?? 0) * 70}ms`, ...(typeof p.style === 'object' ? p.style : {}) });
  return p.as === 'article'
    ? <article ref={reveal} class={`card rv ${p.flush ? 'flush' : ''} ${p.class || ''}`} style={style()} {...(rest as any)}>{p.children}</article>
    : p.as === 'div'
      ? <div ref={reveal} class={`card rv ${p.flush ? 'flush' : ''} ${p.class || ''}`} style={style()} {...(rest as any)}>{p.children}</div>
      : <section ref={reveal} class={`card rv ${p.flush ? 'flush' : ''} ${p.class || ''}`} style={style()} {...(rest as any)}>{p.children}</section>;
};

export const Head: Component<{ title: string; kicker?: string; children?: JSX.Element }> = p =>
  <header class="head"><div><Show when={p.kicker}><span class="kicker">{p.kicker}</span></Show><h2>{p.title}</h2></div><Show when={p.children}><div class="head-aside">{p.children}</div></Show></header>;

export const Stat: Component<{ label: string; value: number | null | undefined; digits?: number; suffix?: string; note?: string; signed?: boolean; i?: number; tone?: 'up' | 'down' | 'accent' }> = p =>
  <div class="stat" style={{ '--i': p.i ?? 0 }}>
    <span class="stat-label">{p.label}</span>
    <strong class={`stat-value ${p.tone || ''}`}><CountUp value={p.value} digits={p.digits} suffix={p.suffix} signed={p.signed} delay={(p.i ?? 0) * 45} /></strong>
    <Show when={p.note}><small class="stat-note">{p.note}</small></Show>
  </div>;

export const Img: Component<{ src: string; alt?: string; class?: string; loading?: 'lazy' | 'eager' }> = p =>
  <img class={p.class} src={p.src} alt={p.alt ?? ''} loading={p.loading ?? 'lazy'} decoding="async"
    onError={e => { if (!e.currentTarget.src.endsWith(FALLBACK)) e.currentTarget.src = FALLBACK; }} />;

export const AgentIcon: Component<{ name: string; size?: number; class?: string }> = p =>
  <span class={`agent-icon ${p.class || ''}`} style={{ width: `${p.size ?? 40}px`, height: `${p.size ?? 40}px` }}><Img src={agentIcon(p.name)} alt={p.name} /></span>;

export const RankBadge: Component<{ tier: number; size?: number; withName?: boolean }> = p => {
  const [failed, setFailed] = createSignal(false);
  return <span class="rank-badge" style={{ '--rank': rankHue(p.tier), width: p.withName ? undefined : `${p.size ?? 36}px` }}>
    <Show when={p.tier >= 3} fallback={<span class="rank-unrated" style={{ width: `${p.size ?? 36}px`, height: `${p.size ?? 36}px` }}>—</span>}>
      <Show when={!failed()} fallback={<svg width={p.size ?? 36} height={p.size ?? 36} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 37 20 20 38 3 20z" fill="none" stroke="var(--rank)" stroke-width="2.5" /><path d="m20 11 8 9-8 9-8-9z" fill="var(--rank)" /></svg>}>
        <img src={rankIcon(p.tier)} alt="" width={p.size ?? 36} height={p.size ?? 36} loading="lazy" onError={() => setFailed(true)} />
      </Show>
    </Show>
    <Show when={p.withName}><b>{rankName(p.tier)}</b></Show>
  </span>;
};

export const Result: Component<{ won: boolean; draw?: boolean; short?: boolean }> = p =>
  <span class="result" classList={{ win: p.won, loss: !p.won && !p.draw, draw: p.draw }}>{p.draw ? (p.short ? 'D' : 'Draw') : p.won ? (p.short ? 'W' : 'Victory') : (p.short ? 'L' : 'Defeat')}</span>;

export const Empty: Component<{ title: string; text: string; children?: JSX.Element }> = p =>
  <div class="empty"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 2 22 12 12 22 2 12z" /><path d="M12 8v5M12 16h.01" /></svg><h3>{p.title}</h3><p>{p.text}</p>{p.children}</div>;

export const Icon: Component<{ d: string; size?: number }> = p =>
  <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={p.d} /></svg>;

export const ICONS = {
  overview: 'M3 13h8V3H3zM13 21h8V11h-8zM3 21h8v-6H3zM13 3v6h8V3z',
  matches: 'M4 6h16M4 12h16M4 18h10',
  performance: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  agents: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  maps: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  weapons: 'M3 10h12l3-3h3v5h-4l-2 2h-3l-1 5H8l1-5H3z',
  seasons: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3',
  data: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  search: 'M21 21l-4.3-4.3M18 11a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
  close: 'M6 6l12 12M18 6 6 18',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  sync: 'M20 7v5h-5M4 17v-5h5M6.3 7.5A7 7 0 0 1 19 11M4.9 13a7 7 0 0 0 12.8 3.5',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-5M12 8h.01',
  spike: 'M12 2l3 6-3 14-3-14z',
  skull: 'M12 3a8 8 0 0 0-8 8c0 3 1.5 4.5 3 5.5V20h10v-3.5c1.5-1 3-2.5 3-5.5a8 8 0 0 0-8-8zM9 12h.01M15 12h.01',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  shield: 'M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
};
