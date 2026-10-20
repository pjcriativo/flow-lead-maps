// Cliente da EVOLUTION GO (WhatsApp) — MULTI-TENANT: uma instância POR ORG.
// ⚠️ Rotas VALIDADAS contra o Swagger da versão EM USO — DIFEREM da Evolution API (Node).
// Auth por header `apikey`: a GLOBAL key só GERENCIA (listar/criar/deletar instância); o
// TOKEN de cada instância (que pareia/envia) é POR ORG e vive em wa_instancia_tokens
// (RLS on, ZERO policies → só service_role lê; nem o dono da org enxerga).
//
// INCIDENTE (corrigido aqui): antes havia UMA instância global ("flowleads") para todas as
// orgs e as edges não checavam o dono → B via o número de A, enviava pelo WhatsApp de A e,
// ao pedir código, derrubava a conexão de A (recriar global). Agora TUDO é escopado ao
// org_id validado no backend, e o NOME da instância é ARMAZENADO (nunca derivado) — assim o legado
// "flowleads" convive com as novas sem caso especial.
//
// Rotas GO usadas:
//   GET  /instance/all           (apikey: global)        -> lista instâncias (gerência)
//   POST /instance/create        (apikey: global)        body {name, token}
//   DELETE /instance/delete/{id} (apikey: global)
//   GET  /instance/status        (apikey: token da org)  -> {data:{Connected,LoggedIn,Name}}
//   GET  /instance/qr            (apikey: token da org)  -> {data:{Qrcode:"data:image/png;base64,..."}}
//   POST /instance/pair          (apikey: token da org)  body {phone} -> {data:{PairingCode}}
//   POST /send/text              (apikey: token da org)  body {number, text}

// Client supabase com SERVICE_ROLE, criado na edge (as tabelas wa_* não são acessíveis ao cliente).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;
import { resolverChave } from "./chaves.ts";
import { normalizeEvolutionGoQr } from "../../../src/lib/evolution-go-qr.ts";
import {
  calculateOperationalHealth,
  parseEvolutionGoStatus,
  providerFailure,
  type WaProviderObservation,
  type WaProviderState,
} from "./whatsapp-instance-health.ts";

// 🔐 Cofre de chaves: cada edge que importa wa.ts chama inicializarCofreWa(admin) 1x no início
// do handler — Deno.env.set não funciona no runtime das Edges, por isso o cache de módulo
// aqui (todas as funções deste arquivo já leem waBase()/waGlobalKey() só através destes 2
// getters, então nenhum outro call-site precisa mudar).
let _waBaseCache: string | null = null;
let _waKeyCache: string | null = null;

export async function inicializarCofreWa(admin: Admin): Promise<void> {
  _waBaseCache = await resolverChave(admin, "EVOLUTION_URL");
  _waKeyCache = await resolverChave(admin, "EVOLUTION_API_KEY");
}

export function waBase(): string {
  return (_waBaseCache ?? Deno.env.get("EVOLUTION_URL") ?? "").replace(/\/+$/, "");
}
export function waGlobalKey(): string {
  return _waKeyCache ?? Deno.env.get("EVOLUTION_API_KEY") ?? "";
}

export async function verificarEvolutionGo(): Promise<{
  ok: boolean;
  configured: boolean;
  status: number;
  instanceCount: number | null;
}> {
  if (!waBase() || !waGlobalKey()) {
    return { ok: false, configured: false, status: 503, instanceCount: null };
  }
  try {
    const response = await fetch(`${waBase()}/instance/all`, {
      headers: { apikey: waGlobalKey() },
    });
    const payload: unknown = await response.json().catch(() => null);
    const data =
      payload && typeof payload === "object" && "data" in payload
        ? (payload as { data?: unknown }).data
        : null;
    return {
      ok: response.ok,
      configured: true,
      status: response.status,
      instanceCount: Array.isArray(data) ? data.length : null,
    };
  } catch (error) {
    console.error(
      "wa Evolution GO probe failed",
      error instanceof Error ? error.name : "network_error",
    );
    return { ok: false, configured: true, status: 503, instanceCount: null };
  }
}

export type WaInstanciaOrg = {
  id: string;
  orgId: string;
  nome: string;
  token: string;
  numero: string | null;
  status: string;
  funcao?: string;
};

export type WaTenantScope = { userId: string; orgId: string };

/** Linha da instância (sem token) — para listar os chips da org na UI. */
export type WaChip = {
  id: string;
  nome: string;
  numero: string | null;
  status: string;
  funcao: string;
  ordem: number;
  provider_status: WaProviderState;
  operational_health: string;
  last_health_check_at: string | null;
  last_provider_success_at: string | null;
  health_failure_count: number;
  health_error_code: string | null;
};

