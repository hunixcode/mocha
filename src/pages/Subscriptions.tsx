import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { subscriptionStorage } from "../lib/storage";
import type { Subscription } from "../types";

const CATEGORIES = ["Streaming", "Cloud", "Productivity", "Development", "Music", "News", "Other"];

const SUGGESTED_SUBSCRIPTIONS = [
  // Streaming
  { name: "Netflix", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Disney+", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Max (HBO)", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Hulu", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Amazon Prime Video", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Apple TV+", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Paramount+", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Peacock", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Crunchyroll", category: "Streaming", billingCycle: "monthly" as const },
  { name: "BritBox", category: "Streaming", billingCycle: "monthly" as const },
  { name: "Discovery+", category: "Streaming", billingCycle: "monthly" as const },

  // Music
  { name: "Spotify", category: "Music", billingCycle: "monthly" as const },
  { name: "Apple Music", category: "Music", billingCycle: "monthly" as const },
  { name: "YouTube Music", category: "Music", billingCycle: "monthly" as const },
  { name: "Tidal", category: "Music", billingCycle: "monthly" as const },
  { name: "Deezer", category: "Music", billingCycle: "monthly" as const },
  { name: "Amazon Music", category: "Music", billingCycle: "monthly" as const },

  // Cloud
  { name: "Google One", category: "Cloud", billingCycle: "monthly" as const },
  { name: "iCloud+", category: "Cloud", billingCycle: "monthly" as const },
  { name: "Dropbox", category: "Cloud", billingCycle: "monthly" as const },
  { name: "OneDrive", category: "Cloud", billingCycle: "monthly" as const },
  { name: "MEGA", category: "Cloud", billingCycle: "monthly" as const },
  { name: "Backblaze", category: "Cloud", billingCycle: "yearly" as const },

  // Productivity
  { name: "Microsoft 365", category: "Productivity", billingCycle: "yearly" as const },
  { name: "Google Workspace", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Notion", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Todoist", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Evernote", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Canva Pro", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Figma", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Slack", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Notability", category: "Productivity", billingCycle: "yearly" as const },
  { name: "Obsidian", category: "Productivity", billingCycle: "yearly" as const },

  // Development
  { name: "GitHub Pro", category: "Development", billingCycle: "monthly" as const },
  { name: "GitLab", category: "Development", billingCycle: "monthly" as const },
  { name: "AWS", category: "Development", billingCycle: "monthly" as const },
  { name: "DigitalOcean", category: "Development", billingCycle: "monthly" as const },
  { name: "Vercel", category: "Development", billingCycle: "monthly" as const },
  { name: "Netlify", category: "Development", billingCycle: "monthly" as const },
  { name: "Heroku", category: "Development", billingCycle: "monthly" as const },
  { name: "Railway", category: "Development", billingCycle: "monthly" as const },
  { name: "Linode", category: "Development", billingCycle: "monthly" as const },
  { name: "Supabase", category: "Development", billingCycle: "monthly" as const },
  { name: "Clerk", category: "Development", billingCycle: "monthly" as const },
  { name: "Tailwind CSS", category: "Development", billingCycle: "yearly" as const },

  // VPN / Security
  { name: "NordVPN", category: "Other", billingCycle: "yearly" as const },
  { name: "ExpressVPN", category: "Other", billingCycle: "yearly" as const },
  { name: "Proton VPN", category: "Other", billingCycle: "yearly" as const },
  { name: "Proton Mail", category: "Other", billingCycle: "yearly" as const },
  { name: "1Password", category: "Other", billingCycle: "yearly" as const },
  { name: "Bitwarden", category: "Other", billingCycle: "yearly" as const },
  { name: "Dashlane", category: "Other", billingCycle: "yearly" as const },

  // News
  { name: "Medium", category: "News", billingCycle: "monthly" as const },
  { name: "The New York Times", category: "News", billingCycle: "yearly" as const },
  { name: "The Guardian", category: "News", billingCycle: "monthly" as const },
  { name: "The Washington Post", category: "News", billingCycle: "yearly" as const },
  { name: "Le Monde", category: "News", billingCycle: "monthly" as const },
  { name: "Substack", category: "News", billingCycle: "monthly" as const },
  { name: "Bluesky", category: "News", billingCycle: "monthly" as const },

  // Other
  { name: "Patreon", category: "Other", billingCycle: "monthly" as const },
  { name: "Adobe Creative Cloud", category: "Other", billingCycle: "monthly" as const },
  { name: "Figma Professional", category: "Productivity", billingCycle: "yearly" as const },
  { name: "Cloudflare", category: "Development", billingCycle: "monthly" as const },
  { name: "Namecheap", category: "Development", billingCycle: "yearly" as const },
  { name: "OnlyFans", category: "Other", billingCycle: "monthly" as const },
  { name: "LinkedIn Premium", category: "Productivity", billingCycle: "monthly" as const },
  { name: "ChatGPT Plus", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Claude Pro", category: "Productivity", billingCycle: "monthly" as const },
  { name: "Perplexity Pro", category: "Productivity", billingCycle: "monthly" as const },
];

type FormData = Omit<Subscription, "id" | "createdAt">;

const emptyForm: FormData = {
  name: "",
  category: "Other",
  cost: 0,
  currency: "USD",
  billingCycle: "monthly",
  nextBilling: "",
  notes: "",
};

function costPerMonth(sub: Subscription): number {
  switch (sub.billingCycle) {
    case "weekly": return sub.cost * 4.33;
    case "monthly": return sub.cost;
    case "quarterly": return sub.cost / 3;
    case "yearly": return sub.cost / 12;
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function Subscriptions() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [suggestionQuery, setSuggestionQuery] = useState("");

  useEffect(() => {
    if (!user) return;
    loadSubs(user.id);
  }, [user]);

  async function loadSubs(userId: string) {
    try {
      const data = await subscriptionStorage.download(userId);
      if (data) setSubs(JSON.parse(data));
    } catch { /* no data */ }
    setLoading(false);
  }

  async function saveSubs(list: Subscription[]) {
    if (!user) return;
    await subscriptionStorage.upload(user.id, JSON.stringify(list));
  }

  function notify(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  }

  function openNew() {
    setForm(emptyForm);
    setEditingId(null);
    setSuggestionQuery("");
    setShowForm(true);
  }

  function openEdit(sub: Subscription) {
    setForm({ name: sub.name, category: sub.category, cost: sub.cost, currency: sub.currency, billingCycle: sub.billingCycle, nextBilling: sub.nextBilling, notes: sub.notes });
    setEditingId(sub.id);
    setSuggestionQuery("");
    setShowForm(true);
  }

  function pickSuggestion(sugg: typeof SUGGESTED_SUBSCRIPTIONS[number]) {
    setForm({ ...emptyForm, name: sugg.name, category: sugg.category, billingCycle: sugg.billingCycle });
    setSuggestionQuery("");
  }

  async function handleSave() {
    if (!form.name.trim()) return notify("Name is required.");
    if (!form.nextBilling) return notify("Next billing date is required.");

    if (editingId) {
      const updated = subs.map((s) => s.id === editingId ? { ...s, ...form } : s);
      setSubs(updated as Subscription[]);
      await saveSubs(updated as Subscription[]);
      notify("Saved");
    } else {
      const sub: Subscription = {
        id: crypto.randomUUID(),
        ...form,
        cost: Number(form.cost),
        createdAt: new Date().toISOString(),
      };
      const updated = [...subs, sub];
      setSubs(updated);
      await saveSubs(updated);
      notify("Created");
    }
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    const sub = subs.find((s) => s.id === id);
    if (!sub || !window.confirm(`Delete "${sub.name}"?`)) return;
    const updated = subs.filter((s) => s.id !== id);
    setSubs(updated);
    await saveSubs(updated);
    notify("Deleted");
  }

  const totalMonthly = subs.reduce((sum, s) => sum + costPerMonth(s), 0);
  const totalYearly = subs.reduce((sum, s) => {
    switch (s.billingCycle) {
      case "weekly": return sum + s.cost * 52;
      case "monthly": return sum + s.cost * 12;
      case "quarterly": return sum + s.cost * 4;
      case "yearly": return sum + s.cost;
    }
  }, 0);

  const now = new Date();
  const upcoming = subs.filter((s) => {
    const d = new Date(s.nextBilling);
    return d >= now && daysUntil(s.nextBilling) <= 30;
  }).sort((a, b) => new Date(a.nextBilling).getTime() - new Date(b.nextBilling).getTime());

  const isAdding = showForm && !editingId;
  const filteredSuggestions = useMemo(() => {
    if (!suggestionQuery.trim()) return SUGGESTED_SUBSCRIPTIONS;
    const q = suggestionQuery.toLowerCase();
    return SUGGESTED_SUBSCRIPTIONS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)
    );
  }, [suggestionQuery]);

  if (loading) {
    return <div className="placeholder-page"><div className="placeholder-content"><p>Loading…</p></div></div>;
  }

  return (
    <div className="subs-page">
      <div className="subs-header">
        <h2>Subscriptions</h2>
        <button className="btn primary" onClick={openNew}>+ Add subscription</button>
      </div>

      <div className="subs-summary">
        <div className="summary-card">
          <span className="summary-label">Monthly</span>
          <span className="summary-value">${totalMonthly.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Yearly</span>
          <span className="summary-value">${totalYearly.toFixed(2)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total subs</span>
          <span className="summary-value">{subs.length}</span>
        </div>
        {upcoming.length > 0 && (
          <div className="summary-card accent">
            <span className="summary-label">Due in 30 days</span>
            <span className="summary-value">{upcoming.length}</span>
          </div>
        )}
      </div>

      {upcoming.length > 0 && (
        <div className="subs-upcoming">
          <h3>Upcoming renewals</h3>
          <div className="subs-upcoming-list">
            {upcoming.map((s) => (
              <div key={s.id} className="subs-upcoming-item">
                <span className="subs-upcoming-name">{s.name}</span>
                <span className="subs-upcoming-date">{formatDate(s.nextBilling)} ({daysUntil(s.nextBilling)}d)</span>
                <span className="subs-upcoming-cost">${s.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subs.length === 0 && (
        <div className="placeholder-content" style={{ marginTop: 40 }}>
          <p>No subscriptions yet. Add one to start tracking.</p>
        </div>
      )}

      <div className="subs-list">
        {subs.map((s) => {
          const dueDays = daysUntil(s.nextBilling);
          const isDue = dueDays <= 7;
          return (
            <div key={s.id} className={`subs-item ${isDue ? "due-soon" : ""}`}>
              <div className="subs-item-info">
                <span className="subs-item-name">{s.name}</span>
                <span className={`subs-cat cat-${s.category.toLowerCase()}`}>{s.category}</span>
                <span className="subs-item-date">{formatDate(s.nextBilling)}{dueDays > 0 && ` (${dueDays}d)`}</span>
              </div>
              <div className="subs-item-cost">
                <span className="subs-cost-value">${s.cost.toFixed(2)}</span>
                <span className="subs-cost-cycle">/{s.billingCycle}</span>
              </div>
              <div className="subs-item-actions">
                <button className="btn ghost sm" onClick={() => openEdit(s)}>Edit</button>
                <button className="btn ghost sm danger" onClick={() => handleDelete(s.id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal subs-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? "Edit subscription" : "Add subscription"}</h2>

            {isAdding && (
              <div className="suggestion-panel">
                <input
                  className="search"
                  placeholder="Search popular subscriptions…"
                  value={suggestionQuery}
                  onChange={(e) => setSuggestionQuery(e.target.value)}
                  autoFocus
                />
                {filteredSuggestions.length > 0 && (
                  <div className="suggestion-list">
                    {filteredSuggestions.map((s) => (
                      <button
                        key={s.name}
                        className="suggestion-item"
                        onClick={() => pickSuggestion(s)}
                      >
                        <span className="suggestion-name">{s.name}</span>
                        <span className={`subs-cat cat-${s.category.toLowerCase()}`}>{s.category}</span>
                        <span className="suggestion-cycle">{s.billingCycle}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <label>
              Name <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus={!isAdding} />
            </label>
            <div className="row">
              <label style={{ flex: 1 }}>
                Cost <input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} />
              </label>
              <label style={{ flex: 1 }}>
                Currency
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="XPF">XPF (₣)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="CHF">CHF (Fr)</option>
                  <option value="CNY">CNY (¥)</option>
                  <option value="DKK">DKK (kr)</option>
                  <option value="HKD">HKD (HK$)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="KRW">KRW (₩)</option>
                  <option value="MXN">MXN (MX$)</option>
                  <option value="NOK">NOK (kr)</option>
                  <option value="NZD">NZD (NZ$)</option>
                  <option value="PLN">PLN (zł)</option>
                  <option value="SEK">SEK (kr)</option>
                  <option value="SGD">SGD (S$)</option>
                  <option value="TWD">TWD (NT$)</option>
                </select>
              </label>
            </div>
            <div className="row">
              <label style={{ flex: 1 }}>
                Category
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </label>
              <label style={{ flex: 1 }}>
                Billing cycle
                <select value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value as Subscription["billingCycle"] })}>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="weekly">Weekly</option>
                </select>
              </label>
            </div>
            <label>
              Next billing date <input type="date" value={form.nextBilling} onChange={(e) => setForm({ ...form, nextBilling: e.target.value })} />
            </label>
            <label>
              Notes <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </label>
            <div className="row end">
              <button className="btn ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
