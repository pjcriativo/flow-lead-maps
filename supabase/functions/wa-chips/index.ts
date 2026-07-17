// Edge: wa-chips — gestão de N chips (instâncias WhatsApp) DA ORG do usuário logado.
//
// 🔒 ISOLAMENTO (mesmo padrão do incidente corrigido): AUTH OBRIGATÓRIA (getUser); a org sai
// SEMPRE do JWT. Toda operação por-chip resolve a instância por (id, user_id) via
// instanciaDaOrgComToken — um id/nome forjado de outra org devolve null e é NEGADO. O cliente
// nunca aponta para instância de outra org, nunca lê token (tabelas wa_* só via service_role).
//
// Ações (body.acao):
//   listar                         -> [{id,nome,numero,status,funcao,ordem}]  (sem token)
//   criar   {funcao?}              -> cria um chip NOVO da org
//   parear  {instancia_id, phone}  -> recria a sessão do chip e devolve o código de pareamento
//   qr      {instancia_id}         -> recria a sessão do chip e devolve o QR
//   status  {instancia_id}         -> lê o status real do chip (sincroniza numero/status)
//   marcar  {instancia_id, funcao?, status?, ordem?} -> muda função/status/ordem (marcar queimado, graduar, reordenar)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";
import { corsHeaders, json } from "../_shared/cors.ts";
import {
  waBase,
  listarInstanciasDaOrg,
  criarInstanciaDaOrg,
  instanciaDaOrgComToken,
  recriarInstanciaPorId,
  atualizarChip,
  statusInstancia,
  sincronizarInstancia,
  pairInstancia,
  qrInstancia,
  checarSaudeChip,
  rotacionarDisparo,
  graduarChipDoLead,
  definirWebhookInstancia,
} from "../_shared/wa.ts";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);
  if (!waBase()) return json({ error: "EVOLUTION_URL não configurada" }, 503);

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
    },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);
  const userId = userData.user.id;

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let b: any = {};
  try {
    b = await req.json();
  } catch {
    /* corpo vazio */
  }
  const acao = String(b?.acao || "listar");
  const instanciaId = String(b?.instancia_id || "");
  const phone = String(b?.phone || "").replace(/\D/g, "");

  if (acao === "listar") {
    return json({ chips: await listarInstanciasDaOrg(admin, userId) });
  }

  if (acao === "criar") {
    const funcao = b?.funcao === "conversa" ? "conversa" : "disparo";
    const nova = await criarInstanciaDaOrg(admin, userId, funcao);
    if (!nova) return json({ error: "Não foi possível criar o chip." }, 500);
    return json({ id: nova.id, nome: nova.nome, status: nova.status, funcao: nova.funcao });
  }

  // Daqui pra baixo exige instancia_id DO PRÓPRIO DONO. id forjado → NEGADO.
  if (acao === "parear") {
    const nova = await recriarInstanciaPorId(admin, userId, instanciaId);
    if (!nova) return json({ status: "erro", error: "Chip não encontrado." });
    if (phone.length < 12) return json({ status: "erro", error: "Número inválido (DDI+DDD)." });
    await sleep(2500);
    const code = await pairInstancia(nova.token, phone);
    if (!code) return json({ status: "erro", error: "Não foi possível gerar o código." });
    return json({ status: "code", instancia_id: nova.id, code });
  }

  if (acao === "qr") {
    const nova = await recriarInstanciaPorId(admin, userId, instanciaId);
    if (!nova) return json({ status: "erro", error: "Chip não encontrado." });
    await sleep(2500);
    const qr = await qrInstancia(nova.token);
    if (!qr) return json({ status: "aguardando", instancia_id: nova.id });
    return json({ status: "qr", instancia_id: nova.id, qr });
  }

  if (acao === "status") {
    const inst = await instanciaDaOrgComToken(admin, userId, instanciaId);
    if (!inst) return json({ status: "erro", error: "Chip não encontrado." });
    const st = await statusInstancia(inst.token);
    const numero = await sincronizarInstancia(admin, inst, st);
    return json({
      status: st?.loggedIn ? "conectado" : st?.connected ? "aguardando" : "desconectado",
      instancia_id: inst.id,
      numero: numero ?? inst.numero,
    });
  }

  if (acao === "marcar") {
    const inst = await instanciaDaOrgComToken(admin, userId, instanciaId);
    if (!inst) return json({ ok: false, error: "Chip não encontrado." });
    const ok = await atualizarChip(admin, userId, instanciaId, {
      funcao: b?.funcao,
      status: b?.status,
      ordem: typeof b?.ordem === "number" ? b.ordem : undefined,
    });
    return json({ ok });
  }

  // ETAPA 3: checa a saúde do chip ao vivo; se QUEIMOU, já rotaciona pro próximo + avisa.
  if (acao === "checar") {
    const inst = await instanciaDaOrgComToken(admin, userId, instanciaId);
    if (!inst) return json({ resultado: "erro", error: "Chip não encontrado." });
    const r = await checarSaudeChip(admin, userId, instanciaId);
    if (r.resultado === "queimou") {
      const rot = await rotacionarDisparo(admin, userId, instanciaId);
      return json({ ...r, rotacao: { proximo: rot.proximo?.id ?? null, alerta: rot.alerta } });
    }
    return json(r);
  }

  // ETAPA 3: rotação explícita (o motor de disparo chama quando confirma um chip queimado).
  if (acao === "rotacionar") {
    const inst = await instanciaDaOrgComToken(admin, userId, instanciaId);
    if (!inst) return json({ error: "Chip não encontrado." });
    const rot = await rotacionarDisparo(admin, userId, instanciaId);
    return json({
      proximo: rot.proximo?.id ?? null,
      numero: rot.proximo?.numero ?? null,
      alerta: rot.alerta,
    });
  }

  // CONVERSAS: ativa o RECEBIMENTO neste chip (seta o webhook na Evolution). O dono aciona
  // explicitamente — não tocamos em chip nenhum sem consentimento.
  if (acao === "ativar_recebimento") {
    const inst = await instanciaDaOrgComToken(admin, userId, instanciaId);
    if (!inst) return json({ ok: false, error: "Chip não encontrado." });
    const secret = Deno.env.get("WA_WEBHOOK_SECRET") ?? "";
    const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/wa-webhook?k=${secret}`;
    const r = await definirWebhookInstancia(inst.token, url, ["Message"]);
    return json({ ok: r.ok, status: r.status, detalhe: r.body });
  }

  // ETAPA 3.4: graduação — o chip que mandou pro lead vira 'conversa'. Gancho do pipeline.
  if (acao === "graduar_lead") {
    const leadId = String(b?.lead_id || "");
    if (!leadId) return json({ graduou: false });
    return json(await graduarChipDoLead(admin, userId, leadId));
  }

  return json({ error: "Ação desconhecida." }, 400);
});