/* ----------------------- gerência na Evolution (key global) ----------------------- */

/** Token de uma instância pelo NOME (usado p/ adotar o legado sem re-parear). */
async function tokenNaEvolution(nome: string): Promise<string | null> {
  const r = await fetch(`${waBase()}/instance/all`, { headers: { apikey: waGlobalKey() } });
  if (!r.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j: any = await r.json().catch(() => ({}));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inst = (j.data || []).find((i: any) => i.name === nome);
  return inst?.token ?? null;
}

/** Id (da Evolution) de uma instância pelo NOME — necessário p/ deletar. */
async function idNaEvolution(nome: string): Promise<string | null> {
  const r = await fetch(`${waBase()}/instance/all`, { headers: { apikey: waGlobalKey() } });
  if (!r.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j: any = await r.json().catch(() => ({}));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inst = (j.data || []).find((i: any) => i.name === nome);
  return inst?.id ?? null;
}

/** Cria a instância na Evolution com um nome dado; devolve o token dela. */
async function criarNaEvolution(nome: string): Promise<string | null> {
  const token = crypto.randomUUID();
  const c = await fetch(`${waBase()}/instance/create`, {
    method: "POST",
    headers: { apikey: waGlobalKey(), "Content-Type": "application/json" },
    body: JSON.stringify({ name: nome, token }),
  });
  if (!c.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cj: any = await c.json().catch(() => ({}));
  return cj.data?.token || token;
}

/** Remove uma instância remota e confirma o resultado antes de alterar o estado local. */
async function excluirNaEvolution(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${waBase()}/instance/delete/${id}`, {
      method: "DELETE",
      headers: { apikey: waGlobalKey() },
    });
    return response.ok;
  } catch (error) {
    console.error(
      "wa remote instance delete failed",
      error instanceof Error ? error.name : "error",
    );
    return false;
  }
}

/* --------------------------- resolução POR ORG (escopada) --------------------------- */

/**
 * Devolve a instância DA ORGANIZAÇÃO autorizada — e SÓ dela.
 * - Org já tem linha: usa o NOME ARMAZENADO. Se o token ainda não foi gravado (caso do legado
 *   "flowleads", adotado pela migration 020), busca na Evolution POR NOME e grava — sem
 *   re-parear, a conexão viva é preservada.
 * - Org sem linha e criarSeFaltar: cria uma instância NOVA (nome gerado e ARMAZENADO).
 */
/**
 * Garante o token de UMA linha de wa_instancias (já resolvida e escopada ao dono): usa o token
 * gravado; senão adota o que existe na Evolution pelo NOME (legado, sem re-parear); senão recria
 * na Evolution com o mesmo nome. Devolve a instância com token, ou null.
 * eslint-disable-next-line @typescript-eslint/no-explicit-any */
async function garantirTokenDaLinha(
  admin: Admin,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: any,
): Promise<WaInstanciaOrg | null> {
  const { data: tk } = await admin
    .from("wa_instancia_tokens")
    .select("token")
    .eq("instancia_id", row.id)
    .maybeSingle();
  if (tk?.token)
    return {
      id: row.id,
      orgId: row.org_id,
      nome: row.nome,
      token: tk.token,
      numero: row.numero,
      status: row.status,
      funcao: row.funcao,
    };

  let token = await tokenNaEvolution(row.nome);
  let numero: string | null = row.numero;
  let status: string = row.status;
  if (!token) {
    token = await criarNaEvolution(row.nome);
    if (!token) return null;
    numero = null;
    status = "desconectado";
    await admin
      .from("wa_instancias")
      .update({ numero: null, status, atualizado_em: new Date().toISOString() })
      .eq("id", row.id);
  }
  await admin
    .from("wa_instancia_tokens")
    .upsert({ instancia_id: row.id, token, atualizado_em: new Date().toISOString() });
  return {
    id: row.id,
    orgId: row.org_id,
    nome: row.nome,
    token,
    numero,
    status,
    funcao: row.funcao,
  };
}

export async function resolverInstanciaDaOrg(
  admin: Admin,
  scope: WaTenantScope,
  criarSeFaltar = true,
): Promise<WaInstanciaOrg | null> {
  if (!waBase() || !waGlobalKey()) return null;

  // N chips por org: a resolução "genérica" (sem id) devolve a PRIMÁRIA (mais antiga).
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, org_id, nome, numero, status, funcao")
    .eq("org_id", scope.orgId)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (row) return await garantirTokenDaLinha(admin, row);

  if (!criarSeFaltar) return null;

  // Reserva a linha primeiro: o trigger de plano serializa e bloqueia acima da cota
  // antes de criar uma instância externa na Evolution.
  const nome = `org-${scope.orgId.slice(0, 8)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 4)}`;
  const { data: nova, error } = await admin
    .from("wa_instancias")
    .insert({ user_id: scope.userId, org_id: scope.orgId, nome, status: "desconectado" })
    .select("id, org_id, nome, numero, status")
    .single();
  if (error || !nova) return null;
  const token = await criarNaEvolution(nome);
  if (!token) {
    await admin.from("wa_instancias").delete().eq("id", nova.id);
    return null;
  }
  await admin.from("wa_instancia_tokens").insert({ instancia_id: nova.id, token });
  return {
    id: nova.id,
    orgId: nova.org_id,
    nome: nova.nome,
    token,
    numero: null,
    status: "desconectado",
  };
}

/**
 * RECRIA apenas a instância DA PRÓPRIA ORG (mesmo nome armazenado) para abrir uma janela de
 * pareamento nova (o QR da Evolution GO é estático e expira ~60s). Escopado ao caller — nunca
 * derruba a conexão de outra org (esse era o DoS do modelo global).
 */
export async function recriarInstanciaDaOrg(
  admin: Admin,
  scope: WaTenantScope,
): Promise<WaInstanciaOrg | null> {
  const atual = await resolverInstanciaDaOrg(admin, scope, true);
  if (!atual) return null;
  const id = await idNaEvolution(atual.nome);
  if (id && !(await excluirNaEvolution(id))) return null;
  const token = await criarNaEvolution(atual.nome);
  if (!token) return null;
  const agora = new Date().toISOString();
  await admin
    .from("wa_instancia_tokens")
    .upsert({ instancia_id: atual.id, token, atualizado_em: agora });
  await admin
    .from("wa_instancias")
    .update({ status: "aguardando", numero: null, atualizado_em: agora })
    .eq("id", atual.id)
    .eq("org_id", scope.orgId);
  return {
    id: atual.id,
    orgId: scope.orgId,
    nome: atual.nome,
    token,
    numero: null,
    status: "aguardando",
  };
}

/**
 * EXCLUI um chip DA PRÓPRIA ORG (apaga na Evolution e remove a linha).
 * Duas travas, porque excluir é irreversível:
 *  1) HISTÓRICO: wa_envios tem ON DELETE CASCADE — excluir um chip que já enviou APAGARIA a prova
 *     do que foi enviado. Nesse caso recusamos e mandamos marcar como 'queimado' (mantém o
 *     histórico e tira o chip do rodízio).
 *  2) PAREADO: se o chip tem número pareado, excluir MATA o pareamento na Evolution (perde a
 *     sessão do WhatsApp). Só prossegue com confirmação explícita do dono.
 */
export async function excluirInstanciaDaOrg(
  admin: Admin,
  scope: WaTenantScope,
  instanciaId: string,
  confirmado: boolean,
): Promise<{ ok: boolean; motivo?: string; envios?: number; numero?: string | null }> {
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, org_id, nome, numero, status")
    .eq("id", instanciaId)
    .eq("org_id", scope.orgId)
    .maybeSingle();
  if (!row) return { ok: false, motivo: "nao_encontrado" };

  const { count } = await admin
    .from("wa_envios")
    .select("id", { count: "exact", head: true })
    .eq("instancia_id", row.id)
    .eq("org_id", scope.orgId);
  if ((count ?? 0) > 0) return { ok: false, motivo: "tem_historico", envios: count ?? 0 };

  if (row.numero && !confirmado)
    return { ok: false, motivo: "pareado_precisa_confirmar", numero: row.numero };

  const evoId = await idNaEvolution(row.nome);
  if (evoId && !(await excluirNaEvolution(evoId))) {
    return { ok: false, motivo: "conflito" };
  }

  const { error } = await admin
    .from("wa_instancias")
    .delete()
    .eq("id", row.id)
    .eq("org_id", scope.orgId);
  if (error) {
    console.error("wa instance delete failed", error.code);
    return { ok: false, motivo: "conflito" };
  }
  return { ok: true, numero: row.numero };
}

export type WaStatus = { connected: boolean; loggedIn: boolean; name: string; jid: string };

export class EvolutionGoPairingError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "EvolutionGoPairingError";
    this.status = status;
  }
}

function evolutionGoError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object" || !("error" in payload)) return fallback;
  const error = (payload as { error?: unknown }).error;
  return typeof error === "string" && error.trim() ? error.trim().slice(0, 200) : fallback;
}

function pairingHttpStatus(providerStatus: number): number {
  if (providerStatus === 400 || providerStatus === 404 || providerStatus === 409) return 409;
  return 502;
}

/** Typed provider observation. Transport failures are never treated as disconnections. */
export async function observarStatusInstancia(
  token: string,
  timeoutMs = 8_000,
): Promise<WaProviderObservation> {
  const observedAt = new Date().toISOString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${waBase()}/instance/status`, {
      headers: { apikey: token },
      signal: controller.signal,
    });
    if (!response.ok) {
      const kind =
        response.status === 401 || response.status === 403 ? "authentication" : "provider";
      return providerFailure(kind, observedAt, response.status);
    }
    const payload: unknown = await response.json().catch(() => null);
    return parseEvolutionGoStatus(payload, observedAt);
  } catch (error) {
    return providerFailure(
      error instanceof DOMException && error.name === "AbortError" ? "timeout" : "network",
      observedAt,
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Status da instância (GET /instance/status com o token DELA). loggedIn = pareada. */
export async function statusInstancia(token: string): Promise<WaStatus | null> {
  const observation = await observarStatusInstancia(token);
  return observation.ok ? observation : null;
}

/** Sincroniza numero/status da org na tabela a partir do estado real na Evolution. */
export async function sincronizarInstancia(
  admin: Admin,
  inst: WaInstanciaOrg,
  st: WaStatus | null,
): Promise<string | null> {
  if (!st) return inst.numero;
  const status = st?.loggedIn ? "conectado" : st?.connected ? "aguardando" : "desconectado";
  const numero = st?.loggedIn ? st.jid || inst.numero : null;
  await admin
    .from("wa_instancias")
    .update({ status, numero, atualizado_em: new Date().toISOString() })
    .eq("id", inst.id)
    .eq("org_id", inst.orgId);
  return numero;
}

/** Código de pareamento (POST /instance/pair com o token DA ORG). */
export async function pairInstancia(token: string, phone: string): Promise<string | null> {
  const r = await fetch(`${waBase()}/instance/pair`, {
    method: "POST",
    headers: { apikey: token, "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const payload: unknown = await r.json().catch(() => null);
  if (!r.ok) {
    throw new EvolutionGoPairingError(
      evolutionGoError(payload, "A Evolution GO recusou o código de pareamento."),
      pairingHttpStatus(r.status),
    );
  }
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data?: unknown }).data
      : null;
  const code =
    data && typeof data === "object" && "PairingCode" in data
      ? (data as { PairingCode?: unknown }).PairingCode
      : null;
  return typeof code === "string" && code.trim() ? code.trim() : null;
}

/** QR da instância DA ORG (GET /instance/qr com o token dela). */
export async function qrInstancia(token: string): Promise<string | null> {
  const q = await fetch(`${waBase()}/instance/qr`, { headers: { apikey: token } });
  const payload: unknown = await q.json().catch(() => null);
  if (!q.ok) {
    throw new EvolutionGoPairingError(
      evolutionGoError(payload, "A Evolution GO não disponibilizou um QR Code."),
      pairingHttpStatus(q.status),
    );
  }
  const qr = normalizeEvolutionGoQr(payload);
  if (!qr) {
    throw new EvolutionGoPairingError(
      "A Evolution GO retornou um QR Code ausente ou em formato inválido.",
      502,
    );
  }
  return qr;
}

/* ------------------------------ N CHIPS por org ------------------------------ */

/** Lista os chips DA ORG (sem token) — para a UI. Ordena por função, ordem, idade. */
export async function listarInstanciasDaOrg(admin: Admin, orgId: string): Promise<WaChip[]> {
  const { data } = await admin
    .from("wa_instancias")
    .select(
      "id, nome, numero, status, funcao, ordem, provider_status, operational_health, last_health_check_at, last_provider_success_at, health_failure_count, health_error_code",
    )
    .eq("org_id", orgId)
    .order("funcao", { ascending: true })
    .order("ordem", { ascending: true })
    .order("criada_em", { ascending: true });
  return (data ?? []) as WaChip[];
}

/**
 * Resolve UM chip pelo id — SÓ se pertencer ao `org_id` autorizado.
 * id forjado de outra org → null. Devolve com token (adota/recria o token se preciso).
 */
export async function instanciaDaOrgComToken(
  admin: Admin,
  orgId: string,
  id: string,
): Promise<WaInstanciaOrg | null> {
  if (!id) return null;
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, org_id, nome, numero, status, funcao")
    .eq("id", id)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!row) return null;
  return await garantirTokenDaLinha(admin, row);
}

/** Cria um chip NOVO para a org (Evolution + linha + token). ordem = próxima da fila. */
export async function criarInstanciaDaOrg(
  admin: Admin,
  scope: WaTenantScope,
  funcao = "disparo",
): Promise<WaInstanciaOrg | null> {
  if (!waBase() || !waGlobalKey()) return null;
  const nome = `org-${scope.orgId.slice(0, 8)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 4)}`;
  const { data: ult } = await admin
    .from("wa_instancias")
    .select("ordem")
    .eq("org_id", scope.orgId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordem = (ult?.ordem ?? -1) + 1;
  const { data: nova, error } = await admin
    .from("wa_instancias")
    .insert({
      user_id: scope.userId,
      org_id: scope.orgId,
      nome,
      status: "desconectado",
      funcao: funcao === "conversa" ? "conversa" : "disparo",
      ordem,
    })
    .select("id, org_id, nome, numero, status, funcao")
    .single();
  if (error || !nova) return null;
  const token = await criarNaEvolution(nome);
  if (!token) {
    await admin.from("wa_instancias").delete().eq("id", nova.id);
    return null;
  }
  await admin.from("wa_instancia_tokens").insert({ instancia_id: nova.id, token });
  return {
    id: nova.id,
    orgId: nova.org_id,
    nome: nova.nome,
    token,
    numero: null,
    status: "desconectado",
    funcao: nova.funcao,
  };
}

/** RECRIA a sessão Evolution de UM chip da organização autorizada. */
export async function recriarInstanciaPorId(
  admin: Admin,
  orgId: string,
  id: string,
): Promise<WaInstanciaOrg | null> {
  const atual = await instanciaDaOrgComToken(admin, orgId, id);
  if (!atual) return null;
  const evoId = await idNaEvolution(atual.nome);
  if (evoId && !(await excluirNaEvolution(evoId))) return null;
  const token = await criarNaEvolution(atual.nome);
  if (!token) return null;
  const agora = new Date().toISOString();
  await admin
    .from("wa_instancia_tokens")
    .upsert({ instancia_id: atual.id, token, atualizado_em: agora });
  await admin
    .from("wa_instancias")
    .update({ status: "aguardando", numero: null, atualizado_em: agora })
    .eq("id", atual.id)
    .eq("org_id", orgId);
  return { id: atual.id, orgId, nome: atual.nome, token, numero: null, status: "aguardando" };
}

/** Próximo chip de DISPARO da org: funcao='disparo' + status='conectado', por ordem. */
export async function proximaInstanciaDisparo(
  admin: Admin,
  orgId: string,
): Promise<WaInstanciaOrg | null> {
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, org_id, nome, numero, status, funcao")
    .eq("org_id", orgId)
    .eq("funcao", "disparo")
    .eq("status", "conectado")
    .eq("provider_status", "connected")
    .eq("operational_health", "healthy")
    .gte("last_provider_success_at", new Date(Date.now() - 5 * 60_000).toISOString())
    // 'conectado' (Connected) é ENGANOSO: fica true até num chip NUNCA pareado (ver decidirSaude).
    // Um chip usável tem NÚMERO pareado — sem isso, não é disparo real (evita o falso 'enviado').
    .not("numero", "is", null)
    .order("ordem", { ascending: true })
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!row) return null;
  return await garantirTokenDaLinha(admin, row);
}

const STATUS_VALIDOS = ["desconectado", "aguardando", "conectado", "erro", "queimada"];

/** Atualiza função/status/ordem de UM chip do dono (marcar queimado, graduar, reordenar). */
export async function atualizarChip(
  admin: Admin,
  orgId: string,
  id: string,
  patch: { funcao?: string; status?: string; ordem?: number },
): Promise<boolean> {
  const set: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (patch.funcao === "disparo" || patch.funcao === "conversa") set.funcao = patch.funcao;
  if (patch.status && STATUS_VALIDOS.includes(patch.status)) set.status = patch.status;
  if (typeof patch.ordem === "number" && patch.ordem >= 0) set.ordem = patch.ordem;
  const { error } = await admin.from("wa_instancias").update(set).eq("id", id).eq("org_id", orgId);
  return !error;
}

/* ---------------- ETAPA 3: saúde (ban) + rotação + graduação + alertas ---------------- */

// CRITÉRIO (confirmado pelo diagnóstico 3.1):
//  - LoggedIn é o sinal de "chip autenticado/usável". Connected é ENGANOSO (fica true até num
//    chip nunca pareado). Uma queda de rede derruba Connected mas NÃO remove o device JID do
//    store → LoggedIn segue true → NÃO queima.
//  - LoggedIn=false ⟺ sem device JID no store = deslogado/banido (send falha com "the store
//    doesn't contain a device JID"). Um único LoggedIn=false pode ser re-auth transitório —
//    por isso só queima após LIMITE checagens SEGUIDAS. Zera ao voltar LoggedIn=true.
export const LIMITE_QUEIMA = 3; // checagens seguidas com LoggedIn=false p/ queimar
export const JANELA_CHECAGEM_MS = 60_000; // ≥60s entre checagens que contam (idempotência)

/** Núcleo PURO do critério: dado LoggedIn e o contador atual, devolve novo contador e se queima. */
export function decidirSaude(
  loggedIn: boolean,
  falhasAtuais: number,
  limite = LIMITE_QUEIMA,
): { falhas: number; queima: boolean } {
  if (loggedIn) return { falhas: 0, queima: false }; // sessão viva → zera, nunca queima
  const falhas = falhasAtuais + 1;
  return { falhas, queima: falhas >= limite }; // LoggedIn=false sustentado → queima
}

export type ResultadoChecagem = {
  resultado: "sadio" | "suspeito" | "queimou" | "pulado" | "erro";
  falhas?: number;
  loggedIn?: boolean;
};

/**
 * Aplica a decisão de saúde a partir de uma observação de LoggedIn e PERSISTE. Idempotente por
 * janela: duas checagens em <60s não contam duas vezes; chip já 'queimada' é pulado (não re-queima).
 */
export async function registrarChecagem(
  admin: Admin,
  orgId: string,
  chipId: string,
  loggedIn: boolean,
): Promise<ResultadoChecagem> {
  const { data: row } = await admin
    .from("wa_instancias")
    .select("status, falhas_login, ultima_checagem_em")
    .eq("id", chipId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!row) return { resultado: "erro" };
  if (row.status === "queimada") return { resultado: "pulado", falhas: row.falhas_login };
  if (
    row.ultima_checagem_em &&
    Date.now() - new Date(row.ultima_checagem_em).getTime() < JANELA_CHECAGEM_MS
  )
    return { resultado: "pulado", falhas: row.falhas_login };

  const { falhas, queima } = decidirSaude(loggedIn, row.falhas_login ?? 0);
  const patch: Record<string, unknown> = {
    falhas_login: falhas,
    ultima_checagem_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  };
  if (queima) patch.status = "queimada";
  else if (loggedIn) patch.status = "conectado";
  await admin.from("wa_instancias").update(patch).eq("id", chipId).eq("org_id", orgId);
  return {
    resultado: queima ? "queimou" : loggedIn ? "sadio" : "suspeito",
    falhas,
    loggedIn,
  };
}

/** Checagem COMPLETA de um chip: lê o status ao vivo na Evolution e aplica registrarChecagem. */
export async function checarSaudeChip(
  admin: Admin,
  orgId: string,
  chipId: string,
): Promise<ResultadoChecagem> {
  const inst = await instanciaDaOrgComToken(admin, orgId, chipId);
  if (!inst) return { resultado: "erro" };
  const observation = await observarStatusInstancia(inst.token);
  const { data: current } = await admin
    .from("wa_instancias")
    .select("provider_status, last_provider_success_at, health_failure_count")
    .eq("id", chipId)
    .eq("org_id", orgId)
    .maybeSingle();
  if (!current) return { resultado: "erro" };
  const failures = observation.ok ? 0 : (current.health_failure_count ?? 0) + 1;
  const providerState = observation.ok
    ? observation.providerState
    : (current.provider_status ?? "unknown");
  const health = calculateOperationalHealth({
    providerState,
    lastSuccessfulCheckAt: observation.ok
      ? observation.observedAt
      : current.last_provider_success_at,
    lastCheckFailed: !observation.ok,
    consecutiveFailures: failures,
  });
  const { data: applied, error } = await admin.rpc("wa_apply_instance_observation", {
    p_org: orgId,
    p_instance: chipId,
    p_source: "manual",
    p_observed_at: observation.observedAt,
    p_provider_status: providerState,
    p_operational_health: health,
    p_success: observation.ok,
    p_error_code: observation.ok ? null : observation.errorCode,
    p_number: observation.ok ? observation.jid : null,
    p_actor: null,
  });
  if (error || applied === false) return { resultado: "erro", falhas: failures };
  if (!observation.ok) return { resultado: "suspeito", falhas: failures };
  return {
    resultado: health === "healthy" ? "sadio" : "suspeito",
    falhas: 0,
    loggedIn: observation.loggedIn,
  };
}

/** Aviso VISÍVEL ao dono (a UI lê wa_alertas e mostra). Insert só via edge (service_role). */
export async function alertar(
  admin: Admin,
  scope: WaTenantScope,
  tipo: string,
  mensagem: string,
): Promise<void> {
  await admin.from("wa_alertas").insert({
    user_id: scope.userId,
    org_id: scope.orgId,
    tipo,
    mensagem,
  });
}

/**
 * ROTAÇÃO: marca o chip como 'queimada' (idempotente) e assume o PRÓXIMO chip de disparo
 * conectado (proximaInstanciaDisparo já exclui 'conversa' e não-conectados → NUNCA recruta o
 * flowleads nem o próprio queimado). Sem próximo → pausa e avisa. Avisa o dono nos dois casos.
 */
export async function rotacionarDisparo(
  admin: Admin,
  scope: WaTenantScope,
  chipQueimadoId: string,
): Promise<{ proximo: WaInstanciaOrg | null; alerta: string }> {
  await admin
    .from("wa_instancias")
    .update({ status: "queimada", atualizado_em: new Date().toISOString() })
    .eq("id", chipQueimadoId)
    .eq("org_id", scope.orgId);
  const proximo = await proximaInstanciaDisparo(admin, scope.orgId);
  if (proximo) {
    const alerta = `Chip queimado — disparo assumido pelo próximo chip (${proximo.numero ?? proximo.nome}).`;
    await alertar(admin, scope, "rotacao", alerta);
    return { proximo, alerta };
  }
  const alerta =
    "Chip queimado e NÃO há outro chip de disparo conectado — disparo PAUSADO. Conecte um chip novo.";
  await alertar(admin, scope, "sem_chip", alerta);
  return { proximo: null, alerta };
}

/**
 * GRADUAÇÃO: o chip que mandou pro lead (wa_envios) vira 'conversa' e sai do disparo. Chamada
 * quando o lead é movido pra "Respondeu" (e, depois, pelo webhook de recebimento — MESMA função).
 * Idempotente: sem envio registrado ou chip já 'conversa' → no-op.
 */
export async function graduarChipDoLead(
  admin: Admin,
  scope: WaTenantScope,
  leadId: string,
): Promise<{ graduou: boolean; chip?: string }> {
  const { data: env } = await admin
    .from("wa_envios")
    .select("instancia_id")
    .eq("lead_id", leadId)
    .eq("org_id", scope.orgId)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!env) return { graduou: false };
  const { data: chip } = await admin
    .from("wa_instancias")
    .select("id, nome, numero, funcao")
    .eq("id", env.instancia_id)
    .eq("org_id", scope.orgId)
    .maybeSingle();
  if (!chip || chip.funcao === "conversa")
    return { graduou: false, chip: chip?.numero ?? chip?.nome };
  await admin
    .from("wa_instancias")
    .update({ funcao: "conversa", atualizado_em: new Date().toISOString() })
    .eq("id", chip.id)
    .eq("org_id", scope.orgId);
  await alertar(
    admin,
    scope,
    "graduacao",
    `Chip ${chip.numero ?? chip.nome} graduou para CONVERSA (o lead respondeu) — saiu do disparo.`,
  );
  return { graduou: true, chip: chip.numero ?? chip.nome };
}

/* ---------------- ETAPA 4: envio de campanha por WhatsApp (motor compartilhado) ---------------- */

// TETO DIÁRIO POR CHIP — diferente do e-mail (rampa por DOMÍNIO). Aqui o recurso que queima é o
// NÚMERO, então o teto é por chip. É um BACKSTOP: a proteção principal contra ban é o intervalo
// com jitter (vazão) + rodízio de chips + revezamento de texto. Conservador de propósito; dá pra
// afrouxar por chip mais tarde. (Justificativa detalhada no relatório da ETAPA 4.)
export const WA_TETO_DIARIO_CHIP = 40;

/** Quantos envios ESTE chip já fez hoje (dia UTC) — consumo do teto diário por chip. */
export async function enviosHojeDoChip(
  admin: Admin,
  orgId: string,
  instanciaId: string,
): Promise<number> {
  const inicioDia = new Date();
  inicioDia.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("wa_envios")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("instancia_id", instanciaId)
    .in("status", ["accepted", "sent", "delivered", "read"])
    .gte("enviado_em", inicioDia.toISOString());
  return count ?? 0;
}

/** Última variação enviada NESTA campanha — para não repetir a anterior (revezamento). */
export async function ultimaVariacaoDaCampanha(
  admin: Admin,
  orgId: string,
  campanhaId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("wa_envios")
    .select("variacao_id")
    .eq("org_id", orgId)
    .eq("campanha_id", campanhaId)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.variacao_id ?? null;
}

/** Já enviamos pra este lead NESTA campanha? (idempotência do lote — não manda duas vezes.) */
export async function jaEnviouNaCampanha(
  admin: Admin,
  orgId: string,
  campanhaId: string,
  leadId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("wa_envios")
    .select("id")
    .eq("org_id", orgId)
    .eq("campanha_id", campanhaId)
    .eq("lead_id", leadId)
    .limit(1)
    .maybeSingle();
  return !!data;
}

/** Envia texto por UMA instância (apikey = token do chip). Devolve o erro REAL da Evolution. */
export async function enviarTextoInstancia(
  token: string,
  number: string,
  text: string,
): Promise<{ ok: boolean; error?: string; data?: unknown; httpStatus: number }> {
  const r = await fetch(`${waBase()}/send/text`, {
    method: "POST",
    headers: { apikey: token, "Content-Type": "application/json" },
    body: JSON.stringify({ number, text }),
  });
  const raw = await r.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    data = { raw };
  }
  return { ...interpretarEnvio(r.ok, r.status, data), httpStatus: r.status };
}

/** Interpreta a resposta do /send/text. PURO (testável) — a Evolution GO às vezes responde
 * HTTP 200 com erro no corpo (ex.: instância não pareada → "the store doesn't contain a device
 * JID"). Confiar só no HTTP marca 'enviado' cego. Regra: HTTP não-ok OU corpo com erro/sucesso
 * falso = FALHA. Exigimos um marcador de sucesso (Id/Key/status) quando a Evolution o fornece. */
export function interpretarEnvio(
  httpOk: boolean,
  httpStatus: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
): { ok: boolean; error?: string; data?: unknown } {
  if (!httpOk)
    return { ok: false, error: data?.error ?? data?.message ?? `HTTP ${httpStatus}`, data };
  // Erro embutido num 200: campo error/erro, success:false, status:"error", ou a msg do JID.
  const erroCorpo =
    data?.error ??
    data?.erro ??
    (data?.success === false ? data?.message || "success=false" : undefined) ??
    (typeof data?.status === "string" && /error|fail/i.test(data.status) ? data.status : undefined);
  if (erroCorpo) return { ok: false, error: String(erroCorpo), data };
  const txt = JSON.stringify(data ?? {});
  if (/doesn't contain a device jid|not logged in|not connected|disconnected/i.test(txt))
    return { ok: false, error: "chip não pareado/deslogado na Evolution", data };
  // Marcador de sucesso quando existir (Id/Key/message id). Se a Evolution não devolve nada
  // identificável, aceitamos o 200 limpo (sem sinal de erro) — mas nunca um 200 com erro.
  return { ok: true, data };
}

/** Chip de CONVERSA conectado da org (com token) — quem responde no bate-papo. flowleads é o
 * padrão. Fallback: qualquer instância da org resolvida. */
export async function instanciaConversaDaOrg(
  admin: Admin,
  scope: WaTenantScope,
): Promise<WaInstanciaOrg | null> {
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, org_id, nome, numero, status, funcao")
    .eq("org_id", scope.orgId)
    .eq("funcao", "conversa")
    .eq("status", "conectado")
    .order("ordem", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (row) return await garantirTokenDaLinha(admin, row);
  return await resolverInstanciaDaOrg(admin, scope, false);
}

/** Configura o webhook de RECEBIMENTO numa instância (POST /instance/connect com o token dela).
 * Evolution GO guarda webhookUrl + subscribe (eventos). NÃO re-pareia (mantém a sessão viva). */
export async function definirWebhookInstancia(
  token: string,
  webhookUrl: string,
  eventos: string[] = ["MESSAGE"], // Evolution GO usa nomes MAIÚSCULOS (MESSAGE/CONNECTION/QRCODE)
): Promise<{ ok: boolean; status: number; body?: string }> {
  try {
    const r = await fetch(`${waBase()}/instance/connect`, {
      method: "POST",
      headers: { apikey: token, "Content-Type": "application/json" },
      body: JSON.stringify({ webhookUrl, subscribe: eventos, immediate: false }),
    });
    const body = await r.text().catch(() => "");
    return { ok: r.ok, status: r.status, body: body.slice(0, 300) };
  } catch (error) {
    console.error(
      "wa webhook configuration failed",
      error instanceof Error ? error.name : "network_error",
    );
    return { ok: false, status: 503 };
  }
}

/** Registra o envio (base da graduação, do histórico e do revezamento). */
export async function registrarEnvio(
  admin: Admin,
  scope: WaTenantScope,
  e: {
    leadId: string;
    instanciaId: string;
    campanhaId: string | null;
    variacaoId: string | null;
    mensagem: string;
  },
): Promise<void> {
  const { error } = await admin.from("wa_envios").insert({
    user_id: scope.userId,
    org_id: scope.orgId,
    lead_id: e.leadId,
    instancia_id: e.instanciaId,
    campanha_id: e.campanhaId,
    variacao_id: e.variacaoId,
    mensagem: e.mensagem,
  });
  if (error) throw new Error(`Falha ao registrar envio de WhatsApp: ${error.message}`);
}
