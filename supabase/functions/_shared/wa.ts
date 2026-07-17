// Cliente da EVOLUTION GO (WhatsApp) — MULTI-TENANT: uma instância POR ORG.
// ⚠️ Rotas VALIDADAS contra o Swagger da versão EM USO — DIFEREM da Evolution API (Node).
// Auth por header `apikey`: a GLOBAL key só GERENCIA (listar/criar/deletar instância); o
// TOKEN de cada instância (que pareia/envia) é POR ORG e vive em wa_instancia_tokens
// (RLS on, ZERO policies → só service_role lê; nem o dono da org enxerga).
//
// INCIDENTE (corrigido aqui): antes havia UMA instância global ("flowleads") para todas as
// orgs e as edges não checavam o dono → B via o número de A, enviava pelo WhatsApp de A e,
// ao pedir código, derrubava a conexão de A (recriar global). Agora TUDO é escopado ao
// user_id do caller, e o NOME da instância é ARMAZENADO (nunca derivado) — assim o legado
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

export function waBase(): string {
  return (Deno.env.get("EVOLUTION_URL") || "").replace(/\/+$/, "");
}
export function waGlobalKey(): string {
  return Deno.env.get("EVOLUTION_API_KEY") || "";
}

export type WaInstanciaOrg = {
  id: string;
  nome: string;
  token: string;
  numero: string | null;
  status: string;
  funcao?: string;
};

