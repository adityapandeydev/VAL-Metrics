import { Component, For, JSX, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { useInView } from './motion';
import { fmt } from './data/stats';

const center = 'relative grid justify-items-center text-center leading-[1.1] [&_b]:font-display [&_b]:text-[19px] [&_b]:font-bold [&_small]:text-[10.5px] [&_small]:text-muted';

/* ───────────── Ring: a circle that fills to value/max ───────────── */
export const Ring: Component<{ value: number | null; max?: number; size?: number; stroke?: number; color?: string; label?: string; children?: JSX.Element; delay?: number; glow?: boolean }> = p => {
  const size = () => p.size ?? 120, stroke = () => p.stroke ?? 9;
  const r = () => (size() - stroke()) / 2;
  const len = () => 2 * Math.PI * r();
  const frac = () => (p.value == null || !Number.isFinite(p.value) ? 0 : Math.max(0, Math.min(1, p.value / (p.max ?? 100))));
  const [seen, ref] = useInView(0.2);
  return <div ref={ref} class="relative grid flex-none place-items-center" classList={{ in: seen() }} style={{ width: `${size()}px`, height: `${size()}px` }} role="img" aria-label={p.label}>
    <svg class="absolute inset-0 overflow-visible" viewBox={`0 0 ${size()} ${size()}`} width={size()} height={size()}>
      <circle class="fill-none stroke-ink/7" cx={size() / 2} cy={size() / 2} r={r()} stroke-width={stroke()} />
      <circle class="fx-stroke fill-none" classList={{ 'drop-shadow-[0_0_6px_var(--rank-c)]': p.glow }} cx={size() / 2} cy={size() / 2} r={r()} stroke-width={stroke()} stroke-linecap="round"
        style={{ stroke: p.color || 'var(--color-accent)', 'stroke-dasharray': `${len()}`, '--len': `${len()}`, '--off': `${len() * (1 - frac())}`, '--delay': `${p.delay ?? 0}ms` }}
        transform={`rotate(-90 ${size() / 2} ${size() / 2})`} />
    </svg>
    <div class={center}>{p.children}</div>
  </div>;
};

/* ───────────── Gauge: 270° arc with ticks, for the headline rating ───────────── */
export const Gauge: Component<{ value: number | null; size?: number; children?: JSX.Element; label: string }> = p => {
  const size = () => p.size ?? 230, stroke = 14, r = () => (size() - stroke) / 2 - 10;
  const arc = () => 2 * Math.PI * r() * 0.75;
  const full = () => 2 * Math.PI * r();
  const frac = () => (p.value == null ? 0 : Math.max(0, Math.min(1, p.value / 100)));
  const [seen, ref] = useInView(0.2);
  const c = () => size() / 2;
  return <div ref={ref} class="relative grid flex-none place-items-center" classList={{ in: seen() }} style={{ width: `${size()}px`, height: `${size()}px` }} role="img" aria-label={p.label}>
    <svg class="absolute inset-0 overflow-visible" viewBox={`0 0 ${size()} ${size()}`}>
      <defs>
        <linearGradient id="gauge-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="var(--color-accent)" /><stop offset="100%" stop-color="var(--color-accent-2)" />
        </linearGradient>
      </defs>
      <g transform={`rotate(135 ${c()} ${c()})`}>
        <circle class="fill-none stroke-ink/7" cx={c()} cy={c()} r={r()} stroke-width={stroke} stroke-linecap="round" style={{ 'stroke-dasharray': `${arc()} ${full()}` }} />
        <circle class="fx-stroke fill-none drop-shadow-[0_0_10px_rgb(255_70_85/.45)]" cx={c()} cy={c()} r={r()} stroke-width={stroke} stroke-linecap="round" stroke="url(#gauge-grad)"
          style={{ 'stroke-dasharray': `${arc()} ${full()}`, '--len': `${arc()}`, '--off': `${arc() * (1 - frac())}`, '--delay': '200ms' }} />
      </g>
      <For each={Array.from({ length: 28 })}>{(_, i) => {
        const a = (135 + (270 / 27) * i()) * Math.PI / 180;
        const r1 = r() + 12, r2 = r() + (i() % 9 === 0 ? 19 : 15);
        return <line class="fx-tick stroke-ink/12" classList={{ lit: i() / 27 <= frac() }} stroke-width="2" stroke-linecap="round" style={{ '--i': i() }}
          x1={c() + Math.cos(a) * r1} y1={c() + Math.sin(a) * r1} x2={c() + Math.cos(a) * r2} y2={c() + Math.sin(a) * r2} />;
      }}</For>
    </svg>
    <div class="grid justify-items-center gap-0.5">{p.children}</div>
  </div>;
};

/* ───────────── Meter: horizontal bar that grows ───────────── */
export const Meter: Component<{ value: number; max?: number; color?: string; i?: number; thin?: boolean; label?: string }> = p => {
  const frac = () => (Number.isFinite(p.value) ? Math.max(0, Math.min(1, p.value / (p.max ?? 100))) : 0);
  return <div class="relative min-w-10 flex-1 overflow-hidden rounded-full bg-ink/6" classList={{ 'h-1': p.thin, 'h-2': !p.thin }} role={p.label ? 'img' : undefined} aria-label={p.label}>
    <i class="fx-scale-x absolute inset-0 rounded-full bg-linear-to-r from-accent to-accent-2" style={{ '--v': frac(), '--i': p.i ?? 0, background: p.color }} />
  </div>;
};

/* ───────────── Split bar: head / body / legs etc. ───────────── */
export const SplitBar: Component<{ parts: { value: number; color: string; label: string }[] }> = p => {
  const total = () => p.parts.reduce((n, x) => n + (Number.isFinite(x.value) ? x.value : 0), 0) || 1;
  return <div class="mt-1 flex h-2.5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={p.parts.map(x => `${x.label} ${fmt(x.value, 1)}%`).join(', ')}>
    <For each={p.parts}>{(x, i) => <i class="fx-grow-x first:rounded-l-full last:rounded-r-full" title={`${x.label} ${fmt(x.value, 1)}%`} style={{ flex: `0 0 ${(x.value / total()) * 100}%`, background: x.color, '--i': i() }} />}</For>
  </div>;
};

/* ───────────── Responsive width helper ───────────── */
function useWidth(fallback = 600) {
  const [w, setW] = createSignal(fallback);
  const ref = (el: HTMLElement) => {
    onMount(() => {
      // The observer reports the size itself (first callback fires on observe), so no forced layout.
      const ro = new ResizeObserver(([e]) => { const cw = Math.round(e.contentRect.width); if (cw) setW(cw); });
      ro.observe(el);
      onCleanup(() => ro.disconnect());
    });
  };
  return [w, ref] as const;
}

/* ───────────── Line chart: draws itself in, crosshair + tooltip ───────────── */
export interface LinePoint { y: number; label: string; sub?: string; tone?: 'win' | 'loss' | 'neutral'; id?: string }
export const LineChart: Component<{
  points: LinePoint[]; height?: number; format?: (v: number) => string; color?: string;
  baseline?: number; min?: number; max?: number; bands?: { at: number; label: string }[]; onPick?: (i: number) => void; label: string;
  hideAxis?: boolean; tipValue?: (i: number) => string;
}> = p => {
  const [width, wref] = useWidth();
  const [seen, ref] = useInView(0.2);
  const [hover, setHover] = createSignal<number | null>(null);
  // Props are getters in Solid; memoise so the points array isn't rebuilt on every read.
  const pts = createMemo(() => p.points);
  const H = () => p.height ?? 220;
  const pad = { l: p.hideAxis ? 8 : 44, r: 14, t: 16, b: 26 };
  const ys = () => pts().map(x => x.y).filter(Number.isFinite);
  const lo = () => p.min ?? Math.floor(Math.min(...ys(), p.baseline ?? Infinity) * 0.92);
  const hi = () => p.max ?? Math.ceil(Math.max(...ys(), p.baseline ?? -Infinity) * 1.06);
  const x = (i: number) => pad.l + (i * (width() - pad.l - pad.r)) / Math.max(1, pts().length - 1);
  const y = (v: number) => pad.t + (1 - (v - lo()) / Math.max(1e-6, hi() - lo())) * (H() - pad.t - pad.b);
  const path = createMemo(() => pts().map((pt, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(pt.y).toFixed(1)}`).join(' '));
  const area = () => `${path()} L${x(pts().length - 1)},${H() - pad.b} L${x(0)},${H() - pad.b} Z`;
  const ticks = () => [0, 1, 2, 3].map(i => lo() + ((hi() - lo()) * i) / 3);
  const f = (v: number) => (p.format ? p.format(v) : fmt(v));
  const onMove = (e: PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const i = Math.round(((e.clientX - rect.left - pad.l) / (width() - pad.l - pad.r)) * (pts().length - 1));
    setHover(Math.max(0, Math.min(pts().length - 1, i)));
  };
  const key = createMemo(() => path().length + ':' + pts().length + ':' + pts().map(q => q.y).join(','));
  const gid = `lg-${Math.random().toString(36).slice(2, 8)}`;
  const stroke = () => p.color || 'var(--color-accent)';
  return <div ref={el => { wref(el); ref(el); }} class="relative select-none" classList={{ in: seen(), 'cursor-pointer': !!p.onPick }} style={{ height: `${H()}px` }}
    onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={() => hover() != null && p.onPick?.(hover()!)}
    role="img" aria-label={p.label}>
    <svg class="block overflow-visible" width={width()} height={H()}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color={stroke()} stop-opacity=".32" /><stop offset="100%" stop-color={stroke()} stop-opacity="0" />
      </linearGradient></defs>
      <For each={ticks()}>{t => <g>
        <line class="stroke-line" x1={pad.l} x2={width() - pad.r} y1={y(t)} y2={y(t)} />
        <Show when={!p.hideAxis}><text class="fill-muted font-display text-[10.5px] font-medium" x={pad.l - 8} y={y(t) + 4} text-anchor="end">{f(t)}</text></Show>
      </g>}</For>
      <For each={p.bands || []}>{b => <Show when={b.at > lo() && b.at < hi()}><g>
        <line class="stroke-accent-2/18 [stroke-dasharray:2_4]" x1={pad.l} x2={width() - pad.r} y1={y(b.at)} y2={y(b.at)} />
        <text class="fill-accent-2/70 stroke-bg font-display text-[9.5px] font-semibold uppercase tracking-[.1em] [paint-order:stroke] [stroke-width:4px] [stroke-linejoin:round]" x={pad.l + 4} y={y(b.at) - 5} text-anchor="start">{b.label}</text>
      </g></Show>}</For>
      <Show when={p.baseline != null && Number.isFinite(p.baseline)}>
        <line class="stroke-ink-2 opacity-45 [stroke-dasharray:5_5]" x1={pad.l} x2={width() - pad.r} y1={y(p.baseline!)} y2={y(p.baseline!)} />
      </Show>
      <Show when={key()} keyed>{_k => <>
        <path class="fx-fade-late opacity-0" d={area()} fill={`url(#${gid})`} />
        <path class="fx-draw fill-none drop-shadow-[0_4px_10px_rgb(255_70_85/.35)]" d={path()} pathLength="1" stroke-width="2.25" stroke-linejoin="round" stroke-linecap="round" style={{ stroke: stroke() }} />
        <For each={pts()}>{(pt, i) => <circle class="fx-pop fill-surface stroke-2"
          classList={{ 'stroke-win': pt.tone === 'win', 'stroke-loss': pt.tone === 'loss', 'stroke-ink-2': !pt.tone || pt.tone === 'neutral' }}
          cx={x(i())} cy={y(pt.y)} r="4" style={{ '--i': i(), '--step': `${1600 / Math.max(1, pts().length)}ms`, '--base': '300ms' }} />}</For>
      </>}</Show>
      <Show when={hover() != null}>
        <line class="stroke-line-2 [stroke-dasharray:3_3]" x1={x(hover()!)} x2={x(hover()!)} y1={pad.t} y2={H() - pad.b} />
        <circle class="fill-none stroke-ink stroke-2" cx={x(hover()!)} cy={y(pts()[hover()!].y)} r="7" />
      </Show>
    </svg>
    <Show when={hover() != null}>
      <div class="pointer-events-none absolute z-3 grid min-w-[140px] animate-rise gap-px rounded-lg border border-line-2 bg-bg/95 px-2.5 py-2 shadow-[0_12px_30px_-10px_#000] [animation-duration:.18s]"
        style={{ left: `${Math.min(width() - 150, Math.max(0, x(hover()!) - 70))}px`, top: `${Math.max(0, y(pts()[hover()!].y) - 74)}px` }}>
        <strong class="font-display text-[17px] font-bold">{p.tipValue ? p.tipValue(hover()!) : f(pts()[hover()!].y)}</strong>
        <span class="text-xs">{pts()[hover()!].label}</span><small class="text-[11px] text-muted">{pts()[hover()!].sub}</small>
      </div>
    </Show>
  </div>;
};

/* ───────────── Column chart: bars that rise, per-bar tooltip ───────────── */
export const Columns: Component<{ items: { value: number; label: string; sub?: string; tone?: string }[]; height?: number; format?: (v: number) => string; max?: number; onPick?: (i: number) => void; avg?: number; label: string }> = p => {
  const [seen, ref] = useInView(0.2);
  const max = () => p.max ?? Math.max(1, ...p.items.map(i => i.value)) * 1.08;
  const f = (v: number) => (p.format ? p.format(v) : fmt(v));
  return <div ref={ref} class="relative flex items-end gap-1 border-b border-line-2 pt-2.5" classList={{ in: seen() }} style={{ height: `${p.height ?? 200}px` }} role="img" aria-label={p.label}>
    <Show when={p.avg != null}>
      <div class="pointer-events-none absolute inset-x-0 z-1 border-t border-dashed border-ink/40" style={{ bottom: `${(p.avg! / max()) * 100}%` }}>
        <span class="absolute right-0 -top-[18px] font-display text-[10px] font-semibold uppercase tracking-[.1em] text-ink-2">avg {f(p.avg!)}</span>
      </div>
    </Show>
    <For each={p.items}>{(it, i) => <button type="button" class="group relative flex h-full flex-1 items-end" style={{ '--h': `${(Math.max(0, it.value) / max()) * 100}%`, '--i': i() }} onClick={() => p.onPick?.(i())} tabindex={p.onPick ? 0 : -1}>
      <i class="fx-grow-y h-(--h) w-full rounded-t bg-linear-to-b group-hover:brightness-135 group-focus-visible:brightness-135"
        classList={{ 'from-win to-win/25': it.tone === 'win', 'from-loss to-loss/25': it.tone === 'loss', 'from-ink-2 to-ink-2/35': it.tone !== 'win' && it.tone !== 'loss' }} />
      <span class="pointer-events-none absolute left-1/2 z-2 grid -translate-x-1/2 translate-y-1.5 rounded-md border border-line-2 bg-bg/95 px-2 py-1.5 text-[11.5px] whitespace-nowrap opacity-0 transition duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        style={{ bottom: 'calc(var(--h) + 8px)' }}>
        <b class="font-display text-[15px] font-bold">{f(it.value)}</b>{it.label}<small class="text-muted">{it.sub}</small>
      </span>
    </button>}</For>
  </div>;
};

/* ───────────── Radar: normalized profile polygon that blooms ───────────── */
export const Radar: Component<{ axes: { label: string; value: number; display: string }[]; size?: number }> = p => {
  const [seen, ref] = useInView(0.25);
  const S = () => p.size ?? 300, c = () => S() / 2, R = () => S() / 2 - 46;
  const pt = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / p.axes.length;
    return [c() + Math.cos(a) * R() * v, c() + Math.sin(a) * R() * v] as const;
  };
  const poly = () => p.axes.map((ax, i) => pt(i, Math.max(0.04, Math.min(1, ax.value / 100))).join(',')).join(' ');
  return <div ref={ref} class="grid place-items-center" classList={{ in: seen() }}>
    <svg class="w-full max-w-[340px] overflow-visible" viewBox={`0 0 ${S()} ${S()}`} role="img" aria-label={p.axes.map(a => `${a.label} ${a.display}`).join(', ')}>
      <For each={[0.25, 0.5, 0.75, 1]}>{lv => <polygon class="fill-none stroke-line" points={p.axes.map((_, i) => pt(i, lv).join(',')).join(' ')} />}</For>
      <For each={p.axes}>{(_, i) => <line class="stroke-line" x1={c()} y1={c()} x2={pt(i(), 1)[0]} y2={pt(i(), 1)[1]} />}</For>
      <polygon class="fx-pop fill-accent/20 stroke-accent stroke-2 [stroke-linejoin:round]" points={poly()} style={{ 'transform-box': 'view-box', 'transform-origin': `${c()}px ${c()}px`, '--base': '200ms' }} />
      <For each={p.axes}>{(ax, i) => <circle class="fx-pop fill-accent-2" cx={pt(i(), Math.max(0.04, ax.value / 100))[0]} cy={pt(i(), Math.max(0.04, ax.value / 100))[1]} r="3.5" style={{ '--i': i(), '--step': '80ms', '--base': '1000ms' }} />}</For>
      <For each={p.axes}>{(ax, i) => {
        const [lx, ly] = pt(i(), 1.2);
        return <text class="fill-ink-2 font-display text-[11px] font-semibold uppercase tracking-[.08em]" x={lx} y={ly} text-anchor={Math.abs(lx - c()) < 8 ? 'middle' : lx > c() ? 'start' : 'end'}>
          <tspan x={lx} dy="-2">{ax.label}</tspan><tspan x={lx} dy="14" class="fill-muted font-body text-[10.5px] font-medium normal-case tracking-normal">{ax.display}</tspan>
        </text>;
      }}</For>
    </svg>
  </div>;
};

/* ───────────── Donut: role share with 2px gaps ───────────── */
export const Donut: Component<{ parts: { label: string; value: number; color: string }[]; size?: number; children?: JSX.Element }> = p => {
  const [seen, ref] = useInView(0.2);
  const S = () => p.size ?? 168, sw = 16, r = () => (S() - sw) / 2, len = () => 2 * Math.PI * r();
  const total = () => p.parts.reduce((n, x) => n + x.value, 0) || 1;
  const segs = createMemo(() => {
    let acc = 0;
    return p.parts.filter(x => x.value > 0).map(x => { const s = { ...x, start: acc / total(), frac: x.value / total() }; acc += x.value; return s; });
  });
  return <div ref={ref} class="relative grid flex-none place-items-center" classList={{ in: seen() }} style={{ width: `${S()}px`, height: `${S()}px` }}>
    <svg class="absolute inset-0" viewBox={`0 0 ${S()} ${S()}`} role="img" aria-label={p.parts.map(x => `${x.label} ${x.value}`).join(', ')}>
      <circle class="fill-none stroke-ink/7" cx={S() / 2} cy={S() / 2} r={r()} stroke-width={sw} />
      <For each={segs()}>{(s, i) => {
        const seg = () => Math.max(0, s.frac * len() - 3);
        return <circle class="fx-stroke fill-none" cx={S() / 2} cy={S() / 2} r={r()} stroke-width={sw}
          style={{ stroke: s.color, 'stroke-dasharray': `${seg()} ${len()}`, '--len': `${seg()}`, '--off': '0', '--delay': `${i() * 180 + 200}ms`, transform: `rotate(${-90 + s.start * 360}deg)`, 'transform-origin': '50% 50%' }} />;
      }}</For>
    </svg>
    <div class={center}>{p.children}</div>
  </div>;
};

/* ───────────── Activity heatmap: matches per day ───────────── */
export const Heatmap: Component<{ days: { date: Date; count: number; wins: number }[] }> = p => {
  const [seen, ref] = useInView(0.2);
  const max = () => Math.max(1, ...p.days.map(d => d.count));
  return <div ref={ref} class="mx-auto grid w-full max-w-[320px] grid-cols-7 content-start gap-[5px]" classList={{ in: seen() }}>
    <For each={p.days}>{(d, i) => <span class="fx-pop aspect-square rounded border border-line hover:outline hover:outline-ink-2"
      style={{ background: d.count ? `rgb(255 70 85 / ${0.25 + (d.count / max()) * 0.75})` : 'rgb(236 232 225 / .03)', '--i': i(), '--step': '14ms', '--base': '150ms' }}
      title={`${d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.count} matches${d.count ? ` · ${d.wins}W ${d.count - d.wins}L` : ''}`} />}</For>
  </div>;
};
