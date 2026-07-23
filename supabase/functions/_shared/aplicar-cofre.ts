// DEPRECADO — Deno.env.set() não é suportado no runtime das Supabase Edge Functions (lança
// "The operation is not supported"), então esta abordagem nunca funcionou de verdade (o erro
// era engolido pelo try/catch). Substituído por resolverChave() em _shared/chaves.ts (leitura
// direta, com fallback) e pelos caches de módulo em _shared/wa.ts / _shared/ai/*.ts para os
// casos com várias leituras da mesma chave. Nenhum arquivo importa mais daqui.
export {};
