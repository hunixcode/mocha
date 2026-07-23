import { supabase } from "../supabase";

async function uploadToBucket(bucket: string, path: string, data: string) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, data, {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw error;
}

async function downloadFromBucket(bucket: string, path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .download(path);
  if (error) {
    if (error.message.includes("not found") || error.status === 404) return null;
    throw error;
  }
  return await data.text();
}

const VAULT_PATH = "vault.mocha";
const AUTHENTICATOR_PATH = "authenticator.json";
const SUBSCRIPTIONS_PATH = "subscriptions.json";

export const vaultStorage = {
  async upload(userId: string, blob: string) {
    await uploadToBucket("vaults", `${userId}/${VAULT_PATH}`, blob);
  },
  async download(userId: string): Promise<string | null> {
    return downloadFromBucket("vaults", `${userId}/${VAULT_PATH}`);
  },
};

export const authenticatorStorage = {
  async upload(userId: string, data: string) {
    await uploadToBucket("vaults", `${userId}/${AUTHENTICATOR_PATH}`, data);
  },
  async download(userId: string): Promise<string | null> {
    return downloadFromBucket("vaults", `${userId}/${AUTHENTICATOR_PATH}`);
  },
};

export const subscriptionStorage = {
  async upload(userId: string, data: string) {
    await uploadToBucket("vaults", `${userId}/${SUBSCRIPTIONS_PATH}`, data);
  },
  async download(userId: string): Promise<string | null> {
    return downloadFromBucket("vaults", `${userId}/${SUBSCRIPTIONS_PATH}`);
  },
};
