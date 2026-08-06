export type LimitesFinanceirosApify = {
  usageUsd: number;
  hardLimitUsd: number;
  hardRemainingUsd: number;
  cycleStartAt: string;
  cycleEndAt: string;
};

export type ContaFinanceiraApify = LimitesFinanceirosApify & {
  accountId: string;
  username: string;
  planCreditsUsd: number;
  planRemainingUsd: number;
  effectiveRemainingUsd: number;
};

export type ResumoContaFinanceiraApify = {
  usageUsd: number;
  limitUsd: number;
  remainingUsd: number;
  includedCreditsUsd: number;
  includedCreditsRemainingUsd: number;
};

export type ResumoFinanceiroConsolidadoApify = ResumoContaFinanceiraApify & {
  accountCount: number;
};

export type ResultadoConsultaFinanceiraApify =
  | { situacao: "ok"; conta: ContaFinanceiraApify }
  | { situacao: "invalida"; motivo: string }
  | { situacao: "erro"; motivo: string };

type JsonObject = { [key: string]: unknown };

function objeto(value: unknown, path: string): JsonObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`Resposta Apify invalida: ${path} ausente`);
  }
  return value as JsonObject;
}

function numero(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Resposta Apify invalida: ${path} ausente`);
  }
  return value;
}

function numeroOpcional(value: unknown, padrao: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return padrao;
}

function texto(value: unknown, path: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Resposta Apify invalida: ${path} ausente`);
  }
  return value;
}

function restante(total: number, usado: number): number {
  return Math.max(0, Number((total - usado).toFixed(8)));
}

/** Normaliza o endpoint oficial GET /v2/users/me/limits em uma fronteira tipada. */
export function normalizarLimitesFinanceirosApify(json: unknown): LimitesFinanceirosApify {
  const root = objeto(json, "root");
  const data = objeto(root.data, "data");
  const limits = objeto(data.limits, "data.limits");
  const current = objeto(data.current, "data.current");
  const cycle = objeto(data.monthlyUsageCycle, "data.monthlyUsageCycle");
  const usageUsd = numero(current.monthlyUsageUsd, "data.current.monthlyUsageUsd");
  const hardLimitUsd = numeroOpcional(limits.maxMonthlyUsageUsd, 999999);

  return {
    usageUsd,
    hardLimitUsd,
    hardRemainingUsd: restante(hardLimitUsd, usageUsd),
    cycleStartAt: texto(cycle.startAt, "data.monthlyUsageCycle.startAt"),
    cycleEndAt: texto(cycle.endAt, "data.monthlyUsageCycle.endAt"),
  };
}

/**
 * Une os dois contratos oficiais da Apify:
 * - /users/me: identidade da conta e creditos mensais incluidos no plano;
 * - /users/me/limits: uso do ciclo e limite duro ajustavel.
 *
 * O saldo operacional segue o limite duro, pois a Apify pode permitir overage depois que
 * os creditos pre-pagos terminam. Por isso credito do plano e limite nunca sao somados.
 */
export function normalizarContaFinanceiraApify(
  userJson: unknown,
  limitsJson: unknown,
): ContaFinanceiraApify {
  const root = objeto(userJson, "root");
  const data = objeto(root.data, "data");
  const plan = objeto(data.plan, "data.plan");
  const limites = normalizarLimitesFinanceirosApify(limitsJson);
  const planCreditsUsd = numeroOpcional(plan.monthlyUsageCreditsUsd, 0);

  return {
    accountId: texto(data.id, "data.id"),
    username: texto(data.username, "data.username"),
    planCreditsUsd,
    usageUsd: limites.usageUsd,
    planRemainingUsd: restante(planCreditsUsd, limites.usageUsd),
    hardLimitUsd: limites.hardLimitUsd,
    hardRemainingUsd: limites.hardRemainingUsd,
    effectiveRemainingUsd: limites.hardRemainingUsd,
    cycleStartAt: limites.cycleStartAt,
    cycleEndAt: limites.cycleEndAt,
  };
}

