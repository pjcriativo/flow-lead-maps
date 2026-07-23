// Resolve uma chave gerenciada pelo cofre (config_chaves) com fallback pro secret original.
// IMPORTANTE: `Deno.env.set()` NÃO é suportado no runtime das Supabase Edge Functions (lança
// "The operation is not supported") — por isso NÃO dá pra "aplicar" o cofre no ambiente e
// deixar o código antigo (Deno.env.get(...) direto) enxergar sozinho. Cada leitura de uma
// chave gerenciada precisa passar por resolverChave() (ou por um cache de módulo populado a
// partir dela — ver _shared/wa.ts e _shared/ai/*.ts para os casos com várias leituras).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;
import { decifrar } from "./cofre.ts";

export async function resolverChave(admin: Admin, nome: string): Promise<string | null> {
  try {
    const { data } = await admin
      .from("config_chaves")
      .select("valor_cifrado")
      .eq("nome", nome)
      .maybeSingle();
    if (data?.valor_cifrado) {
      try {
        return await decifrar(data.valor_cifrado);
      } catch {
        /* cofre corrompido (chave-mestra trocada etc.) -> cai no secret original */
      }
    }
  } catch {
    /* tabela indisponível -> cai no secret original */
  }
  return Deno.env.get(nome) ?? null;
}
