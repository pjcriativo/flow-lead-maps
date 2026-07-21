// Camada de serviço — WhatsApp (Fase 2, peça 1: PROVA DE CONEXÃO). Fala com as
// Edge Functions wa-connect / wa-send-test (que falam com a Evolution GO). As
// chaves da Evolution ficam só no secret do servidor — nunca aqui no cliente.
import { supabase } from "@/integrations/supabase/client";

export type WaConnect =
  | { status: "conectado"; instancia: string; numero: string }
  | { status: "qr"; instancia: string; qr: string }
  | { status: "code"; instancia: string; code: string }
  | { status: "aguardando"; instancia: string; aviso?: string }
  | { status: "erro"; error: string };

/** Cria/lê a instância dedicada e devolve o QR (pra parear) ou "conectado".
 * fresh=true (clique explícito em "Conectar") recria a sessão p/ um QR novo
 * (o QR da Evolution GO é estático e vale só ~60s). O polling passa fresh=false. */
export async function conectarWhatsapp(fresh = false): Promise<WaConnect> {
  const { data, error } = await supabase.functions.invoke("wa-connect", { body: { fresh } });
  if (error) throw error;
  return data as WaConnect;
}

/** Gera um CÓDIGO DE PAREAMENTO para o número dedicado (alternativa confiável ao QR).
 * O dono digita o código em WhatsApp → Conectar um aparelho → Conectar com número. */
export async function pairWhatsapp(phone: string): Promise<WaConnect> {
  const { data, error } = await supabase.functions.invoke("wa-connect", { body: { phone } });
  if (error) throw error;
  return data as WaConnect;
}

// ===== N CHIPS por org (edge wa-chips) =====
export type WaChip = {
  id: string;
  nome: string;
  numero: string | null;
  status: "desconectado" | "aguardando" | "conectado" | "erro" | "queimada" | string;
  funcao: "disparo" | "conversa" | string;
  ordem: number;
};

async function waChips<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("wa-chips", { body });
  if (error) throw error;
  return data as T;
}

/** Lista os chips (instâncias) da org. */
export async function listarChips(): Promise<WaChip[]> {
  const r = await waChips<{ chips: WaChip[] }>({ acao: "listar" });
  return r.chips ?? [];
}

/** Cria um chip novo (função disparo/conversa). Depois pareie-o. */
export async function criarChip(funcao: "disparo" | "conversa" = "disparo") {
  return waChips<{ id: string; nome: string; status: string; funcao: string }>({
    acao: "criar",
    funcao,
  });
}

/** Gera o código de pareamento de um chip (recria a sessão dele). */
export async function parearChip(instancia_id: string, phone: string) {
  return waChips<WaConnect & { instancia_id?: string }>({ acao: "parear", instancia_id, phone });
}

/** Gera o QR de um chip (recria a sessão dele). */
export async function qrChip(instancia_id: string) {
  return waChips<WaConnect & { instancia_id?: string }>({ acao: "qr", instancia_id });
}

/** Lê o status real de um chip (sincroniza numero/status). */
export async function statusChip(instancia_id: string) {
  return waChips<{ status: string; numero: string | null; instancia_id?: string }>({
    acao: "status",
    instancia_id,
  });
}

/** Muda função/status/ordem de um chip (marcar queimado, graduar, reordenar). */
export async function marcarChip(
  instancia_id: string,
  patch: { funcao?: "disparo" | "conversa"; status?: string; ordem?: number },
) {
  return waChips<{ ok: boolean; error?: string }>({ acao: "marcar", instancia_id, ...patch });
}

/** EXCLUI um chip (irreversível). Recusa se o chip já enviou (histórico) e pede confirmação
 * explícita se ele tem número pareado (excluir mata a sessão do WhatsApp). */
export async function excluirChip(instancia_id: string, confirmar = false) {
  return waChips<{
    ok: boolean;
    motivo?: "nao_encontrado" | "tem_historico" | "pareado_precisa_confirmar" | string;
    envios?: number;
    numero?: string | null;
  }>({ acao: "excluir", instancia_id, confirmar });
}

/** Checa a saúde de um chip ao vivo (ETAPA 3): se queimou, já rotaciona pro próximo + avisa. */
export async function checarChip(instancia_id: string) {
  return waChips<{
    resultado: "sadio" | "suspeito" | "queimou" | "pulado" | "erro";
    falhas?: number;
    loggedIn?: boolean;
    rotacao?: { proximo: string | null; alerta: string };
  }>({ acao: "checar", instancia_id });
}

/** Graduação: o chip que mandou pro lead vira 'conversa' (gancho: lead move p/ Respondeu). */
export async function graduarLeadWa(lead_id: string) {
  return waChips<{ graduou: boolean; chip?: string }>({ acao: "graduar_lead", lead_id });
}

