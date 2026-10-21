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
//   POST /instance/connect       (apikey: token da org)  body {subscribe:[...]} -> inicia o cliente
//                                 em goroutine (NÃO devolve QR; o QR só aparece após Connected)
//   GET  /instance/qr            (apikey: token da org)  -> {data:{Qrcode:"data:image/png;base64,..."}}
//   POST /instance/pair          (apikey: token da org)  body {phone} -> {data:{PairingCode}}
//   POST /send/text              (apikey: token da org)  body {number, text}

// Client supabase com SERVICE_ROLE, criado na edge (as tabelas wa_* não são acessíveis ao cliente).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any;
import { resolverChave } from "./chaves.ts";
import {
  calculateOperationalHealth,
  normalizeWhatsappOwner,
  parseEvolutionGoStatus,
  providerFailure,
  type WaProviderObservation,
  type WaProviderState,
} from "./whatsapp-instance-health.ts";
import {
  chipsParaRevalidar,
  escolherChipParaEnvio,
  type ChipRotacao,
  type EscolhaChip,
} from "./whatsapp-chip-rotation.ts";

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

type WaRemoteInstance = {
  id: string;
  name: string;
  token: string | null;
  owner: string;
  connected: boolean;
};

function remoteText(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

async function numeroNaInstanciaRemota(id: string): Promise<string> {
  if (!id) return "";
  try {
    const response = await fetch(`${waBase()}/instance/info/${encodeURIComponent(id)}`, {
      headers: { apikey: waGlobalKey() },
    });
    if (!response.ok) {
      console.warn(
        JSON.stringify({
          event: "wa_instance_info_failed",
          instance_id: id,
          status: response.status,
        }),
      );
      return "";
    }
    const payload: unknown = await response.json().catch(() => null);
    const root =
      payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
    const data =
      root?.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
    if (!data) return "";
    return normalizeWhatsappOwner(
      data.owner ?? data.Owner ?? data.jid ?? data.Jid ?? data.myJid ?? data.MyJid,
    );
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "wa_instance_info_unavailable",
        instance_id: id,
        error: error instanceof Error ? error.name : "unknown_error",
      }),
    );
    return "";
  }
}

async function listarInstanciasRemotas(): Promise<WaRemoteInstance[] | null> {
  try {
    const response = await fetch(`${waBase()}/instance/all`, {
      headers: { apikey: waGlobalKey() },
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json().catch(() => null);
    const data =
      payload && typeof payload === "object" && "data" in payload
        ? (payload as { data?: unknown }).data
        : null;
    if (!Array.isArray(data)) return null;
    const instances = data.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      const name = remoteText(item, "name", "Name");
      if (!name) return [];
      return [
        {
          id: remoteText(item, "id", "Id", "ID"),
          name,
          token: remoteText(item, "token", "Token") || null,
          owner: normalizeWhatsappOwner(
            item.owner ?? item.Owner ?? item.jid ?? item.Jid ?? item.myJid ?? item.MyJid,
          ),
          connected: (item.connected ?? item.Connected) === true,
        },
      ];
    });
    await Promise.all(
      instances.map(async (instance) => {
        // A Evolution GO mantém o proprietário mesmo depois de a sessão desconectar.
        // Consultar apenas instâncias conectadas fazia o telefone desaparecer justamente
        // nos casos em que o usuário precisava identificar e excluir uma conexão antiga.
        if (instance.owner || !instance.id) return;
        instance.owner = await numeroNaInstanciaRemota(instance.id);
      }),
    );
    return instances;
  } catch {
    return null;
  }
}

/** Instância remota pelo NOME (o nome é o vínculo estável entre a linha local e a Evolution). */
async function instanciaRemotaPorNome(nome: string): Promise<WaRemoteInstance | null> {
  const instances = await listarInstanciasRemotas();
  return instances?.find((instance) => instance.name === nome) ?? null;
}

/** Id (da Evolution) de uma instância pelo NOME — necessário p/ deletar. */
async function idNaEvolution(nome: string): Promise<string | null> {
  return (await instanciaRemotaPorNome(nome))?.id || null;
}

