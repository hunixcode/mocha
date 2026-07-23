import { FormEvent, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { useAuth } from "../contexts/AuthContext";
import { vaultStorage } from "../lib/storage";
import { Entry } from "../types";
import { Logo, ActionIcon, ICON_EDIT, ICON_FOLDER, ICON_TRASH } from "../components/Icons";

const emptyForm: Entry = {
  id: "", name: "", username: "", password: "", url: "", notes: "", folder: "",
};

type PwScreen = "checking" | "create" | "unlock" | "vault";

export default function PasswordManager() {
  const { user, signOut } = useAuth();
  const [pwScreen, setPwScreen] = useState<PwScreen>("checking");
  const [master, setMaster] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Entry>(emptyForm);
  const [showPw, setShowPw] = useState(false);
  const [toast, setToast] = useState("");
  const [showImportInfo, setShowImportInfo] = useState(false);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [moveEntry, setMoveEntry] = useState<Entry | null>(null);
  const [moveFolder, setMoveFolder] = useState("");

  useEffect(() => {
    if (!user) return;
    checkVault(user.id);
  }, [user]);

  async function checkVault(userId: string) {
    try {
      const vaultData = await vaultStorage.download(userId);
      if (vaultData) {
        setPwScreen("unlock");
      } else {
        setPwScreen("create");
      }
    } catch {
      setPwScreen("create");
    }
  }

  const folders = useMemo(
    () => Array.from(new Set(entries.map((e) => e.folder).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [entries]
  );
  const unfiledCount = useMemo(() => entries.filter((e) => !e.folder).length, [entries]);

  useEffect(() => {
    if (activeFolder === null) return;
    const gone = activeFolder === "" ? unfiledCount === 0 : !folders.includes(activeFolder);
    if (gone) setActiveFolder(null);
  }, [activeFolder, folders, unfiledCount]);

  const filtered = useMemo(() => {
    const inFolder = activeFolder === null ? entries : entries.filter((e) => activeFolder === "" ? !e.folder : e.folder === activeFolder);
    const q = search.trim().toLowerCase();
    const list = q ? inFolder.filter((e) => e.name.toLowerCase().includes(q) || e.username.toLowerCase().includes(q) || e.url.toLowerCase().includes(q)) : inFolder;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [entries, search, activeFolder]);

  const selected = entries.find((e) => e.id === selectedId) ?? null;

  function notify(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(""), 1800);
  }

  function enterVault(list: Entry[]) {
    setEntries(list);
    setPwScreen("vault");
    setMaster("");
    setConfirm("");
    setError("");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (master.length < 8) return setError("Master password must be at least 8 characters.");
    if (master !== confirm) return setError("Passwords do not match.");
    if (!user) return setError("Not authenticated.");
    try {
      const [list, blob] = await invoke<[Entry[], string]>("create_vault", { master });
      await vaultStorage.upload(user.id, blob);
      enterVault(list);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!user) return setError("Not authenticated.");
    try {
      const vaultData = await vaultStorage.download(user.id);
      if (!vaultData) return setError("No vault found on server.");
      const list = await invoke<Entry[]>("unlock_vault", { master, vaultData });
      enterVault(list);
    } catch (err) {
      setError(String(err));
    }
  }

  async function handleLock() {
    await invoke("lock_vault");
    setEntries([]);
    setSelectedId(null);
    setEditing(false);
    setPwScreen("unlock");
  }

  function startNew() {
    setForm({ ...emptyForm, folder: activeFolder ?? "" });
    setSelectedId(null);
    setEditing(true);
    setShowPw(false);
  }

  function startEdit(entry: Entry) {
    setForm(entry);
    setEditing(true);
    setShowPw(false);
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return notify("Name is required");
    if (!user) return notify("Not authenticated");
    const entry = { ...form, folder: form.folder.trim() };
    try {
      if (entry.id) {
        const blob = await invoke<string>("update_entry", { entry });
        setEntries((prev) => prev.map((x) => (x.id === entry.id ? entry : x)));
        setSelectedId(entry.id);
        await vaultStorage.upload(user.id, blob);
      } else {
        const [created, blob] = await invoke<[Entry, string]>("add_entry", { entry });
        setEntries((prev) => [...prev, created]);
        setSelectedId(created.id);
        await vaultStorage.upload(user.id, blob);
      }
      setEditing(false);
      notify("Saved");
    } catch (err) {
      notify(String(err));
    }
  }

  async function handleDelete(entry: Entry) {
    if (!window.confirm(`Delete "${entry.name}"?`)) return;
    if (!user) return notify("Not authenticated");
    try {
      const blob = await invoke<string>("delete_entry", { id: entry.id });
      setEntries((prev) => prev.filter((x) => x.id !== entry.id));
      setSelectedId(null);
      setEditing(false);
      await vaultStorage.upload(user.id, blob);
      notify("Deleted");
    } catch (err) {
      notify(String(err));
    }
  }

  async function handleMove() {
    if (!moveEntry || !user) return;
    const entry = { ...moveEntry, folder: moveFolder.trim() };
    try {
      const blob = await invoke<string>("update_entry", { entry });
      setEntries((prev) => prev.map((x) => (x.id === entry.id ? entry : x)));
      await vaultStorage.upload(user.id, blob);
      setMoveEntry(null);
      notify(entry.folder ? `Moved to ${entry.folder}` : "Removed from folder");
    } catch (err) {
      notify(String(err));
    }
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    notify(`${label} copied`);
  }

  async function handleExport() {
    try {
      const path = await save({ defaultPath: "mocha-bitwarden.json", filters: [{ name: "JSON", extensions: ["json"] }] });
      if (!path) return;
      await invoke("export_bitwarden", { path });
      notify("Vault exported");
    } catch (err) {
      notify(String(err));
    }
  }

  async function handleImport() {
    setShowImportInfo(false);
    if (!user) return notify("Not authenticated");
    try {
      const path = await open({ multiple: false, filters: [{ name: "JSON", extensions: ["json"] }] });
      if (!path) return;
      const [list, blob] = await invoke<[Entry[], string]>("import_bitwarden", { path });
      setEntries(list);
      await vaultStorage.upload(user.id, blob);
      notify("Vault imported");
    } catch (err) {
      notify(String(err));
    }
  }

  function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
    const bytes = new Uint32Array(20);
    crypto.getRandomValues(bytes);
    const pw = Array.from(bytes, (b) => chars[b % chars.length]).join("");
    setForm((f) => ({ ...f, password: pw }));
    setShowPw(true);
  }

  // --- Create / Unlock screens ---
  if (pwScreen === "create" || pwScreen === "unlock") {
    const creating = pwScreen === "create";
    return (
      <div className="vault-gate">
        <form className="vault-gate-card" onSubmit={creating ? handleCreate : handleUnlock}>
          <div className="logo"><Logo size={44} /></div>
          <h1>Mocha</h1>
          <p className="tagline">
            {creating ? "Set a master password to encrypt your vault." : "Enter your master password to unlock your vault."}
          </p>
          <input type="password" placeholder="Master password" value={master} onChange={(e) => setMaster(e.target.value)} autoFocus />
          {creating && (
            <input type="password" placeholder="Confirm master password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          )}
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn primary">{creating ? "Create vault" : "Unlock"}</button>
          <button type="button" className="btn ghost" onClick={signOut}>Sign out</button>
        </form>
      </div>
    );
  }

  // --- Checking ---
  if (pwScreen === "checking") {
    return (
      <div className="vault-gate">
        <div className="logo"><Logo size={44} /></div>
      </div>
    );
  }

  // --- Vault view ---
  return (
    <div className="vault">
      <div className="vault-actions">
        <span className="count">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
        <button className="btn ghost" onClick={() => setShowImportInfo(true)}>Import</button>
        <button className="btn ghost" onClick={handleExport}>Export</button>
        <button className="btn primary" onClick={handleLock}>Lock</button>
      </div>
      <div className="body">
        <aside className="sidebar">
          <input className="search" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {folders.length > 0 && (
            <div className="folders">
              <button className={`folder ${activeFolder === null ? "active" : ""}`} onClick={() => setActiveFolder(null)}>
                <span>All items</span>
                <span className="folder-count">{entries.length}</span>
              </button>
              {folders.map((f) => (
                <button key={f} className={`folder ${activeFolder === f ? "active" : ""}`} onClick={() => setActiveFolder(f)}>
                  <span>{f}</span>
                  <span className="folder-count">{entries.filter((e) => e.folder === f).length}</span>
                </button>
              ))}
              {unfiledCount > 0 && (
                <button className={`folder ${activeFolder === "" ? "active" : ""}`} onClick={() => setActiveFolder("")}>
                  <span>No folder</span>
                  <span className="folder-count">{unfiledCount}</span>
                </button>
              )}
            </div>
          )}
          <div className="list">
            {filtered.map((entry) => {
              const select = () => { setSelectedId(entry.id); setEditing(false); setShowPw(false); };
              return (
                <div key={entry.id} className={`item ${entry.id === selectedId ? "active" : ""}`} role="button" tabIndex={0} onClick={select} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); } }}>
                  <div className="item-text">
                    <span className="item-name">{entry.name}</span>
                    <span className="item-user">{entry.username}</span>
                  </div>
                  <div className="item-actions">
                    <button className="icon-btn" title="Edit entry" aria-label={`Edit ${entry.name}`} onClick={(e) => { e.stopPropagation(); setSelectedId(entry.id); startEdit(entry); }}>
                      <ActionIcon path={ICON_EDIT} />
                    </button>
                    <button className="icon-btn" title="Move to folder" aria-label={`Move ${entry.name} to folder`} onClick={(e) => { e.stopPropagation(); setMoveFolder(entry.folder); setMoveEntry(entry); }}>
                      <ActionIcon path={ICON_FOLDER} />
                    </button>
                    <button className="icon-btn danger" title="Delete entry" aria-label={`Delete ${entry.name}`} onClick={(e) => { e.stopPropagation(); handleDelete(entry); }}>
                      <ActionIcon path={ICON_TRASH} />
                    </button>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="empty">No entries</div>}
          </div>
          <button className="btn primary wide" onClick={startNew}>+ New entry</button>
        </aside>

        <main className="detail">
          {editing ? (
            <form className="card" key={form.id || "new"} onSubmit={handleSave}>
              <h2>{form.id ? "Edit entry" : "New entry"}</h2>
              <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></label>
              <label>Username<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
              <label>
                Password
                <div className="row">
                  <input type={showPw ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button type="button" className="btn ghost" onClick={() => setShowPw(!showPw)}>{showPw ? "Hide" : "Show"}</button>
                  <button type="button" className="btn ghost" onClick={generatePassword}>Generate</button>
                </div>
              </label>
              <label>URL<input value={form.url} placeholder="https://…" onChange={(e) => setForm({ ...form, url: e.target.value })} /></label>
              <label>Folder<input list="folder-options" value={form.folder} placeholder="None" onChange={(e) => setForm({ ...form, folder: e.target.value })} /></label>
              <label>Notes<textarea rows={4} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
              <div className="row end">
                <button type="button" className="btn ghost" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn primary">Save</button>
              </div>
            </form>
          ) : selected ? (
            <div className="card" key={selected.id}>
              <h2>{selected.name}</h2>
              <div className="field">
                <span className="label">Username</span>
                <span className="value">{selected.username || "—"}</span>
                {selected.username && <button className="btn ghost sm" onClick={() => copy(selected.username, "Username")}>Copy</button>}
              </div>
              <div className="field">
                <span className="label">Password</span>
                <span className="value mono">{selected.password ? (showPw ? selected.password : "••••••••••") : "—"}</span>
                {selected.password && (
                  <>
                    <button className="btn ghost sm" onClick={() => setShowPw(!showPw)}>{showPw ? "Hide" : "Show"}</button>
                    <button className="btn ghost sm" onClick={() => copy(selected.password, "Password")}>Copy</button>
                  </>
                )}
              </div>
              <div className="field">
                <span className="label">URL</span>
                <span className="value">{selected.url || "—"}</span>
                {selected.url && <button className="btn ghost sm" onClick={() => copy(selected.url, "URL")}>Copy</button>}
              </div>
              <div className="field">
                <span className="label">Folder</span>
                <span className="value">{selected.folder || "—"}</span>
              </div>
              <div className="field notes">
                <span className="label">Notes</span>
                <span className="value pre">{selected.notes || "—"}</span>
              </div>
              <div className="row end">
                <button className="btn danger" onClick={() => handleDelete(selected)}>Delete</button>
                <button className="btn primary" onClick={() => startEdit(selected)}>Edit</button>
              </div>
            </div>
          ) : (
            <div className="placeholder">
              <div className="logo"><Logo size={48} /></div>
              <p>Select an entry, or create a new one.</p>
            </div>
          )}
        </main>
      </div>

      <datalist id="folder-options">
        {folders.map((f) => (<option key={f} value={f} />))}
      </datalist>

      {moveEntry && (
        <div className="modal-overlay" onClick={() => setMoveEntry(null)}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Move to folder</h2>
            <p>Choose a folder for <strong>{moveEntry.name}</strong>. Type a new name to create a folder, or leave empty to remove it from its folder.</p>
            <input list="folder-options" value={moveFolder} placeholder="None" autoFocus onChange={(e) => setMoveFolder(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleMove(); } }} />
            <div className="row end">
              <button className="btn ghost" onClick={() => setMoveEntry(null)}>Cancel</button>
              <button className="btn primary" onClick={handleMove}>Move</button>
            </div>
          </div>
        </div>
      )}

      {showImportInfo && (
        <div className="modal-overlay" onClick={() => setShowImportInfo(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>Import from Bitwarden</h2>
            <p>Mocha imports <strong>unencrypted Bitwarden JSON exports</strong>. In Bitwarden, go to <em>Tools → Export vault</em> and choose the <em>.json</em> format (not <em>.json (Encrypted)</em> — encrypted exports are rejected).</p>
            <p>The file must contain an <code>items</code> array. It should look like this:</p>
            <pre className="code-sample">{`{\n  "encrypted": false,\n  "items": [\n    {\n      "type": 1,\n      "name": "Example site",\n      "notes": "Optional note",\n      "login": {\n        "username": "you@example.com",\n        "password": "secret",\n        "uris": [{ "uri": "https://example.com" }]\n      }\n    }\n  ]\n}`}</pre>
            <p className="modal-hint">Only login items (<code>"type": 1</code>) are imported — cards, identities and secure notes are skipped. Bitwarden folders are imported as Mocha folders. Imported entries are added to your existing vault.</p>
            <div className="row end">
              <button className="btn ghost" onClick={() => setShowImportInfo(false)}>Cancel</button>
              <button className="btn primary" onClick={handleImport}>Choose file…</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
