import { decifrar } from "./supabase/functions/_shared/cofre.ts";
import { consultarContaFinanceiraApify } from "./supabase/functions/_shared/apify-financeiro.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: chaves } = await supabase.from("apify_chaves").select("*").eq("status", "ativa");
  for (const c of chaves) {
    const token = await decifrar(c.valor_cifrado);
    const res = await consultarContaFinanceiraApify(token);
    console.log(`Key ${c.apelido}:`);
    if (res.situacao === "ok") {
      console.log(`  Account ID: ${res.conta.accountId}`);
      console.log(`  Hard Limit: ${res.conta.hardLimitUsd}`);
      console.log(`  Hard Remaining: ${res.conta.hardRemainingUsd}`);
      console.log(`  Usage: ${res.conta.usageUsd}`);
    } else {
      console.log(`  Error: ${res.situacao} - ${res.motivo}`);
    }
  }
}
run();
