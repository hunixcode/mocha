import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { authenticatorStorage } from "../lib/storage";
import { generateTOTP, getRemainingSeconds, formatCode } from "../lib/totp";

interface TOTPAccount {
  id: string;
  issuer: string;
  secret: string;
}

export default function Authenticator() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<TOTPAccount[]>([]);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(30);
  const [showAdd, setShowAdd] = useState(false);
  const [newIssuer, setNewIssuer] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadAccounts(user.id);
  }, [user]);

  useEffect(() => {
    if (accounts.length === 0) return;

    function refresh() {
      const now = Date.now();
      const rem = getRemainingSeconds();
      setRemaining(rem);
      accounts.forEach(async (a) => {
        const code = await generateTOTP(a.secret, now);
        setCodes((prev) => ({ ...prev, [a.id]: code }));
      });
    }

    refresh();
    const interval = setInterval(refresh, 1000);
    return () => clearInterval(interval);
  }, [accounts]);

  async function loadAccounts(userId: string) {
    try {
      const data = await authenticatorStorage.download(userId);
      if (data) setAccounts(JSON.parse(data));
    } catch { /* no data yet */ }
    setLoading(false);
  }

  async function saveAccounts(list: TOTPAccount[]) {
    if (!user) return;
    await authenticatorStorage.upload(user.id, JSON.stringify(list));
  }

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  async function handleAdd() {
    const issuer = newIssuer.trim();
    const secret = newSecret.trim().replace(/\s/g, "").toUpperCase();
    if (!issuer || !secret) return notify("Issuer and secret are required.");

    const account: TOTPAccount = {
      id: crypto.randomUUID(),
      issuer,
      secret,
    };
    const updated = [...accounts, account];
    setAccounts(updated);
    await saveAccounts(updated);
    setNewIssuer("");
    setNewSecret("");
    setShowAdd(false);
    notify("Account added");
  }

  async function handleDelete(id: string) {
    const account = accounts.find((a) => a.id === id);
    if (!account) return;
    if (!window.confirm(`Delete "${account.issuer}"?`)) return;
    const updated = accounts.filter((a) => a.id !== id);
    setAccounts(updated);
    await saveAccounts(updated);
    notify("Account deleted");
  }

  async function copyCode(id: string) {
    const code = codes[id];
    if (!code) return;
    await navigator.clipboard.writeText(code);
    notify("Code copied");
  }

  const progress = ((30 - remaining) / 30) * 100;

  if (loading) {
    return <div className="placeholder-page"><div className="placeholder-content"><p>Loading…</p></div></div>;
  }

  return (
    <div className="auth-page">
      <div className="auth-header">
        <h2>Authenticator</h2>
        <button className="btn primary" onClick={() => setShowAdd(true)}>+ Add account</button>
      </div>

      {accounts.length === 0 && !showAdd && (
        <div className="placeholder-content" style={{ marginTop: 60 }}>
          <p>No accounts yet. Add an account to generate TOTP codes.</p>
        </div>
      )}

      <div className="auth-list">
        {accounts.map((a) => (
          <div key={a.id} className={`auth-item ${remaining <= 5 ? "expiring" : ""}`}>
            <div className="auth-info">
              <span className="auth-issuer">{a.issuer}</span>
              <span className="auth-code">{codes[a.id] ? formatCode(codes[a.id]) : "------"}</span>
            </div>
            <div className="auth-actions">
              <button className="btn ghost sm" onClick={() => copyCode(a.id)}>Copy</button>
              <button className="btn ghost sm danger" onClick={() => handleDelete(a.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {accounts.length > 0 && (
        <div className="auth-timer-bar">
          <div className="auth-timer-track">
            <div className="auth-timer-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Add account</h2>
            <label>
              Issuer
              <input value={newIssuer} placeholder="GitHub" onChange={(e) => setNewIssuer(e.target.value)} autoFocus />
            </label>
            <label>
              Secret key
              <input value={newSecret} placeholder="JBSWY3DPEHPK3PXP" onChange={(e) => setNewSecret(e.target.value)} />
            </label>
            <p className="modal-hint">Paste the base32-encoded secret key shown when setting up 2FA.</p>
            <div className="row end">
              <button className="btn ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn primary" onClick={handleAdd}>Add</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
