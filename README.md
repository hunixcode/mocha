<div align="center">
    <img src="./src-tauri/icons/128x128.png" height="128">
    <h1>Cortado</h1>
    <p>A minimal password manager hand-made using Tauri, Rust, React
        </br>Your passwords stay on your machine
    </p>
    <img src="https://img.shields.io/github/repo-size/hunixcode/cortado" />
    <img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/hunixcode/cortado">
</div>

# Overview

Cortado is my take on a password manager that does exactly what it should and
nothing more : a very simple encrypted vault file on your disk, it'll be protected by a master
password. Feel free to open an issue if you find something I
could potentialy work on.

## Quickstart

*Requirements : latest npm & nodejs versions + a stable [Rust](https://rustup.rs) toolchain*

Platform dependencies :

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

Then clone and run :

```bash
git clone https://github.com/hunixcode/cortado.git
cd cortado
npm install
npm run tauri dev
```

The first run compiles all Rust dependencies and takes a few minutes ; subsequent
runs are fast.

To build a release binary / installer :

```bash
npm run tauri build
```

Outputs land in `src-tauri/target/release/bundle/` (`.msi`/`.exe` on Windows,
`.deb`/`.rpm`/`.AppImage` on Linux, `.app`/`.dmg` on macOS).

## Featuring

- Master-password protected vault (AES-256-GCM encryption, key derived with Argon2id)
- Full entry management : name, username, password, URL, notes and folder, with
  inline edit / move-to-folder / delete actions on every list entry
- Folders : organize entries and filter by folder in the sidebar, mapped to and
  from Bitwarden folders on import/export
- Password generator (20 chars, letters/digits/symbols, OS cryptographic random source)
- Bitwarden-compatible JSON export & import (unencrypted format)
- Search across name, username and URL, combined with the active folder
- Copy-to-clipboard and show/hide passwords
- Tiny footprint : Tauri uses the OS webview, no bundled Chromium (~3–5 MB binary)

## How it works

The vault is a single file, `vault.cortado`, in your OS application-data directory :

| OS | Path |
|---|---|
| Windows | `%APPDATA%\com.cortado.app\vault.cortado` |
| Linux | `~/.local/share/com.cortado.app/vault.cortado` |
| macOS | `~/Library/Application Support/com.cortado.app/vault.cortado` |

The file holds three base64 fields : a random 16-byte salt, a random 12-byte nonce
and the ciphertext.

1. When you create or unlock the vault, a 32-byte key is derived from your master
   password and the salt using **Argon2id**.
2. The entry list (JSON) is encrypted with **AES-256-GCM** using that key and a
   fresh random nonce on every save. GCM is authenticated encryption, so any
   tampering with the file — or a wrong master password — is detected and rejected.
3. The key and decrypted entries are held in memory only while the vault is
   unlocked ; locking the vault drops them.

Passwords are never written to disk in plain text. The only exception is a
Bitwarden export, which is unencrypted by design — treat exported files carefully
and delete them after use. There is no master-password recovery : if you forget
it, the vault cannot be decrypted.

Code layout :

```
cortado/
├── index.html              Entry HTML for the webview
├── src/                    Frontend (React + TypeScript)
│   ├── main.tsx            React bootstrap
│   ├── App.tsx             All screens : create/unlock gate, vault, dialogs
│   ├── App.css             Theme and layout
│   └── types.ts            Shared Entry type
└── src-tauri/              Backend (Rust)
    ├── src/lib.rs          Crypto, vault persistence and all Tauri commands
    ├── src/main.rs         Binary entry point
    ├── tauri.conf.json     Window, bundle and build configuration
    └── capabilities/       Tauri permission scopes
```

The frontend never touches the vault file or any cryptography. It calls Tauri
commands (`create_vault`, `unlock_vault`, `lock_vault`, `add_entry`, `update_entry`,
`delete_entry`, `export_bitwarden`, `import_bitwarden`) over Tauri's IPC bridge ;
all crypto and file I/O happen in the Rust process.

## Usage

1. **First launch** — choose a master password (minimum 8 characters) to create the vault.
2. **Unlock** — enter the master password on later launches. **Lock** (top right)
   closes the session without quitting the app.
3. **Entries** — create with **New entry** ; each list entry also has inline actions
   to edit, move to a folder or delete. **Generate** in the editor fills in a random
   password.
4. **Folders** — type a folder name in the entry editor (existing folders are
   suggested), or use the folder action on a list entry. The sidebar shows all
   folders with entry counts ; click one to filter. A folder disappears automatically
   when its last entry leaves it.
5. **Search** — filters the visible list by name, username or URL.

## Bitwarden compatibility

**Export** saves an unencrypted Bitwarden `.json` including your folders. Import it
in Bitwarden under *Tools → Import data*, format *Bitwarden (json)*.

**Import** accepts an unencrypted Bitwarden `.json` export (in Bitwarden : *Tools →
Export vault*, format *.json* — encrypted exports are rejected). Only login items
(`"type": 1`) are imported ; cards, identities and secure notes are skipped.
Bitwarden folders become Cortado folders, and imported entries are merged into the
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
