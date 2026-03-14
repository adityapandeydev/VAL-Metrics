import { render } from "solid-js/web";
import { createSignal } from "solid-js";
import { LiveMatchOverlay } from "./components/overlay/LiveMatchOverlay";
import "./index.css";

const App = () => {
  // Simple dev test toggle between Overlay HUD and full Web Dashboard Preview
  const [view, setView] = createSignal<"OVERLAY" | "DASHBOARD">("OVERLAY");

  return (
    <div class="p-4 min-h-screen w-full flex flex-col items-start space-y-4">
      {/* Dev preview toggle bar (disappears when click-through overlay mode is active) */}
      <div class="bg-zinc-900/90 border border-zinc-700/80 rounded px-3 py-1 flex items-center space-x-3 text-xs text-zinc-300">
        <span class="font-bold text-cyan-400">VAL-METRICS DEV CONTROLS:</span>
        <button 
          onClick={() => setView("OVERLAY")}
          class={`px-2 py-0.5 rounded transition ${view() === "OVERLAY" ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/50" : "hover:text-white"}`}
        >
          Live Overlay HUD
        </button>
        <button 
          onClick={() => setView("DASHBOARD")}
          class={`px-2 py-0.5 rounded transition ${view() === "DASHBOARD" ? "bg-cyan-500/30 text-cyan-300 border border-cyan-500/50" : "hover:text-white"}`}
        >
          Web Dashboard (Upcoming)
        </button>
      </div>

      {view() === "OVERLAY" ? (
        <LiveMatchOverlay />
      ) : (
        <div class="w-full max-w-4xl rounded-lg bg-zinc-900/95 border border-zinc-800 p-6 text-zinc-200 shadow-2xl backdrop-blur-md">
          <h1 class="text-xl font-black text-cyan-400 tracking-wide uppercase mb-2">Tactical Web Dashboard</h1>
          <p class="text-sm text-zinc-400 mb-4">
            This module will display comprehensive historical act rankings, map performance matrix, agent win-rate distributions, and weapon accuracy breakdowns powered by the high-performance Go backend.
          </p>
          <div class="p-4 rounded bg-zinc-800/50 border border-zinc-700/60 font-mono text-xs text-emerald-400">
            [STATUS] Ready for Go Backend API integration and SQLite historical telemetry storage.
          </div>
        </div>
      )}
    </div>
  );
};

const root = document.getElementById("root");
if (root) {
  render(() => <App />, root);
}
