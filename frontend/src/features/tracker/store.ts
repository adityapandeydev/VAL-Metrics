import { createMemo, createRoot, createSignal } from 'solid-js';
import { sampleProfile } from './data/demo';
import { buildStats } from './data/stats';
import type { Match, Profile, Queue } from './data/types';

export type Page = 'overview' | 'matches' | 'performance' | 'agents' | 'maps' | 'weapons' | 'seasons' | 'data';
export const PAGES: { id: Page; label: string }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'matches', label: 'Matches' }, { id: 'performance', label: 'Performance' },
  { id: 'agents', label: 'Agents' }, { id: 'maps', label: 'Maps' }, { id: 'weapons', label: 'Weapons' },
  { id: 'seasons', label: 'Seasons' }, { id: 'data', label: 'API coverage' },
];
export type QueueFilter = 'All' | Queue;

export const store = createRoot(() => {
  const [profile, setProfile] = createSignal<Profile>(sampleProfile());
  const [queue, setQueue] = createSignal<QueueFilter>('Competitive');
  const [page, setPageRaw] = createSignal<Page>('overview');
  const [openMatch, setOpenMatch] = createSignal<Match | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [pendingTab, setPendingTab] = createSignal('');

  const matches = createMemo(() => {
    const p = profile();
    if (p.source === 'server') return p.matches;
    return queue() === 'All' ? p.matches : p.matches.filter(m => m.queue === queue());
  });
  const stats = createMemo(() => profile().serverView ?? buildStats(matches()));
  const isSample = () => profile().source === 'sample';

  const setPage = (p: Page) => {
    setPageRaw(p);
    if (typeof history !== 'undefined') history.replaceState(null, '', `#${p}`);
  };
  return { profile, setProfile, queue, setQueue, page, setPage, openMatch, setOpenMatch, pendingTab, setPendingTab, loading, setLoading, message, setMessage, matches, stats, isSample };
});