/** Ativa o RECEBIMENTO de mensagens num chip (seta o webhook na Evolution). O dono aciona. */
export async function ativarRecebimentoChip(instancia_id: string) {
  return waChips<{ ok: boolean; status?: number; detalhe?: string; error?: string }>({
    acao: "ativar_recebimento",
    instancia_id,
  });
}

// ===== Alertas visíveis (wa_alertas) — lidos direto por RLS (SELECT/UPDATE do dono) =====
export type WaAlerta = {
  id: string;
  tipo: string;
  mensagem: string;
  lido: boolean;
  criado_em: string;
};

/** Alertas não lidos da org (chip queimado, rotação, sem chip, graduação). */
export async function listarAlertas(): Promise<WaAlerta[]> {
  const { data, error } = await supabase
    .from("wa_alertas")
    .select("id, tipo, mensagem, lido, criado_em")
    .eq("lido", false)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WaAlerta[];
}

/** Marca um alerta como lido (dispensar). */
export async function marcarAlertaLido(id: string): Promise<void> {
  const { error } = await supabase.from("wa_alertas").update({ lido: true }).eq("id", id);
  if (error) throw error;
}

// ===== Campanha por WhatsApp (ETAPA 4) — envio de UM lead (o cliente orquestra o lote c/ jitter) =====
export type WaCampEnvio = {
  ok: boolean;
  reason?: string;
  para?: string;
  chip?: string;
  variacao?: string;
  mensagem?: string;
  error?: string;
};

/** Rótulos amigáveis dos motivos de não-envio (botão/lead que não saiu tem que se explicar). */
export const WA_MOTIVO_LABEL: Record<string, string> = {
  nao_aprovado: "ainda não aprovado (aprove p/ publicar o link)",
  sem_link: "sem link publicado (aprove p/ publicar a prévia)",
  sem_whatsapp: "lead sem WhatsApp",
  opt_out: "lead pediu para não receber (opt-out)",
  sem_chip: "nenhum chip de disparo conectado",
  chip_desconectado: "chip de disparo não está pareado/logado (reconecte na aba WhatsApp)",
  teto_dia: "teto diário do chip atingido",
  ja_enviado: "já enviado nesta campanha",
  sem_variacao: "nenhuma variação elegível",
  envio_falhou: "falha no envio (Evolution)",
  canal_errado: "campanha não é de WhatsApp",
  campanha_concluida: "campanha concluída",
};

/** Envia a mensagem de campanha WhatsApp para UM campanha_lead (aprovado). */
export async function enviarCampanhaLeadWa(campanha_lead_id: string): Promise<WaCampEnvio> {
  const { data, error } = await supabase.functions.invoke("send-proposal-wa", {
    body: { campanha_lead_id },
  });
  if (error) throw error;
  return data as WaCampEnvio;
}

// ===== Compor campanha (tela única estilo S-zap): leads da org com WhatsApp =====
export type WaLeadCompose = {
  id: string;
  business_name: string;
  whatsapp: string;
  city: string | null;
  bairro: string | null;
  category: string | null;
  lead_status: string;
  score: number | null;
  rating: number | null;
  review_count: number | null;
  score_breakdown: unknown;
  enviado: boolean; // já recebeu WhatsApp em alguma campanha
};

/** Todos os leads da org COM WhatsApp + se já foram enviados (para os contadores/filtros). */
export async function listarLeadsWaCompose(): Promise<WaLeadCompose[]> {
  const [{ data: leads, error }, { data: envios }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, business_name, whatsapp, city, bairro, category, status, score, rating, review_count, score_breakdown",
      )
      .not("whatsapp", "is", null)
      .limit(3000),
    supabase.from("wa_envios").select("lead_id"),
  ]);
  if (error) throw error;
  const enviados = new Set((envios ?? []).map((r) => (r as { lead_id: string }).lead_id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (leads ?? []).map((l: any) => ({
    id: l.id,
    business_name: l.business_name,
    whatsapp: l.whatsapp,
    city: l.city,
    bairro: l.bairro,
    category: l.category,
    lead_status: l.status,
    score: l.score,
    rating: l.rating,
    review_count: l.review_count,
    score_breakdown: l.score_breakdown,
    enviado: enviados.has(l.id),
  }));
}

// ===== Scripts (mensagens/mídias salvas) =====
export type WaScript = {
  id: string;
  nome: string;
  tipo: "texto" | "imagem" | "video" | "arquivo" | string;
  mensagem: string | null;
  media_url: string | null;
  criado_em: string;
};

export async function listarScripts(): Promise<WaScript[]> {
  const { data, error } = await supabase
    .from("wa_scripts")
    .select("id, nome, tipo, mensagem, media_url, criado_em")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as WaScript[];
}

export async function criarScript(s: {
  nome: string;
  tipo: WaScript["tipo"];
  mensagem?: string;
  media_url?: string;
}): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Não autenticado");
  const { error } = await supabase.from("wa_scripts").insert({
    user_id: u.user.id,
    nome: s.nome.trim(),
    tipo: s.tipo,
    mensagem: s.mensagem ?? null,
    media_url: s.media_url ?? null,
  });
  if (error) throw error;
}

