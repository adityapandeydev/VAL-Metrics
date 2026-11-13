import { Component, createEffect, createSignal, on, onCleanup } from 'solid-js';
import { fmt } from './data/stats';

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ───────────── One shared IntersectionObserver for every reveal / in-view hook ───────────── */
const seenCallbacks = new WeakMap<Element, () => void>();
let sharedIO: IntersectionObserver | undefined;
function observeOnce(el: Element, cb: () => void) {
  if (reducedMotion() || typeof IntersectionObserver === 'undefined') { cb(); return () => {}; }
  sharedIO ??= new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const fn = seenCallbacks.get(e.target);
      sharedIO!.unobserve(e.target); seenCallbacks.delete(e.target); fn?.();
    }
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  seenCallbacks.set(el, cb);
  sharedIO.observe(el);
  return () => { sharedIO?.unobserve(el); seenCallbacks.delete(el); };
}

/** Signal that flips true once the element is visible. */
export function useInView(_threshold?: number) {
  const [seen, setSeen] = createSignal(false);
  let stop = () => {};
  const ref = (el: Element) => { stop = observeOnce(el, () => setSeen(true)); };
  onCleanup(() => stop());
  return [seen, ref] as const;
}

/* ───────────── One shared animation-frame ticker for all count-ups ───────────── */
const tickers = new Set<(now: number) => boolean>();
let rafId = 0;
const frame = (now: number) => {
  for (const t of tickers) if (!t(now)) tickers.delete(t);
  rafId = tickers.size ? requestAnimationFrame(frame) : 0;
};
function addTicker(t: (now: number) => boolean) {
  tickers.add(t);
  if (!rafId) rafId = requestAnimationFrame(frame);
  return () => tickers.delete(t);
}

/** Number that counts up from its previous value when it becomes visible or changes. */
export const CountUp: Component<{ value: number | null | undefined; digits?: number; suffix?: string; prefix?: string; duration?: number; delay?: number; signed?: boolean; class?: string }> = p => {
  const [seen, ref] = useInView();
  const [shown, setShown] = createSignal(0);
  let from = 0, stop = () => {};
  createEffect(on(() => [p.value, seen()] as const, ([v, s]) => {
    if (!s || v == null || !Number.isFinite(v)) return;
    stop();
    if (reducedMotion()) { setShown(v); from = v; return; }
    const start = performance.now() + (p.delay ?? 0), a = from, dur = p.duration ?? 1300;
    let last = '';
    stop = addTicker(now => {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      const cur = a + (v - a) * (1 - Math.pow(1 - t, 4));
      from = cur;
      // Only touch the DOM when the visible text actually changes.
      const txt = fmt(cur, p.digits ?? 0);
      if (txt !== last) { last = txt; setShown(cur); }
      return t < 1;
    });
  }));
  onCleanup(() => stop());
  const valid = () => p.value != null && Number.isFinite(p.value);
  return <span ref={ref} class={`tabular-nums ${p.class || ''}`}>
    {valid() ? `${p.prefix ?? ''}${p.signed && (p.value as number) > 0 ? '+' : ''}${fmt(shown(), p.digits ?? 0)}${p.suffix ?? ''}` : '—'}
  </span>;
};

/**
 * Cursor-following spotlight on `.card`. Moves one childless `.fx-spot` element with a
 * transform, at most once per frame — no style recalculation of the card's subtree.
 */
export function installSpotlight() {
  let pending: PointerEvent | null = null, raf = 0;
  const apply = () => {
    raf = 0;
    const e = pending; pending = null;
    if (!e) return;
    const card = (e.target as HTMLElement | null)?.closest?.('.card') as HTMLElement | null;
    const spot = card?.querySelector<HTMLElement>(':scope > .fx-spot');
    if (!card || !spot) return;
    const r = card.getBoundingClientRect();
    spot.style.transform = `translate3d(${e.clientX - r.left}px, ${e.clientY - r.top}px, 0)`;
  };
  const move = (e: PointerEvent) => { pending = e; if (!raf) raf = requestAnimationFrame(apply); };
  window.addEventListener('pointermove', move, { passive: true });
  return () => { window.removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
}

/* ───────────── Downscaled images ─────────────
 * Agent portraits (2048×1860) and map splashes (up to 3840×2160) decode to 15–33 MB each.
 * We fetch once, resize off the main thread with createImageBitmap, and keep only a small
 * WebP blob, so the browser holds ~1–3 MB per image instead. Falls back to the original URL.
 */
const scaledCache = new Map<string, Promise<string>>();
// Small concurrency pool; small targets (icons) jump ahead of large art so they never wait behind portraits.
const waiting: { width: number; run: () => void }[] = [];
let active = 0;
const pump = () => {
  while (active < 3 && waiting.length) {
    waiting.sort((a, b) => a.width - b.width);
    const next = waiting.shift()!; active++; next.run();
  }
};
export function scaledSrc(src: string, width: number): Promise<string> {
  const key = `${src}@${width}`;
  let hit = scaledCache.get(key);
  if (!hit) {
    if (typeof createImageBitmap === 'undefined' || typeof OffscreenCanvas === 'undefined' || !/^https?:/.test(src)) return Promise.resolve(src);
    // Downloads run in parallel (network-bound); only the decode/resize/encode step is pooled.
    const download = fetch(src, { mode: 'cors' }).then(r => r.blob()).catch(() => null);
    const job = async () => {
      try {
        const blob = await download;
        if (!blob) return src;
        // Height follows the aspect ratio when only resizeWidth is given; decoding runs off the main thread.
        const bmp = await createImageBitmap(blob, { resizeWidth: width, resizeQuality: 'high' });
        const canvas = new OffscreenCanvas(bmp.width, bmp.height);
        canvas.getContext('2d')!.drawImage(bmp, 0, 0);
        bmp.close();
        return URL.createObjectURL(await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 }));
      } catch { return src; }
    };
    // Bounded concurrency keeps the transient full-size decodes from stacking up.
    hit = download.then(() => new Promise<string>(res => { waiting.push({ width, run: () => job().then(res).finally(() => { active--; pump(); }) }); pump(); }));
    scaledCache.set(key, hit);
  }
  return hit;
}
/** Solid accessor for a downscaled image URL ('' until ready). */
export function useScaled(src: () => string, width: number) {
  const [url, setUrl] = createSignal('');
  createEffect(() => { const s = src(); setUrl(''); let live = true; scaledSrc(s, width).then(u => live && setUrl(u)); onCleanup(() => { live = false; }); });
  return url;
}
