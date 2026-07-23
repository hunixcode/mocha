const BASE32_LOOKUP: Record<string, number> = {};
"ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".split("").forEach((c, i) => { BASE32_LOOKUP[c] = i; });

function base32Decode(str: string): Uint8Array {
  const s = str.replace(/[^A-Za-z2-7]/g, "").toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of s) {
    const val = BASE32_LOOKUP[ch];
    if (val === undefined) continue;
    buffer = (buffer << 5) | val;
    bits += 5;
    if (bits >= 8) {
      bytes.push((buffer >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

function pad8(value: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    buf[i] = Number(value & 0xffn);
    value >>= 8n;
  }
  return buf;
}

async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw", key as BufferSource, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, message as BufferSource));
}

function truncate(hs: Uint8Array): number {
  const offset = hs[hs.length - 1] & 0xf;
  const bin =
    ((hs[offset] & 0x7f) << 24) |
    (hs[offset + 1] << 16) |
    (hs[offset + 2] << 8) |
    hs[offset + 3];
  return bin % 1_000_000;
}

export async function generateTOTP(secret: string, timestamp: number = Date.now()): Promise<string> {
  const key = base32Decode(secret);
  const counter = BigInt(Math.floor(timestamp / 1000 / 30));
  const msg = pad8(counter);
  const hs = await hmacSha1(key, msg);
  const code = truncate(hs);
  return code.toString().padStart(6, "0");
}

export function getRemainingSeconds(): number {
  return 30 - (Math.floor(Date.now() / 1000) % 30);
}

export function formatCode(code: string): string {
  return `${code.slice(0, 3)} ${code.slice(3)}`;
}
