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
export async function resolverInstanciaDaOrg(
  admin: Admin,
  userId: string,
  criarSeFaltar = true,
): Promise<WaInstanciaOrg | null> {
  if (!waBase() || !waGlobalKey()) return null;

  const { data: row } = await admin
    .from("wa_instancias")
    .select("id, nome, numero, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (row) {
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
      };

    // Token ainda não gravado → adota o que já existe na Evolution (legado), sem re-parear.
    let token = await tokenNaEvolution(row.nome);
    let numero: string | null = row.numero;
    let status: string = row.status;
    if (!token) {
      // A instância sumiu do servidor → recria com o MESMO nome armazenado.
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
    return { id: row.id, nome: row.nome, token, numero, status };
  }

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
