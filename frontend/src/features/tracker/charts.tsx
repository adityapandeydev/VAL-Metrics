import { Component, For, JSX, Show, createMemo, createSignal, onCleanup, onMount } from 'solid-js';
import { useInView } from './motion';
import { fmt } from './data/stats';

/* ───────────── Ring: a circle that fills to value/max ───────────── */
export const Ring: Component<{ value: number | null; max?: number; size?: number; stroke?: number; color?: string; label?: string; children?: JSX.Element; delay?: number }> = p => {
  const size = () => p.size ?? 120, stroke = () => p.stroke ?? 9;
  const r = () => (size() - stroke()) / 2;
  const len = () => 2 * Math.PI * r();
  const frac = () => (p.value == null || !Number.isFinite(p.value) ? 0 : Math.max(0, Math.min(1, p.value / (p.max ?? 100))));
  const [seen, ref] = useInView(0.2);
  return <div ref={ref} class="vring" classList={{ in: seen() }} style={{ width: `${size()}px`, height: `${size()}px`, '--ring-delay': `${p.delay ?? 0}ms` }} role="img" aria-label={p.label}>
    <svg viewBox={`0 0 ${size()} ${size()}`} width={size()} height={size()}>
      <circle class="ring-track" cx={size() / 2} cy={size() / 2} r={r()} stroke-width={stroke()} />
      <circle class="ring-fill" cx={size() / 2} cy={size() / 2} r={r()} stroke-width={stroke()}
        style={{ stroke: p.color || 'var(--accent)', 'stroke-dasharray': `${len()}`, '--len': `${len()}`, '--off': `${len() * (1 - frac())}` }}
        transform={`rotate(-90 ${size() / 2} ${size() / 2})`} />
    </svg>
    <div class="ring-center">{p.children}</div>
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
  return <div ref={ref} class="gauge" classList={{ in: seen() }} style={{ width: `${size()}px`, height: `${size()}px` }} role="img" aria-label={p.label}>
    <svg viewBox={`0 0 ${size()} ${size()}`}>
      <defs>
        <linearGradient id="gauge-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#ff4655" /><stop offset="100%" stop-color="#ffb35c" />
        </linearGradient>
      </defs>
      <g transform={`rotate(135 ${c()} ${c()})`}>
        <circle class="gauge-track" cx={c()} cy={c()} r={r()} stroke-width={stroke} style={{ 'stroke-dasharray': `${arc()} ${full()}` }} />
        <circle class="gauge-fill" cx={c()} cy={c()} r={r()} stroke-width={stroke}
          style={{ 'stroke-dasharray': `${arc()} ${full()}`, '--len': `${arc()}`, '--off': `${arc() * (1 - frac())}` }} />
      </g>
      <For each={Array.from({ length: 28 })}>{(_, i) => {
        const a = (135 + (270 / 27) * i()) * Math.PI / 180;
        const r1 = r() + 12, r2 = r() + (i() % 9 === 0 ? 19 : 15);
        return <line class="gauge-tick" classList={{ lit: i() / 27 <= frac() }} style={{ '--i': i() }} x1={c() + Math.cos(a) * r1} y1={c() + Math.sin(a) * r1} x2={c() + Math.cos(a) * r2} y2={c() + Math.sin(a) * r2} />;
      }}</For>
    </svg>
    <div class="gauge-center">{p.children}</div>
  </div>;
};

/* ───────────── Meter: horizontal bar that grows ───────────── */
export const Meter: Component<{ value: number; max?: number; color?: string; i?: number; thin?: boolean; label?: string }> = p => {
  const frac = () => (Number.isFinite(p.value) ? Math.max(0, Math.min(1, p.value / (p.max ?? 100))) : 0);
  return <div class="meter" classList={{ thin: p.thin }} role={p.label ? 'img' : undefined} aria-label={p.label}>
    <i style={{ '--v': frac(), '--i': p.i ?? 0, background: p.color }} />
  </div>;
};

/* ───────────── Split bar: head / body / legs etc. ───────────── */
export const SplitBar: Component<{ parts: { value: number; color: string; label: string }[] }> = p => {
  const total = () => p.parts.reduce((n, x) => n + (Number.isFinite(x.value) ? x.value : 0), 0) || 1;
  return <div class="splitbar" role="img" aria-label={p.parts.map(x => `${x.label} ${fmt(x.value, 1)}%`).join(', ')}>
    <For each={p.parts}>{(x, i) => <i title={`${x.label} ${fmt(x.value, 1)}%`} style={{ '--w': `${(x.value / total()) * 100}%`, background: x.color, '--i': i() }} />}</For>
  </div>;
};

