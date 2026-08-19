import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const PROJ = process.cwd();
const require = createRequire(join(PROJ, "package.json"));
const { createClient } = require("@supabase/supabase-js");

for (const l of readFileSync(join(PROJ, ".env"), "utf8").split(/\r?\n/)) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
  if (!m) continue;
  let v = m[2].trim();
  if (/^['"].*['"]$/.test(v)) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}

const URL_SB = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const admin = createClient(URL_SB, SERVICE, { auth: { persistSession: false } });

async function sessao(email) {
  const { data: lk, error: e1 } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (e1) throw new Error("Falha generateLink: " + e1.message);
  const an = createClient(URL_SB, ANON, { auth: { persistSession: false } });
  const { data: se, error: e2 } = await an.auth.verifyOtp({
    token_hash: lk.properties.hashed_token,
    type: "magiclink",
  });
  if (e2) throw new Error("Falha verifyOtp: " + e2.message);
  return se.session.access_token;
}

async function run() {
  try {
    console.log("Gerando sessão...");
    const jwt = await sessao("marcosg1.pereira@gmail.com");
    const an = createClient(URL_SB, ANON, { 
      auth: { persistSession: false }, 
      global: { headers: { Authorization: `Bearer ${jwt}` } } 
    });
    
    console.log("Iniciando busca IG-5 (limite 10) na Edge Function...");
    const start = Date.now();
    const { data, error } = await an.functions.invoke("buscar-redes", {
      body: {
        acao: "buscar",
        estrategia: "IG-5",
        campos: { nicho: "clinica", cidade: "Curitiba", minSeguidores: 50, soComerciais: true },
        limite: 10
      }
    });
    
    const end = Date.now();
    console.log(`Tempo total: ${((end - start) / 1000).toFixed(1)}s`);
    
    if (error) {
      console.error("ERRO NA EDGE FUNCTION:", error);
    } else {
      console.log("SUCESSO:", data);
      
      if (data.inseridos > 0) {
        console.log("Buscando leads no banco...");
        const { data: leads } = await an.from("leads")
          .select("id, business_name, instagram_url")
          .eq("origem_estrategia", "IG-5")
          .order("created_at", { ascending: false })
          .limit(data.inseridos);
        console.log("LEADS REAIS INSERIDOS:");
        console.table(leads);
      }
    }
  } catch(e) {
    console.error("Exceção:", e);
  }
}

run();