/** Linha da instância (sem token) — para listar os chips da org na UI. */
export type WaChip = {
  id: string;
  nome: string;
  numero: string | null;
  status: string;
  funcao: string;
  ordem: number;
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

/* --------------------------- resolução POR ORG (escopada) --------------------------- */

/**
 * Devolve a instância DA ORG do userId — e SÓ dela. Nunca lista/retorna a de outra org.
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
  return { id: row.id, nome: row.nome, token, numero, status, funcao: row.funcao };
}

export async function resolverInstanciaDaOrg(
  admin: Admin,
  userId: string,
  criarSeFaltar = true,
): Promise<WaInstanciaOrg | null> {
  if (!waBase() || !waGlobalKey()) return null;

  // N chips por org: a resolução "genérica" (sem id) devolve a PRIMÁRIA (mais antiga).
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, nome, numero, status, funcao")
    .eq("user_id", userId)
    .order("criada_em", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (row) return await garantirTokenDaLinha(admin, row);

  if (!criarSeFaltar) return null;

  // Org sem instância → cria a DELA. Nome gerado e ARMAZENADO (nunca derivado em runtime).
  const nome = `org-${userId.slice(0, 8)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 4)}`;
  const token = await criarNaEvolution(nome);
  if (!token) return null;
  const { data: nova, error } = await admin
    .from("wa_instancias")
    .insert({ user_id: userId, nome, status: "desconectado" })
    .select("id, nome, numero, status")
    .single();
  if (error || !nova) return null;
  await admin.from("wa_instancia_tokens").insert({ instancia_id: nova.id, token });
  return { id: nova.id, nome: nova.nome, token, numero: null, status: "desconectado" };
}

/**
 * RECRIA apenas a instância DA PRÓPRIA ORG (mesmo nome armazenado) para abrir uma janela de
 * pareamento nova (o QR da Evolution GO é estático e expira ~60s). Escopado ao caller — nunca
 * derruba a conexão de outra org (esse era o DoS do modelo global).
 */
export async function recriarInstanciaDaOrg(
  admin: Admin,
  userId: string,
): Promise<WaInstanciaOrg | null> {
  const atual = await resolverInstanciaDaOrg(admin, userId, true);
  if (!atual) return null;
  const id = await idNaEvolution(atual.nome);
  if (id)
    await fetch(`${waBase()}/instance/delete/${id}`, {
      method: "DELETE",
      headers: { apikey: waGlobalKey() },
    }).catch(() => {});
  const token = await criarNaEvolution(atual.nome);
  if (!token) return null;
  const agora = new Date().toISOString();
  await admin
    .from("wa_instancia_tokens")
    .upsert({ instancia_id: atual.id, token, atualizado_em: agora });
  await admin
    .from("wa_instancias")
    .update({ status: "aguardando", numero: null, atualizado_em: agora })
    .eq("id", atual.id);
  return { id: atual.id, nome: atual.nome, token, numero: null, status: "aguardando" };
}

export type WaStatus = { connected: boolean; loggedIn: boolean; name: string; jid: string };

/** Status da instância (GET /instance/status com o token DELA). loggedIn = pareada. */
export async function statusInstancia(token: string): Promise<WaStatus | null> {
  const r = await fetch(`${waBase()}/instance/status`, { headers: { apikey: token } });
  if (!r.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j: any = await r.json().catch(() => ({}));
  return {
    connected: !!j.data?.Connected,
    loggedIn: !!j.data?.LoggedIn,
    name: j.data?.Name || "",
    jid: j.data?.Jid || j.data?.jid || "",
  };
}

/** Sincroniza numero/status da org na tabela a partir do estado real na Evolution. */
export async function sincronizarInstancia(
  admin: Admin,
  inst: WaInstanciaOrg,
  st: WaStatus | null,
): Promise<string | null> {
  const status = st?.loggedIn ? "conectado" : st?.connected ? "aguardando" : "desconectado";
  const numero = st?.loggedIn ? st.jid || inst.numero : null;
  await admin
    .from("wa_instancias")
    .update({ status, numero, atualizado_em: new Date().toISOString() })
    .eq("id", inst.id);
  return numero;
}

/** Código de pareamento (POST /instance/pair com o token DA ORG). */
export async function pairInstancia(token: string, phone: string): Promise<string | null> {
  const r = await fetch(`${waBase()}/instance/pair`, {
    method: "POST",
    headers: { apikey: token, "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  if (!r.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const j: any = await r.json().catch(() => ({}));
  return j?.data?.PairingCode || null;
}

/** QR da instância DA ORG (GET /instance/qr com o token dela). */
export async function qrInstancia(token: string): Promise<string | null> {
  const q = await fetch(`${waBase()}/instance/qr`, { headers: { apikey: token } });
  if (!q.ok) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qj: any = await q.json().catch(() => ({}));
  return qj?.data?.Qrcode || null;
}

/* ------------------------------ N CHIPS por org ------------------------------ */

/** Lista os chips DA ORG (sem token) — para a UI. Ordena por função, ordem, idade. */
export async function listarInstanciasDaOrg(admin: Admin, userId: string): Promise<WaChip[]> {
  const { data } = await admin
    .from("wa_instancias")
    .select("id, nome, numero, status, funcao, ordem")
    .eq("user_id", userId)
    .order("funcao", { ascending: true })
    .order("ordem", { ascending: true })
    .order("criada_em", { ascending: true });
  return (data ?? []) as WaChip[];
}

/**
 * Resolve UM chip pelo id — SÓ se for do próprio dono (ISOLAMENTO: `.eq("user_id", userId)`).
 * id forjado de outra org → null. Devolve com token (adota/recria o token se preciso).
 */
export async function instanciaDaOrgComToken(
  admin: Admin,
  userId: string,
  id: string,
): Promise<WaInstanciaOrg | null> {
  if (!id) return null;
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, nome, numero, status, funcao")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!row) return null;
  return await garantirTokenDaLinha(admin, row);
}

/** Cria um chip NOVO para a org (Evolution + linha + token). ordem = próxima da fila. */
export async function criarInstanciaDaOrg(
  admin: Admin,
  userId: string,
  funcao = "disparo",
): Promise<WaInstanciaOrg | null> {
  if (!waBase() || !waGlobalKey()) return null;
  const nome = `org-${userId.slice(0, 8)}-${crypto.randomUUID().replace(/-/g, "").slice(0, 4)}`;
  const token = await criarNaEvolution(nome);
  if (!token) return null;
  const { data: ult } = await admin
    .from("wa_instancias")
    .select("ordem")
    .eq("user_id", userId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ordem = (ult?.ordem ?? -1) + 1;
  const { data: nova, error } = await admin
    .from("wa_instancias")
    .insert({
      user_id: userId,
      nome,
      status: "desconectado",
      funcao: funcao === "conversa" ? "conversa" : "disparo",
      ordem,
    })
    .select("id, nome, numero, status, funcao")
    .single();
  if (error || !nova) return null;
  await admin.from("wa_instancia_tokens").insert({ instancia_id: nova.id, token });
  return {
    id: nova.id,
    nome: nova.nome,
    token,
    numero: null,
    status: "desconectado",
    funcao: nova.funcao,
  };
}

/** RECRIA a sessão Evolution de UM chip do dono (re-parear), escopado ao user_id. */
export async function recriarInstanciaPorId(
  admin: Admin,
  userId: string,
  id: string,
): Promise<WaInstanciaOrg | null> {
  const atual = await instanciaDaOrgComToken(admin, userId, id);
  if (!atual) return null;
  const evoId = await idNaEvolution(atual.nome);
  if (evoId)
    await fetch(`${waBase()}/instance/delete/${evoId}`, {
      method: "DELETE",
      headers: { apikey: waGlobalKey() },
    }).catch(() => {});
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
    .eq("user_id", userId);
  return { id: atual.id, nome: atual.nome, token, numero: null, status: "aguardando" };
}

/** Próximo chip de DISPARO da org: funcao='disparo' + status='conectado', por ordem. */
export async function proximaInstanciaDisparo(
  admin: Admin,
  userId: string,
): Promise<WaInstanciaOrg | null> {
  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, nome, numero, status, funcao")
    .eq("user_id", userId)
    .eq("funcao", "disparo")
    .eq("status", "conectado")
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
  userId: string,
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
    .eq("user_id", userId);
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
  userId: string,
  chipId: string,
  loggedIn: boolean,
): Promise<ResultadoChecagem> {
  const { data: row } = await admin
    .from("wa_instancias")
    .select("status, falhas_login, ultima_checagem_em")
    .eq("id", chipId)
    .eq("user_id", userId)
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
  await admin.from("wa_instancias").update(patch).eq("id", chipId).eq("user_id", userId);
  return {
    resultado: queima ? "queimou" : loggedIn ? "sadio" : "suspeito",
    falhas,
    loggedIn,
  };
}

/** Checagem COMPLETA de um chip: lê o status ao vivo na Evolution e aplica registrarChecagem. */
export async function checarSaudeChip(
  admin: Admin,
  userId: string,
  chipId: string,
): Promise<ResultadoChecagem> {
  const inst = await instanciaDaOrgComToken(admin, userId, chipId);
  if (!inst) return { resultado: "erro" };
  const st = await statusInstancia(inst.token);
  return registrarChecagem(admin, userId, chipId, !!st?.loggedIn);
}

/** Aviso VISÍVEL ao dono (a UI lê wa_alertas e mostra). Insert só via edge (service_role). */
export async function alertar(
  admin: Admin,
  userId: string,
  tipo: string,
  mensagem: string,
): Promise<void> {
  await admin.from("wa_alertas").insert({ user_id: userId, tipo, mensagem });
}

/**
 * ROTAÇÃO: marca o chip como 'queimada' (idempotente) e assume o PRÓXIMO chip de disparo
 * conectado (proximaInstanciaDisparo já exclui 'conversa' e não-conectados → NUNCA recruta o
 * flowleads nem o próprio queimado). Sem próximo → pausa e avisa. Avisa o dono nos dois casos.
 */
export async function rotacionarDisparo(
  admin: Admin,
  userId: string,
  chipQueimadoId: string,
): Promise<{ proximo: WaInstanciaOrg | null; alerta: string }> {
  await admin
    .from("wa_instancias")
    .update({ status: "queimada", atualizado_em: new Date().toISOString() })
    .eq("id", chipQueimadoId)
    .eq("user_id", userId);
  const proximo = await proximaInstanciaDisparo(admin, userId);
  if (proximo) {
    const alerta = `Chip queimado — disparo assumido pelo próximo chip (${proximo.numero ?? proximo.nome}).`;
    await alertar(admin, userId, "rotacao", alerta);
    return { proximo, alerta };
  }
  const alerta =
    "Chip queimado e NÃO há outro chip de disparo conectado — disparo PAUSADO. Conecte um chip novo.";
  await alertar(admin, userId, "sem_chip", alerta);
  return { proximo: null, alerta };
}

/**
 * GRADUAÇÃO: o chip que mandou pro lead (wa_envios) vira 'conversa' e sai do disparo. Chamada
 * quando o lead é movido pra "Respondeu" (e, depois, pelo webhook de recebimento — MESMA função).
 * Idempotente: sem envio registrado ou chip já 'conversa' → no-op.
 */
export async function graduarChipDoLead(
  admin: Admin,
  userId: string,
  leadId: string,
): Promise<{ graduou: boolean; chip?: string }> {
  const { data: env } = await admin
    .from("wa_envios")
    .select("instancia_id")
    .eq("lead_id", leadId)
    .eq("user_id", userId)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!env) return { graduou: false };
  const { data: chip } = await admin
    .from("wa_instancias")
    .select("id, nome, numero, funcao")
    .eq("id", env.instancia_id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!chip || chip.funcao === "conversa")
    return { graduou: false, chip: chip?.numero ?? chip?.nome };
  await admin
    .from("wa_instancias")
    .update({ funcao: "conversa", atualizado_em: new Date().toISOString() })
    .eq("id", chip.id)
    .eq("user_id", userId);
  await alertar(
    admin,
    userId,
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
  userId: string,
  instanciaId: string,
): Promise<number> {
  const inicioDia = new Date();
  inicioDia.setUTCHours(0, 0, 0, 0);
  const { count } = await admin
    .from("wa_envios")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("instancia_id", instanciaId)
    .gte("enviado_em", inicioDia.toISOString());
  return count ?? 0;
}

/** Última variação enviada NESTA campanha — para não repetir a anterior (revezamento). */
export async function ultimaVariacaoDaCampanha(
  admin: Admin,
  userId: string,
  campanhaId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("wa_envios")
    .select("variacao_id")
    .eq("user_id", userId)
    .eq("campanha_id", campanhaId)
    .order("enviado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.variacao_id ?? null;
}

/** Já enviamos pra este lead NESTA campanha? (idempotência do lote — não manda duas vezes.) */
export async function jaEnviouNaCampanha(
  admin: Admin,
  userId: string,
  campanhaId: string,
  leadId: string,
): Promise<boolean> {
  const { data } = await admin
    .from("wa_envios")
    .select("id")
    .eq("user_id", userId)
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
): Promise<{ ok: boolean; error?: string; data?: unknown }> {
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
  if (!r.ok) return { ok: false, error: data?.error ?? data?.message ?? `HTTP ${r.status}`, data };
  return { ok: true, data };
}

/** Registra o envio (base da graduação, do histórico e do revezamento). */
export async function registrarEnvio(
  admin: Admin,
  userId: string,
  e: {
    leadId: string;
    instanciaId: string;
    campanhaId: string | null;
    variacaoId: string | null;
    mensagem: string;
  },
): Promise<void> {
  await admin.from("wa_envios").insert({
    user_id: userId,
    lead_id: e.leadId,
    instancia_id: e.instanciaId,
    campanha_id: e.campanhaId,
    variacao_id: e.variacaoId,
    mensagem: e.mensagem,
  });
}
