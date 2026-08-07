import { createSignal } from 'solid-js';
import { OverlayTelemetryPayload } from '../types/valorant';
import { AdvancedPlayerMetrics } from '../types/analytics';

// Dynamically resolve backend endpoint:
// 1. Explicit VITE_BACKEND_URL environment override (ideal for Tauri native Windows builds)
// 2. Local Vite development mode (http://localhost:8080/api/v1)
// 3. Production web dashboard deployment (Netlify), utilizing clean relative routing '/api/v1' via our HTTPS Cloud Proxy Bridge!
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:8080/api/v1' : '/api/v1');

export interface LCUStatus {
  connected: boolean;
  port?: string;
  pid?: string;
  reason?: string;
}

export interface AuthSessionData {
  authenticated: boolean;
  token?: string;
  username?: string;
  riotId?: string;
  puuid?: string;
  isVerified?: boolean;
}

export interface SyncReport {
  puuid: string;
  riotId: string;
  syncState: string;
  newMatchesCount: number;
  lastSyncAgo: string;
  errorMessage?: string;
}

export const [isBackendOnline, setIsBackendOnline] = createSignal<boolean>(false);
export const [isLiveRiotApiActive, setIsLiveRiotApiActive] = createSignal<boolean>(false);
export const [lcuStatus, setLcuStatus] = createSignal<LCUStatus>({ connected: false });
export const [authSession, setAuthSession] = createSignal<AuthSessionData>({ authenticated: false });

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/status`);
    if (res.ok) {
      const data = await res.json();
      setIsBackendOnline(true);
      if (data && typeof data.live_riot_api === 'boolean') {
        setIsLiveRiotApiActive(data.live_riot_api);
      }
      return true;
    }
  } catch {
    setIsBackendOnline(false);
    setIsLiveRiotApiActive(false);
  }
  return false;
}

export async function checkAuthStatus(): Promise<AuthSessionData> {
  const storedToken = localStorage.getItem('val_auth_token');
  if (!storedToken) {
    setAuthSession({ authenticated: false });
    return { authenticated: false };
  }
  try {
    const res = await fetch(`${BACKEND_URL}/auth/session?token=${encodeURIComponent(storedToken)}`);
    if (res.ok) {
      const data: AuthSessionData = await res.json();
      if (data.authenticated) {
        setAuthSession(data);
        return data;
      }
    }
  } catch (e) {
    console.warn("Session validation failed:", e);
  }
  localStorage.removeItem('val_auth_token');
  setAuthSession({ authenticated: false });
  return { authenticated: false };
}

export async function registerUser(username: string, email: string, pass: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password: pass })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('val_auth_token', data.token);
        setAuthSession({
          authenticated: true,
          token: data.token,
          username: data.username,
          isVerified: false
        });
        return true;
      }
    }
  } catch (e) {
    console.error("User registration error:", e);
  }
  return false;
}

export async function loginUser(username: string, pass: string): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password: pass })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('val_auth_token', data.token);
        setAuthSession({
          authenticated: true,
          token: data.token,
          username: data.username,
          riotId: data.riotId,
          puuid: data.puuid,
          isVerified: data.isVerified
        });
        return true;
      }
    }
  } catch (e) {
    console.error("Login authentication error:", e);
  }
  return false;
}

export async function linkRiotAccount(riotId: string): Promise<boolean> {
  const token = localStorage.getItem('val_auth_token') || 'direct_riot_session';
  try {
    const res = await fetch(`${BACKEND_URL}/auth/riot/link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, riotId })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "LINKED") {
        if (data.token) localStorage.setItem('val_auth_token', data.token);
        setAuthSession({
          authenticated: true,
          token: data.token || token,
          username: data.username || riotId,
          riotId: data.riotId || riotId,
          puuid: data.puuid,
          isVerified: true
        });
        return true;
      }
    }
  } catch (e) {
    console.error("Riot account verification failed:", e);
  }
  return false;
}

export async function logoutUser(): Promise<void> {
  const token = localStorage.getItem('val_auth_token');
  if (token) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
    } catch {}
  }
  localStorage.removeItem('val_auth_token');
  setAuthSession({ authenticated: false });
}

export async function triggerPlayerSync(riotId: string): Promise<SyncReport | null> {
  if (!riotId) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/players/sync/?riotId=${encodeURIComponent(riotId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Manual background match sync request failed:", e);
  }
  return null;
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

export async function fetchLiveOverlayTelemetry(riotId: string): Promise<OverlayTelemetryPayload | null> {
  if (!riotId) return null;
  try {
    const res = await fetch(`${BACKEND_URL}/players/live/?riotId=${encodeURIComponent(riotId)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch sub-kilobyte HUD telemetry:", e);
  }
  return null;
}

export async function fetchHistoricalAnalytics(
  riotId: string,
  queue: string = "Competitive",
  act: string = "V26: A4"
): Promise<AdvancedPlayerMetrics | null> {
  if (!riotId || !riotId.includes('#')) return null;
  try {
    const url = `${BACKEND_URL}/players/analytics/?riotId=${encodeURIComponent(riotId)}&queue=${encodeURIComponent(queue)}&act=${encodeURIComponent(act)}`;
    const res = await fetch(url);
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Failed to load comprehensive advanced metrics:", e);
  }
  return null;
}
