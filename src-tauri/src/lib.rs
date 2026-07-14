use std::{collections::HashMap, sync::Mutex};

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use argon2::Argon2;
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::State;

#[derive(Clone, Serialize, Deserialize, Default)]
pub struct Entry {
    pub id: String,
    pub name: String,
    pub username: String,
    pub password: String,
    pub url: String,
    pub notes: String,
    #[serde(default)]
    pub folder: String,
}

#[derive(Serialize, Deserialize)]
struct VaultFile {
    salt: String,
    nonce: String,
    data: String,
}

struct Session {
    key: [u8; 32],
    salt: [u8; 16],
    entries: Vec<Entry>,
    vault_blob: String,
}

#[derive(Default)]
pub struct AppState(Mutex<Option<Session>>);

fn derive_key(master: &str, salt: &[u8; 16]) -> Result<[u8; 32], String> {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(master.as_bytes(), salt, &mut key)
        .map_err(|e| e.to_string())?;
    Ok(key)
}

fn encrypt(key: &[u8; 32], plaintext: &[u8]) -> Result<(Vec<u8>, [u8; 12]), String> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    let mut nonce = [0u8; 12];
    rand::thread_rng().fill_bytes(&mut nonce);
    let ct = cipher
        .encrypt(Nonce::from_slice(&nonce), plaintext)
        .map_err(|e| e.to_string())?;
    Ok((ct, nonce))
}

fn decrypt(key: &[u8; 32], nonce: &[u8], ciphertext: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(key));
    cipher
        .decrypt(Nonce::from_slice(nonce), ciphertext)
        .map_err(|_| "Wrong master password or corrupted vault".to_string())
}

fn re_encrypt(session: &Session) -> Result<String, String> {
    let plaintext = serde_json::to_vec(&session.entries).map_err(|e| e.to_string())?;
    let (ct, nonce) = encrypt(&session.key, &plaintext)?;
    let file = VaultFile {
        salt: B64.encode(session.salt),
        nonce: B64.encode(nonce),
        data: B64.encode(ct),
    };
    serde_json::to_string(&file).map_err(|e| e.to_string())
}

fn with_session<T>(
    state: &State<AppState>,
    f: impl FnOnce(&mut Session) -> Result<T, String>,
) -> Result<T, String> {
    let mut guard = state.0.lock().map_err(|_| "State lock poisoned".to_string())?;
    let session = guard.as_mut().ok_or_else(|| "Vault is locked".to_string())?;
    f(session)
}

#[tauri::command]
fn create_vault(
    state: State<AppState>,
    master: String,
) -> Result<(Vec<Entry>, String), String> {
    if master.len() < 8 {
        return Err("Master password must be at least 8 characters".into());
    }
    let mut salt = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut salt);
    let key = derive_key(&master, &salt)?;
    let entries: Vec<Entry> = Vec::new();
    let session = Session {
        key,
        salt,
        entries: entries.clone(),
        vault_blob: String::new(),
    };
    let blob = re_encrypt(&session)?;
    let mut final_session = session;
    final_session.vault_blob = blob.clone();
    *state.0.lock().map_err(|_| "State lock poisoned".to_string())? = Some(final_session);
    Ok((entries, blob))
}

#[tauri::command]
fn unlock_vault(
    state: State<AppState>,
    master: String,
    vault_data: String,
) -> Result<Vec<Entry>, String> {
    let file: VaultFile =
        serde_json::from_str(&vault_data).map_err(|e| format!("Invalid vault data: {e}"))?;
    let salt_vec = B64.decode(file.salt).map_err(|e| e.to_string())?;
    let salt: [u8; 16] = salt_vec
        .try_into()
        .map_err(|_| "Corrupted vault (salt)".to_string())?;
    let nonce = B64.decode(file.nonce).map_err(|e| e.to_string())?;
    let data = B64.decode(file.data).map_err(|e| e.to_string())?;
    let key = derive_key(&master, &salt)?;
    let plaintext = decrypt(&key, &nonce, &data)?;
    let entries: Vec<Entry> = serde_json::from_slice(&plaintext).map_err(|e| e.to_string())?;
    let result = entries.clone();
    *state.0.lock().map_err(|_| "State lock poisoned".to_string())? = Some(Session {
        key,
        salt,
        entries,
        vault_blob: vault_data,
    });
    Ok(result)
}

#[tauri::command]
fn lock_vault(state: State<AppState>) -> Result<(), String> {
    *state.0.lock().map_err(|_| "State lock poisoned".to_string())? = None;
    Ok(())
}

#[tauri::command]
fn get_vault_blob(state: State<AppState>) -> Result<String, String> {
    with_session(&state, |s| Ok(s.vault_blob.clone()))
}

#[tauri::command]
fn add_entry(state: State<AppState>, mut entry: Entry) -> Result<(Entry, String), String> {
    with_session(&state, |s| {
        entry.id = uuid::Uuid::new_v4().to_string();
        s.entries.push(entry.clone());
        let blob = re_encrypt(s)?;
        s.vault_blob = blob.clone();
        Ok((entry, blob))
    })
}

