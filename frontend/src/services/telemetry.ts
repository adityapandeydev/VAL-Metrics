import { createSignal } from 'solid-js';
import { OverlayTelemetryPayload } from '../types/valorant';

// Backend configuration
const BACKEND_URL = 'http://localhost:8080/api/v1';

export interface LCUStatus {
  connected: boolean;
  port?: string;
  pid?: string;
  reason?: string;
}

export interface AgentMastery {
  agentName: string;
  agentIconUrl: string;
  matchesPlayed: number;
  winRate: number;
  avgCombatScore: number;
  kdRatio: number;
}

export interface WeaponMarksmanship {
  weaponName: string;
  totalKills: number;
  headshotPercent: number;
  bodyshotPercent: number;
  legshotPercent: number;
}

export interface MapPerformance {
  mapName: string;
  matchesPlayed: number;
  winRate: number;
  attackWinRate: number;
  defendWinRate: number;
}

export interface PlayerHistoricalSummary {
  puuid: string;
  riotId: string;
  currentRank: string;
  peakRank: string;
  overallKdRatio: number;
  overallWinRate: number;
  totalMatches: number;
  agentMasteries: AgentMastery[];
  weaponAccuracy: WeaponMarksmanship[];
  mapMatrix: MapPerformance[];
  lastUpdated: string;
}

// Reactive status signals for global UI binding
export const [isBackendOnline, setIsBackendOnline] = createSignal<boolean>(false);
export const [lcuStatus, setLcuStatus] = createSignal<LCUStatus>({ connected: false });

/**
 * Pings the Go Backend server health endpoint to verify connectivity
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/status`);
    if (res.ok) {
      setIsBackendOnline(true);
      return true;
    }
  } catch {
    setIsBackendOnline(false);
  }
  return false;
}

/**
 * Audits whether the local VALORANT PC client is running and linked via LCU loopback
 */
export async function auditLCUConnection(): Promise<LCUStatus> {
  try {
    const res = await fetch(`${BACKEND_URL}/lcu/status`);
    if (res.ok) {
      const data: LCUStatus = await res.json();
      setLcuStatus(data);
      return data;
    }
  } catch (e) {
    console.warn("LCU Check failed:", e);
  }
  const fallback = { connected: false, reason: "Go Backend Offline or Unreachable" };
  setLcuStatus(fallback);
  return fallback;
}

/**
 * Retrieves ultra-lightweight (< 450 bytes) live match telemetry for the in-game HUD
 */
export async function fetchLiveOverlayTelemetry(riotId: string = "Vanguard#KILL"): Promise<OverlayTelemetryPayload | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/players/live/${encodeURIComponent(riotId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch sub-kilobyte HUD telemetry:", e);
  }
  return null;
}

/**
 * Retrieves comprehensive Tracker.gg style historical profile statistics from SQLite Vault
 */
export async function fetchHistoricalAnalytics(riotId: string = "Vanguard#KILL"): Promise<PlayerHistoricalSummary | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/players/analytics/${encodeURIComponent(riotId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to load comprehensive historical analytics:", e);
  }
  return null;
}
