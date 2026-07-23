// NÚCLEO PURO do critério de rodízio de chaves Apify — sem Deno/rede/banco, testável em
// Node (mesmo padrão de decidirSaude no rodízio de chips). Baseado nos SINAIS REAIS
// levantados na Etapa 0 (probe em produção + docs oficiais/OpenAPI, 2026-07-23):
//
//   esgotada   → 402 (doc oficial do POST /runs: "exceeded usage limit / not enough
//                credits"); 403 type "platform-feature-disabled" ou message com
//                "Monthly usage hard limit exceeded" (observado em produção; type no enum
//                oficial); type "not-enough-usage-to-run-paid-actor" (crédito insuficiente
//                p/ ator PAGO — os nossos são pagos).
//   invalida   → 401 (types reais capturados pelo probe: user-or-token-not-found,
//                invalid-token, token-not-provided) — erro de cadastro, não de crédito.
//   passageira → 429 rate-limit (backoff e retry na MESMA chave), 5xx, 408, rede,
//                concurrent-runs-limit-exceeded. NUNCA marca chave.
//   outro      → 404 ator, 400 input, 403 insufficient-permissions (permissão ≠ crédito —
//                diferenciada pela message/type; queimar o pool aqui seria o erro do
//                "Connected" dos chips). Não rotaciona: é erro da operação, não da chave.
//
// ⚠️ NO MEIO do run não existe sinal confiável no status (run morto por limite termina
// ABORTED igual ao abort manual, sem statusMessage padronizado) — o árbitro é o endpoint
// de limites (creditoRestanteDeLimits), consultado pelo lado Deno (apify-pool.ts).

export type ClasseErroApify = "esgotada" | "invalida" | "passageira" | "outro";

const RE_ESGOTADO =
  /monthly usage hard limit|usage (hard )?limit exceeded|not enough usage|insufficient credit/i;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function classificarErroApify(status: number, corpo: any): ClasseErroApify {
  const tipo = String(corpo?.error?.type ?? "").toLowerCase();
  const msg = String(corpo?.error?.message ?? (typeof corpo === "string" ? corpo : ""));

  if (status === 401) return "invalida";
  if (status === 402) return "esgotada";
  if (tipo === "not-enough-usage-to-run-paid-actor") return "esgotada";
  if (status === 403) {
    if (tipo === "platform-feature-disabled" || RE_ESGOTADO.test(msg)) return "esgotada";
    return "outro"; // ex.: insufficient-permissions — permissão, não crédito
  }
  if (status === 429 || tipo === "rate-limit-exceeded") return "passageira";
  if (tipo === "concurrent-runs-limit-exceeded") return "passageira";
  if (status === 408) return "passageira";
  if (status >= 500) return "passageira";
  if (status <= 0) return "passageira"; // falha de rede/fetch (sem resposta HTTP)
  return "outro";
}

/** Crédito restante (USD) a partir do JSON de GET /v2/users/me/limits. null = ilegível. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function creditoRestanteDeLimits(json: any): number | null {
  const max = json?.data?.limits?.maxMonthlyUsageUsd;
  const uso = json?.data?.current?.monthlyUsageUsd;
  if (typeof max !== "number" || typeof uso !== "number") return null;
  return max - uso;
}

// Margem do árbitro do MEIO do run: um run em andamento morre AO ATINGIR o teto, então a
// leitura pós-morte fica encostada no zero (centavos de arredondamento/billing assíncrono).
// <= US$0,10 restando + run morto que nós não abortamos = esgotamento inequívoco.
export const MARGEM_ESGOTADO_USD = 0.1;

/** Um run que terminou `status` sem termos pedido abort é SUSPEITO de morte por limite? */
export function runMortoSuspeito(status: string, abortamosNos: boolean): boolean {
  if (abortamosNos) return false;
  return status === "ABORTED" || status === "FAILED";
}