#[tauri::command]
fn update_entry(state: State<AppState>, entry: Entry) -> Result<String, String> {
    with_session(&state, |s| {
        let slot = s
            .entries
            .iter_mut()
            .find(|e| e.id == entry.id)
            .ok_or_else(|| "Entry not found".to_string())?;
        *slot = entry;
        let blob = re_encrypt(s)?;
        s.vault_blob = blob.clone();
        Ok(blob)
    })
}

#[tauri::command]
fn delete_entry(state: State<AppState>, id: String) -> Result<String, String> {
    with_session(&state, |s| {
        s.entries.retain(|e| e.id != id);
        let blob = re_encrypt(s)?;
        s.vault_blob = blob.clone();
        Ok(blob)
    })
}

#[tauri::command]
fn export_bitwarden(state: State<AppState>, path: String) -> Result<(), String> {
    with_session(&state, |s| {
        let mut folder_ids: Vec<(String, String)> = Vec::new();
        for e in &s.entries {
            if !e.folder.is_empty() && !folder_ids.iter().any(|(name, _)| name == &e.folder) {
                folder_ids.push((e.folder.clone(), uuid::Uuid::new_v4().to_string()));
            }
        }
        let folders: Vec<Value> = folder_ids
            .iter()
            .map(|(name, id)| json!({ "id": id, "name": name }))
            .collect();
        let items: Vec<Value> = s
            .entries
            .iter()
            .map(|e| {
                let folder_id = folder_ids
                    .iter()
                    .find(|(name, _)| name == &e.folder)
                    .map(|(_, id)| Value::String(id.clone()))
                    .unwrap_or(Value::Null);
                json!({
                    "passwordHistory": null,
                    "revisionDate": null,
                    "creationDate": null,
                    "deletedDate": null,
                    "id": e.id,
                    "organizationId": null,
                    "folderId": folder_id,
                    "type": 1,
                    "reprompt": 0,
                    "name": e.name,
                    "notes": if e.notes.is_empty() { Value::Null } else { Value::String(e.notes.clone()) },
                    "favorite": false,
                    "login": {
                        "fido2Credentials": [],
                        "uris": if e.url.is_empty() {
                            json!([])
                        } else {
                            json!([{ "match": null, "uri": e.url }])
                        },
                        "username": e.username,
                        "password": e.password,
                        "totp": null
                    },
                    "collectionIds": null
                })
            })
            .collect();
        let export = json!({ "encrypted": false, "folders": folders, "items": items });
        let pretty = serde_json::to_string_pretty(&export).map_err(|e| e.to_string())?;
        std::fs::write(&path, pretty).map_err(|e| e.to_string())
    })
}

fn str_at(v: &Value, key: &str) -> String {
    v.get(key)
        .and_then(Value::as_str)
        .unwrap_or_default()
        .to_string()
}

#[tauri::command]
fn import_bitwarden(state: State<AppState>, path: String) -> Result<(Vec<Entry>, String), String> {
    let raw = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let doc: Value = serde_json::from_str(&raw).map_err(|e| e.to_string())?;
    if doc.get("encrypted").and_then(Value::as_bool) == Some(true) {
        return Err("This is an encrypted Bitwarden export. Please export it unencrypted.".into());
    }
    let items = doc
        .get("items")
        .and_then(Value::as_array)
        .ok_or_else(|| "Not a Bitwarden JSON export (missing \"items\")".to_string())?;

    let mut folder_names: HashMap<String, String> = HashMap::new();
    if let Some(folders) = doc.get("folders").and_then(Value::as_array) {
        for f in folders {
            folder_names.insert(str_at(f, "id"), str_at(f, "name"));
        }
    }

    let mut imported: Vec<Entry> = Vec::new();
    for item in items {
        if item.get("type").and_then(Value::as_i64) != Some(1) {
            continue;
        }
        let login = item.get("login").cloned().unwrap_or(Value::Null);
        let url = login
            .get("uris")
            .and_then(Value::as_array)
            .and_then(|uris| uris.first())
            .map(|u| str_at(u, "uri"))
            .unwrap_or_default();
        let folder = item
            .get("folderId")
            .and_then(Value::as_str)
            .and_then(|id| folder_names.get(id).cloned())
            .unwrap_or_default();
        imported.push(Entry {
            id: uuid::Uuid::new_v4().to_string(),
            name: str_at(item, "name"),
            username: str_at(&login, "username"),
            password: str_at(&login, "password"),
            url,
            notes: str_at(item, "notes"),
            folder,
        });
    }

    with_session(&state, |s| {
        s.entries.extend(imported);
        let blob = re_encrypt(s)?;
        s.vault_blob = blob.clone();
        Ok((s.entries.clone(), blob))
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            create_vault,
            unlock_vault,
            lock_vault,
            get_vault_blob,
            add_entry,
            update_entry,
            delete_entry,
            export_bitwarden,
            import_bitwarden
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mocha");
}