/** Logs recentes e sanitizados da instância para diagnóstico operacional do pareamento. */
export async function logsPareamentoEvolution(nome: string): Promise<string[]> {
  const id = await idNaEvolution(nome);
  if (!id) return ["instance_not_found"];
  const response = await fetch(`${waBase()}/instance/logs/${encodeURIComponent(id)}?limit=20`, {
    headers: { apikey: waGlobalKey() },
  });
  if (!response.ok) return [`logs_http_${response.status}`];
  const payload: unknown = await response.json().catch(() => null);
  if (!Array.isArray(payload)) return ["logs_invalid_payload"];
  return payload.slice(0, 20).map((entry) => {
    if (!entry || typeof entry !== "object") return "invalid_log_entry";
    const record = entry as Record<string, unknown>;
    const level = typeof record.level === "string" ? record.level : "LOG";
    const message = typeof record.message === "string" ? record.message : "unknown";
    return `${level}:${message}`.slice(0, 500);
  });
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
  verificarRemoto = false,
): Promise<WaInstanciaOrg | null> {
  const { data: tk } = await admin
    .from("wa_instancia_tokens")
    .select("token")
    .eq("instancia_id", row.id)
    .maybeSingle();

  if (tk?.token && !verificarRemoto) {
    return {
      id: row.id,
      orgId: row.org_id,
      nome: row.nome,
      token: tk.token,
      numero: row.numero,
      status: row.status,
      funcao: row.funcao,
    };
  }

  // A instância existe na Evolution? (pelo NOME — o id remoto pode não vir na listagem)
  const remota = await instanciaRemotaPorNome(row.nome);
  let token: string | null = null;

  if (remota) {
    // Candidatos a token: o gravado localmente e o que a própria Evolution expõe na listagem.
    // Um token só é DESCARTADO quando a Evolution o rejeita explicitamente (401/403). Falha de
    // transporte ou resposta inesperada não autoriza destruir uma sessão possivelmente viva.
    const candidatos = [tk?.token ?? null, remota.token].filter(
      (value, index, all): value is string => Boolean(value) && all.indexOf(value) === index,
    );
    for (const candidato of candidatos) {
      const observation = await observarStatusInstancia(candidato, 4000);
      if (!observation.ok && observation.failureKind === "authentication") continue;
      token = candidato;
      break;
    }
    if (token) {
      if (token !== tk?.token) {
        await admin
          .from("wa_instancia_tokens")
          .upsert(
            { instancia_id: row.id, token, atualizado_em: new Date().toISOString() },
            { onConflict: "instancia_id" },
          );
      }
      return {
        id: row.id,
        orgId: row.org_id,
        nome: row.nome,
        token,
        numero: row.numero,
        status: row.status,
        funcao: row.funcao,
      };
    }
    // Existe remotamente, mas nenhum token é aceito: remove a antiga para recriar sem 409.
    if (remota.id) await excluirNaEvolution(remota.id).catch(() => false);
  }

  // Cria a instância na Evolution
  token = await criarNaEvolution(row.nome);
  if (!token) return null;

  const numero = null;
  const status = "desconectado";
  await admin
    .from("wa_instancias")
    .update({
      numero: null,
      status,
      provider_status: "desconectado",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", row.id);

  await admin
    .from("wa_instancia_tokens")
    .upsert(
      { instancia_id: row.id, token, atualizado_em: new Date().toISOString() },
      { onConflict: "instancia_id" },
    );

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
    .is("deleted_at", null)
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
 * EXCLUI uma conexão DA PRÓPRIA ORG. A sessão remota e seu token são removidos, mas a linha é
 * arquivada para preservar mensagens, envios, incidentes e auditoria ligados a ela.
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
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) return { ok: false, motivo: "nao_encontrado" };

  if (row.numero && !confirmado)
    return { ok: false, motivo: "pareado_precisa_confirmar", numero: row.numero };

  const evoId = await idNaEvolution(row.nome);
  if (evoId && !(await excluirNaEvolution(evoId))) {
    return { ok: false, motivo: "conflito" };
  }

  await admin.from("wa_instancia_tokens").delete().eq("instancia_id", row.id);
  const { error } = await admin
    .from("wa_instancias")
    .update({
      deleted_at: new Date().toISOString(),
      status: "desconectado",
      provider_status: "disconnected",
      operational_health: "unavailable",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("org_id", scope.orgId)
    .is("deleted_at", null);
  if (error) {
    console.error("wa instance delete failed", error.code);
    return { ok: false, motivo: "conflito" };
  }
  return { ok: true, numero: row.numero };
}

export type WaStatus = { connected: boolean; loggedIn: boolean; name: string; jid: string };

/**
 * Classificação do erro de pareamento — decide se vale RECRIAR a sessão remota.
 * - provider_rejected: a Evolution recusou a chamada de forma explícita (não recuperável aqui).
 * - already_logged_in: a sessão já está pareada; não há QR/código a gerar (nunca recriar!).
 * - session_unauthorized: o token da instância não é mais aceito (recriar).
 * - session_not_connected: o cliente não ficou Connected no prazo — cliente morto no mapa da
 *   Evolution GO; só delete+create limpa esse estado (recriar).
 * - qr_unavailable: conectado, mas o WhatsApp não emitiu QR no prazo (recriar).
 */
export type EvolutionGoPairingCode =
  | "provider_rejected"
  | "already_logged_in"
  | "session_unauthorized"
  | "session_not_connected"
  | "qr_unavailable"
  | "provider_overloaded";

/** Mensagem única para o esgotamento de conexões do Postgres interno da Evolution GO. */
export const MENSAGEM_EVOLUTION_SOBRECARREGADA =
  "O serviço do WhatsApp está temporariamente sobrecarregado. Tente novamente em alguns minutos.";

/**
 * A Evolution GO 0.7.x abre um pool de Postgres NOVO a cada início de cliente e nunca o fecha;
 * com o banco dela esgotado, nenhum cliente sobe até o processo ser reiniciado. Detectado pelos
 * logs da própria instância.
 */
export function evolutionSemConexoesDeBanco(logs: string[]): boolean {
  return logs.some((log) => log.includes("too many clients already"));
}

export class EvolutionGoPairingError extends Error {
  readonly status: number;
  readonly code: EvolutionGoPairingCode;

  constructor(message: string, status: number, code: EvolutionGoPairingCode = "provider_rejected") {
    super(message);
    this.name = "EvolutionGoPairingError";
    this.status = status;
    this.code = code;
  }
}

/** Erros em que recriar a sessão remota (delete + create) é a única saída conhecida. */
export function pareamentoRecuperavel(error: unknown): error is EvolutionGoPairingError {
  return (
    error instanceof EvolutionGoPairingError &&
    (error.code === "session_not_connected" ||
      error.code === "qr_unavailable" ||
      error.code === "session_unauthorized")
  );
}

/** Prazos do protocolo de pareamento (ajustáveis nos testes). */
export type WaPairingTiming = {
  /** Quanto esperar o cliente ficar Connected após o /instance/connect. */
  prazoSessaoMs: number;
  /** Quanto esperar o WhatsApp emitir o QR depois de Connected. */
  prazoQrMs: number;
  /** Intervalo entre consultas de status/QR. */
  intervaloMs: number;
};

export const PAIRING_TIMING: WaPairingTiming = {
  prazoSessaoMs: 10_000,
  prazoQrMs: 12_000,
  intervaloMs: 1_000,
};

function dormir(ms: number): Promise<void> {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

function normalizeEvolutionGoQr(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return null;
  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  for (const candidate of [record.Qrcode, record.qrcode, record.Code, record.code]) {
    if (typeof candidate !== "string") continue;
    const value = candidate.trim();
    if (/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value)) return value;
    if (/^iVBORw0KGgo[A-Za-z0-9+/]*={0,2}$/.test(value)) {
      return `data:image/png;base64,${value}`;
    }
  }
  return null;
}

function evolutionGoError(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const msg =
      record.message ||
      record.error ||
      (record.response &&
        typeof record.response === "object" &&
        (record.response as Record<string, unknown>).message);
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (Array.isArray(msg) && msg.length && typeof msg[0] === "string") return msg[0];
  }
  return fallback;
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

export type WaContactAvatar = {
  url: string | null;
  id: string | null;
  found: boolean;
};

/**
 * JID canônico do WhatsApp (só dígitos + servidor) para rotas da Evolution GO que consultam o
 * protocolo direto, sem usync — caso de /user/avatar.
 *
 * Por quê (fonte da Evolution GO 0.7.x, utils.CreateJID): número "cru" vira "+5541...@s.whatsapp.net".
 * O envio de mensagens tolera o "+" (o servidor o remove com CanonicalJID), mas a rota de foto
 * NÃO remove: o WhatsApp ignora a consulta e ela morre em "info query timed out". Um JID já
 * completo é repassado sem alteração, então enviamos sempre o canônico.
 */
export function jidCanonicoWhatsapp(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  if (raw.includes("@")) {
    const [user, server] = raw.split("@");
    const cleanUser = user.split(":")[0].replace(/^\+/, "");
    return cleanUser && server ? `${cleanUser}@${server}` : null;
  }
  const digits = raw.split(":")[0].replace(/\D/g, "");
  return digits ? `${digits}@s.whatsapp.net` : null;
}

/** Respostas do WhatsApp que significam "não há foto visível" (não é falha do provedor). */
const SEM_FOTO_VISIVEL =
  /no profile picture|does not have a profile picture|profile picture not found|hidden their profile picture|not found/i;

/** Obtém a foto real do contato. A Evolution GO autentica esta rota com o token da instância. */
export async function obterAvatarInstancia(
  token: string,
  number: string,
  timeoutMs = 6_000,
): Promise<WaContactAvatar> {
  const jid = jidCanonicoWhatsapp(number);
  if (!jid) return { url: null, id: null, found: false };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${waBase()}/user/avatar`, {
      method: "POST",
      headers: { apikey: token, "Content-Type": "application/json" },
      body: JSON.stringify({ number: jid, preview: true }),
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    const root =
      payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
    const data =
      root?.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
    const rawUrl = data?.URL ?? data?.url;
    const url = typeof rawUrl === "string" && /^https:\/\//i.test(rawUrl) ? rawUrl : null;
    const rawId = data?.ID ?? data?.id;
    const id = typeof rawId === "string" && rawId.trim() ? rawId.trim() : null;
    if (response.ok && url) return { url, id, found: true };

    const errorText = String(root?.error ?? root?.message ?? "");
    if (SEM_FOTO_VISIVEL.test(errorText)) {
      return { url: null, id: null, found: false };
    }
    throw new Error(`Evolution GO avatar HTTP ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
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

/**
 * Garante que a sessão da instância está CONECTADA ao WhatsApp antes de pedir QR ou código.
 *
 * Por quê (lido no fonte da Evolution GO 0.7.x): /instance/connect só agenda o StartClient em
 * goroutine e responde na hora, sem QR. Se /instance/qr ou /instance/pair chegam antes de o
 * cliente ser registrado, o servidor inicia um SEGUNDO cliente para a mesma instância — cada
 * um abre um pool próprio de Postgres (daí "too many clients already") e o perdedor da corrida
 * vira um cliente morto no mapa, que faz todo /instance/qr seguinte responder "no QR code
 * available" indefinidamente. Logo: status → connect (só se preciso) → esperar Connected=true
 * → só então QR/código. Se nunca conecta, o erro sai classificado para a camada acima RECRIAR.
 */
export async function prepararSessaoPareamento(
  token: string,
  timing: WaPairingTiming = PAIRING_TIMING,
): Promise<void> {
  const classificar = (observation: WaProviderObservation): "pronta" | "aguardando" => {
    if (!observation.ok && observation.failureKind === "authentication") {
      throw new EvolutionGoPairingError(
        "O serviço de conexão não reconhece mais esta instância.",
        409,
        "session_unauthorized",
      );
    }
    if (observation.ok && observation.loggedIn) {
      throw new EvolutionGoPairingError("Este número já está conectado.", 409, "already_logged_in");
    }
    return observation.ok && observation.connected ? "pronta" : "aguardando";
  };

  if (classificar(await observarStatusInstancia(token, 4_000)) === "pronta") return;

  await iniciarPareamentoInstancia(token);
  const limite = Date.now() + timing.prazoSessaoMs;
  for (;;) {
    await dormir(timing.intervaloMs);
    if (classificar(await observarStatusInstancia(token, 4_000)) === "pronta") return;
    if (Date.now() >= limite) {
      throw new EvolutionGoPairingError(
        "A sessão do WhatsApp não respondeu a tempo.",
        409,
        "session_not_connected",
      );
    }
  }
}

/** Código de pareamento (POST /instance/pair com o token DA ORG). */
export async function pairInstancia(
  token: string,
  phone: string,
  timing: WaPairingTiming = PAIRING_TIMING,
): Promise<string | null> {
  await prepararSessaoPareamento(token, timing);
  const r = await fetch(`${waBase()}/instance/pair`, {
    method: "POST",
    headers: { apikey: token, "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const payload: unknown = await r.json().catch(() => null);
  if (!r.ok) {
    throw new EvolutionGoPairingError(
      evolutionGoError(payload, "O serviço de conexão recusou o código de pareamento."),
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

/** POST /instance/connect: grava as assinaturas de eventos e agenda o StartClient no servidor. */
async function iniciarPareamentoInstancia(token: string): Promise<void> {
  const connect = await fetch(`${waBase()}/instance/connect`, {
    method: "POST",
    headers: { apikey: token, "Content-Type": "application/json" },
    body: JSON.stringify({ subscribe: ["MESSAGE", "CONNECTION", "QRCODE"] }),
  });
  const payload: unknown = await connect.json().catch(() => null);
  if (!connect.ok) {
    throw new EvolutionGoPairingError(
      evolutionGoError(payload, "O serviço de conexão não iniciou a sessão de pareamento."),
      pairingHttpStatus(connect.status),
    );
  }
}

/**
 * QR da instância DA ORG (GET /instance/qr com o token dela), só depois de a sessão estar
 * Connected (ver prepararSessaoPareamento). O servidor guarda o QR no banco ao receber o evento
 * do WhatsApp; enquanto não chega, responde 400 "no QR code available" — é transitório até o
 * prazo. Nunca devolve null: ou entrega o QR ou lança um erro classificado.
 */
export async function qrInstancia(
  token: string,
  timing: WaPairingTiming = PAIRING_TIMING,
): Promise<string> {
  await prepararSessaoPareamento(token, timing);

  const limite = Date.now() + timing.prazoQrMs;
  for (;;) {
    const q = await fetch(`${waBase()}/instance/qr`, { headers: { apikey: token } });
    const payload: unknown = await q.json().catch(() => null);
    if (q.ok) {
      const qr = normalizeEvolutionGoQr(payload);
      if (qr) return qr;
    }

    const errText = evolutionGoError(payload, "");
    if (q.status === 401 || q.status === 403) {
      throw new EvolutionGoPairingError(
        "O serviço de conexão não reconhece mais esta instância.",
        409,
        "session_unauthorized",
      );
    }
    if (/already logged in/i.test(errText)) {
      throw new EvolutionGoPairingError("Este número já está conectado.", 409, "already_logged_in");
    }
    const transitorio =
      q.ok ||
      q.status === 400 ||
      q.status === 404 ||
      q.status === 409 ||
      /no qr code available|wait a moment|invalid qr code format/i.test(errText);
    if (!transitorio) {
      throw new EvolutionGoPairingError(
        errText || "O serviço de conexão não disponibilizou um QR Code.",
        pairingHttpStatus(q.status),
      );
    }
    if (Date.now() >= limite) break;
    await dormir(timing.intervaloMs);
  }

  throw new EvolutionGoPairingError(
    "O WhatsApp não liberou o QR Code a tempo.",
    409,
    "qr_unavailable",
  );
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
    .is("deleted_at", null)
    .order("funcao", { ascending: true })
    .order("ordem", { ascending: true })
    .order("criada_em", { ascending: true });
  const local = (data ?? []) as WaChip[];
  const remote = await listarInstanciasRemotas();
  if (!remote) return local;

  const remoteByName = new Map(remote.map((instance) => [instance.name, instance]));
  const remoteNames = new Set(remoteByName.keys());
  const visible = local.filter((instance) => remoteNames.has(instance.nome));
  const updates: PromiseLike<unknown>[] = [];
  const now = new Date().toISOString();

  for (const instance of visible) {
    const remoteInstance = remoteByName.get(instance.nome);
    if (!remoteInstance) continue;
    const providerStatus: WaProviderState = remoteInstance.connected ? "connected" : "disconnected";
    const status = remoteInstance.connected ? "conectado" : "desconectado";
    const operationalHealth = remoteInstance.connected ? "healthy" : "unavailable";
    if (remoteInstance.owner) instance.numero = remoteInstance.owner;
    instance.status = status;
    instance.provider_status = providerStatus;
    instance.operational_health = operationalHealth;
    instance.last_health_check_at = now;
    instance.last_provider_success_at = now;
    instance.health_failure_count = 0;
    instance.health_error_code = null;
    updates.push(
      admin
        .from("wa_instancias")
        .update({
          ...(remoteInstance.owner ? { numero: remoteInstance.owner } : {}),
          status,
          provider_status: providerStatus,
          operational_health: operationalHealth,
          last_health_check_at: now,
          last_provider_success_at: now,
          health_failure_count: 0,
          health_error_code: null,
          atualizado_em: now,
        })
        .eq("id", instance.id)
        .eq("org_id", orgId),
    );
  }
  if (updates.length) await Promise.all(updates);
  return visible;
}

/**
 * Resolve UM chip pelo id — SÓ se pertencer ao `org_id` autorizado.
 * id forjado de outra org → null. Devolve com token (adota/recria o token se preciso).
 */
export async function instanciaDaOrgComToken(
  admin: Admin,
  orgId: string,
  id: string,
  verificarRemoto = false,
): Promise<WaInstanciaOrg | null> {
  if (!id) return null;
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, org_id, nome, numero, status, funcao")
    .eq("id", id)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!row) return null;
  return await garantirTokenDaLinha(admin, row, verificarRemoto);
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
    .is("deleted_at", null)
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

/**
 * Reutiliza a tentativa de pareamento ainda sem número da organização. Isso torna o botão
 * "Conectar número" idempotente: atualizar/tentar novamente não cria chips órfãos em sequência.
 */
export async function obterOuCriarInstanciaParaPareamento(
  admin: Admin,
  scope: WaTenantScope,
  funcao = "disparo",
): Promise<WaInstanciaOrg | null> {
  const { data: pending, error } = await admin
    .from("wa_instancias")
    .select("id, org_id, nome, numero, status, funcao")
    .eq("org_id", scope.orgId)
    .eq("funcao", funcao === "conversa" ? "conversa" : "disparo")
    .is("deleted_at", null)
    .is("numero", null)
    .order("criada_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  // Uma tentativa sem número pode ter ficado com um token local cuja sessão já foi
  // descarregada pela Evolution. Confirme a existência remota antes de reutilizá-la; se ela
  // sumiu, garantirTokenDaLinha recria a sessão com o mesmo nome e atualiza o token da mesma
  // linha, evitando tanto `not authorized` quanto novos chips órfãos.
  if (pending) return garantirTokenDaLinha(admin, pending, true);
  return criarInstanciaDaOrg(admin, scope, funcao);
}

/**
 * Operação atômica: obtém/cria a instância pendente de pareamento E tenta gerar o QR Code.
 * Se a instância foi CRIADA AGORA e o QR falhar, ela é excluída automaticamente para evitar
 * chips órfãos. Se já existia (reutilização idempotente), o erro de QR é propagado sem alterar
 * o banco (a instância pode ser reutilizada na próxima tentativa).
 *
 * Retorna { instance, qr } em caso de sucesso, ou lança EvolutionGoPairingError em caso de falha.
 * Já enriquece o erro com diagnóstico de "too many clients already" da Evolution antes de relançar.
 */
export async function obterOuCriarEObterQr(
  admin: Admin,
  scope: WaTenantScope,
  funcao = "disparo",
  timing: WaPairingTiming = PAIRING_TIMING,
): Promise<{ instance: WaInstanciaOrg; qr: string }> {
  const func = funcao === "conversa" ? "conversa" : "disparo";

  // 1. Limpa tentativas antigas pendentes (órfãs) sem número para esta org/função, exceto a mais recente
  const { data: pendingRows } = await admin
    .from("wa_instancias")
    .select("id, org_id, nome, numero, status, funcao")
    .eq("org_id", scope.orgId)
    .eq("funcao", func)
    .is("deleted_at", null)
    .is("numero", null)
    .order("criada_em", { ascending: false });

  const pendingRow = pendingRows && pendingRows.length > 0 ? pendingRows[0] : null;

  // Se houver mais de uma linha pendente, arquiva as excedentes para manter a tabela limpa
  if (pendingRows && pendingRows.length > 1) {
    const extraIds = pendingRows.slice(1).map((r) => r.id);
    await admin
      .from("wa_instancias")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", extraIds)
      .eq("org_id", scope.orgId);
  }

  const wasExisting = Boolean(pendingRow);

  // 2. Obtém/cria a instância com token válido.
  const instance = pendingRow
    ? await garantirTokenDaLinha(admin, pendingRow, true)
    : await criarInstanciaDaOrg(admin, scope, func);

  if (!instance) {
    throw new EvolutionGoPairingError(
      "Não foi possível inicializar a instância de pareamento.",
      503,
    );
  }

  // 3. Gera o QR (com UMA recriação da sessão remota se ela estiver morta). Se ainda assim
  //    falhar e a instância era nova, faz rollback completo para não deixar chip órfão.
  try {
    const { instance: ativa, result: qr } = await comSessaoRecuperavel(admin, instance, (inst) =>
      qrInstancia(inst.token, timing),
    );
    return { instance: ativa, qr };
  } catch (error) {
    // Logs do provedor ANTES de qualquer rollback (depois a instância remota já não existe).
    const providerLogs =
      error instanceof EvolutionGoPairingError
        ? await logsPareamentoEvolution(instance.nome).catch(() => [])
        : [];
    if (error instanceof EvolutionGoPairingError && error.code === "already_logged_in") {
      // A linha estava "sem número", mas a sessão remota já está pareada: sincroniza e avisa.
      await sincronizarInstancia(admin, instance, await statusInstancia(instance.token));
      throw new EvolutionGoPairingError(
        "Este número já está conectado. A lista de números foi atualizada.",
        409,
        "already_logged_in",
      );
    }
    if (!wasExisting) {
      const evoId = await idNaEvolution(instance.nome).catch(() => null);
      if (evoId) await excluirNaEvolution(evoId).catch(() => false);
      await admin
        .from("wa_instancias")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", instance.id)
        .eq("org_id", scope.orgId);
    }
    if (error instanceof EvolutionGoPairingError) {
      console.error("wa criar_e_qr pairing failed", error.code, error.message, providerLogs);
      if (error.code !== "provider_overloaded" && evolutionSemConexoesDeBanco(providerLogs)) {
        throw new EvolutionGoPairingError(
          MENSAGEM_EVOLUTION_SOBRECARREGADA,
          503,
          "provider_overloaded",
        );
      }
    }
    throw error;
  }
}

/**
 * Recria a sessão remota de UMA linha (delete + create com o MESMO nome) e grava o token novo.
 * É o único jeito conhecido de limpar um cliente morto do mapa da Evolution GO: /instance/connect
 * em cliente existente só "atualiza configurações", e /instance/disconnect exige Connected.
 * A linha local é preservada (mesmo id, mesma ordem) — nada de chip órfão.
 */
export async function recriarSessaoDaLinha(
  admin: Admin,
  instance: WaInstanciaOrg,
): Promise<WaInstanciaOrg | null> {
  const remota = await instanciaRemotaPorNome(instance.nome);
  if (remota?.id && !(await excluirNaEvolution(remota.id))) return null;
  const token = await criarNaEvolution(instance.nome);
  if (!token) return null;
  const agora = new Date().toISOString();
  await admin
    .from("wa_instancia_tokens")
    .upsert(
      { instancia_id: instance.id, token, atualizado_em: agora },
      { onConflict: "instancia_id" },
    );
  await admin
    .from("wa_instancias")
    .update({ status: "aguardando", numero: null, atualizado_em: agora })
    .eq("id", instance.id)
    .eq("org_id", instance.orgId);
  return { ...instance, token, numero: null, status: "aguardando" };
}

/**
 * Executa uma operação de pareamento (QR ou código) e, se a sessão remota estiver morta ou
 * com token rejeitado, recria-a UMA vez e repete. Sessão já pareada NUNCA é recriada
 * (already_logged_in não é recuperável) — preserva a conexão viva do cliente.
 */
export async function comSessaoRecuperavel<T>(
  admin: Admin,
  instance: WaInstanciaOrg,
  operacao: (inst: WaInstanciaOrg) => Promise<T>,
): Promise<{ instance: WaInstanciaOrg; result: T; recuperada: boolean }> {
  try {
    return { instance, result: await operacao(instance), recuperada: false };
  } catch (error) {
    if (!pareamentoRecuperavel(error)) throw error;
    const logs = await logsPareamentoEvolution(instance.nome).catch(() => []);
    // Recriar a sessão abriria MAIS um pool no Postgres já esgotado da Evolution e pioraria o
    // incidente para todos os clientes. Falha rápida e honesta em vez disso.
    if (evolutionSemConexoesDeBanco(logs)) {
      console.error(JSON.stringify({ event: "wa_provider_db_exhausted", instance: instance.nome }));
      throw new EvolutionGoPairingError(
        MENSAGEM_EVOLUTION_SOBRECARREGADA,
        503,
        "provider_overloaded",
      );
    }
    console.warn(
      JSON.stringify({
        event: "wa_pairing_session_reset",
        instance: instance.nome,
        code: error.code,
        provider_logs: logs.slice(0, 5),
      }),
    );
    const nova = await recriarSessaoDaLinha(admin, instance);
    if (!nova) throw error;
    return { instance: nova, result: await operacao(nova), recuperada: true };
  }
}

/** RECRIA a sessão Evolution de UM chip da organização autorizada. */
export async function recriarInstanciaPorId(
  admin: Admin,
  orgId: string,
  id: string,
): Promise<WaInstanciaOrg | null> {
  const atual = await instanciaDaOrgComToken(admin, orgId, id);
  if (!atual) return null;
  return recriarSessaoDaLinha(admin, atual);
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
    .is("deleted_at", null)
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
  const { error } = await admin
    .from("wa_instancias")
    .update(set)
    .eq("id", id)
    .eq("org_id", orgId)
    .is("deleted_at", null);
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
  origem: "manual" | "worker" | "monitor" = "manual",
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
    p_source: origem,
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
/**
 * Seleciona, NA HORA DO ENVIO, o chip que vai disparar uma mensagem vinculada a
 * `chipOriginalId` (ver regras em whatsapp-chip-rotation.ts). Revalida ao vivo a saúde dos
 * chips velhos/caídos antes de decidir, para que nem a falta de monitor periódico nem uma queda
 * já recuperada travem a fila.
 */
export async function selecionarChipParaEnvio(
  admin: Admin,
  orgId: string,
  chipOriginalId: string,
  agora = Date.now(),
): Promise<{ escolha: EscolhaChip; chips: ChipRotacao[]; revalidados: string[] }> {
  const carregar = async (): Promise<ChipRotacao[]> => {
    const { data, error } = await admin
      .from("wa_instancias")
      .select(
        "id,status,funcao,numero,provider_status,operational_health,last_provider_success_at,last_health_check_at,ordem",
      )
      .eq("org_id", orgId)
      .is("deleted_at", null);
    if (error) throw new Error("chips_indisponiveis");
    const inicioDia = new Date(agora);
    inicioDia.setUTCHours(0, 0, 0, 0);
    const { data: enviados } = await admin
      .from("wa_envios")
      .select("instancia_id")
      .eq("org_id", orgId)
      .in("status", ["accepted", "sent", "delivered", "read"])
      .gte("enviado_em", inicioDia.toISOString());
    const porChip = new Map<string, number>();
    for (const row of (enviados ?? []) as Array<{ instancia_id: string }>) {
      porChip.set(row.instancia_id, (porChip.get(row.instancia_id) ?? 0) + 1);
    }
    return ((data ?? []) as Array<Omit<ChipRotacao, "enviosHoje">>).map((row) => ({
      ...row,
      ordem: Number(row.ordem ?? 0),
      enviosHoje: porChip.get(row.id) ?? 0,
    }));
  };

  const { data: contingencia } = await admin
    .from("wa_contingencias")
    .select("backup_instance_id")
    .eq("org_id", orgId)
    .eq("source_instance_id", chipOriginalId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  const backupContingenciaId = contingencia?.backup_instance_id
    ? String(contingencia.backup_instance_id)
    : null;

  let chips = await carregar();
  const revalidados = chipsParaRevalidar(chips, WA_TETO_DIARIO_CHIP, agora);
  if (revalidados.length) {
    for (const id of revalidados) {
      await checarSaudeChip(admin, orgId, id, "worker").catch(() => null);
    }
    chips = await carregar();
  }
  const escolha = escolherChipParaEnvio({
    chipOriginalId,
    backupContingenciaId,
    chips,
    teto: WA_TETO_DIARIO_CHIP,
    agora: Math.max(agora, Date.now()),
  });
  return { escolha, chips, revalidados };
}

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
    return { ok: false, error: "número não pareado ou desconectado do WhatsApp", data };
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
