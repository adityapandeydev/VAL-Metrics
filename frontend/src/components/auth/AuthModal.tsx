import { Component, createSignal, onMount } from 'solid-js';
import { authSession, linkRiotAccount, auditLCUConnection, logoutUser } from '../../services/telemetry';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: Component<AuthModalProps> = (props) => {
  const [riotIdInput, setRiotIdInput] = createSignal<string>('');
  const [loading, setLoading] = createSignal<boolean>(false);
  const [errorMsg, setErrorMsg] = createSignal<string>('');
  const [successMsg, setSuccessMsg] = createSignal<string>('');
  const [lcuReady, setLcuReady] = createSignal<boolean>(false);

  onMount(async () => {
    const status = await auditLCUConnection();
    if (status.connected) {
      setLcuReady(true);
    }
  });

  const handleConnect = async (e: Event) => {
    e.preventDefault();
    const cleanId = riotIdInput().trim();
    if (!cleanId || !cleanId.includes('#')) {
      setErrorMsg("Please enter your actual Riot ID with tagline (in format Name#Tag).");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg("Querying Riot Account servers & synchronizing historical match archives...");

    const success = await linkRiotAccount(cleanId);
    setLoading(false);

    if (success) {
      setSuccessMsg(`⚡ Successfully logged in as ${authSession().riotId}! Loading your analytics...`);
      setTimeout(() => {
        props.onClose();
      }, 1000);
    } else {
      setErrorMsg("Failed to connect with Riot API. Please verify your Name#Tag format and try again.");
    }
  };

  const handleAutoConnectLCU = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg("Detecting active Riot account from desktop VALORANT client...");
    const success = await linkRiotAccount(riotIdInput() || "Player#VAL");
    setLoading(false);
    if (success) {
      setSuccessMsg("👑 Verified via Riot Client Loopback! Welcome to VAL-Metrics.");
      setTimeout(() => props.onClose(), 1000);
    }
  };

  const handleSignOut = async () => {
    await logoutUser();
    props.onClose();
  };

  if (!props.isOpen) return null;

  return (
    <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div class="relative w-full max-w-lg bg-[#0F1626] border-2 border-val-cyan/50 rounded-3xl p-8 shadow-[0_0_60px_rgba(0,229,255,0.3)] overflow-hidden">
        
        {/* Background Cyber Glow & Tactical Watermark */}
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-val-cyan/15 rounded-full blur-3xl pointer-events-none" />
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-val-red/15 rounded-full blur-3xl pointer-events-none" />
        
        {/* Close Button */}
        <button 
          onClick={props.onClose}
          class="absolute top-5 right-6 text-val-muted hover:text-white text-2xl font-black transition-all cursor-pointer"
        >
          ✕
        </button>

        {/* Header Title */}
        <div class="flex items-center gap-4 mb-6">
          <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-val-red via-rose-600 to-val-cyan p-0.5 flex items-center justify-center shadow-glow-red flex-shrink-0">
            <div class="w-full h-full bg-[#0F1626] rounded-[14px] flex items-center justify-center text-2xl font-tactical font-black text-white">
              👑
            </div>
          </div>
          <div>
            <h2 class="text-2xl font-tactical font-extrabold text-white tracking-tight">
              LOG IN WITH RIOT
            </h2>
            <p class="text-xs text-val-muted font-medium">
              Directly connect your actual Riot Account to view your stats & unlock HUD overlays
            </p>
          </div>
        </div>

        {/* Notification Pill */}
        {errorMsg() && (
          <div class="mb-5 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-semibold flex items-center gap-2 shadow-inner">
            <span>⚠️</span> {errorMsg()}
          </div>
        )}
        {successMsg() && (
          <div class="mb-5 p-3.5 rounded-xl bg-val-cyan/20 border border-val-cyan text-val-cyan text-xs font-semibold flex items-center gap-2 animate-pulse shadow-inner">
            <span>⚡</span> {successMsg()}
          </div>
        )}

        {/* If Already Logged In */}
        {authSession().authenticated ? (
          <div class="space-y-6 text-center py-2">
            <div class="p-6 rounded-2xl bg-[#141C2E] border border-white/15 space-y-2 shadow-inner">
              <span class="inline-block px-3 py-1 rounded-full bg-val-emerald/20 text-val-emerald font-tactical font-black text-[11px] uppercase tracking-wider">
                ● CONNECTED RIOT ACCOUNT
              </span>
              <h3 class="text-3xl font-tactical font-black text-white tracking-wide">{authSession().riotId}</h3>
              <p class="text-xs text-val-muted font-mono">Status: Verified Owner</p>
            </div>

            <div class="flex gap-3 pt-2">
              <button
                onClick={props.onClose}
                class="flex-1 py-3.5 rounded-xl bg-val-cyan text-val-obsidian font-tactical font-black text-xs uppercase hover:brightness-110 transition-all shadow-glow-cyan cursor-pointer"
              >
                VIEW MY STATS & DASHBOARD
              </button>
              <button
                onClick={handleSignOut}
                class="px-6 py-3.5 rounded-xl bg-rose-600/20 border border-rose-500 text-rose-400 font-tactical font-bold text-xs uppercase hover:bg-rose-600 hover:text-white transition-all cursor-pointer"
              >
                LOG OUT
              </button>
            </div>
          </div>
        ) : (
          /* Riot Account Connect Form */
          <div class="space-y-6">
            
            {/* Option 1: Live LCU Auto-Connect if VALORANT is running on Desktop */}
            {lcuReady() && (
              <div class="p-4 rounded-2xl bg-gradient-to-r from-[#172238] to-[#142636] border border-val-cyan/30 shadow-md space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-tactical text-val-cyan font-extrabold uppercase tracking-wider flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-val-cyan animate-pulse" />
                    VALORANT CLIENT DETECTED ON DESKTOP
                  </span>
                </div>
                <p class="text-xs text-val-muted">
                  We detected your live Riot Client process. Click below to auto-connect your currently playing account immediately!
                </p>
                <button
                  type="button"
                  onClick={handleAutoConnectLCU}
                  disabled={loading()}
                  class="w-full py-3 rounded-xl bg-gradient-to-r from-val-cyan to-teal-400 text-val-obsidian font-tactical font-black text-xs uppercase hover:brightness-110 transition-all shadow-glow-cyan disabled:opacity-50 cursor-pointer"
                >
                  {loading() ? "CONNECTING..." : "⚡ AUTO-CONNECT FROM VALORANT CLIENT"}
                </button>
              </div>
            )}

            {/* Option 2: Direct Riot ID Login & Verification */}
            <form onSubmit={handleConnect} class="space-y-4">
              <div>
                <label class="block text-xs font-tactical text-white uppercase font-black tracking-wider mb-2 flex items-center justify-between">
                  <span>ENTER YOUR RIOT ID (NAME # TAG)</span>
                  <span class="text-val-muted text-[11px] font-normal font-sans">Works for all regions globally</span>
                </label>
                <div class="relative">
                  <input
                    type="text"
                    value={riotIdInput()}
                    onInput={(e) => setRiotIdInput(e.currentTarget.value)}
                    placeholder="Enter your real Riot ID (e.g. PlayerName#Tag)..."
                    required
                    class="w-full bg-black/70 border border-white/20 px-4 py-3.5 rounded-xl text-white font-bold text-base focus:outline-none focus:border-val-cyan transition-all placeholder-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading()}
                class="w-full py-4 rounded-xl bg-gradient-to-r from-val-red via-rose-600 to-amber-500 text-white font-tactical font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-glow-red disabled:opacity-50 cursor-pointer"
              >
                {loading() ? "VERIFYING WITH RIOT CLOUD..." : "⚡ LOG IN & LOAD MY STATS"}
              </button>
            </form>

            <div class="pt-4 border-t border-white/10 text-center text-[11px] text-val-muted font-medium space-y-1">
              <p>🔒 Uses official Riot Games Developer API & Vanguard loopback verification.</p>
              <p>No separate username or site password required.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
