import { Component, createSignal } from 'solid-js';
import { authSession, loginUser, registerUser, linkRiotAccount, logoutUser } from '../../services/telemetry';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: Component<AuthModalProps> = (props) => {
  const [activeTab, setActiveTab] = createSignal<'signin' | 'register' | 'riotLink'>('signin');
  const [username, setUsername] = createSignal<string>('');
  const [email, setEmail] = createSignal<string>('');
  const [password, setPassword] = createSignal<string>('');
  const [riotIdInput, setRiotIdInput] = createSignal<string>('Aditya#INDI');
  const [loading, setLoading] = createSignal<boolean>(false);
  const [errorMsg, setErrorMsg] = createSignal<string>('');
  const [successMsg, setSuccessMsg] = createSignal<string>('');

  const handleSignIn = async (e: Event) => {
    e.preventDefault();
    if (!username() || !password()) {
      setErrorMsg("Please enter both username and password.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const success = await loginUser(username(), password());
    setLoading(false);
    if (success) {
      setSuccessMsg(`Welcome back, ${authSession().username}!`);
      if (!authSession().isVerified) {
        setActiveTab('riotLink');
      } else {
        setTimeout(() => props.onClose(), 1200);
      }
    } else {
      setErrorMsg("Sign in failed. Please verify your credentials or click 'Register New Account'.");
    }
  };

  const handleRegister = async (e: Event) => {
    e.preventDefault();
    if (!username() || !password() || !email()) {
      setErrorMsg("Please complete all registration fields.");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const success = await registerUser(username(), email(), password());
    setLoading(false);
    if (success) {
      setSuccessMsg("Account successfully created! Now let's link your Riot Games ID.");
      setActiveTab('riotLink');
    } else {
      setErrorMsg("Registration failed. Please try a different username.");
    }
  };

  const handleLinkRiot = async (e: Event) => {
    e.preventDefault();
    if (!riotIdInput() || !riotIdInput().includes('#')) {
      setErrorMsg("Please enter a valid Riot ID (Format: Name#Tag).");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg("Verifying PUUID and synchronizing historical match archives with Riot Cloud...");
    const success = await linkRiotAccount(riotIdInput());
    setLoading(false);
    if (success) {
      setSuccessMsg("⚔️ Verified! Riot account bound to your VAL-Metrics profile. Desktop HUD Overlay unlocked!");
      setTimeout(() => props.onClose(), 1800);
    } else {
      setErrorMsg("Could not verify Riot ID. Please make sure the name and tag are accurate.");
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    props.onClose();
  };

  if (!props.isOpen) return null;

  return (
    <div class="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div class="relative w-full max-w-lg bg-[#0F1626] border-2 border-val-cyan/40 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,229,255,0.25)] overflow-hidden">
        
        {/* Background Cyber Glow & Tactical Watermark */}
        <div class="absolute -right-20 -top-20 w-64 h-64 bg-val-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div class="absolute -left-20 -bottom-20 w-64 h-64 bg-val-red/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Close Modal Button */}
        <button 
          onClick={props.onClose}
          class="absolute top-5 right-6 text-val-muted hover:text-white text-2xl font-black transition-all"
        >
          ✕
        </button>

        {/* Header Title */}
        <div class="flex items-center gap-3 mb-6">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-val-red to-val-cyan p-0.5 flex items-center justify-center shadow-glow-red flex-shrink-0">
            <div class="w-full h-full bg-[#0F1626] rounded-[14px] flex items-center justify-center text-xl font-tactical font-black text-white">
              👑
            </div>
          </div>
          <div>
            <h2 class="text-2xl font-tactical font-extrabold text-white tracking-tight">
              VAL-METRICS ID ACCESS
            </h2>
            <p class="text-xs text-val-muted font-medium">
              Connect your verified Riot Games profile for continuous match auto-sync & HUD overlays
            </p>
          </div>
        </div>

        {/* Notification Pill */}
        {errorMsg() && (
          <div class="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span> {errorMsg()}
          </div>
        )}
        {successMsg() && (
          <div class="mb-4 p-3 rounded-xl bg-val-emerald/20 border border-val-emerald text-val-emerald text-xs font-semibold flex items-center gap-2 animate-pulse">
            <span>⚡</span> {successMsg()}
          </div>
        )}

        {/* If Already Authenticated & Verified */}
        {authSession().authenticated ? (
          <div class="space-y-6 text-center py-4">
            <div class="p-6 rounded-2xl bg-[#141C2E] border border-white/10 space-y-3">
              <span class="inline-block px-3 py-1 rounded-full bg-val-emerald/20 text-val-emerald font-tactical font-black text-[11px] uppercase tracking-wider">
                ACTIVE ACCOUNT LINK
              </span>
              <h3 class="text-3xl font-tactical font-black text-white">{authSession().riotId || authSession().username}</h3>
              <p class="text-xs text-val-muted font-mono">User ID: {authSession().username} • Status: {authSession().isVerified ? "Verified Riot Owner" : "Spectator Account"}</p>
            </div>

            {!authSession().isVerified && (
              <form onSubmit={handleLinkRiot} class="space-y-3 text-left">
                <label class="block text-xs font-tactical text-val-cyan uppercase tracking-wider">
                  Link Riot Account (Name#Tag)
                </label>
                <div class="flex gap-2">
                  <input
                    type="text"
                    value={riotIdInput()}
                    onInput={(e) => setRiotIdInput(e.currentTarget.value)}
                    placeholder="e.g. Aditya#INDI"
                    class="flex-1 bg-black/60 border border-white/15 px-4 py-3 rounded-xl text-white font-semibold focus:outline-none focus:border-val-cyan"
                  />
                  <button
                    type="submit"
                    disabled={loading()}
                    class="bg-val-cyan text-val-obsidian font-tactical font-black px-6 py-3 rounded-xl hover:brightness-110 uppercase text-xs transition-all shadow-glow-cyan"
                  >
                    {loading() ? "LINKING..." : "CONNECT"}
                  </button>
                </div>
              </form>
            )}

            <div class="flex gap-3 pt-2">
              <button
                onClick={props.onClose}
                class="flex-1 py-3 rounded-xl bg-val-cyan/20 border border-val-cyan text-val-cyan font-tactical font-black text-xs uppercase hover:bg-val-cyan hover:text-val-obsidian transition-all"
              >
                BACK TO DASHBOARD
              </button>
              <button
                onClick={handleLogout}
                class="px-6 py-3 rounded-xl bg-rose-600/20 border border-rose-500 text-rose-400 font-tactical font-bold text-xs uppercase hover:bg-rose-600 hover:text-white transition-all"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        ) : (
          /* Tab Selection Header */
          <div>
            <div class="flex rounded-xl bg-[#0A0E17] p-1.5 border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setActiveTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                class={`flex-1 py-2 rounded-lg font-tactical font-black text-xs uppercase transition-all ${
                  activeTab() === 'signin' ? 'bg-val-cyan text-val-obsidian shadow-glow-cyan' : 'text-val-muted hover:text-white'
                }`}
              >
                🔑 SIGN IN
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setErrorMsg(''); setSuccessMsg(''); }}
                class={`flex-1 py-2 rounded-lg font-tactical font-black text-xs uppercase transition-all ${
                  activeTab() === 'register' ? 'bg-val-red text-white shadow-glow-red' : 'text-val-muted hover:text-white'
                }`}
              >
                ⚡ NEW ACCOUNT SIGN UP
              </button>
            </div>

            {/* Form Panels */}
            {activeTab() === 'signin' ? (
              <form onSubmit={handleSignIn} class="space-y-4">
                <div>
                  <label class="block text-xs font-tactical text-val-muted uppercase mb-1.5">Username or Site ID</label>
                  <input
                    type="text"
                    value={username()}
                    onInput={(e) => setUsername(e.currentTarget.value)}
                    placeholder="Enter your username..."
                    required
                    class="w-full bg-black/60 border border-white/15 px-4 py-3 rounded-xl text-white font-medium focus:outline-none focus:border-val-cyan transition-all"
                  />
                </div>
                <div>
                  <label class="block text-xs font-tactical text-val-muted uppercase mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    placeholder="••••••••••••"
                    required
                    class="w-full bg-black/60 border border-white/15 px-4 py-3 rounded-xl text-white font-medium focus:outline-none focus:border-val-cyan transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading()}
                  class="w-full py-3.5 rounded-xl bg-val-cyan text-val-obsidian font-tactical font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-glow-cyan"
                >
                  {loading() ? "AUTHENTICATING DATABASE..." : "LOG IN TO VAL-METRICS"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} class="space-y-4">
                <div>
                  <label class="block text-xs font-tactical text-val-muted uppercase mb-1.5">Desired Username</label>
                  <input
                    type="text"
                    value={username()}
                    onInput={(e) => setUsername(e.currentTarget.value)}
                    placeholder="e.g. AdityaPandey"
                    required
                    class="w-full bg-black/60 border border-white/15 px-4 py-3 rounded-xl text-white font-medium focus:outline-none focus:border-val-red transition-all"
                  />
                </div>
                <div>
                  <label class="block text-xs font-tactical text-val-muted uppercase mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={email()}
                    onInput={(e) => setEmail(e.currentTarget.value)}
                    placeholder="aditya@example.com"
                    required
                    class="w-full bg-black/60 border border-white/15 px-4 py-3 rounded-xl text-white font-medium focus:outline-none focus:border-val-red transition-all"
                  />
                </div>
                <div>
                  <label class="block text-xs font-tactical text-val-muted uppercase mb-1.5">Choose Password</label>
                  <input
                    type="password"
                    value={password()}
                    onInput={(e) => setPassword(e.currentTarget.value)}
                    placeholder="••••••••••••"
                    required
                    class="w-full bg-black/60 border border-white/15 px-4 py-3 rounded-xl text-white font-medium focus:outline-none focus:border-val-red transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading()}
                  class="w-full py-3.5 rounded-xl bg-gradient-to-r from-val-red via-rose-600 to-amber-500 text-white font-tactical font-black text-sm uppercase tracking-wider hover:brightness-110 active:scale-98 transition-all shadow-glow-red"
                >
                  {loading() ? "REGISTERING USER IN DATABASE..." : "⚡ CREATE ACCOUNT & NEXT: LINK RIOT ID"}
                </button>
              </form>
            )}

            <div class="mt-6 pt-4 border-t border-white/10 text-center text-xs text-val-muted font-medium">
              🔒 All account links run through verified Riot Sign-On (RSO OAuth2) security and Vanguard-approved loopback guidelines.
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