/* ───────────── Responsive width helper ───────────── */
function useWidth(fallback = 600) {
  const [w, setW] = createSignal(fallback);
  const ref = (el: HTMLElement) => {
    onMount(() => {
      setW(el.clientWidth || fallback);
      const ro = new ResizeObserver(() => setW(el.clientWidth || fallback));
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
  const H = () => p.height ?? 220;
  const pad = { l: p.hideAxis ? 8 : 44, r: 14, t: 16, b: 26 };
  const ys = () => p.points.map(x => x.y).filter(Number.isFinite);
  const lo = () => p.min ?? Math.floor(Math.min(...ys(), p.baseline ?? Infinity) * 0.92);
  const hi = () => p.max ?? Math.ceil(Math.max(...ys(), p.baseline ?? -Infinity) * 1.06);
  const x = (i: number) => pad.l + (i * (width() - pad.l - pad.r)) / Math.max(1, p.points.length - 1);
  const y = (v: number) => pad.t + (1 - (v - lo()) / Math.max(1e-6, hi() - lo())) * (H() - pad.t - pad.b);
  const path = createMemo(() => p.points.map((pt, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(pt.y).toFixed(1)}`).join(' '));
  const area = () => `${path()} L${x(p.points.length - 1)},${H() - pad.b} L${x(0)},${H() - pad.b} Z`;
  const ticks = () => [0, 1, 2, 3].map(i => lo() + ((hi() - lo()) * i) / 3);
  const f = (v: number) => (p.format ? p.format(v) : fmt(v));
  const onMove = (e: PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = Math.round(((px - pad.l) / (width() - pad.l - pad.r)) * (p.points.length - 1));
    setHover(Math.max(0, Math.min(p.points.length - 1, i)));
  };
  const key = createMemo(() => path().length + ':' + p.points.length + ':' + p.points.map(q => q.y).join(','));
  const gid = `lg-${Math.random().toString(36).slice(2, 8)}`;
  return <div ref={el => { wref(el); ref(el); }} class="linechart" classList={{ in: seen(), pickable: !!p.onPick }} style={{ height: `${H()}px` }}
    onPointerMove={onMove} onPointerLeave={() => setHover(null)} onClick={() => hover() != null && p.onPick?.(hover()!)}
    role="img" aria-label={p.label}>
    <svg width={width()} height={H()}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color={p.color || 'var(--accent)'} stop-opacity=".32" /><stop offset="100%" stop-color={p.color || 'var(--accent)'} stop-opacity="0" />
      </linearGradient></defs>
      <For each={ticks()}>{t => <g><line class="gridline" x1={pad.l} x2={width() - pad.r} y1={y(t)} y2={y(t)} /><Show when={!p.hideAxis}><text class="axis" x={pad.l - 8} y={y(t) + 4} text-anchor="end">{f(t)}</text></Show></g>}</For>
      <For each={p.bands || []}>{b => <Show when={b.at > lo() && b.at < hi()}><g><line class="band" x1={pad.l} x2={width() - pad.r} y1={y(b.at)} y2={y(b.at)} /><text class="band-label" x={pad.l + 4} y={y(b.at) - 5} text-anchor="start">{b.label}</text></g></Show>}</For>
      <Show when={p.baseline != null && Number.isFinite(p.baseline)}>
        <line class="baseline" x1={pad.l} x2={width() - pad.r} y1={y(p.baseline!)} y2={y(p.baseline!)} />
      </Show>
      <Show when={key()} keyed>{_k => <>
        <path class="area" d={area()} fill={`url(#${gid})`} />
        <path class="line" d={path()} pathLength="1" style={{ stroke: p.color || 'var(--accent)' }} />
        <For each={p.points}>{(pt, i) => <circle class={`dot ${pt.tone || ''}`} cx={x(i())} cy={y(pt.y)} r="4" style={{ '--i': i(), '--n': p.points.length }} />}</For>
      </>}</Show>
      <Show when={hover() != null}>
        <line class="cross" x1={x(hover()!)} x2={x(hover()!)} y1={pad.t} y2={H() - pad.b} />
        <circle class="dot-hover" cx={x(hover()!)} cy={y(p.points[hover()!].y)} r="7" />
      </Show>
    </svg>
    <Show when={hover() != null}>
      <div class="tip" style={{ left: `${Math.min(width() - 150, Math.max(0, x(hover()!) - 70))}px`, top: `${Math.max(0, y(p.points[hover()!].y) - 74)}px` }}>
        <strong>{p.tipValue ? p.tipValue(hover()!) : f(p.points[hover()!].y)}</strong><span>{p.points[hover()!].label}</span><small>{p.points[hover()!].sub}</small>
      </div>
    </Show>
  </div>;
};

/* ───────────── Column chart: bars that rise, per-bar tooltip ───────────── */
export const Columns: Component<{ items: { value: number; label: string; sub?: string; tone?: string }[]; height?: number; format?: (v: number) => string; max?: number; onPick?: (i: number) => void; avg?: number; label: string }> = p => {
  const [seen, ref] = useInView(0.2);
  const max = () => p.max ?? Math.max(1, ...p.items.map(i => i.value)) * 1.08;
  const f = (v: number) => (p.format ? p.format(v) : fmt(v));
  return <div ref={ref} class="columns" classList={{ in: seen() }} style={{ height: `${p.height ?? 200}px` }} role="img" aria-label={p.label}>
    <Show when={p.avg != null}><div class="columns-avg" style={{ bottom: `${(p.avg! / max()) * 100}%` }}><span>avg {f(p.avg!)}</span></div></Show>
    <For each={p.items}>{(it, i) => <button type="button" class={`col ${it.tone || ''}`} style={{ '--h': `${(Math.max(0, it.value) / max()) * 100}%`, '--i': i() }} onClick={() => p.onPick?.(i())} tabindex={p.onPick ? 0 : -1}>
      <i /><span class="col-tip"><b>{f(it.value)}</b>{it.label}<small>{it.sub}</small></span>
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
  return <div ref={ref} class="radar" classList={{ in: seen() }}>
    <svg viewBox={`0 0 ${S()} ${S()}`} role="img" aria-label={p.axes.map(a => `${a.label} ${a.display}`).join(', ')}>
      <For each={[0.25, 0.5, 0.75, 1]}>{lv => <polygon class="radar-ring" points={p.axes.map((_, i) => pt(i, lv).join(',')).join(' ')} />}</For>
      <For each={p.axes}>{(_, i) => <line class="radar-spoke" x1={c()} y1={c()} x2={pt(i(), 1)[0]} y2={pt(i(), 1)[1]} />}</For>
      <polygon class="radar-shape" points={poly()} style={{ 'transform-origin': `${c()}px ${c()}px` }} />
      <For each={p.axes}>{(ax, i) => <circle class="radar-dot" cx={pt(i(), Math.max(0.04, ax.value / 100))[0]} cy={pt(i(), Math.max(0.04, ax.value / 100))[1]} r="3.5" style={{ '--i': i() }} />}</For>
      <For each={p.axes}>{(ax, i) => {
        const [lx, ly] = pt(i(), 1.2);
        return <text class="radar-label" x={lx} y={ly} text-anchor={Math.abs(lx - c()) < 8 ? 'middle' : lx > c() ? 'start' : 'end'}>
          <tspan x={lx} dy="-2">{ax.label}</tspan><tspan x={lx} dy="14" class="radar-val">{ax.display}</tspan>
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
  return <div ref={ref} class="donut" classList={{ in: seen() }} style={{ width: `${S()}px`, height: `${S()}px` }}>
    <svg viewBox={`0 0 ${S()} ${S()}`} role="img" aria-label={p.parts.map(x => `${x.label} ${x.value}`).join(', ')}>
      <circle class="ring-track" cx={S() / 2} cy={S() / 2} r={r()} stroke-width={sw} />
      <For each={segs()}>{(s, i) => <circle class="donut-seg" cx={S() / 2} cy={S() / 2} r={r()} stroke-width={sw}
        style={{ stroke: s.color, 'stroke-dasharray': `${Math.max(0, s.frac * len() - 3)} ${len()}`, '--seglen': `${Math.max(0, s.frac * len() - 3)}`, '--i': i(), transform: `rotate(${-90 + s.start * 360}deg)`, 'transform-origin': '50% 50%' }} />}</For>
    </svg>
    <div class="ring-center">{p.children}</div>
  </div>;
};

/* ───────────── Activity heatmap: matches per day ───────────── */
export const Heatmap: Component<{ days: { date: Date; count: number; wins: number }[] }> = p => {
  const [seen, ref] = useInView(0.2);
  const max = () => Math.max(1, ...p.days.map(d => d.count));
  return <div ref={ref} class="heatmap" classList={{ in: seen() }}>
    <For each={p.days}>{(d, i) => <span class="heat" style={{ '--a': d.count ? 0.25 + (d.count / max()) * 0.75 : 0, '--i': i() }} classList={{ empty: !d.count }}
      title={`${d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.count} matches${d.count ? ` · ${d.wins}W ${d.count - d.wins}L` : ''}`} />}</For>
  </div>;
};

/* ───────────── Sparkline ───────────── */
export const Spark: Component<{ values: number[]; color?: string; w?: number; h?: number }> = p => {
  const [seen, ref] = useInView(0.1);
  const W = () => p.w ?? 90, Hh = () => p.h ?? 28;
  const d = () => {
    const v = p.values.filter(Number.isFinite); if (v.length < 2) return '';
    const lo = Math.min(...v), hi = Math.max(...v);
    return v.map((y, i) => `${i ? 'L' : 'M'}${(i * W()) / (v.length - 1)},${Hh() - 3 - ((y - lo) / Math.max(1e-6, hi - lo)) * (Hh() - 6)}`).join(' ');
  };
  return <svg ref={ref} class="spark" classList={{ in: seen() }} width={W()} height={Hh()} aria-hidden="true">
    <path d={d()} pathLength="1" style={{ stroke: p.color || 'var(--accent)' }} />
  </svg>;
};