export async function excluirScript(id: string): Promise<void> {
  const { error } = await supabase.from("wa_scripts").delete().eq("id", id);
  if (error) throw error;
}

// ===== Conversas (bate-papo) =====
export type WaMensagem = {
  id: string;
  numero: string;
  direcao: "in" | "out" | string;
  tipo: string;
  texto: string | null;
  media_url: string | null;
  lida: boolean;
  criado_em: string;
  nome_contato: string | null;
};

export type WaConversa = {
  numero: string;
  nome_contato: string | null;
  ultima: string | null;
  ultima_em: string;
  nao_lidas: number;
};

/** Lista as conversas (uma por número), com a última mensagem e não-lidas. */
export async function listarConversas(): Promise<WaConversa[]> {
  const { data, error } = await supabase
    .from("wa_mensagens")
    .select("numero, nome_contato, direcao, texto, lida, criado_em")
    .order("criado_em", { ascending: false })
    .limit(3000);
  if (error) throw error;
  const porNumero = new Map<string, WaConversa>();
  for (const m of (data ?? []) as Array<{
    numero: string;
    nome_contato: string | null;
    direcao: string;
    texto: string | null;
    lida: boolean;
    criado_em: string;
  }>) {
    const cur = porNumero.get(m.numero);
    if (!cur) {
      porNumero.set(m.numero, {
        numero: m.numero,
        nome_contato: m.nome_contato,
        ultima: m.texto,
        ultima_em: m.criado_em,
        nao_lidas: m.direcao === "in" && !m.lida ? 1 : 0,
      });
    } else {
      if (m.direcao === "in" && !m.lida) cur.nao_lidas += 1;
      if (!cur.nome_contato && m.nome_contato) cur.nome_contato = m.nome_contato;
    }
  }
  return [...porNumero.values()];
}

/** Mensagens de uma conversa (por número), em ordem cronológica. */
export async function listarMensagens(numero: string): Promise<WaMensagem[]> {
  const { data, error } = await supabase
    .from("wa_mensagens")
    .select("id, numero, direcao, tipo, texto, media_url, lida, criado_em, nome_contato")
    .eq("numero", numero)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []) as WaMensagem[];
}

/** Marca as mensagens recebidas de um número como lidas. */
export async function marcarConversaLida(numero: string): Promise<void> {
  await supabase
    .from("wa_mensagens")
    .update({ lida: true })
    .eq("numero", numero)
    .eq("direcao", "in")
    .eq("lida", false);
}

/** Responde uma conversa (envia pelo chip da org via edge + grava a saída). */
export async function responderConversa(
  numero: string,
  texto: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke("wa-responder", {
    body: { numero, texto },
  });
  if (error) throw error;
  return data as { ok: boolean; error?: string };
}

/** Limpa o histórico de conversas da org (aba WhatsApp). Devolve quantas removeu. */
export async function limparConversas(): Promise<number> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Não autenticado");
  const { data, error } = await supabase
    .from("wa_mensagens")
    .delete()
    .eq("user_id", u.user.id)
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}

// ===== Painel (dashboard estilo S-zap): números do topo + status de conexão =====
export type WaEstatisticas = {
  leadsComWhatsapp: number;
  totalLeads: number;
  campanhasEnviadas: number;
  conversas: number;
  conectado: boolean;
  /** tem chip de DISPARO pareado (só isso permite disparar campanha a frio) */
  temDisparo: boolean;
  /** tem chip de CONVERSA pareado (recebe respostas; nunca dispara a frio) */
  temConversa: boolean;
};

export async function estatisticasWa(): Promise<WaEstatisticas> {
  const [leadsWa, total, envios, msgs, chips] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).not("whatsapp", "is", null),
    supabase.from("leads").select("id", { count: "exact", head: true }),
    supabase.from("wa_envios").select("campanha_id"),
    supabase.from("wa_mensagens").select("numero").limit(5000),
    listarChips().catch(() => [] as WaChip[]),
  ]);
  const campanhas = new Set(
    (envios.data ?? [])
      .map((r) => (r as { campanha_id: string | null }).campanha_id)
      .filter(Boolean),
  ).size;
  const conversas = new Set((msgs.data ?? []).map((r) => (r as { numero: string }).numero)).size;
  return {
    leadsComWhatsapp: leadsWa.count ?? 0,
    totalLeads: total.count ?? 0,
    campanhasEnviadas: campanhas,
    conversas,
    conectado: chips.some((c) => c.status === "conectado"),
    // pareado (numero) é o que vale — 'conectado' sozinho fica true até em chip nunca pareado.
    temDisparo: chips.some((c) => c.funcao === "disparo" && c.status === "conectado" && !!c.numero),
    temConversa: chips.some(
      (c) => c.funcao === "conversa" && c.status === "conectado" && !!c.numero,
    ),
  };
}

