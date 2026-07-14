<div align="center">
    <img src="./src-tauri/icons/128x128.png" height="128">
    <img src="https://www.vectorlogo.zone/logos/supabase/supabase-icon.svg" height="128" style="margin-left: 16px;">
    <h1>Mocha <code>x</code> Supabase</h1>
    <p>A minimal password manager hand-made using Tauri, Rust, React + Supabase
        </br>Your passwords stay on your machine, synced to your own cloud
    </p>
    <img src="https://img.shields.io/github/repo-size/hunixcode/hotmocha" />
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/hunixcode/hotmocha">
</div>

# Overview

Mocha is my take on a password manager that does exactly what it should and
nothing more : a very simple encrypted vault, protected by a master
password, synced to your own Supabase instance. Feel free to open an issue if you
find something I could potentially work on.

## Features

- Master-password protected vault (AES-256-GCM encryption, key derived with Argon2id)
- **Cloud sync via Supabase** — your vault lives on your own Supabase project, accessible from any machine
- **Email/password authentication** — sign in or sign up to manage your vault
- Full entry management : name, username, password, URL, notes and folder, with
  inline edit / move-to-folder / delete actions on every list entry
- Folders : organize entries and filter by folder in the sidebar, mapped to and
  from Bitwarden folders on import/export
- Password generator (20 chars, letters/digits/symbols, OS cryptographic random source)
- Bitwarden-compatible JSON export & import (unencrypted format)
- Search across name, username and URL, combined with the active folder
- Copy-to-clipboard and show/hide passwords
- Tiny footprint : Tauri uses the OS webview, no bundled Chromium (~3–5 MB binary)
- **In-app setup** — configure your Supabase credentials directly from the UI, no `.env` file needed

## Setup your own instance

This section walks you through everything from zero to a running Mocha app on
your machine. Take your time — the Supabase part is the only non-trivial step.

### 1. Prerequisites

You need three things installed on your machine:

