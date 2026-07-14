import { createClient, SupabaseClient } from "@supabase/supabase-js";

const STORAGE_KEY_URL = "mocha_supabase_url";
const STORAGE_KEY_KEY = "mocha_supabase_key";

function readConfig() {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const envKey =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

  const url = envUrl || localStorage.getItem(STORAGE_KEY_URL) || "";
  const key = envKey || localStorage.getItem(STORAGE_KEY_KEY) || "";

  return { url, key };
}

const config = readConfig();

export const supabaseReady = Boolean(config.url && config.key);

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem(STORAGE_KEY_URL, url);
  localStorage.setItem(STORAGE_KEY_KEY, key);
}

export const supabase: SupabaseClient = supabaseReady
  ? createClient(config.url, config.key)
  : (null as unknown as SupabaseClient);
