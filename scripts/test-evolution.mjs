import { createClient } from "@supabase/supabase-js";


const admin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Verificando chaves da Evolution no Cofre...");
  const { data: keys } = await admin.from("chaves").select("chave, valor").in("chave", ["EVOLUTION_URL", "EVOLUTION_API_KEY"]);
  
  if (!keys || keys.length < 2) {
    console.error("❌ Chaves EVOLUTION não encontradas no banco de dados.");
    return;
  }
  
  const url = keys.find(k => k.chave === "EVOLUTION_URL")?.valor.replace(/\/+$/, "");
  const key = keys.find(k => k.chave === "EVOLUTION_API_KEY")?.valor;
  
  console.log("Conectando na API:", url);
  try {
    const res = await fetch(`${url}/instance/all`, { headers: { apikey: key } });
    if (res.ok) {
       const json = await res.json();
       console.log("✅ Conexão Evolution API bem-sucedida!");
       // eslint-disable-next-line @typescript-eslint/no-explicit-any
       const count = Array.isArray(json) ? json.length : (json.data ? json.data.length : Object.keys(json).length);
       console.log(`Instâncias atuais (incluindo WhatsApp/Insta): ${count}`);
    } else {
       console.error("❌ Falha na conexão com Evolution:", res.status, res.statusText);
    }
  } catch (e) {
    console.error("❌ Erro de rede conectando a Evolution:", e.message);
  }
}

run();
