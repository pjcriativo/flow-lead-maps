function base64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function tokenKey(): Promise<CryptoKey> {
  const encoded = Deno.env.get("FLOW_BUSINESS_TOKEN_KEY")?.trim();
  if (!encoded) throw new Error("missing_config:FLOW_BUSINESS_TOKEN_KEY");
  const raw = fromBase64(encoded);
  if (raw.byteLength !== 32) throw new Error("invalid_config:FLOW_BUSINESS_TOKEN_KEY");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function validateFlowBusinessTokenKey(): Promise<void> {
  await tokenKey();
}

export async function encryptFlowBusinessToken(token: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await tokenKey(),
    new TextEncoder().encode(token),
  );
  return `${base64(iv)}.${base64(new Uint8Array(encrypted))}`;
}

export async function decryptFlowBusinessToken(ciphertext: string): Promise<string> {
  const [ivPart, payloadPart] = ciphertext.split(".");
  if (!ivPart || !payloadPart) throw new Error("invalid_token_ciphertext");
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(ivPart) },
    await tokenKey(),
    fromBase64(payloadPart),
  );
  return new TextDecoder().decode(decrypted);
}