| Tool | How to get it |
|---|---|
| **Node.js + npm** | Download from [nodejs.org](https://nodejs.org) (LTS version is fine) |
| **Rust** | Run `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` then follow the prompts ([rustup.rs](https://rustup.rs)) |
| **Platform deps** | See the table below |

**Platform-specific dependencies:**

- **Windows** — WebView2 (preinstalled on Windows 10/11) + MSVC Build Tools
  ("Desktop development with C++" in the Visual Studio installer)
- **Debian / Ubuntu** —
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
    libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```
- **Arch / Manjaro / EndeavourOS** —
  ```bash
  sudo pacman -Syu
  sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file openssl \
    appmenu-gtk-module libappindicator-gtk3 librsvg
  ```
- **macOS** — `xcode-select --install`

### 2. Create a Supabase project (free)

Mocha uses [Supabase](https://supabase.com) to store your encrypted vault in
the cloud. You get 1 GB of storage for free — more than enough for a password
manager.

1. **Sign up** at [app.supabase.com](https://app.supabase.com) (email, GitHub,
   or Google).
2. **Create a new project** — pick any name and region close to you. Set a
   database password (you won't need it for Mocha, just pick something random).
3. Wait a minute for the project to finish initializing.

### 3. Create the storage bucket and get your API keys

Mocha stores the vault file in a Supabase Storage bucket called `vaults`.

1. In your Supabase dashboard, go to **Storage** in the left sidebar.
2. Click **New bucket**.
3. Name it exactly **`vaults`**.
4. Toggle **Public bucket** OFF (the vault should stay private).
5. Click **Create bucket**.
6. Go to **Project Settings** (gear icon, bottom left) → **API**.
7. Copy the **Project URL** — it looks like
   `https://xxxxxxxx.supabase.co`.
8. Copy the **anon / publishable key** — it's a long string starting with
   `eyJ...`.

### 4. Clone the repo and run

```bash
git clone https://github.com/hunixcode/hotmocha.git
cd hotmocha
npm install
npm run tauri dev
```

The first run compiles all Rust dependencies and takes a few minutes. Subsequent
runs are fast.

### 5. Enter your Supabase credentials

When the app opens, you'll see a **Setup required** page with a form. Paste the
**Project URL** and **anon key** you copied from your Supabase dashboard, then
click **Save & restart**.

> Credentials are stored locally on your machine (localStorage). They are never
> sent anywhere other than your own Supabase project.

Alternatively, you can create a `.env` file at the project root (takes priority
over the in-app form):

```bash
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> The key can also be called `VITE_SUPABASE_ANON_KEY` — both work.

### 6. Create your account and vault

After the app restarts, click **Sign up** to create your account, then **Create
vault** to set your master password. Your vault is now encrypted and synced to
your Supabase storage.

### Build a release binary / installer

```bash
npm run tauri build
```

Outputs land in `src-tauri/target/release/bundle/` (`.msi`/`.exe` on Windows,
`.deb`/`.rpm`/`.AppImage` on Linux, `.app`/`.dmg` on macOS).

## How it works

### Authentication flow

1. On launch, Mocha checks for an active Supabase session.
2. If no session, you see the **Sign in / Sign up** screen. Authentication uses
   Supabase Auth (email + password).
3. After signing in, Mocha checks if a vault exists in Supabase Storage.

### Vault encryption

The vault is an encrypted JSON blob stored in Supabase Storage under your user
ID at `vaults/<user-id>/vault.mocha`. The file holds three base64 fields: a
random 16-byte salt, a random 12-byte nonce, and the ciphertext.

1. When you create or unlock the vault, a 32-byte key is derived from your master
   password and the salt using **Argon2id**.
2. The entry list (JSON) is encrypted with **AES-256-GCM** using that key and a
   fresh random nonce on every save. GCM is authenticated encryption, so any
   tampering — or a wrong master password — is detected and rejected.
3. The key and decrypted entries are held in memory only while the vault is
   unlocked ; locking the vault drops them.

Passwords are never written to disk in plain text. The encrypted blob is uploaded
to Supabase Storage after every mutation. The only exception is a Bitwarden
export, which is unencrypted by design — treat exported files carefully and
delete them after use.

There is no master-password recovery : if you forget it, the vault cannot be
decrypted.

### Code layout

```
hotmocha/
├── index.html                  Entry HTML for the webview
├── package.json                Node dependencies and scripts
├── tsconfig.json               TypeScript configuration
├── vite.config.ts              Vite dev server and build config
├── src/                        Frontend (React + TypeScript)
│   ├── main.tsx                React bootstrap
│   ├── App.tsx                 All screens : auth, create/unlock, vault, dialogs
│   ├── App.css                 Theme and layout
│   ├── types.ts                Shared Entry type
│   └── supabase.ts             Supabase client (reads env vars)
└── src-tauri/                  Backend (Rust)
    ├── Cargo.toml              Rust crate config and dependencies
    ├── tauri.conf.json         Window, bundle and build configuration
    ├── capabilities/           Tauri permission scopes
    ├── icons/                  Application icons
    └── src/
        ├── lib.rs              Crypto, vault persistence and all Tauri commands
        └── main.rs             Binary entry point
```

The frontend handles the UI and Supabase communication (auth + storage). It never
touches the vault file or performs cryptography directly. Instead, it calls Tauri
commands (`create_vault`, `unlock_vault`, `lock_vault`, `get_vault_blob`,
`add_entry`, `update_entry`, `delete_entry`, `export_bitwarden`,
`import_bitwarden`) over Tauri's IPC bridge for all crypto and vault operations.

The data flow is : **User action → React UI → Tauri IPC (Rust) → re-encrypt →
return encrypted blob → React uploads to Supabase Storage**.

## Usage

1. **Sign in / Sign up** — create an account with your email and password. This
   is your Supabase account, separate from the vault master password.
2. **First launch** — choose a master password (minimum 8 characters) to create
   the vault.
3. **Unlock** — enter the master password on later launches. **Lock** (top right)
   closes the session without quitting the app.
4. **Entries** — create with **New entry** ; each list entry also has inline actions
   to edit, move to a folder or delete. **Generate** in the editor fills in a random
   password.
5. **Folders** — type a folder name in the entry editor (existing folders are
   suggested), or use the folder action on a list entry. The sidebar shows all
   folders with entry counts ; click one to filter. A folder disappears automatically
   when its last entry leaves it.
6. **Search** — filters the visible list by name, username or URL.
7. **Sign out** — ends your Supabase session. You'll need to sign in again next
   time.

## Bitwarden compatibility

**Export** saves an unencrypted Bitwarden `.json` including your folders. Import it
in Bitwarden under *Tools → Import data*, format *Bitwarden (json)*.

**Import** accepts an unencrypted Bitwarden `.json` export (in Bitwarden : *Tools →
Export vault*, format *.json* — encrypted exports are rejected). Only login items
(`"type": 1`) are imported ; cards, identities and secure notes are skipped.
Bitwarden folders become Mocha folders, and imported entries are merged into the
existing vault. The expected file shape :

```json
{
  "encrypted": false,
  "folders": [{ "id": "f1", "name": "Work" }],
  "items": [
    {
      "type": 1,
      "name": "Example site",
      "folderId": "f1",
      "notes": "Optional note",
      "login": {
        "username": "you@example.com",
        "password": "secret",
        "uris": [{ "uri": "https://example.com" }]
      }
    }
  ]
}
```

---
