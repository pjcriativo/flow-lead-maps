import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const { data } = await admin.from("apify_chaves").select("*").eq("status", "ativa");
console.log(`Found ${data?.length} active keys`);

async function chaveMestra() {
  const raw = Deno.env.get("CHAVES_MASTER_KEY");
  if (!raw) throw new Error("CHAVES_MASTER_KEY não configurada");
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
}

for (const k of data || []) {
  try {
    const key = await chaveMestra();
    const combo = Uint8Array.from(atob(k.valor_cifrado), (c) => c.charCodeAt(0));
    const iv = combo.slice(0, 12);
    const cifrado = combo.slice(12);
    const plano = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cifrado);
    const token = new TextDecoder().decode(plano);
    console.log(`Key ${k.apelido}: Successfully decrypted (token length ${token.length})`);
    
    // Test if key is actually valid in Apify
    const res = await fetch(`https://api.apify.com/v2/acts/compass~crawler-google-places/runs?token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ searchStringsArray: ["test"] })
    });
    console.log(`Key ${k.apelido}: Apify test status: ${res.status}`);
    if (!res.ok) {
        console.log(`Key ${k.apelido}: Apify test error: ${await res.text()}`);
    }
  } catch (e) {
    console.log(`Key ${k.apelido}: Failed to decrypt or test - ${e.message}`);
  }
}