/** Saldo/uso pertence a conta Apify, nao ao token. Mantem somente uma linha por accountId. */
export function deduplicarContasFinanceirasApify(
  contas: ContaFinanceiraApify[],
): ContaFinanceiraApify[] {
  const unicas = new Map<string, ContaFinanceiraApify>();
  for (const conta of contas) {
    if (!unicas.has(conta.accountId)) unicas.set(conta.accountId, conta);
  }
  return [...unicas.values()];
}

/** Contrato do painel: o denominador principal e o teto oficial de uso, nao o plano-base. */
export function resumirContaFinanceiraApify(
  conta: ContaFinanceiraApify,
): ResumoContaFinanceiraApify {
  return {
    usageUsd: conta.usageUsd,
    limitUsd: conta.hardLimitUsd,
    remainingUsd: conta.hardRemainingUsd,
    includedCreditsUsd: conta.planCreditsUsd,
    includedCreditsRemainingUsd: conta.planRemainingUsd,
  };
}

/** Soma somente contas financeiras distintas; tokens repetidos nunca multiplicam saldo/uso. */
export function consolidarContasFinanceirasApify(
  contas: ContaFinanceiraApify[],
): ResumoFinanceiroConsolidadoApify {
  const unicas = deduplicarContasFinanceirasApify(contas);
  return unicas.reduce<ResumoFinanceiroConsolidadoApify>(
    (total, conta) => {
      const resumo = resumirContaFinanceiraApify(conta);
      total.usageUsd = Number((total.usageUsd + resumo.usageUsd).toFixed(8));
      total.limitUsd = Number((total.limitUsd + resumo.limitUsd).toFixed(8));
      total.remainingUsd = Number((total.remainingUsd + resumo.remainingUsd).toFixed(8));
      total.includedCreditsUsd = Number(
        (total.includedCreditsUsd + resumo.includedCreditsUsd).toFixed(8),
      );
      total.includedCreditsRemainingUsd = Number(
        (total.includedCreditsRemainingUsd + resumo.includedCreditsRemainingUsd).toFixed(8),
      );
      total.accountCount += 1;
      return total;
    },
    {
      usageUsd: 0,
      limitUsd: 0,
      remainingUsd: 0,
      includedCreditsUsd: 0,
      includedCreditsRemainingUsd: 0,
      accountCount: 0,
    },
  );
}

async function respostaJson(response: Response, endpoint: string): Promise<unknown> {
  try {
    return await response.json();
  } catch (error) {
    throw new Error(
      `${endpoint} retornou JSON invalido: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** Consulta suportada pela API publica; o token segue no header e nunca aparece na URL/log. */
export async function consultarContaFinanceiraApify(
  token: string,
): Promise<ResultadoConsultaFinanceiraApify> {
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const signal = AbortSignal.timeout(10_000);
    const [userResponse, limitsResponse] = await Promise.all([
      fetch("https://api.apify.com/v2/users/me", { headers, signal }),
      fetch("https://api.apify.com/v2/users/me/limits", { headers, signal }),
    ]);
    if (userResponse.status === 401 || limitsResponse.status === 401) {
      return { situacao: "invalida", motivo: "token invalido (401)" };
    }
    if (!userResponse.ok || !limitsResponse.ok) {
      return {
        situacao: "erro",
        motivo: `Apify indisponivel (conta HTTP ${userResponse.status}; limites HTTP ${limitsResponse.status})`,
      };
    }
    const [userJson, limitsJson] = await Promise.all([
      respostaJson(userResponse, "/users/me"),
      respostaJson(limitsResponse, "/users/me/limits"),
    ]);
    return {
      situacao: "ok",
      conta: normalizarContaFinanceiraApify(userJson, limitsJson),
    };
  } catch (error) {
    return {
      situacao: "erro",
      motivo: error instanceof Error ? error.message : String(error),
    };
  }
}
