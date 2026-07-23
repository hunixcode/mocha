import { FormEvent, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAuth } from "../contexts/AuthContext";
import { Logo } from "./Icons";
import ResizeHandles from "./ResizeHandles";

export default function Gate() {
  const { user, loading, supabaseReady, signIn, signUp, saveConfig } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [error, setError] = useState("");
  const [setupUrl, setSetupUrl] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupSaving, setSetupSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function startDrag(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("button, input, textarea, a")) return;
    getCurrentWindow().startDragging();
  }

  function renderWindowControls() {
    return (
      <>
        <button className="wc-btn" onClick={() => getCurrentWindow().minimize()} aria-label="Minimize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect y="5" width="12" height="1" fill="currentColor" rx="0.5" /></svg>
        </button>
        <button className="wc-btn" onClick={() => getCurrentWindow().toggleMaximize()} aria-label="Maximize">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="none" /></svg>
        </button>
        <button className="wc-btn wc-close" onClick={() => getCurrentWindow().close()} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 12 12"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
        </button>
      </>
    );
  }

  // --- Setup screen ---
  if (!supabaseReady) {
    function handleSetup(e: FormEvent) {
      e.preventDefault();
      setSetupError("");
      const url = setupUrl.trim();
      const key = setupKey.trim();
      if (!url) return setSetupError("Project URL is required.");
      if (!key) return setSetupError("API key is required.");
      try { new URL(url); } catch { return setSetupError("Invalid URL. Make sure it includes https://"); }
      setSetupSaving(true);
      saveConfig(url, key);
    }

    return (
      <div className="gate">
        <ResizeHandles />
        <div className="gate-drag" onMouseDown={startDrag}>
          <div className="window-controls gate-wc">{renderWindowControls()}</div>
        </div>
        <div className="gate-card setup-card">
          <div className="logo"><Logo size={44} /></div>
          <h1>Setup required</h1>
          <p className="tagline">Mocha needs a Supabase project to store your vault.</p>
          <div className="setup-steps">
            <div className="setup-step">
              <span className="step-num">1</span>
              <div>
                <strong>Create a Supabase project</strong>
                <p>Go to <a href="https://app.supabase.com" target="_blank" rel="noreferrer">app.supabase.com</a> and create a free project.</p>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-num">2</span>
              <div>
                <strong>Create storage buckets</strong>
                <p>In Storage, create a bucket named <code>vaults</code> (private).</p>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-num">3</span>
              <div>
                <strong>Get your API keys</strong>
                <p>In Project Settings → API, copy the <em>Project URL</em> and <em>anon key</em>.</p>
              </div>
            </div>
            <div className="setup-step">
              <span className="step-num">4</span>
              <div>
                <strong>Enter your credentials below</strong>
                <p>Paste the values you just copied.</p>
              </div>
            </div>
          </div>
          <form className="setup-form" onSubmit={handleSetup}>
            <label>
              Project URL
              <input type="url" placeholder="https://your-project.supabase.co" value={setupUrl} onChange={(e) => setSetupUrl(e.target.value)} autoFocus />
            </label>
            <label>
              Anon / Publishable Key
              <input type="password" placeholder="eyJhbGci..." value={setupKey} onChange={(e) => setSetupKey(e.target.value)} />
            </label>
            {setupError && <div className="error">{setupError}</div>}
            <div className="row end">
              <button type="submit" className="btn primary" disabled={setupSaving}>{setupSaving ? "Saving…" : "Save & restart"}</button>
            </div>
          </form>
          <p className="setup-hint">Credentials are stored locally on your machine. You can also set them in a <code>.env</code> file at the project root.</p>
        </div>
      </div>
    );
  }

  // --- Loading screen ---
  if (loading) {
    return (
      <div className="gate">
        <ResizeHandles />
        <div className="gate-drag" onMouseDown={startDrag}>
          <div className="window-controls gate-wc">{renderWindowControls()}</div>
        </div>
        <div className="logo"><Logo size={44} /></div>
      </div>
    );
  }

  // --- Already logged in, no gate needed ---
  if (user) return null;

  // --- Auth screen ---
  async function handleAuth(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    if (!email.trim() || !authPassword) {
      setError("Email and password are required.");
      setSubmitting(false);
      return;
    }
    try {
      if (authMode === "signin") {
        await signIn(email, authPassword);
      } else {
        await signUp(email, authPassword);
      }
    } catch (err) {
      setError(String(err));
    }
    setSubmitting(false);
  }

  const signing = authMode === "signin";
  return (
    <div className="gate">
      <ResizeHandles />
      <div className="gate-drag" onMouseDown={startDrag}>
        <div className="window-controls gate-wc">{renderWindowControls()}</div>
      </div>
      <form className="gate-card" onSubmit={handleAuth}>
        <div className="logo"><Logo size={44} /></div>
        <h1>Mocha</h1>
        <p className="tagline">{signing ? "Sign in to access your suite." : "Create an account to get started."}</p>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
        <input type="password" placeholder="Password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} />
        {error && <div className="error">{error}</div>}
        <button type="submit" className="btn primary" disabled={submitting}>{signing ? "Sign in" : "Sign up"}</button>
        <button type="button" className="btn ghost" onClick={() => { setAuthMode(signing ? "signup" : "signin"); setError(""); }}>
          {signing ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