// ===== Histórico da campanha (ETAPA 4.3): data, enviados, qual chip usou, quantos responderam =====
export type WaHistorico = {
  enviados: number;
  responderam: number;
  primeiro: string | null;
  ultimo: string | null;
  chips: { instancia_id: string; numero: string; enviados: number }[];
};

/** Enviados por campanha (batch) — para os cards da lista mostrarem o real (wa_envios). */
export async function enviadosPorCampanhaWa(
  campanhaIds: string[],
): Promise<Record<string, number>> {
  if (campanhaIds.length === 0) return {};
  const { data, error } = await supabase
    .from("wa_envios")
    .select("campanha_id")
    .in("campanha_id", campanhaIds);
  if (error) throw error;
  const m: Record<string, number> = {};
  for (const r of (data ?? []) as { campanha_id: string | null }[])
    if (r.campanha_id) m[r.campanha_id] = (m[r.campanha_id] ?? 0) + 1;
  return m;
}

/** Estatísticas de uma campanha de WhatsApp já realizada (lê o ledger wa_envios). */
export async function historicoCampanhaWa(campanhaId: string): Promise<WaHistorico> {
  const { data: envios, error } = await supabase
    .from("wa_envios")
    .select("lead_id, instancia_id, enviado_em")
    .eq("campanha_id", campanhaId)
    .order("enviado_em", { ascending: true });
  if (error) throw error;
  const rows = (envios ?? []) as { lead_id: string; instancia_id: string; enviado_em: string }[];
  if (rows.length === 0)
    return { enviados: 0, responderam: 0, primeiro: null, ultimo: null, chips: [] };

  // qual chip usou (número via listarChips — o cliente não lê wa_instancias direto).
  const chipsOrg = await listarChips().catch(() => [] as WaChip[]);
  const numById = new Map(chipsOrg.map((c) => [c.id, c.numero ?? c.nome]));
  const porChip = new Map<string, number>();
  for (const r of rows) porChip.set(r.instancia_id, (porChip.get(r.instancia_id) ?? 0) + 1);

  // quantos responderam: leads desta campanha que hoje estão em 'responded'/'meeting'.
  const leadIds = [...new Set(rows.map((r) => r.lead_id))];
  const { data: leads } = await supabase
    .from("leads")
    .select("id, status")
    .in("id", leadIds)
    .in("status", ["responded", "meeting"]);
  return {
    enviados: rows.length,
    responderam: (leads ?? []).length,
    primeiro: rows[0].enviado_em,
    ultimo: rows[rows.length - 1].enviado_em,
    chips: [...porChip.entries()].map(([instancia_id, enviados]) => ({
      instancia_id,
      numero: numById.get(instancia_id) ?? "—",
      enviados,
    })),
  };
}

export type WaEnvio = { ok: boolean; para?: string; error?: string };

/** Envia 1 mensagem de teste para um número (DDI+DDD). Erro real da Evolution. */
export async function enviarTesteWhatsapp(numero: string, texto?: string): Promise<WaEnvio> {
  const { data, error } = await supabase.functions.invoke("wa-send-test", {
    body: { number: numero, text: texto },
  });
  if (error) throw error;
  return data as WaEnvio;
}

// ===== Coleta em redes sociais (Instagram/LinkedIn via Apify) — edge buscar-redes =====
export type ColetaRedes = {
  ok: boolean;
  reason?: string;
  motivo?: string;
  estrategia?: string;
  encontrados?: number;
  inseridos?: number;
  descartados?: number;
  custo?: number;
  gastoMes?: number;
  gastoMesDepois?: number;
  teto?: { rodada: number; mes: number };
  estourou?: boolean;
  detalhe?: string;
};

/** Roda a coleta REAL de uma estratégia. O servidor aplica o teto de gasto (US$/rodada e US$/mês). */
export async function buscarRedes(
  estrategia: string,
  campos: Record<string, unknown>,
  limite: number,
): Promise<ColetaRedes> {
  const { data, error } = await supabase.functions.invoke("buscar-redes", {
    body: { acao: "buscar", estrategia, campos, limite },
  });
  if (error) throw error;
  return data as ColetaRedes;
}
