// POOL DE CHAVES APIFY — rodízio automático por esgotamento (Etapas 1-3).
// Espelho do rodízio de chips (wa.ts): proximaInstanciaDisparo → detectar → rotacionar →
// avisar. Aqui: chaves ativas em ordem; START do run tenta a corrente; sinal inequívoco de
// esgotamento/invalidez marca a chave (auditoria) e a PRÓXIMA assume na hora. Falha
// passageira NUNCA marca (retry na MESMA chave). Poll/dataset/abort ficam presos à chave
// que iniciou o run (runId pertence àquela conta) — a troca é sempre no start/restart.
//
// Fallback de compatibilidade: pool NUNCA configurado (zero linhas) → usa a chave única do
// cofre/secret (APIFY_API_TOKEN), como sempre foi. Pool configurado mas sem nenhuma ativa →
// PARAR com aviso claro ("todas as chaves Apify esgotadas"), nunca falhar calado.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;
import { decifrar } from "./cofre.ts";
import { resolverChave } from "./chaves.ts";
import {
  classificarErroApify,
  creditoRestanteDeLimits,
  MARGEM_ESGOTADO_USD,
  runMortoSuspeito,
} from "./apify-criterio.ts";

const API = "https://api.apify.com/v2";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type ChaveApify = {
  /** null = chave única do cofre/secret (pool não configurado) — não marcável */
  id: string | null;
  apelido: string;
  token: string;
};

export type PoolApify = { chaves: ChaveApify[]; poolConfigurado: boolean };

/** Chaves ATIVAS decifradas, na ordem do rodízio. poolConfigurado=false → caiu no secret. */
export async function carregarPoolApify(admin: Admin): Promise<PoolApify> {
  try {
    const { data: todas, error } = await admin
      .from("apify_chaves")
      .select("id, apelido, valor_cifrado, status, ordem")
      .order("ordem", { ascending: true });
    if (error) {
      console.error("[apify-pool] Falha ao carregar o pool:", error);
      await avisarSuperAdminsApify(
        admin,
        "Falha ao carregar o pool Apify",
        "O banco nao respondeu ao carregar as chaves. A busca foi interrompida para nao usar uma chave antiga fora do rodizio.",
      );
      return { chaves: [], poolConfigurado: true };
    }
    const linhas = todas ?? [];
    if (linhas.length > 0) {
      const chaves: ChaveApify[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const l of linhas.filter((x: any) => x.status === "ativa")) {
        try {
          chaves.push({ id: l.id, apelido: l.apelido, token: await decifrar(l.valor_cifrado) });
        } catch {
          /* linha ilegível (chave-mestra trocada) — pula, não derruba o rodízio */
        }
      }
      return { chaves, poolConfigurado: true };
    }
  } catch (error) {
    console.error("[apify-pool] Excecao ao carregar o pool:", error);
    await avisarSuperAdminsApify(
      admin,
      "Falha ao carregar o pool Apify",
      "O banco nao respondeu ao carregar as chaves. A busca foi interrompida para nao usar uma chave antiga fora do rodizio.",
    );
    return { chaves: [], poolConfigurado: true };
  }
  const secret = await resolverChave(admin, "APIFY_API_TOKEN");
  return {
    chaves: secret ? [{ id: null, apelido: "chave única (cofre/secret)", token: secret }] : [],
    poolConfigurado: false,
  };
}

/** Marca a chave (esgotada/invalida) + auditoria automática. Idempotente. */
export async function marcarChaveApify(
  admin: Admin,
  id: string,
  status: "esgotada" | "invalida",
): Promise<boolean> {
  const agora = new Date().toISOString();
  const { data: linha, error } = await admin
    .from("apify_chaves")
    .update({
      status,
      atualizado_em: agora,
      ...(status === "esgotada" ? { esgotada_em: agora } : {}),
    })
    .eq("id", id)
    .eq("status", "ativa")
    .select("apelido")
    .maybeSingle();
  if (error) {
    await avisarSuperAdminsApify(
      admin,
      "Falha ao salvar a rotação Apify",
      `A chave ${id} falhou, mas o banco não confirmou a mudança de status. A próxima busca tentará reconciliar novamente.`,
    );
    return false;
  }
  if (!linha) return false;
  await admin.from("apify_chaves_auditoria").insert({
    apelido: linha.apelido ?? id,
    acao: `${status}_automatico`,
    alterado_por: null,
  });
  return true;
}

