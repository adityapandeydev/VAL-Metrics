import { Component, JSX, Show, createSignal, splitProps } from 'solid-js';
import { useInView, CountUp, useScaled } from './motion';
import { FALLBACK, agentIcon, rankHue, rankIcon, rankName } from './data/assets';

/* ───────────── Shared Tailwind class recipes ───────────── */
export const tw = {
  kicker: 'block font-display text-[10.5px] leading-tight font-semibold tracking-[.16em] uppercase text-muted',
  label: 'block font-display text-[10.5px] font-semibold tracking-[.14em] uppercase text-muted',
  h2: 'mt-[3px] font-display text-base font-bold uppercase tracking-[.04em]',
  h3: 'font-display text-[13px] font-bold uppercase tracking-[.1em] text-ink-2',
  num: 'font-display font-bold tabular-nums',
  well: 'rounded-lg border border-line bg-bg/35',
  btn: 'relative inline-flex items-center gap-2 overflow-hidden rounded-md px-4 py-2.5 font-display text-[12.5px] font-semibold uppercase tracking-[.08em] transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 active:scale-[.97]',
  primary: 'bg-accent text-white shadow-[0_10px_26px_-10px_rgb(255_70_85/.8)]',
  ghost: 'border border-line-2 text-ink-2 hover:border-ink-2 hover:text-ink',
  chip: 'inline-flex items-center gap-1.5 rounded-full border border-line-2 px-2.5 py-1 font-display text-[11px] font-semibold uppercase tracking-[.06em] text-ink-2 transition duration-200 hover:-translate-y-px hover:border-accent hover:text-ink',
  chipOn: 'border-[var(--role,var(--color-accent))] bg-[color-mix(in_srgb,var(--role,var(--color-accent))_22%,transparent)] text-ink',
  select: 'inline-flex items-center gap-2 font-display text-[11px] font-semibold uppercase tracking-[.08em] text-muted [&_select]:rounded-md [&_select]:border [&_select]:border-line-2 [&_select]:bg-surface-2 [&_select]:px-2.5 [&_select]:py-1.5 [&_select]:font-body [&_select]:text-[13px] [&_select]:font-medium [&_select]:normal-case [&_select]:tracking-normal [&_select]:text-ink',
  segWrap: 'relative inline-flex flex-wrap rounded-lg border border-line bg-bg/60 p-[3px]',
  seg: 'rounded-md px-3.5 py-2 font-display text-xs font-semibold uppercase tracking-[.06em] text-ink-2 transition-colors duration-200 hover:text-ink active:scale-[.96]',
  segSm: 'rounded-md px-2.5 py-1.5 font-display text-[11px] font-semibold uppercase tracking-[.06em] text-ink-2 transition-colors duration-200 hover:text-ink',
  segOn: 'bg-linear-135 from-accent to-[#d63445] text-white! shadow-[0_6px_18px_-6px_rgb(255_70_85/.7)]',
  iconBtn: 'grid size-9 place-items-center rounded-full border border-line-2 bg-bg/60 transition-transform duration-300 ease-spring hover:rotate-90 hover:border-accent',
  table: 'w-full border-collapse text-[13px] [&_td]:border-b [&_td]:border-line [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-left [&_td]:whitespace-nowrap [&_th]:border-b [&_th]:border-line [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:whitespace-nowrap [&_tbody_th]:font-semibold [&_thead_th]:bg-bg/35 [&_thead_th]:font-display [&_thead_th]:text-[10.5px] [&_thead_th]:font-semibold [&_thead_th]:uppercase [&_thead_th]:tracking-[.12em] [&_thead_th]:text-muted',
  rrChip: 'min-w-[46px] justify-self-end rounded-md bg-surface-3 px-2 py-1 text-center font-display text-[13px] font-bold text-ink-2',
  rrUp: 'bg-win/10 text-win',
  rrDown: 'bg-loss/10 text-loss',
  up: 'text-win',
  down: 'text-loss',
};
export const rrTone = (v?: number) => (v == null ? 'text-muted' : v > 0 ? tw.rrUp : v < 0 ? tw.rrDown : '');
export const tone = (v: number) => (v > 0 ? tw.up : v < 0 ? tw.down : '');

/* ───────────── Card: reveals on scroll, cursor spotlight, corner notch ───────────── */
const cardBase = 'card fx-reveal relative min-w-0 overflow-hidden rounded-[10px] border border-line bg-linear-to-b from-surface-2/92 to-surface/92 transition-[border-color,box-shadow] duration-300 hover:border-line-2 hover:shadow-[0_24px_50px_-30px_rgb(0_0_0/.9)] '
  + 'after:pointer-events-none after:absolute after:top-0 after:left-0 after:size-3.5 after:rounded-tl-[10px] after:border-t-2 after:border-l-2 after:border-accent after:opacity-0 after:transition-opacity after:delay-500 [&.in]:after:opacity-90';

export const Card: Component<JSX.HTMLAttributes<HTMLElement> & { as?: 'section' | 'article' | 'div'; i?: number; flush?: boolean }> = props => {
  const [p, rest] = splitProps(props, ['as', 'i', 'class', 'children', 'flush', 'style']);
  // `in` is part of the rendered class string (driven by a signal), so Solid never overwrites it.
  const [seen, ref] = useInView();
  const cls = () => `${cardBase} ${p.flush ? '' : 'p-5'} ${p.class || ''}${seen() ? ' in' : ''}`;
  const style = () => ({ '--d': `${(p.i ?? 0) * 70}ms`, ...(typeof p.style === 'object' ? p.style : {}) });
  return p.as === 'article'
    ? <article ref={ref} class={cls()} style={style()} {...(rest as any)}><span class="fx-spot" aria-hidden="true" />{p.children}</article>
    : p.as === 'div'
      ? <div ref={ref} class={cls()} style={style()} {...(rest as any)}><span class="fx-spot" aria-hidden="true" />{p.children}</div>
      : <section ref={ref} class={cls()} style={style()} {...(rest as any)}><span class="fx-spot" aria-hidden="true" />{p.children}</section>;
};

