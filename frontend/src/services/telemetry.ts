import { createSignal } from 'solid-js';
import { OverlayTelemetryPayload } from '../types/valorant';
import { AdvancedPlayerMetrics } from '../types/analytics';

const BACKEND_URL = 'http://localhost:8080/api/v1';

export interface LCUStatus {
  connected: boolean;
  port?: string;
  pid?: string;
  reason?: string;
}

export const [isBackendOnline, setIsBackendOnline] = createSignal<boolean>(false);
export const [lcuStatus, setLcuStatus] = createSignal<LCUStatus>({ connected: false });

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

export async function fetchLiveOverlayTelemetry(riotId: string = "throwkarumga#6969"): Promise<OverlayTelemetryPayload | null> {
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
 * Retrieves comprehensive VAL-Index analytical profile metrics from our high-precision Go backend
 */
export async function fetchHistoricalAnalytics(riotId: string = "throwkarumga#6969"): Promise<AdvancedPlayerMetrics | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/players/analytics/${encodeURIComponent(riotId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to load comprehensive advanced metrics:", e);
  }
  return null;
}
