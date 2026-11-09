import { Component, createEffect, createSignal, on, onCleanup } from 'solid-js';
import { fmt } from './data/stats';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Adds `.in` to an element the first time it scrolls into view; CSS does the rest. */
export function reveal(el: Element) {
  if (reducedMotion() || typeof IntersectionObserver === 'undefined') { el.classList.add('in'); return; }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  io.observe(el);
  onCleanup(() => io.disconnect());
}

/** Signal that flips true once the element is visible. */
export function useInView(threshold = 0.15) {
  const [seen, setSeen] = createSignal(false);
  let io: IntersectionObserver | undefined;
  const ref = (el: Element) => {
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { setSeen(true); io?.disconnect(); } }, { threshold });
    io.observe(el);
  };
  onCleanup(() => io?.disconnect());
  return [seen, ref] as const;
}

/** Number that counts up from its previous value when it becomes visible or changes. */
export const CountUp: Component<{ value: number | null | undefined; digits?: number; suffix?: string; prefix?: string; duration?: number; delay?: number; signed?: boolean; class?: string }> = p => {
  const [seen, ref] = useInView(0.05);
  const [shown, setShown] = createSignal(0);
  let raf = 0, from = 0;
  createEffect(on(() => [p.value, seen()] as const, ([v, s]) => {
    if (!s || v == null || !Number.isFinite(v)) return;
    cancelAnimationFrame(raf);
    if (reducedMotion()) { setShown(v); from = v; return; }
    const start = performance.now() + (p.delay ?? 0), a = from, dur = p.duration ?? 1300;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      const cur = a + (v - a) * (1 - Math.pow(1 - t, 4));
      setShown(cur); from = cur;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }));
  onCleanup(() => cancelAnimationFrame(raf));
  const valid = () => p.value != null && Number.isFinite(p.value);
  return <span ref={ref} class={`tabular-nums ${p.class || ''}`}>
    {valid() ? `${p.prefix ?? ''}${p.signed && (p.value as number) > 0 ? '+' : ''}${fmt(shown(), p.digits ?? 0)}${p.suffix ?? ''}` : '—'}
  </span>;
};

/** Cursor-following spotlight on any `.card` (one delegated listener). */
export function installSpotlight() {
  const move = (e: PointerEvent) => {
    const card = (e.target as HTMLElement | null)?.closest?.('.card') as HTMLElement | null;
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  window.addEventListener('pointermove', move, { passive: true });
  return () => window.removeEventListener('pointermove', move);
}