export const Head: Component<{ title: string; kicker?: string; children?: JSX.Element }> = p =>
  <header class="mb-4 flex flex-wrap items-start justify-between gap-3">
    <div><Show when={p.kicker}><span class={tw.kicker}>{p.kicker}</span></Show><h2 class={tw.h2}>{p.title}</h2></div>
    <Show when={p.children}><div class="flex flex-wrap items-center gap-2">{p.children}</div></Show>
  </header>;

export const Stat: Component<{ label: string; value: number | null | undefined; digits?: number; suffix?: string; note?: string; signed?: boolean; i?: number; tone?: 'up' | 'down' | 'accent' }> = p =>
  <div class={`fx-rise ${tw.well} px-3.5 py-3 transition duration-200 ease-out-expo hover:-translate-y-[3px] hover:border-line-2 hover:bg-bg/55`} style={{ '--i': p.i ?? 0 }}>
    <span class={tw.label}>{p.label}</span>
    <strong class="mt-1 block font-display text-2xl leading-[1.15] font-bold" classList={{ 'text-win': p.tone === 'up', 'text-loss': p.tone === 'down', 'text-accent': p.tone === 'accent' }}>
      <CountUp value={p.value} digits={p.digits} suffix={p.suffix} signed={p.signed} delay={(p.i ?? 0) * 45} />
    </strong>
    <Show when={p.note}><small class="mt-0.5 block text-[11.5px] text-muted">{p.note}</small></Show>
  </div>;

/** Image with fallback. `scale` = max width to keep in memory (large art is downscaled once, see motion.tsx). */
export const Img: Component<{ src: string; alt?: string; class?: string; loading?: 'lazy' | 'eager'; scale?: number }> = p => {
  const scaled = p.scale ? useScaled(() => p.src, p.scale) : () => p.src;
  return <img class={p.class} src={scaled() || undefined} alt={p.alt ?? ''} loading={p.loading ?? 'lazy'} decoding="async"
    style={p.scale && !scaled() ? { visibility: 'hidden' } : undefined}
    onError={e => { if (!e.currentTarget.src.endsWith(FALLBACK)) e.currentTarget.src = FALLBACK; }} />;
};

export const AgentIcon: Component<{ name: string; size?: number; class?: string }> = p =>
  <span class={`inline-block flex-none overflow-hidden rounded-lg border border-line bg-surface-3 ${p.class || ''}`} style={{ width: `${p.size ?? 40}px`, height: `${p.size ?? 40}px` }}>
    <Img class="size-full object-cover" src={agentIcon(p.name)} alt={p.name} scale={128} />
  </span>;

export const RankBadge: Component<{ tier: number; size?: number; withName?: boolean }> = p => {
  const [failed, setFailed] = createSignal(false);
  const s = () => p.size ?? 36;
  return <span class="inline-flex items-center gap-2" style={{ '--rank': rankHue(p.tier), width: p.withName ? undefined : `${s()}px` }}>
    <Show when={p.tier >= 3} fallback={<span class="grid place-items-center rounded-full border border-dashed border-line-2 text-muted" style={{ width: `${s()}px`, height: `${s()}px` }}>—</span>}>
      <Show when={!failed()} fallback={<svg width={s()} height={s()} viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2 37 20 20 38 3 20z" fill="none" stroke="var(--rank)" stroke-width="2.5" /><path d="m20 11 8 9-8 9-8-9z" fill="var(--rank)" /></svg>}>
        <img class="drop-shadow-[0_0_10px_color-mix(in_srgb,var(--rank)_45%,transparent)]" src={rankIcon(p.tier)} alt="" width={s()} height={s()} loading="lazy" onError={() => setFailed(true)} />
      </Show>
    </Show>
    <Show when={p.withName}><b class="font-display text-[13px] font-semibold">{rankName(p.tier)}</b></Show>
  </span>;
};

export const Result: Component<{ won: boolean; draw?: boolean; short?: boolean }> = p =>
  <span class="inline-block rounded px-2 py-[3px] font-display text-[10.5px] font-bold uppercase tracking-[.14em]"
    classList={{ 'bg-win/12 text-win': p.won, 'bg-loss/12 text-loss': !p.won && !p.draw, 'bg-surface-3 text-ink-2': p.draw }}>
    {p.draw ? (p.short ? 'D' : 'Draw') : p.won ? (p.short ? 'W' : 'Victory') : (p.short ? 'L' : 'Defeat')}
  </span>;

export const Empty: Component<{ title: string; text: string; children?: JSX.Element }> = p =>
  <div class="grid justify-items-center gap-2 px-4 py-8 text-center text-muted">
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 2 22 12 12 22 2 12z" /><path d="M12 8v5M12 16h.01" /></svg>
    <h3 class="font-display text-[15px] font-semibold text-ink">{p.title}</h3><p class="max-w-[420px] text-[13px]">{p.text}</p>{p.children}
  </div>;

export const Icon: Component<{ d: string; size?: number; class?: string }> = p =>
  <svg class={`flex-none ${p.class || ''}`} width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={p.d} /></svg>;

export const Swatch: Component<{ color: string; class?: string }> = p =>
  <span class={`inline-block size-2.5 flex-none rounded-[3px] ${p.class || ''}`} style={{ background: p.color }} />;

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
