import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { cifrar, decifrar } from "../_shared/cofre.ts";

serve(async (req) => {
  try {
    const raw = Deno.env.get("CHAVES_MASTER_KEY");
    const bytesLength = Uint8Array.from(atob(raw || ""), (c) => c.charCodeAt(0)).length;
    
    // just test if we can import
    let decryptResult = "not tried";
    let importError = null;
    try {
      const cifrado = await cifrar("test");
      decryptResult = await decifrar(cifrado);
    } catch(e) {
      importError = e.message;
    }

    return new Response(
      JSON.stringify({ raw, bytesLength, decryptResult, importError }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
})
