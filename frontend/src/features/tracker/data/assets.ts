import { ALL_AGENTS } from '../../../data/agents';
import { ALL_MAPS } from '../../../data/maps';
import { ALL_WEAPONS } from '../../../data/weapons';
import type { Role } from './types';
import { CONTENT } from './content';

const C_MAPS = CONTENT.maps as Record<string, { splash: string; list: string; location: string }>;
const C_WEAPONS = CONTENT.weapons as Record<string, string>;
const C_AGENTS = CONTENT.agents as Record<string, { icon: string; portrait: string; role: string }>;
const find = <T,>(rec: Record<string, T>, name: string) => rec[Object.keys(rec).find(k => norm(k) === norm(name)) || ''];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const agentIndex = new Map(ALL_AGENTS.map(a => [norm(a.name), a]));
const mapIndex = new Map(ALL_MAPS.map(m => [norm(m.name), m]));
const weaponIndex = new Map(ALL_WEAPONS.map(w => [norm(w.name), w]));

export const FALLBACK = '/tracker/unknown.svg';
export const agentIcon = (name: string) => find(C_AGENTS, name)?.icon || agentIndex.get(norm(name))?.iconUrl || FALLBACK;
export const agentPortrait = (name: string) => find(C_AGENTS, name)?.portrait || agentIndex.get(norm(name))?.portraitUrl || FALLBACK;
export const agentRole = (name: string): Role => ((find(C_AGENTS, name)?.role || agentIndex.get(norm(name))?.role) as Role) || 'Duelist';
export const mapSplash = (name: string) => find(C_MAPS, name)?.splash || mapIndex.get(norm(name))?.splashUrl || FALLBACK;
export const mapBanner = (name: string) => find(C_MAPS, name)?.list || mapSplash(name);
export const mapLocation = (name: string) => mapIndex.get(norm(name))?.location || '';
export const weaponIcon = (name: string) => find(C_WEAPONS, name) || weaponIndex.get(norm(name))?.iconUrl || FALLBACK;
export const weaponCategory = (name: string) => weaponIndex.get(norm(name))?.category || 'Other';

/** Competitive tier art (tier ids 3–27). Falls back to an inline emblem on error. */
export const rankIcon = (tier: number) =>
  `https://media.valorant-api.com/competitivetiers/03621f52-342b-cf4e-4f86-9350a49c6d04/${tier}/largeicon.png`;

const TIERS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Ascendant', 'Immortal'];
export function rankName(tier: number) {
  if (tier >= 27) return 'Radiant';
  if (tier < 3) return 'Unranked';
  const i = tier - 3;
  return `${TIERS[Math.floor(i / 3)]} ${(i % 3) + 1}`;
}
/** Hue for a tier family — used only for glows, always beside the rank name. */
export function rankHue(tier: number) {
  const family = tier >= 27 ? 8 : Math.floor((tier - 3) / 3);
  return ['#8d8d8d', '#a86b3c', '#c9d1d6', '#e8c04a', '#3fb6c2', '#c08cf2', '#3fd690', '#e2486b', '#fff1a8'][Math.max(0, family)];
}

export const ROLE_COLOR: Record<Role, string> = {
  Duelist: '#E0552E', Initiator: '#169A9A', Controller: '#9C62F0', Sentinel: '#B08510',
};
