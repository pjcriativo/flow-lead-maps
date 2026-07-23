// Cofre de chaves — AES-256-GCM. A CHAVE-MESTRA vive só no secret CHAVES_MASTER_KEY
// (Deno.env), NUNCA no banco. O banco guarda só iv+ciphertext em base64 — mesmo um dump
// completo da tabela config_chaves não revela nenhuma chave de API.
async function chaveMestra(): Promise<CryptoKey> {
  const raw = Deno.env.get("CHAVES_MASTER_KEY");
  if (!raw) throw new Error("CHAVES_MASTER_KEY não configurada");
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function cifrar(texto: string): Promise<string> {
  const key = await chaveMestra();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const dados = new TextEncoder().encode(texto);
  const cifrado = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, dados);
  const combo = new Uint8Array(iv.length + cifrado.byteLength);
  combo.set(iv, 0);
  combo.set(new Uint8Array(cifrado), iv.length);
  let bin = "";
  for (const b of combo) bin += String.fromCharCode(b);
  return btoa(bin);
}

export async function decifrar(b64: string): Promise<string> {
  const key = await chaveMestra();
  const combo = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const iv = combo.slice(0, 12);
  const cifrado = combo.slice(12);
  const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cifrado);
  return new TextDecoder().decode(plano);
}
