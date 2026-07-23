<div align="center">
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#c8956c" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M4 8h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V8z"/>
    <path d="M15 9.5h1.5a2.5 2.5 0 0 1 0 5H15"/>
    <path d="M5 21h12"/>
  </svg>
  <h1>Mocha Suite</h1>
  <p>A personal suite of privacy tools — password manager, authenticator, subscriptions.</p>
  <p>Built with Tauri, Rust, React + Supabase</p>
  <img src="https://img.shields.io/github/repo-size/hunixcode/mocha" />
  <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/hunixcode/mocha">
</div>

# Overview

Mocha Suite is a desktop application that brings together the privacy tools you use
every day into one place. No cloud dependencies, no subscriptions — just your own
Supabase instance and your own data.

**Apps included:**

- **Password Manager** — AES-256-GCM encrypted vault synced to your Supabase storage,
  protected by a master password (Argon2id key derivation)
- **Authenticator** — TOTP (RFC 6238) two-factor codes generated from base32 secrets,
  stored securely in your Supabase storage
- **Subscriptions** — track recurring subscriptions with cost summaries, upcoming
  renewals, and category management

## Features

### Password Manager
- Master-password protected vault (AES-256-GCM, key derived with Argon2id)
- Cloud sync via Supabase — your vault lives on your own Supabase project
- Full entry management : name, username, password, URL, notes, folders
- Folders with sidebar filtering (mapped to/from Bitwarden)
- Password generator (20 chars, cryptographic random source)
- Bitwarden-compatible JSON export & import
- Search across name, username and URL
- Copy-to-clipboard and show/hide passwords

### Authenticator
- TOTP code generation (RFC 6238, HMAC-SHA1, 6-digit, 30-second window)
- Live countdown bar showing time until next code refresh
- Manual secret entry (base32)
- Copy code to clipboard
- Persisted to Supabase storage

### Subscriptions
- Full CRUD for recurring subscriptions
- Monthly / yearly / quarterly / weekly billing cycles
- Monthly and yearly spend totals
- Upcoming renewals (next 30 days)
- 66 popular subscription presets with search
- Color-coded category badges
- 20 supported currencies (including XPF)
- Persisted to Supabase storage

### General
- Email/password authentication via Supabase Auth
- **6 themes** — Mocha (default), Latte, Espresso, Matcha, Midnight, Caramel
- **6 languages** — English, Français, Español, 中文, 한국어, Русский
- Persistent sidebar navigation
- In-app Supabase setup (no `.env` file required)
- Tiny footprint : Tauri uses the OS webview, no bundled Chromium (~3–5 MB binary)

## Setup your own instance

### 1. Prerequisites

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

Mocha Suite uses [Supabase](https://supabase.com) for authentication and storage.
You get 1 GB of storage for free.

1. Sign up at [app.supabase.com](https://app.supabase.com).
2. Create a new project — pick any name and region.
3. Wait for the project to finish initializing.

### 3. Create a storage bucket

Mocha Suite stores data in a Supabase Storage bucket called `vaults`.

1. In your Supabase dashboard, go to **Storage**.
2. Click **New bucket**, name it **`vaults`**, toggle **Public bucket** OFF.
3. Click **Create bucket**.
4. Go to **Project Settings** → **API**.
5. Copy the **Project URL** and the **anon / publishable key**.

### 4. Clone and run

```bash
git clone https://github.com/hunixcode/mocha.git
cd mocha
npm install
npm run tauri dev
```

The first run compiles all Rust dependencies and takes a few minutes.

### 5. Enter your Supabase credentials

When the app opens, paste the **Project URL** and **anon key**, then click
**Save & restart**.

Alternatively, create a `.env` file at the project root:

```bash
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Create your account

After the app restarts, sign up with your email and password. You'll land on the
Dashboard where you can access all apps.

### Build a release binary

```bash
npm run tauri build
```

Outputs land in `src-tauri/target/release/bundle/`.

## How it works

### Authentication flow

1. On launch, Mocha Suite checks for an active Supabase session.
2. If no session, you see the **Sign in / Sign up** screen.
3. After signing in, the **Dashboard** opens with access to all apps.
4. The **Password Manager** additionally requires a master password to unlock
   the vault.

### Vault encryption (Password Manager)

The vault is an encrypted JSON blob stored in Supabase Storage at
`vaults/<user-id>/vault.mocha`.

1. A 32-byte key is derived from your master password and a random salt using
   **Argon2id**.
2. Entries are encrypted with **AES-256-GCM** with a fresh random nonce on every
   save.
3. The key and decrypted entries are held in memory only while the vault is
   unlocked.

There is no master-password recovery — if you forget it, the vault cannot be
decrypted.

### Authenticator

TOTP secrets are stored as JSON in Supabase Storage. Codes are generated
client-side using the Web Crypto API (HMAC-SHA1).

### Subscriptions

Subscription data is stored as JSON in Supabase Storage. The app computes
monthly/yearly totals and upcoming renewals from the stored data.

## Code layout

```
mocha/
├── index.html                  Entry HTML
├── package.json                Dependencies and scripts
├── src/                        Frontend (React + TypeScript)
│   ├── main.tsx                Bootstrap with providers
│   ├── App.tsx                 Router and gate screen
│   ├── App.css                 All styles
│   ├── types.ts                Shared types
│   ├── supabase.ts             Supabase client
│   ├── contexts/               React contexts (Auth, Theme, I18n)
│   ├── components/             Layout, Sidebar, Topbar, Gate, Icons
│   ├── pages/                  Dashboard, PasswordManager, Authenticator,
│   │                           Subscriptions, Settings
│   └── lib/                    Storage helpers, TOTP, translations
└── src-tauri/                  Backend (Rust)
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/
    ├── icons/
    └── src/
        ├── lib.rs              Crypto and Tauri commands
        └── main.rs             Entry point
```

## Usage

1. **Dashboard** — landing page with cards for each app.
2. **Password Manager** — unlock with your master password, then manage entries.
   Lock returns to the unlock screen.
3. **Authenticator** — add accounts by pasting the base32 secret from your 2FA
   setup page. Codes refresh every 30 seconds.
4. **Subscriptions** — search from 66 popular presets or add manually. Summary
   cards show monthly/yearly spend and upcoming renewals.
5. **Settings** — switch between 6 themes and 6 languages.