async function consultarIdContaApify(token: string): Promise<string | null> {
  try {
    const response = await fetch(`${API}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return null;
    const body = await response.json().catch(() => ({}));
    return typeof body?.data?.id === "string" ? body.data.id : null;
  } catch {
    return null;
  }
}

/**
 * Um saldo esgotado pertence a conta, nao ao token. Resolve identidade apenas na falha
 * (zero custo/latencia no caminho feliz) e devolve as chaves que compartilham a conta.
 * Se a Apify estiver indisponivel, falha aberto e marca somente a chave que comprovadamente falhou.
 */
export async function chavesDaMesmaContaApify(
  chaveEsgotada: ChaveApify,
  chaves: ChaveApify[],
): Promise<ChaveApify[]> {
  const candidatas = [chaveEsgotada, ...chaves.filter((chave) => chave.id !== chaveEsgotada.id)];
  const identidades = await Promise.all(
    candidatas.map(async (chave) => ({ chave, contaId: await consultarIdContaApify(chave.token) })),
  );
  const contaId = identidades[0]?.contaId ?? null;
  if (!contaId) return [chaveEsgotada];
  return identidades.filter((item) => item.contaId === contaId).map((item) => item.chave);
}

async function marcarContaApifyEsgotada(
  admin: Admin,
  chaveEsgotada: ChaveApify,
  chaves: ChaveApify[],
): Promise<Set<string>> {
  const compartilhadas = await chavesDaMesmaContaApify(chaveEsgotada, chaves);
  const ids = compartilhadas
    .map((chave) => chave.id)
    .filter((id): id is string => typeof id === "string");
  const idsIgnorados = new Set(ids);
  if (ids.length === 0) return idsIgnorados;
  const agora = new Date().toISOString();
  const { data: linhas, error } = await admin
    .from("apify_chaves")
    .update({ status: "esgotada", esgotada_em: agora, atualizado_em: agora })
    .in("id", ids)
    .eq("status", "ativa")
    .select("id, apelido");
  if (error) {
    await avisarSuperAdminsApify(
      admin,
      "Falha ao salvar esgotamento da conta Apify",
      "A busca pulou a conta sem saldo nesta execução, mas o banco não confirmou a atualização atômica das chaves. A próxima execução tentará reconciliar novamente.",
    );
    return idsIgnorados;
  }
  const alteradas = linhas ?? [];
  if (alteradas.length > 0) {
    await admin.from("apify_chaves_auditoria").insert(
      alteradas.map((linha: { apelido?: string; id?: string }) => ({
        apelido: linha.apelido ?? linha.id ?? "conta Apify",
        acao: "esgotada_automatico",
        alterado_por: null,
      })),
    );
    await avisarMarcacao(admin, chaveEsgotada, "esgotada");
  }
  return idsIgnorados;
}

/** Aviso VISÍVEL aos super admins (reusa o sistema real de notificações in-app). */
export async function avisarSuperAdminsApify(
  admin: Admin,
  titulo: string,
  mensagem: string,
): Promise<void> {
  try {
    const { data: admins } = await admin.from("profiles").select("id").eq("is_super_admin", true);
    if (!admins?.length) return;
    const { data: notif } = await admin
      .from("notificacoes")
      .insert({ titulo, mensagem, criado_por: null })
      .select("id")
      .single();
    if (!notif) return;
    await admin
      .from("notificacao_destinatarios")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(admins.map((a: any) => ({ notificacao_id: notif.id, user_id: a.id })));
  } catch {
    /* aviso é best-effort — nunca derruba a operação */
  }
}

async function contarAtivas(admin: Admin): Promise<number> {
  const { count } = await admin
    .from("apify_chaves")
    .select("id", { count: "exact", head: true })
    .eq("status", "ativa");
  return count ?? 0;
}

async function avisarMarcacao(
  admin: Admin,
  chave: ChaveApify,
  status: "esgotada" | "invalida",
): Promise<void> {
  const restantes = await contarAtivas(admin);
  const causa = status === "esgotada" ? "esgotou o crédito" : "está inválida (erro de cadastro)";
  const cauda =
    restantes === 0
      ? "⚠️ NENHUMA chave ativa restante — as buscas via Apify vão PARAR até cadastrar/reativar uma chave."
      : "O rodízio seguirá automaticamente com as outras contas ativas do pool.";
  await avisarSuperAdminsApify(
    admin,
    `Chave Apify "${chave.apelido}" ${status === "esgotada" ? "esgotada" : "inválida"}`,
    `A chave "${chave.apelido}" ${causa} e saiu do rodízio. ${cauda}`,
  );
}

/** GET /users/me/limits com a chave — o ÁRBITRO (grátis). */
export async function verificarCreditoChave(
  token: string,
): Promise<
  | { situacao: "ok"; restante: number; max: number; uso: number }
  | { situacao: "invalida" }
  | { situacao: "ilegivel" }
> {
  try {
    const r = await fetch(`${API}/users/me/limits`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (r.status === 401) return { situacao: "invalida" };
    const j = await r.json().catch(() => ({}));
    const restante = creditoRestanteDeLimits(j);
    if (restante === null) return { situacao: "ilegivel" };
    return {
      situacao: "ok",
      restante,
      max: j?.data?.limits?.maxMonthlyUsageUsd ?? 0,
      uso: j?.data?.current?.monthlyUsageUsd ?? 0,
    };
  } catch {
    return { situacao: "ilegivel" };
  }
}

export type ResultadoStart =
  | { ok: true; resp: Response; chave: ChaveApify; trocas: number }
  | {
      ok: false;
      reason: "pool_esgotado" | "sem_chave" | "falha_passageira" | "erro_apify";
      detalhe: string;
      status?: number;
    };

/**
 * Executa UMA chamada de START (POST /acts/.../runs) com rodízio: tenta a chave corrente;
 * esgotada/inválida → marca, avisa e a PRÓXIMA tenta o MESMO start. Só repete na MESMA
 * chave quando a Apify confirma que rejeitou o start por rate/concurrency limit. Rede,
 * timeout e 5xx são ambíguos e não repetem POST; outro erro devolve sem rotacionar.
 * montarUrl devolve somente a URL operacional; o token segue no header Authorization.
 */
export async function startRunComPool(
  admin: Admin,
  montarUrl: () => string,
  init: RequestInit,
): Promise<ResultadoStart> {
  const pool = await carregarPoolApify(admin);
  if (pool.chaves.length === 0) {
    if (pool.poolConfigurado) {
      await avisarSuperAdminsApify(
        admin,
        "Todas as chaves Apify indisponíveis",
        "O pool está configurado mas nenhuma chave está ativa (esgotadas/invalidadas/desativadas). Cadastre ou reative uma chave em Configurações → Chaves e integrações.",
      );
      return {
        ok: false,
        reason: "pool_esgotado",
        detalhe: "Todas as chaves Apify do pool estão esgotadas/indisponíveis.",
      };
    }
    return { ok: false, reason: "sem_chave", detalhe: "APIFY_API_TOKEN não configurada." };
  }

  let trocas = 0;
  let ultimaFalha = "";
  const idsIgnorados = new Set<string>();
  for (const chave of pool.chaves) {
    if (chave.id && idsIgnorados.has(chave.id)) continue;
    for (let tentativa = 1; tentativa <= 2; tentativa++) {
      let resp: Response | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let corpo: any = null;
      try {
        const headers = new Headers(init.headers);
        headers.set("Authorization", `Bearer ${chave.token}`);
        resp = await fetch(montarUrl(), { ...init, headers });
      } catch (e) {
        corpo = e instanceof Error ? e.message : String(e);
      }
      if (resp?.ok) {
        if (chave.id)
          await admin
            .from("apify_chaves")
            .update({ ultimo_uso: new Date().toISOString() })
            .eq("id", chave.id);
        return { ok: true, resp, chave, trocas };
      }
      const status = resp?.status ?? 0;
      if (resp) corpo = await resp.json().catch(() => null);
      const classe = classificarErroApify(status, corpo);
      const detalhe = String(corpo?.error?.message ?? corpo ?? `HTTP ${status}`).slice(0, 300);

      if (classe === "passageira") {
        const tipo = String(corpo?.error?.type ?? "").toLowerCase();
        const rejeicaoConfirmada =
          status === 429 ||
          tipo === "rate-limit-exceeded" ||
          tipo === "concurrent-runs-limit-exceeded";
        if (tentativa === 1 && rejeicaoConfirmada) {
          await sleep(1500);
          continue;
        }
        return { ok: false, reason: "falha_passageira", detalhe, status };
      }
      if (classe === "invalida" || classe === "esgotada") {
        if (chave.id) {
          if (classe === "esgotada") {
            const idsConta = await marcarContaApifyEsgotada(admin, chave, pool.chaves);
            for (const id of idsConta) idsIgnorados.add(id);
          } else {
            const marcou = await marcarChaveApify(admin, chave.id, classe);
            if (marcou) await avisarMarcacao(admin, chave, classe);
          }
        } else {
          // chave única do secret — não há pool pra rotacionar
          await avisarSuperAdminsApify(
            admin,
            classe === "esgotada" ? "Crédito Apify esgotado" : "Chave Apify inválida",
            `A chave única (cofre/secret) falhou: ${detalhe}. Cadastre chaves no pool em Configurações → Chaves e integrações.`,
          );
          return { ok: false, reason: "pool_esgotado", detalhe, status };
        }
        trocas++;
        ultimaFalha = detalhe;
        break; // próxima chave assume o MESMO start
      }
      return { ok: false, reason: "erro_apify", detalhe, status }; // "outro": não rotaciona
    }
  }
  await avisarSuperAdminsApify(
    admin,
    "Todas as chaves Apify falharam",
    `Todas as chaves do pool falharam durante a operação. Último erro recebido da Apify: ${ultimaFalha || "Desconhecido"}`,
  );
  return {
    ok: false,
    reason: "pool_esgotado",
    detalhe: ultimaFalha
      ? `Todas as chaves falharam. Motivo da Apify: ${ultimaFalha}`
      : "Todas as chaves Apify do pool estão esgotadas/indisponíveis.",
  };
}

export type VereditoRunMorto = "trocar_chave" | "erro_real" | "parar_sem_pool";

/**
 * Run terminou morto (ABORTED/FAILED) sem termos pedido abort? O status NÃO diz o motivo
 * (Etapa 0: morte por limite termina ABORTED igual ao abort manual) — o árbitro é o
 * endpoint de limites. Esgotou de verdade → marca a chave, avisa, e manda o caller
 * REINICIAR o run com a próxima ("trocar_chave"). Senão, é falha real do run ("erro_real").
 */
export async function tratarRunMorto(
  admin: Admin,
  chave: ChaveApify,
  statusRun: string,
  abortamosNos: boolean,
): Promise<VereditoRunMorto> {
  if (!runMortoSuspeito(statusRun, abortamosNos)) return "erro_real";
  const credito = await verificarCreditoChave(chave.token);
  const esgotou =
    credito.situacao === "invalida" ||
    (credito.situacao === "ok" && credito.restante <= MARGEM_ESGOTADO_USD);
  if (!esgotou) return "erro_real";
  const classe = credito.situacao === "invalida" ? "invalida" : "esgotada";
  if (chave.id) {
    if (classe === "esgotada") {
      const pool = await carregarPoolApify(admin);
      await marcarContaApifyEsgotada(admin, chave, pool.chaves);
    } else {
      const marcou = await marcarChaveApify(admin, chave.id, classe);
      if (marcou) await avisarMarcacao(admin, chave, classe);
    }
    return "trocar_chave";
  }
  await avisarSuperAdminsApify(
    admin,
    "Crédito Apify esgotado no meio de uma busca",
    "A chave única (cofre/secret) esgotou com uma busca em andamento. Cadastre chaves no pool em Configurações → Chaves e integrações para o rodízio automático assumir nesses casos.",
  );
  return "parar_sem_pool";
}
