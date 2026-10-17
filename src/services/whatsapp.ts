// Camada de serviço — WhatsApp (Fase 2, peça 1: PROVA DE CONEXÃO). Fala com as
// Edge Functions wa-connect / wa-send-test (que falam com a Evolution GO). As
// chaves da Evolution ficam só no secret do servidor — nunca aqui no cliente.
import { supabase } from "@/integrations/supabase/client";
import {
  getActiveOrganizationContext,
  type ActiveOrganizationContext,
} from "@/lib/active-organization";

const WHATSAPP_ADMIN_ROLES = new Set(["admin", "gerente", "super_admin"]);

async function activeWhatsappOrganization(): Promise<ActiveOrganizationContext> {
  return getActiveOrganizationContext();
}

async function requireWhatsappAdministrator(): Promise<ActiveOrganizationContext> {
  const context = await activeWhatsappOrganization();
  if (!WHATSAPP_ADMIN_ROLES.has(context.role)) {
    throw new Error("Sem permissão para administrar o WhatsApp desta organização.");
  }
  return context;
}

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
  const context = await requireWhatsappAdministrator();
  const { data, error } = await supabase.functions.invoke("wa-connect", {
    body: { fresh, org_id: context.orgId },
  });
  if (error) throw error;
  return data as WaConnect;
}

/** Gera um CÓDIGO DE PAREAMENTO para o número dedicado (alternativa confiável ao QR).
 * O dono digita o código em WhatsApp → Conectar um aparelho → Conectar com número. */
export async function pairWhatsapp(phone: string): Promise<WaConnect> {
  const context = await requireWhatsappAdministrator();
  const { data, error } = await supabase.functions.invoke("wa-connect", {
    body: { phone, org_id: context.orgId },
  });
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
  provider_status: "connected" | "disconnected" | "pairing" | "unknown";
  operational_health:
    "healthy" | "degraded" | "unstable" | "unavailable" | "unknown" | "reconnecting";
  last_health_check_at: string | null;
  last_provider_success_at: string | null;
  health_failure_count: number;
  health_error_code: string | null;
};

async function waChips<T>(body: Record<string, unknown>): Promise<T> {
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase.functions.invoke("wa-chips", {
    body: { ...body, org_id: context.orgId },
  });
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

export async function reconectarChip(instancia_id: string) {
  return waChips<{ status: string; instancia_id: string; requires_pairing: boolean }>({
    acao: "reconectar",
    instancia_id,
  });
}

export async function alterarContingencia(input: {
  ativa: boolean;
  sourceInstanceId?: string;
  backupInstanceId?: string;
  finalidade?: string;
  motivo?: string;
}) {
  return waChips<{ ok: boolean; id?: string; encerradas?: number }>({
    acao: input.ativa ? "autorizar_contingencia" : "encerrar_contingencia",
    instancia_id: input.sourceInstanceId,
    backup_instancia_id: input.backupInstanceId,
    finalidade: input.finalidade,
    motivo: input.motivo,
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
  instancia_id: string | null;
  occurrences: number;
  last_seen_at: string | null;
  resolved_at: string | null;
};

/** Alertas não lidos da org (chip queimado, rotação, sem chip, graduação). */
export async function listarAlertas(): Promise<WaAlerta[]> {
  const result = await waChips<{ alertas: WaAlerta[] }>({ acao: "listar_alertas" });
  return result.alertas ?? [];
}

/** Marca um alerta como lido (dispensar). */
export async function marcarAlertaLido(id: string): Promise<void> {
  const context = await activeWhatsappOrganization();
  const { error } = await supabase
    .from("wa_alertas")
    .update({ lido: true })
    .eq("id", id)
    .eq("org_id", context.orgId);
  if (error) throw error;
}

// ===== Tela 04 — Números e Conexões (Prompt 59 — Layout Aprovado) =====
export type WaFuncaoOperacional =
  "principal" | "comercial" | "suporte" | "reserva" | "contingencia";

export type WaNumeroItem = {
  id: string;
  nome: string;
  numero: string | null;
  status:
    "conectado" | "desconectado" | "aguardando" | "erro" | "queimada" | "desconhecido" | string;
  funcao: string;
  funcaoOperacional: WaFuncaoOperacional;
  ordem: number;
  mensagensHoje: number;
  ultimaVerificacao: string;
  isPrincipal?: boolean;
  falhasLogin?: number;
};

export type WaNumerosKpis = {
  conectados: number;
  desconectados: number;
  reconexao: number;
  mensagensHoje: number;
  disponibilidade: string;
  conectadosTrend?: string;
  desconectadosTrend?: string;
  reconexaoTrend?: string;
  mensagensTrend?: string;
  disponibilidadeTrend?: string;
};

export type WaSaudeConexoes = {
  saudeGeralPct: number;
  conectados: number;
  conectadosPct: number;
  desconectados: number;
  desconectadosPct: number;
  emReconexao: number;
  emReconexaoPct: number;
  erro: number;
  erroPct: number;
  variacao: string;
};

export type WaRotacaoConfig = {
  estrategia: "prioridade" | "equilibrado" | "menor_volume";
  intervalo: number;
  backupChipId: string | null;
  contingenciaAtiva: boolean;
  pausaAutomatica: boolean;
  status: "configurada" | "parcial" | "nao_configurada";
};

export type WaAtividadeRecenteItem = {
  id: string;
  tipo: "conectado" | "desconectado" | "mensagem" | "alerta" | "contingencia" | "configuracao";
  titulo: string;
  subtitulo: string;
  horario: string;
  icone: "whatsapp" | "alerta" | "mensagem" | "chip" | "config";
  cor: "emerald" | "rose" | "blue" | "amber" | "gray";
};

// Benchmark fiel à imagem de referência aprovada pelo proprietário
export const CHIPS_REFERENCIA_PREMIUM: WaNumeroItem[] = [
  {
    id: "chip-ref-1",
    nome: "Chip Principal",
    numero: "5511987654321",
    status: "conectado",
    funcao: "conversa",
    funcaoOperacional: "principal",
    ordem: 0,
    mensagensHoje: 58,
    ultimaVerificacao: "há 2 min",
    isPrincipal: true,
    falhasLogin: 0,
  },
  {
    id: "chip-ref-2",
    nome: "Chip Vendas",
    numero: "5511912345678",
    status: "conectado",
    funcao: "disparo",
    funcaoOperacional: "comercial",
    ordem: 1,
    mensagensHoje: 34,
    ultimaVerificacao: "há 5 min",
    isPrincipal: false,
    falhasLogin: 0,
  },
  {
    id: "chip-ref-3",
    nome: "Chip Suporte",
    numero: "5511998765432",
    status: "conectado",
    funcao: "conversa",
    funcaoOperacional: "suporte",
    ordem: 2,
    mensagensHoje: 28,
    ultimaVerificacao: "há 3 min",
    isPrincipal: false,
    falhasLogin: 0,
  },
  {
    id: "chip-ref-4",
    nome: "Chip Reserva",
    numero: "5511933331122",
    status: "desconectado",
    funcao: "disparo",
    funcaoOperacional: "reserva",
    ordem: 3,
    mensagensHoje: 0,
    ultimaVerificacao: "há 1 hora",
    isPrincipal: false,
    falhasLogin: 1,
  },
  {
    id: "chip-ref-5",
    nome: "Chip Contingência",
    numero: "5511944448899",
    status: "conectado",
    funcao: "disparo",
    funcaoOperacional: "contingencia",
    ordem: 4,
    mensagensHoje: 22,
    ultimaVerificacao: "há 7 min",
    isPrincipal: false,
    falhasLogin: 0,
  },
];

export const ATIVIDADES_REFERENCIA_PREMIUM: WaAtividadeRecenteItem[] = [
  {
    id: "ativ-1",
    tipo: "conectado",
    titulo: "Chip Principal conectado",
    subtitulo: "Instância conectada com sucesso",
    horario: "14:32",
    icone: "whatsapp",
    cor: "emerald",
  },
  {
    id: "ativ-2",
    tipo: "desconectado",
    titulo: "Chip Reserva desconectado",
    subtitulo: "Conexão perdida",
    horario: "13:45",
    icone: "alerta",
    cor: "rose",
  },
  {
    id: "ativ-3",
    tipo: "mensagem",
    titulo: "Chip Vendas recebeu 25 mensagens",
    subtitulo: "Volume acima da média",
    horario: "11:20",
    icone: "mensagem",
    cor: "blue",
  },
  {
    id: "ativ-4",
    tipo: "alerta",
    titulo: "Chip Suporte atingiu 90% da quota",
    subtitulo: "Atenção: alta utilização",
    horario: "10:18",
    icone: "chip",
    cor: "amber",
  },
  {
    id: "ativ-5",
    tipo: "contingencia",
    titulo: "Chip Contingência configurado",
    subtitulo: "Número adicionado como backup",
    horario: "12/03",
    icone: "whatsapp",
    cor: "emerald",
  },
  {
    id: "ativ-6",
    tipo: "configuracao",
    titulo: "Atualização de configuração",
    subtitulo: "Estratégia de rotação alterada",
    horario: "12/03",
    icone: "config",
    cor: "gray",
  },
];

/** Metadados de preferências dos chips salvos localmente por org */
export function obterMetaChipsWa(): Record<string, { role?: WaFuncaoOperacional; alias?: string }> {
  try {
    const raw = localStorage.getItem("flow_wa_chips_meta");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function salvarMetaChipWa(
  chipId: string,
  meta: { role?: WaFuncaoOperacional; alias?: string },
): void {
  try {
    const todos = obterMetaChipsWa();
    todos[chipId] = { ...todos[chipId], ...meta };
    localStorage.setItem("flow_wa_chips_meta", JSON.stringify(todos));
  } catch {
    /* localStorage indisponível */
  }
}

/** Configurações de rotação e contingência */
export function obterConfigRotacaoWa(): WaRotacaoConfig {
  try {
    const raw = localStorage.getItem("flow_wa_rotacao_config");
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback */
  }
  return {
    estrategia: "prioridade",
    intervalo: 20,
    backupChipId: "chip-ref-5",
    contingenciaAtiva: true,
    pausaAutomatica: false,
    status: "configurada",
  };
}

export function salvarConfigRotacaoWa(config: Partial<WaRotacaoConfig>): WaRotacaoConfig {
  const atual = obterConfigRotacaoWa();
  const nova: WaRotacaoConfig = { ...atual, ...config };
  try {
    localStorage.setItem("flow_wa_rotacao_config", JSON.stringify(nova));
  } catch {
    /* noop */
  }
  return nova;
}

/** Carrega os dados reais de números, KPIs e saúde da organização ativa */
export async function obterDadosNumerosWa(): Promise<{
  chips: WaNumeroItem[];
  kpis: WaNumerosKpis;
  saude: WaSaudeConexoes;
  rotacao: WaRotacaoConfig;
  atividades: WaAtividadeRecenteItem[];
}> {
  const context = await activeWhatsappOrganization();
  try {
    const [rawChips, alertas, enviosHojeRes, contingenciasRes] = await Promise.all([
      listarChips(),
      listarAlertas(),
      supabase
        .from("wa_envios")
        .select("instancia_id, enviado_em")
        .eq("org_id", context.orgId)
        .gte("enviado_em", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      waChips<{
        contingencia: { id: string; backup_instance_id: string; status: string } | null;
      }>({ acao: "listar_contingencia" }),
    ]);
    if (enviosHojeRes.error) throw enviosHojeRes.error;
    const enviosHoje = (enviosHojeRes.data ?? []) as Array<{
      instancia_id: string;
      enviado_em: string;
    }>;
    const enviosPorChip: Record<string, number> = {};
    for (const e of enviosHoje) {
      if (e.instancia_id) enviosPorChip[e.instancia_id] = (enviosPorChip[e.instancia_id] ?? 0) + 1;
    }

    let chips: WaNumeroItem[] = [];

    if (rawChips.length > 0) {
      chips = rawChips.map((c: WaChip, idx: number) => {
        const role: WaFuncaoOperacional =
          c.nome === "flowleads" || idx === 0
            ? "principal"
            : c.funcao === "conversa"
              ? "suporte"
              : "comercial";
        const status =
          c.operational_health === "healthy"
            ? "conectado"
            : c.operational_health === "reconnecting" || c.provider_status === "pairing"
              ? "aguardando"
              : c.operational_health === "unavailable"
                ? "desconectado"
                : c.operational_health === "degraded" || c.operational_health === "unstable"
                  ? "erro"
                  : "desconhecido";
        return {
          id: c.id,
          nome: c.nome === "flowleads" ? "Chip Principal" : c.nome,
          numero: c.numero,
          status,
          funcao: c.funcao,
          funcaoOperacional: role,
          ordem: c.ordem,
          mensagensHoje: enviosPorChip[c.id] ?? 0,
          ultimaVerificacao: c.last_health_check_at
            ? new Date(c.last_health_check_at).toLocaleString("pt-BR")
            : "Nunca verificado",
          isPrincipal: c.nome === "flowleads" || idx === 0 || role === "principal",
          falhasLogin: c.health_failure_count,
        };
      });
    }

    const conectados = chips.filter((c) => c.status === "conectado").length;
    const desconectados = chips.filter(
      (c) => c.status === "desconectado" || c.status === "queimada",
    ).length;
    const reconexao = chips.filter(
      (c) => c.status === "aguardando" || c.status === "conectando",
    ).length;
    const erro = chips.filter((c) => c.status === "erro").length;

    const totalChips = Math.max(1, chips.length);
    const saudeGeralPct = Math.round((conectados / totalChips) * 100);

    const msgsHojeTotal = chips.reduce((acc, c) => acc + c.mensagensHoje, 0);

    // ETAPA 4: "Calcular somente com histórico de monitoramento comprovado.
    // Se não existir série histórica suficiente, exibir: 'Dados insuficientes'.
    // Não inventar 98,5% de disponibilidade. Não inventar tendências."
    const disponibilidadeStr = "Dados insuficientes";

    const kpis: WaNumerosKpis = {
      conectados,
      desconectados,
      reconexao,
      mensagensHoje: msgsHojeTotal,
      disponibilidade: disponibilidadeStr,
      conectadosTrend: "—",
      desconectadosTrend: "—",
      reconexaoTrend: "—",
      mensagensTrend: "—",
      disponibilidadeTrend: "—",
    };

    const saude: WaSaudeConexoes = {
      saudeGeralPct,
      conectados,
      conectadosPct: Math.round((conectados / totalChips) * 100),
      desconectados,
      desconectadosPct: Math.round((desconectados / totalChips) * 100),
      emReconexao: reconexao,
      emReconexaoPct: Math.round((reconexao / totalChips) * 100),
      erro,
      erroPct: Math.round((erro / totalChips) * 100),
      variacao: "—",
    };

    const activeContingency = contingenciasRes.contingencia;
    const rotacao: WaRotacaoConfig = {
      estrategia: "prioridade",
      intervalo: 20,
      backupChipId: activeContingency?.backup_instance_id ?? null,
      contingenciaAtiva: Boolean(activeContingency),
      pausaAutomatica: false,
      status: activeContingency ? "configurada" : "nao_configurada",
    };

    // Atividades reais mapeadas de wa_alertas ou fallback de referência
    const atividades: WaAtividadeRecenteItem[] =
      alertas.length > 0
        ? alertas.slice(0, 6).map((a: WaAlerta) => ({
            id: a.id,
            tipo:
              a.tipo === "rotacao"
                ? "contingencia"
                : a.tipo === "sem_chip"
                  ? "desconectado"
                  : a.tipo === "graduacao"
                    ? "mensagem"
                    : "alerta",
            titulo: a.tipo === "rotacao" ? "Rotação de Chip Executada" : a.mensagem.slice(0, 32),
            subtitulo: a.mensagem,
            horario: new Date(a.criado_em).toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            icone: a.tipo === "rotacao" ? "chip" : a.tipo === "sem_chip" ? "alerta" : "whatsapp",
            cor: a.tipo === "rotacao" ? "amber" : a.tipo === "sem_chip" ? "rose" : "emerald",
          }))
        : [];

    return { chips, kpis, saude, rotacao, atividades };
  } catch (error) {
    console.error("Falha ao carregar números WhatsApp", error);
    throw error;
  }
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
  limite_plano: "limite de mensagens do plano atingido — faça upgrade",
};

/** Envia a mensagem de campanha WhatsApp para UM campanha_lead (aprovado). */
export async function enviarCampanhaLeadWa(campanha_lead_id: string): Promise<WaCampEnvio> {
  const context = await requireWhatsappAdministrator();
  const { data, error } = await supabase.functions.invoke("send-proposal-wa", {
    body: { campanha_lead_id, org_id: context.orgId },
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
  const context = await activeWhatsappOrganization();
  const [{ data: leads, error }, { data: envios }] = await Promise.all([
    supabase
      .from("leads")
      .select(
        "id, business_name, whatsapp, city, bairro, category, status, score, rating, review_count, score_breakdown",
      )
      .eq("org_id", context.orgId)
      .not("whatsapp", "is", null)
      .limit(3000),
    supabase.from("wa_envios").select("lead_id").eq("org_id", context.orgId),
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
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase
    .from("wa_scripts")
    .select("id, nome, tipo, mensagem, media_url, criado_em")
    .eq("org_id", context.orgId)
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
  const context = await requireWhatsappAdministrator();
  const { error } = await supabase.from("wa_scripts").insert({
    user_id: context.userId,
    org_id: context.orgId,
    nome: s.nome.trim(),
    tipo: s.tipo,
    mensagem: s.mensagem ?? null,
    media_url: s.media_url ?? null,
  });
  if (error) throw error;
}

export async function excluirScript(id: string): Promise<void> {
  const context = await requireWhatsappAdministrator();
  const { error } = await supabase
    .from("wa_scripts")
    .delete()
    .eq("id", id)
    .eq("org_id", context.orgId);
  if (error) throw error;
}

// ===== Conversas (bate-papo) =====
export type WaMensagem = {
  id: string;
  conversa_id: string;
  direcao: "in" | "out" | string;
  tipo: string;
  texto: string | null;
  media_url: string | null;
  lida: boolean;
  status: "pending" | "sent" | "delivered" | "read" | "failed" | "uncertain" | "received";
  provider_occurred_at: string | null;
  criado_em: string;
};

export type WaConversa = {
  id: string;
  instancia_id: string;
  lead_id: string | null;
  assigned_to: string | null;
  numero: string;
  nome_contato: string | null;
  ultima: string | null;
  ultima_em: string;
  nao_lidas: number;
  status:
    "unassigned" | "in_progress" | "waiting_contact" | "waiting_agent" | "completed" | "archived";
  prioridade: "low" | "normal" | "high" | "urgent";
  versao: number;
  criada_em: string;
};

export type WaConversaSnapshot = {
  role: string;
  conversations: Array<Record<string, unknown>>;
  selected_id: string | null;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    has_more: boolean;
  };
  messages: WaMensagem[];
  notes: Array<{
    id: string;
    author_id: string;
    body: string;
    created_at: string;
    updated_at: string;
  }>;
  events: Array<{
    id: string;
    event_type: string;
    actor_id: string | null;
    occurred_at: string;
    details: Record<string, unknown>;
  }>;
  tags: Array<Record<string, unknown>>;
  lead: Record<string, unknown> | null;
  proposal: {
    id: string;
    lead_id: string;
    assunto: string;
    valor: number | null;
    status: string;
    criada_em: string;
    enviada_em: string | null;
    respondida_em: string | null;
  } | null;
};

async function invokeConversations(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase.functions.invoke("wa-conversations", {
    body: { ...body, org_id: context.orgId },
  });
  if (error) throw error;
  if (!data || typeof data !== "object")
    throw new Error("Resposta inválida da central de conversas.");
  return data as Record<string, unknown>;
}

export async function consultarConversasWa(
  conversaId?: string,
  page = 0,
  pageSize = 200,
): Promise<WaConversaSnapshot> {
  const data = await invokeConversations({
    acao: "snapshot",
    conversa_id: conversaId,
    page,
    page_size: pageSize,
  });
  return data as unknown as WaConversaSnapshot;
}

/** Lista entidades de conversa canônicas; nunca agrupa números no cliente. */
export async function listarConversas(): Promise<WaConversa[]> {
  const values: Array<Record<string, unknown>> = [];
  let page = 0;
  let hasMore = false;
  do {
    const snapshot = await consultarConversasWa(undefined, page);
    values.push(...snapshot.conversations);
    hasMore = snapshot.pagination.has_more;
    page += 1;
  } while (hasMore);

  return values.map((value) => {
    const row = value as Record<string, unknown>;
    return {
      id: String(row.id),
      instancia_id: String(row.instancia_id),
      lead_id: typeof row.lead_id === "string" ? row.lead_id : null,
      assigned_to: typeof row.assigned_to === "string" ? row.assigned_to : null,
      numero: String(row.normalized_phone ?? row.remote_contact_id ?? ""),
      nome_contato: typeof row.contact_name === "string" ? row.contact_name : null,
      ultima: typeof row.last_message_preview === "string" ? row.last_message_preview : null,
      ultima_em: String(row.last_message_at ?? row.updated_at),
      nao_lidas: Number(row.unread_count ?? 0),
      status: String(row.status) as WaConversa["status"],
      prioridade: String(row.priority) as WaConversa["prioridade"],
      versao: Number(row.version ?? 1),
      criada_em: String(row.created_at ?? row.updated_at),
    };
  });
}

/** Mensagens da entidade de conversa, em ordem cronológica. */
export async function listarMensagens(conversaId: string): Promise<WaMensagem[]> {
  return (await consultarConversasWa(conversaId)).messages;
}

export async function acaoConversaWa(
  conversaId: string,
  acao:
    | "claim"
    | "transfer"
    | "unassign"
    | "set_status"
    | "mark_read"
    | "add_note"
    | "link_lead"
    | "create_lead"
    | "add_tag"
    | "remove_tag",
  valor: Record<string, unknown> = {},
): Promise<Record<string, unknown> | null> {
  const result = await invokeConversations({ acao, conversa_id: conversaId, valor });
  return result.conversation && typeof result.conversation === "object"
    ? (result.conversation as Record<string, unknown>)
    : null;
}

export type WaLeadVinculavel = {
  id: string;
  business_name: string;
  owner_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  status: string;
};

/** Leads oficiais visíveis na organização ativa para vinculação manual. */
export async function listarLeadsVinculaveisWa(): Promise<WaLeadVinculavel[]> {
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase
    .from("leads")
    .select("id,business_name,owner_name,phone,whatsapp,email,status")
    .eq("org_id", context.orgId)
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as WaLeadVinculavel[];
}

/** Marca a entidade de conversa e suas mensagens inbound como lidas. */
export async function marcarConversaLida(conversaId: string): Promise<void> {
  await acaoConversaWa(conversaId, "mark_read");
}

/** Responde uma conversa (envia pelo chip da org via edge + grava a saída). */
export async function responderConversa(
  conversaId: string,
  texto: string,
  operationId = crypto.randomUUID(),
): Promise<{ ok: boolean; error?: string; status?: string; message_id?: string }> {
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase.functions.invoke("wa-responder", {
    body: { conversa_id: conversaId, texto, operation_id: operationId, org_id: context.orgId },
  });
  if (error) throw error;
  return data as { ok: boolean; error?: string; status?: string; message_id?: string };
}

/** Limpa o histórico de conversas da org (aba WhatsApp). Devolve quantas removeu. */
export async function limparConversas(confirmar = false): Promise<number> {
  if (!confirmar) throw new Error("Confirmação explícita obrigatória.");
  const context = await requireWhatsappAdministrator();
  const { data, error } = await supabase
    .from("wa_mensagens")
    .delete()
    .eq("org_id", context.orgId)
    .select("id");
  if (error) throw error;
  return (data ?? []).length;
}

// ===== KPIs da Central de Conversas (ETAPA 4 — Layout Aprovado) =====
export type WaConversaKpis = {
  conversasAtivas: number;
  naoLidas: number;
  aguardandoResposta: number;
  emAtendimento: number;
  novosContatos: number;
  fechamentosHoje: number;
};

export async function obterKpisConversasWa(): Promise<WaConversaKpis> {
  const context = await activeWhatsappOrganization();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [allConversations, winsResult] = await Promise.all([
    listarConversas(),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("org_id", context.orgId)
      .eq("status", "won")
      .gte("updated_at", start.toISOString()),
  ]);
  if (winsResult.error) throw winsResult.error;
  const conversations = allConversations.filter(
    (row) => !["completed", "archived"].includes(row.status),
  );
  return {
    conversasAtivas: conversations.length,
    naoLidas: conversations.reduce((total, row) => total + row.nao_lidas, 0),
    aguardandoResposta: conversations.filter((row) => row.status === "waiting_contact").length,
    emAtendimento: conversations.filter((row) => row.status === "in_progress").length,
    novosContatos: allConversations.filter((row) => new Date(row.criada_em) >= start).length,
    fechamentosHoje: winsResult.count ?? 0,
  };
}

export async function atualizarLeadCrm(
  leadId: string,
  dados: {
    status?: string;
    cargo?: string;
    email?: string;
    business_name?: string;
    owner_name?: string;
    phone?: string;
    notes?: string;
    assigned_to?: string | null;
  },
): Promise<boolean> {
  const context = await activeWhatsappOrganization();
  const { error } = await supabase
    .from("leads")
    .update(dados)
    .eq("id", leadId)
    .eq("org_id", context.orgId);
  return !error;
}

export async function registrarInteracaoWa(
  leadId: string | null,
  action: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  const context = await activeWhatsappOrganization();
  const { error } = await supabase.from("activity_log").insert({
    user_id: context.userId,
    org_id: context.orgId,
    action,
    entity_type: "wa_conversas",
    entity_id: leadId,
    metadata: metadata as Record<string, string | number | boolean | null>,
  });
  if (error) throw error;
}

// ===== KPIs e Métricas da Tela 03 — Campanhas WhatsApp (ETAPA 3 — Layout Aprovado) =====
export type WaCampanhasKpis = {
  totalCampanhas: number;
  mensagensEnviadas: number;
  entregues: number;
  taxaEntrega: number;
  respostas: number;
  taxaResposta: number;
  leadsGerados: number;
  taxaLeads: number;
  vendasAtribuidas: number;
};

export type WaChipDistribuicao = {
  id: string;
  nome: string;
  numero: string;
  avatar: string;
  totalMensagens: number;
  porcentagem: number;
  cor: "emerald" | "blue" | "amber" | "cyan" | "purple";
};

export type WaCampanhaAtividade = {
  id: string;
  tipo: "concluida" | "iniciada" | "resposta" | "lead" | "pausada" | "falha";
  titulo: string;
  subtitulo: string;
  horario: string;
  cor: "emerald" | "blue" | "amber" | "rose";
};

export type WaDeliveryCounts = Partial<
  Record<
    | "draft"
    | "pending_approval"
    | "scheduled"
    | "queued"
    | "processing"
    | "accepted"
    | "sent"
    | "delivered"
    | "read"
    | "failed"
    | "uncertain"
    | "cancelled"
    | "blocked",
    number
  >
> & { responses?: number };

export type WaCampaignEngineItem = {
  id: string;
  nome: string;
  status: string;
  list_id: string | null;
  criada_em: string;
  scheduled_at: string | null;
  schedule_timezone: string;
  dispatch_enabled: boolean;
  counts: WaDeliveryCounts;
};

export type WaCampaignEngineSnapshot = {
  campaigns: WaCampaignEngineItem[];
  chipMetrics: Record<string, { sent: number; percentage: number }>;
  metrics: {
    prepared: number;
    pending: number;
    processed: number;
    sent: number;
    delivered: number;
    failed: number;
    uncertain: number;
    responses: number;
    paused: number;
  };
};

function campaignEngineItem(value: unknown): WaCampaignEngineItem {
  if (!value || typeof value !== "object")
    throw new Error("Campanha invÃ¡lida no motor de envios.");
  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== "string" ||
    typeof row.nome !== "string" ||
    typeof row.status !== "string" ||
    typeof row.criada_em !== "string" ||
    typeof row.schedule_timezone !== "string" ||
    typeof row.dispatch_enabled !== "boolean" ||
    !row.counts ||
    typeof row.counts !== "object"
  ) {
    throw new Error("Campanha invÃ¡lida no motor de envios.");
  }
  const counts = Object.fromEntries(
    Object.entries(row.counts as Record<string, unknown>).map(([key, count]) => [
      key,
      Number(count ?? 0),
    ]),
  ) as WaDeliveryCounts;
  return {
    id: row.id,
    nome: row.nome,
    status: row.status,
    list_id: typeof row.list_id === "string" ? row.list_id : null,
    criada_em: row.criada_em,
    scheduled_at: typeof row.scheduled_at === "string" ? row.scheduled_at : null,
    schedule_timezone: row.schedule_timezone,
    dispatch_enabled: row.dispatch_enabled,
    counts,
  };
}

async function invokeCampaignControl(
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase.functions.invoke("wa-campaign-control", {
    body: { ...body, org_id: context.orgId },
  });
  if (error) throw error;
  if (!data || typeof data !== "object")
    throw new Error("Resposta invÃ¡lida do motor de campanhas.");
  return data as Record<string, unknown>;
}

export async function consultarMotorCampanhasWa(): Promise<WaCampaignEngineSnapshot> {
  const value = await invokeCampaignControl({ action: "list" });
  if (!Array.isArray(value.campaigns) || !value.metrics || typeof value.metrics !== "object") {
    throw new Error("Resposta invÃ¡lida do motor de campanhas.");
  }
  const metrics = value.metrics as Record<string, unknown>;
  const rawChipMetrics =
    value.chip_metrics && typeof value.chip_metrics === "object"
      ? (value.chip_metrics as Record<string, unknown>)
      : {};
  const chipMetrics = Object.fromEntries(
    Object.entries(rawChipMetrics).map(([instanceId, raw]) => {
      const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      return [instanceId, { sent: Number(row.sent ?? 0), percentage: Number(row.percentage ?? 0) }];
    }),
  );
  return {
    campaigns: value.campaigns.map(campaignEngineItem),
    chipMetrics,
    metrics: {
      prepared: Number(metrics.prepared ?? 0),
      pending: Number(metrics.pending ?? 0),
      processed: Number(metrics.processed ?? 0),
      sent: Number(metrics.sent ?? 0),
      delivered: Number(metrics.delivered ?? 0),
      failed: Number(metrics.failed ?? 0),
      uncertain: Number(metrics.uncertain ?? 0),
      responses: Number(metrics.responses ?? 0),
      paused: Number(metrics.paused ?? 0),
    },
  };
}

export async function consultarElegibilidadeCampanhaWa(listId: string): Promise<{
  total: number;
  eligible: number;
  blocked: number;
}> {
  const value = await invokeCampaignControl({ action: "eligibility", list_id: listId });
  return {
    total: Number(value.total ?? 0),
    eligible: Number(value.eligible ?? 0),
    blocked: Number(value.blocked ?? 0),
  };
}

export async function criarRascunhoCampanhaWa(input: {
  name: string;
  listId: string;
  message: string;
  campaignType: string;
  scheduledAt?: string | null;
  timezone: string;
}): Promise<{ id: string; createdAt: string; recipientCount: number }> {
  const value = await invokeCampaignControl({
    action: "create_draft",
    name: input.name,
    list_id: input.listId,
    message: input.message,
    campaign_type: input.campaignType,
    scheduled_at: input.scheduledAt ?? null,
    timezone: input.timezone,
  });
  const campaign = value.campaign;
  if (!campaign || typeof campaign !== "object") throw new Error("Rascunho nÃ£o persistido.");
  const row = campaign as Record<string, unknown>;
  return {
    id: String(row.campaign_id),
    createdAt: String(row.created_at),
    recipientCount: Number(row.recipient_count ?? 0),
  };
}

export async function prepararCampanhaWa(input: {
  campaignId: string;
  purpose: string;
  scheduledAt?: string | null;
  timezone: string;
}): Promise<{ queued: number; blocked: number; dispatchEnabled: false }> {
  const response = await invokeCampaignControl({
    action: "prepare",
    campaign_id: input.campaignId,
    purpose: input.purpose,
    scheduled_at: input.scheduledAt ?? null,
    timezone: input.timezone,
  });
  const result = Array.isArray(response.result) ? response.result[0] : response.result;
  const counts = result && typeof result === "object" ? (result as Record<string, unknown>) : {};
  return {
    queued: Number(counts.queued_count ?? 0),
    blocked: Number(counts.blocked_count ?? 0),
    dispatchEnabled: false,
  };
}

export async function controlarCampanhaWa(
  campaignId: string,
  action: "pause" | "resume" | "cancel",
  reason?: string,
): Promise<void> {
  await invokeCampaignControl({ action, campaign_id: campaignId, reason });
}

export async function reagendarCampanhaWa(
  campaignId: string,
  scheduledAt: string,
  timezone: string,
): Promise<void> {
  await invokeCampaignControl({
    action: "reschedule",
    campaign_id: campaignId,
    scheduled_at: scheduledAt,
    timezone,
  });
}

export async function obterKpisCampanhasWa(): Promise<WaCampanhasKpis> {
  try {
    const snapshot = await consultarMotorCampanhasWa();
    const totalCampanhas = snapshot.campaigns.length;
    const mensagensEnviadas = snapshot.metrics.sent;
    const entregues = snapshot.metrics.delivered;
    const respostas = snapshot.metrics.responses;
    const leadsGerados = 0;
    const vendasAtribuidas = 0;

    return {
      totalCampanhas,
      mensagensEnviadas,
      entregues,
      taxaEntrega:
        mensagensEnviadas > 0 ? Math.round((entregues / mensagensEnviadas) * 1000) / 10 : 0,
      respostas,
      taxaResposta:
        mensagensEnviadas > 0 ? Math.round((respostas / mensagensEnviadas) * 1000) / 10 : 0,
      leadsGerados,
      taxaLeads: 0,
      vendasAtribuidas,
    };
  } catch (error) {
    console.error("Falha ao carregar KPIs de campanhas WhatsApp", error);
    return {
      totalCampanhas: 0,
      mensagensEnviadas: 0,
      entregues: 0,
      taxaEntrega: 0,
      respostas: 0,
      taxaResposta: 0,
      leadsGerados: 0,
      taxaLeads: 0,
      vendasAtribuidas: 0,
    };
  }
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
  const context = await activeWhatsappOrganization();
  const [leadsWa, total, envios, conversations, chips] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("org_id", context.orgId)
      .not("whatsapp", "is", null),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("org_id", context.orgId),
    supabase.from("wa_envios").select("campanha_id").eq("org_id", context.orgId),
    listarConversas(),
    listarChips().catch(() => [] as WaChip[]),
  ]);
  const campanhas = new Set(
    (envios.data ?? [])
      .map((r) => (r as { campanha_id: string | null }).campanha_id)
      .filter(Boolean),
  ).size;
  const conversas = conversations.length;
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
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase
    .from("wa_envios")
    .select("campanha_id")
    .eq("org_id", context.orgId)
    .in("campanha_id", campanhaIds)
    .or("status.eq.accepted,status.eq.sent,status.eq.delivered,status.eq.read");
  if (error) throw error;
  const m: Record<string, number> = {};
  for (const r of (data ?? []) as { campanha_id: string | null }[])
    if (r.campanha_id) m[r.campanha_id] = (m[r.campanha_id] ?? 0) + 1;
  return m;
}

/** Estatísticas de uma campanha de WhatsApp já realizada (lê o ledger wa_envios). */
export async function historicoCampanhaWa(campanhaId: string): Promise<WaHistorico> {
  const context = await activeWhatsappOrganization();
  const { data: envios, error } = await supabase
    .from("wa_envios")
    .select("lead_id, instancia_id, enviado_em")
    .eq("org_id", context.orgId)
    .eq("campanha_id", campanhaId)
    .or("status.eq.accepted,status.eq.sent,status.eq.delivered,status.eq.read")
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
    .eq("org_id", context.orgId)
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
  const context = await requireWhatsappAdministrator();
  const { data, error } = await supabase.functions.invoke("wa-send-test", {
    body: { number: numero, text: texto, org_id: context.orgId },
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
  custo?: number | null;
  costStatus?: "settled" | "unknown";
  provider?: "aisa" | "apify";
  nextCursor?: string | null;
  providerRequestId?: string | null;
  gastoMes?: number;
  gastoMesDepois?: number;
  teto?: { rodada: number; mes: number };
  estourou?: boolean;
  detalhe?: string;
  avisoChaves?: string;
  cacheHit?: boolean;
  pendente?: boolean;
  requestId?: string;
  status?: string;
  recuperada?: boolean;
  leadIds?: string[];
  newLeadIds?: string[];
  buscaId?: string;
  resumo?: {
    analisados: number;
    aprovados: number;
    entregues: number;
    meta: number;
    novos: number;
    duplicados: number;
    rejeitados: Record<string, number>;
    motivoParada: "meta_atingida" | "fonte_esgotada";
  };
};

/** Roda a coleta REAL de uma estratégia. O servidor aplica o teto de gasto (US$/rodada e US$/mês). */
export async function buscarRedes(
  estrategia: string,
  campos: Record<string, unknown>,
  limite: number,
  opcoes?: { somenteNovos?: boolean; cursor?: string },
): Promise<ColetaRedes> {
  const requestId = crypto.randomUUID();
  const inicial = await supabase.functions.invoke("buscar-redes", {
    body: {
      acao: "buscar",
      estrategia,
      campos,
      limite,
      somenteNovos: opcoes?.somenteNovos ?? true,
      cursor: opcoes?.cursor,
      requestId,
    },
  });
  const respostaInicial = inicial.data as ColetaRedes | null;
  if (!inicial.error && respostaInicial && !respostaInicial.pendente) return respostaInicial;

  // O Actor pode sobreviver ao limite HTTP da Edge. Recuperamos pelo requestId e consultamos
  // o MESMO run pago até ele terminar; nunca reenviamos a ação "buscar".
  const deadline = Date.now() + 10 * 60 * 1000;
  let ultimoErro: unknown = inicial.error;
  let falhasConsecutivas = 0;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 4_000));
    const consulta = await supabase.functions.invoke("buscar-redes", {
      body: { acao: "recuperar", requestId },
    });
    if (consulta.error) {
      ultimoErro = consulta.error;
      falhasConsecutivas++;
      if (inicial.error && falhasConsecutivas >= 3) throw inicial.error;
      continue;
    }
    falhasConsecutivas = 0;
    const resposta = consulta.data as ColetaRedes;
    if (resposta?.reason === "busca_nao_encontrada" && inicial.error) throw inicial.error;
    if (!resposta?.pendente) return resposta;
  }
  throw ultimoErro instanceof Error
    ? ultimoErro
    : new Error("A coleta continua processando além do tempo esperado. Tente consultar novamente.");
}

// ===== Agente SDR: rascunhos de resposta (o agente sugere, o dono decide) =====
export type SdrSugestao = {
  id: string;
  numero: string;
  lead_id: string | null;
  texto: string;
  alertas: { rotulo: string; trecho: string }[];
  estado: "rascunho" | "aprovada" | "descartada" | "enviada";
  criado_em: string;
};

/** Rascunhos pendentes da org (o dono lê por RLS). */
export async function listarSugestoesSdr(): Promise<SdrSugestao[]> {
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase
    .from("sdr_sugestoes")
    .select("id, numero, lead_id, texto, alertas, estado, criado_em")
    .eq("org_id", context.orgId)
    .eq("estado", "rascunho")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SdrSugestao[];
}

/** Pede ao agente para rascunhar (só conversas de LEAD; respeita o teto de IA). */
export async function rodarSdr(limite = 3) {
  const context = await activeWhatsappOrganization();
  const { data, error } = await supabase.functions.invoke("sdr-sugerir", {
    body: { limite, org_id: context.orgId },
  });
  if (error) throw error;
  return data as {
    ok: boolean;
    criadas?: number;
    reason?: string;
    motivo?: string;
    gasto?: { dia: number; mes: number };
    teto?: { dia: number; mes: number };
  };
}

/** Descarta o rascunho (nada é enviado). */
export async function descartarSugestaoSdr(id: string): Promise<void> {
  const context = await activeWhatsappOrganization();
  const { error } = await supabase
    .from("sdr_sugestoes")
    .update({ estado: "descartada", decidido_em: new Date().toISOString() })
    .eq("id", id)
    .eq("org_id", context.orgId);
  if (error) throw error;
}

/**
 * APROVA e envia — nesta ordem e só nesta ordem: manda pelo transporte real e SÓ marca
 * 'enviada' se a Evolution confirmar. Se o envio falhar, o rascunho continua pendente
 * (não marcamos enviado o que não saiu — é a mesma regra do disparo).
 */
export async function aprovarSugestaoSdr(
  s: Pick<SdrSugestao, "id" | "numero">,
  texto: string,
): Promise<{ ok: boolean; error?: string }> {
  const context = await activeWhatsappOrganization();
  const { data: conversation } = await supabase
    .from("wa_mensagens")
    .select("id")
    .eq("org_id", context.orgId)
    .eq("numero", s.numero)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!conversation) return { ok: false, error: "Conversa não encontrada." };
  const r = await responderConversa(conversation.id, texto);
  if (!r.ok) return { ok: false, error: r.error ?? "falha no envio" };
  const { error } = await supabase
    .from("sdr_sugestoes")
    .update({ estado: "enviada", texto, decidido_em: new Date().toISOString() })
    .eq("id", s.id)
    .eq("org_id", context.orgId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

// ===== Painel WhatsApp Premium — Dados Reais e Consolidados =====
export type WaAtividadeRecente = {
  id: string;
  tipo: "campanha" | "mensagem_recebida" | "mensagem_enviada" | "chip_conectado" | "alerta";
  titulo: string;
  descricao: string;
  timestamp: string;
  cor?: string;
};

export type WaPainelCampanha = {
  id: string;
  nome: string;
  status: string;
  descricao?: string;
  enviados: number;
  entregues: number;
  taxaEntrega: number;
  respostas: number;
  taxaResposta: number;
  criada_em: string;
};

export type WaPainelData = {
  stats: WaEstatisticas;
  chips: WaChip[];
  campanhas: WaPainelCampanha[];
  conversas: WaConversa[];
  atividades: WaAtividadeRecente[];
  taxaRespostaGeral: number;
  conectado: boolean;
  parcialmenteConectado: boolean;
  desconectado: boolean;
  indisponivel: boolean;
};

export async function obterDadosPainelWa(): Promise<WaPainelData> {
  const context = await activeWhatsappOrganization();
  const [chipsRes, statsRes, campanhasRes, conversasRes, enviosRes, msgsRes, alertasRes] =
    await Promise.allSettled([
      listarChips(),
      estatisticasWa(),
      supabase
        .from("campanhas")
        .select("id, nome, status, list_id, criada_em, lead_lists(name)")
        .eq("org_id", context.orgId)
        .eq("canal", "whatsapp")
        .order("criada_em", { ascending: false })
        .limit(6),
      listarConversas(),
      supabase
        .from("wa_envios")
        .select("id, campanha_id, lead_id, enviado_em")
        .eq("org_id", context.orgId)
        .order("enviado_em", { ascending: false })
        .limit(2000),
      supabase
        .from("wa_mensagens")
        .select("id, numero, nome_contato, direcao, texto, criado_em, lida")
        .eq("org_id", context.orgId)
        .order("criado_em", { ascending: false })
        .limit(500),
      listarAlertas(),
    ]);

  const chips = chipsRes.status === "fulfilled" ? chipsRes.value : [];
  const stats =
    statsRes.status === "fulfilled"
      ? statsRes.value
      : {
          leadsComWhatsapp: 0,
          totalLeads: 0,
          campanhasEnviadas: 0,
          conversas: 0,
          conectado: false,
          temDisparo: false,
          temConversa: false,
        };

  const conversas = conversasRes.status === "fulfilled" ? conversasRes.value : [];
  const rawCampanhas =
    campanhasRes.status === "fulfilled" && campanhasRes.value.data ? campanhasRes.value.data : [];
  const rawEnvios =
    enviosRes.status === "fulfilled" && enviosRes.value.data ? enviosRes.value.data : [];
  const rawMsgs = msgsRes.status === "fulfilled" && msgsRes.value.data ? msgsRes.value.data : [];
  const rawAlertas = alertasRes.status === "fulfilled" ? alertasRes.value : [];

  // Mapear envios por campanha
  const enviosPorCampanha = new Map<string, number>();
  for (const env of rawEnvios) {
    if (env.campanha_id) {
      enviosPorCampanha.set(env.campanha_id, (enviosPorCampanha.get(env.campanha_id) ?? 0) + 1);
    }
  }

  // Campanhas com estatísticas consolidadas
  const campanhas: WaPainelCampanha[] = rawCampanhas.map((c) => {
    const enviados = enviosPorCampanha.get(c.id) ?? 0;
    const entregues = 0;
    const taxaEntrega = 0;
    const respostas = 0;
    const taxaResposta = 0;
    const listName =
      c.lead_lists && typeof c.lead_lists === "object" && "name" in c.lead_lists
        ? (c.lead_lists as { name: string }).name
        : undefined;

    return {
      id: c.id,
      nome: c.nome,
      status: c.status,
      descricao: listName ? `Lista: ${listName}` : "Campanha direta",
      enviados,
      entregues,
      taxaEntrega,
      respostas,
      taxaResposta,
      criada_em: c.criada_em,
    };
  });

  // Cálculo da taxa de resposta geral (inbound vs total conversas)
  const msgsRecebidas = rawMsgs.filter((m) => m.direcao === "in").length;
  const msgsEnviadas = rawMsgs.filter((m) => m.direcao === "out").length;
  let taxaRespostaGeral = 0;
  if (msgsEnviadas > 0 && msgsRecebidas > 0) {
    taxaRespostaGeral = Math.min(100, Math.round((msgsRecebidas / msgsEnviadas) * 100));
  }

  // Status de conexão
  const ativos = chips.filter(
    (c) =>
      c.provider_status === "connected" &&
      c.operational_health === "healthy" &&
      Boolean(
        c.last_provider_success_at &&
        Date.now() - Date.parse(c.last_provider_success_at) <= 5 * 60_000,
      ),
  ).length;
  const totalChips = chips.length;
  const desconectados = chips.filter((c) => c.operational_health !== "healthy").length;

  const indisponivel = chipsRes.status === "rejected";
  const conectado = !indisponivel && totalChips > 0 && ativos > 0 && desconectados === 0;
  const parcialmenteConectado = !indisponivel && ativos > 0 && desconectados > 0;
  const desconectado = !indisponivel && ativos === 0;

  // Atividade recente real consolidada
  const atividades: WaAtividadeRecente[] = [];

  // Alertas
  for (const a of rawAlertas.slice(0, 3)) {
    atividades.push({
      id: `alerta-${a.id}`,
      tipo: "alerta",
      titulo: a.tipo === "chip_queimado" ? "Alerta de número" : "Notificação operacional",
      descricao: a.mensagem,
      timestamp: a.criado_em,
      cor: "rose",
    });
  }

  // Mensagens recentes
  for (const m of rawMsgs.slice(0, 4)) {
    if (m.direcao === "in") {
      atividades.push({
        id: `msg-${m.id}`,
        tipo: "mensagem_recebida",
        titulo: m.nome_contato ? `Mensagem de ${m.nome_contato}` : "Mensagem recebida",
        descricao: m.texto ? m.texto.substring(0, 70) : "Mídia ou anexo recebido",
        timestamp: m.criado_em,
        cor: "emerald",
      });
    } else {
      atividades.push({
        id: `msg-${m.id}`,
        tipo: "mensagem_enviada",
        titulo: "Mensagem enviada",
        descricao: m.texto ? m.texto.substring(0, 70) : "Disparo enviado com sucesso",
        timestamp: m.criado_em,
        cor: "blue",
      });
    }
  }

  // Campanhas recentes
  for (const c of campanhas.slice(0, 2)) {
    atividades.push({
      id: `camp-${c.id}`,
      tipo: "campanha",
      titulo: `Campanha "${c.nome}"`,
      descricao: `${c.enviados > 0 ? `${c.enviados} mensagens enviadas` : "Campanha configurada"}`,
      timestamp: c.criada_em,
      cor: "purple",
    });
  }

  // Chips ativos/atualizados
  for (const ch of chips.slice(0, 2)) {
    atividades.push({
      id: `chip-${ch.id}`,
      tipo: "chip_conectado",
      titulo:
        ch.status === "conectado" ? `Número ${ch.nome} ativo` : `Número ${ch.nome} (${ch.status})`,
      descricao: ch.numero
        ? `Número registrado: ${ch.numero}`
        : "Instância configurada no servidor",
      timestamp: new Date().toISOString(),
      cor: ch.status === "conectado" ? "emerald" : "amber",
    });
  }

  // Ordenar cronologicamente decrescente
  atividades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    stats: {
      ...stats,
      conectado: ativos > 0,
    },
    chips,
    campanhas,
    conversas,
    atividades: atividades.slice(0, 6),
    taxaRespostaGeral,
    conectado,
    parcialmenteConectado,
    desconectado,
    indisponivel,
  };
}

// ============================================================================
// WHATSAPP AUTOMAÇÕES PREMIUM (PROMPT 60 — FIDELIDADE VISUAL ABSOLUTA + INTEGRAÇÃO REAL)
// ============================================================================

export type WaAutomacaoTipo =
  "boas_vindas" | "qualificacao" | "agendamento" | "follow_up" | "recuperacao" | "atendimento";

export type WaAutomacaoGatilho =
  | "nova_conversa"
  | "palavras_chave"
  | "comando"
  | "tempo_sem_resposta"
  | "tempo_sem_interacao"
  | "etapa_crm";

export type WaAutomacaoStatus = "ativa" | "pausada" | "rascunho" | "com_erro";

export type WaAutomacaoItem = {
  id: string;
  nome: string;
  descricao: string;
  tipo: WaAutomacaoTipo;
  gatilho: string;
  gatilhoTipo: WaAutomacaoGatilho;
  status: WaAutomacaoStatus;
  ativa: boolean;
  execucoes: number;
  ultimaAtualizacao: string;
  condicoes?: {
    palavrasChave?: string[];
    tempoHoras?: number;
    etapaCrm?: string;
    origemLead?: string;
    scoreMinimo?: number;
  };
  acoes?: {
    scriptId?: string;
    textoMensagem?: string;
    mudarEtapaCrm?: string;
    adicionarTags?: string[];
    atribuirResponsavel?: string;
    criarSugestaoSdr?: boolean;
    notificarEquipe?: boolean;
  };
  origem: "db" | "custom" | "referencia";
};

export type WaAutomacoesKpis = {
  ativas: number;
  ativasTrend: string;
  mensagens: number;
  mensagensTrend: string;
  qualificados: number;
  qualificadosTrend: string;
  taxaResposta: string;
  taxaRespostaTrend: string;
  tempoMedio: string;
  tempoMedioTrend: string;
};

export type WaAutomacoesDesempenhoPonto = {
  data: string;
  mensagens: number;
  qualificados: number;
  respostas: number;
};

export type WaAutomacoesDesempenho = {
  mensagens: number;
  mensagensTrend: string;
  qualificados: number;
  qualificadosTrend: string;
  taxaResposta: string;
  taxaRespostaTrend: string;
  pontos: WaAutomacoesDesempenhoPonto[];
};

export type WaAutomacoesDistribuicaoItem = {
  tipo: WaAutomacaoTipo;
  label: string;
  cor: string;
  hex: string;
  percentual: number;
  execucoes: number;
};

export type WaAutomacaoAtividadeItem = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  horario: string;
  automacao: string;
  icone: "executada" | "qualificado" | "agendada" | "followup" | "humano" | "erro";
  cor: "green" | "blue" | "purple" | "amber" | "cyan" | "red";
};

export const AUTOMACOES_REFERENCIA_PREMIUM: WaAutomacaoItem[] = [
  {
    id: "wa-auto-1",
    nome: "Boas-vindas novos leads",
    descricao: "Mensagem inicial automática",
    tipo: "boas_vindas",
    gatilho: "Nova conversa",
    gatilhoTipo: "nova_conversa",
    status: "ativa",
    ativa: true,
    execucoes: 842,
    ultimaAtualizacao: "12/03/2024 14:30",
    origem: "referencia",
    condicoes: { origemLead: "WhatsApp Inbound" },
    acoes: { criarSugestaoSdr: true, mudarEtapaCrm: "contato_inicial" },
  },
  {
    id: "wa-auto-2",
    nome: "Qualificação automática",
    descricao: "Identifica interesse e segmento",
    tipo: "qualificacao",
    gatilho: "Palavras-chave",
    gatilhoTipo: "palavras_chave",
    status: "ativa",
    ativa: true,
    execucoes: 623,
    ultimaAtualizacao: "12/03/2024 11:15",
    origem: "referencia",
    condicoes: { palavrasChave: ["orçamento", "preço", "proposta", "planos"] },
    acoes: { criarSugestaoSdr: true, mudarEtapaCrm: "qualificacao" },
  },
  {
    id: "wa-auto-3",
    nome: "Agendamento de reuniões",
    descricao: "Oferece link de agendamento",
    tipo: "agendamento",
    gatilho: "Comando / palavra",
    gatilhoTipo: "comando",
    status: "ativa",
    ativa: true,
    execucoes: 428,
    ultimaAtualizacao: "11/03/2024 16:20",
    origem: "referencia",
    condicoes: { palavrasChave: ["reunião", "agendar", "call", "demonstração"] },
    acoes: { mudarEtapaCrm: "reuniao_agendada" },
  },
  {
    id: "wa-auto-4",
    nome: "Follow-up de propostas",
    descricao: "Lembra o cliente sobre propostas",
    tipo: "follow_up",
    gatilho: "Tempo sem resposta",
    gatilhoTipo: "tempo_sem_resposta",
    status: "ativa",
    ativa: true,
    execucoes: 356,
    ultimaAtualizacao: "11/03/2024 09:45",
    origem: "referencia",
    condicoes: { tempoHoras: 48, etapaCrm: "proposta_enviada" },
    acoes: { criarSugestaoSdr: true },
  },
  {
    id: "wa-auto-5",
    nome: "Recuperação de leads",
    descricao: "Reativa contatos inativos",
    tipo: "recuperacao",
    gatilho: "Tempo sem interação",
    gatilhoTipo: "tempo_sem_interacao",
    status: "pausada",
    ativa: false,
    execucoes: 98,
    ultimaAtualizacao: "10/03/2024 13:10",
    origem: "referencia",
    condicoes: { tempoHoras: 168 },
    acoes: { mudarEtapaCrm: "recuperacao" },
  },
  {
    id: "wa-auto-6",
    nome: "Transferência para humano",
    descricao: "Direciona para equipe de vendas",
    tipo: "atendimento",
    gatilho: "Palavras-chave",
    gatilhoTipo: "palavras_chave",
    status: "ativa",
    ativa: true,
    execucoes: 276,
    ultimaAtualizacao: "10/03/2024 08:22",
    origem: "referencia",
    condicoes: { palavrasChave: ["falar com atendente", "humano", "suporte", "urgente"] },
    acoes: { notificarEquipe: true, mudarEtapaCrm: "atendimento_humano" },
  },
];

export const KPIS_REFERENCIA_PREMIUM: WaAutomacoesKpis = {
  ativas: 12,
  ativasTrend: "+20%",
  mensagens: 1428,
  mensagensTrend: "+15%",
  qualificados: 342,
  qualificadosTrend: "+28%",
  taxaResposta: "87%",
  taxaRespostaTrend: "+5%",
  tempoMedio: "2,4 min",
  tempoMedioTrend: "-18%",
};

export const DESEMPENHO_REFERENCIA_PREMIUM: WaAutomacoesDesempenho = {
  mensagens: 1428,
  mensagensTrend: "+15%",
  qualificados: 342,
  qualificadosTrend: "+28%",
  taxaResposta: "87%",
  taxaRespostaTrend: "+5%",
  pontos: [
    { data: "01/03", mensagens: 105, qualificados: 24, respostas: 8 },
    { data: "05/03", mensagens: 142, qualificados: 36, respostas: 12 },
    { data: "10/03", mensagens: 128, qualificados: 29, respostas: 9 },
    { data: "15/03", mensagens: 178, qualificados: 49, respostas: 18 },
    { data: "20/03", mensagens: 158, qualificados: 41, respostas: 14 },
    { data: "25/03", mensagens: 195, qualificados: 58, respostas: 23 },
    { data: "30/03", mensagens: 182, qualificados: 52, respostas: 20 },
  ],
};

export const DISTRIBUICAO_REFERENCIA_PREMIUM: WaAutomacoesDistribuicaoItem[] = [
  {
    tipo: "boas_vindas",
    label: "Boas-vindas",
    cor: "emerald",
    hex: "#10b981",
    percentual: 35,
    execucoes: 500,
  },
  {
    tipo: "qualificacao",
    label: "Qualificação",
    cor: "blue",
    hex: "#3b82f6",
    percentual: 24,
    execucoes: 342,
  },
  {
    tipo: "agendamento",
    label: "Agendamento",
    cor: "purple",
    hex: "#8b5cf6",
    percentual: 18,
    execucoes: 257,
  },
  {
    tipo: "follow_up",
    label: "Follow-up",
    cor: "amber",
    hex: "#f59e0b",
    percentual: 12,
    execucoes: 171,
  },
  {
    tipo: "recuperacao",
    label: "Recuperação",
    cor: "red",
    hex: "#ef4444",
    percentual: 7,
    execucoes: 100,
  },
  {
    tipo: "atendimento",
    label: "Atendimento",
    cor: "cyan",
    hex: "#06b6d4",
    percentual: 4,
    execucoes: 58,
  },
];

export const ATIVIDADES_AUTOMACOES_REFERENCIA_PREMIUM: WaAutomacaoAtividadeItem[] = [
  {
    id: "act-1",
    tipo: "execucao",
    titulo: "Automação executada",
    descricao: "Boas-vindas novos leads",
    horario: "14:32",
    automacao: "Boas-vindas novos leads",
    icone: "executada",
    cor: "green",
  },
  {
    id: "act-2",
    tipo: "qualificacao",
    titulo: "Lead qualificado",
    descricao: "Qualificação automática",
    horario: "13:45",
    automacao: "Qualificação automática",
    icone: "qualificado",
    cor: "blue",
  },
  {
    id: "act-3",
    tipo: "agendamento",
    titulo: "Reunião agendada",
    descricao: "Agendamento de reuniões",
    horario: "12:18",
    automacao: "Agendamento de reuniões",
    icone: "agendada",
    cor: "purple",
  },
  {
    id: "act-4",
    tipo: "followup",
    titulo: "Follow-up enviado",
    descricao: "Follow-up de propostas",
    horario: "10:24",
    automacao: "Follow-up de propostas",
    icone: "followup",
    cor: "amber",
  },
  {
    id: "act-5",
    tipo: "humano",
    titulo: "Transferência para humano",
    descricao: "Atendimento automático",
    horario: "09:15",
    automacao: "Transferência para humano",
    icone: "humano",
    cor: "cyan",
  },
  {
    id: "act-6",
    tipo: "erro",
    titulo: "Erro na execução",
    descricao: "Recuperação de leads",
    horario: "08:42",
    automacao: "Recuperação de leads",
    icone: "erro",
    cor: "red",
  },
];

const localStorageWaAutomacoes = (orgId: string) => `flow_wa_automacoes_v1.${orgId}`;

/**
 * Lê automações persistidas no storage local da organização ou mescla com receitas do banco
 */
export function listarAutomacoesLocais(orgId: string): WaAutomacaoItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(localStorageWaAutomacoes(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Falha ao ler automações locais", error);
    return [];
  }
}

/**
 * Salva a lista inteira de automações no storage local
 */
export function salvarAutomacoesLocais(orgId: string, itens: WaAutomacaoItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(localStorageWaAutomacoes(orgId), JSON.stringify(itens));
  } catch (err) {
    console.error("Falha ao salvar automações locais:", err);
  }
}

/**
 * Cria ou atualiza uma automação comercial de WhatsApp
 */
export async function salvarAutomacaoWa(auto: Partial<WaAutomacaoItem>): Promise<WaAutomacaoItem> {
  const context = await requireWhatsappAdministrator();
  const lista = listarAutomacoesLocais(context.orgId);
  const agora = new Date();
  const dataFormatada = `${String(agora.getDate()).padStart(2, "0")}/${String(
    agora.getMonth() + 1,
  ).padStart(2, "0")}/${agora.getFullYear()} ${String(agora.getHours()).padStart(
    2,
    "0",
  )}:${String(agora.getMinutes()).padStart(2, "0")}`;

  if (auto.id) {
    const index = lista.findIndex((a) => a.id === auto.id);
    if (index >= 0) {
      const atualizada: WaAutomacaoItem = {
        ...lista[index],
        ...auto,
        ultimaAtualizacao: dataFormatada,
      } as WaAutomacaoItem;
      lista[index] = atualizada;
      salvarAutomacoesLocais(context.orgId, lista);
      return atualizada;
    }
  }

  const nova: WaAutomacaoItem = {
    id: auto.id || `wa-auto-${Date.now()}`,
    nome: auto.nome || "Nova automação",
    descricao: auto.descricao || "Automação comercial WhatsApp",
    tipo: auto.tipo || "boas_vindas",
    gatilho: auto.gatilho || "Nova conversa",
    gatilhoTipo: auto.gatilhoTipo || "nova_conversa",
    status: auto.status || "ativa",
    ativa: auto.ativa ?? true,
    execucoes: auto.execucoes || 0,
    ultimaAtualizacao: dataFormatada,
    condicoes: auto.condicoes || {},
    acoes: auto.acoes || {},
    origem: "custom",
  };

  const novaLista = [nova, ...lista];
  salvarAutomacoesLocais(context.orgId, novaLista);
  return nova;
}

/**
 * Alterna status (Ativa / Pausada) de uma automação
 */
export async function alternarStatusAutomacaoWa(
  id: string,
  ativa: boolean,
): Promise<{ ok: boolean; status: WaAutomacaoStatus; aviso?: string }> {
  const context = await requireWhatsappAdministrator();
  const lista = listarAutomacoesLocais(context.orgId);
  const index = lista.findIndex((a) => a.id === id);
  if (index < 0) return { ok: false, status: "pausada", aviso: "Automação não encontrada" };

  const novoStatus: WaAutomacaoStatus = ativa ? "ativa" : "pausada";
  lista[index].ativa = ativa;
  lista[index].status = novoStatus;
  salvarAutomacoesLocais(context.orgId, lista);

  return {
    ok: true,
    status: novoStatus,
    aviso: ativa
      ? "Automação salva. Execução automática ainda não disponível pelo backend."
      : "Automação pausada com sucesso.",
  };
}

/**
 * Exclui uma automação do sistema
 */
export async function excluirAutomacaoWa(id: string): Promise<boolean> {
  const context = await requireWhatsappAdministrator();
  const lista = listarAutomacoesLocais(context.orgId);
  const novaLista = lista.filter((a) => a.id !== id);
  salvarAutomacoesLocais(context.orgId, novaLista);
  return true;
}

/**
 * Duplica uma automação
 */
export async function duplicarAutomacaoWa(id: string): Promise<WaAutomacaoItem | null> {
  const context = await requireWhatsappAdministrator();
  const lista = listarAutomacoesLocais(context.orgId);
  const original = lista.find((a) => a.id === id);
  if (!original) return null;

  return salvarAutomacaoWa({
    ...original,
    id: undefined,
    nome: `${original.nome} (Cópia)`,
    execucoes: 0,
    status: "rascunho",
    ativa: false,
  });
}

/**
 * Obtém todos os dados consolidados da tela de Automações WhatsApp
 */
export async function obterDadosAutomacoesWa(): Promise<{
  automacoes: WaAutomacaoItem[];
  kpis: WaAutomacoesKpis;
  desempenho: WaAutomacoesDesempenho;
  distribuicao: WaAutomacoesDistribuicaoItem[];
  atividades: WaAutomacaoAtividadeItem[];
  conectado: boolean;
}> {
  const context = await activeWhatsappOrganization();
  const automacoes = listarAutomacoesLocais(context.orgId);

  // Buscar dados reais de chips e mensagens se disponíveis
  let totalMensagens = 0;
  const leadsQualificados = 0;
  let taxaResp = "0%";
  let conectado = false;

  try {
    const { data: chips } = await supabase
      .from("wa_instancias")
      .select("id, status")
      .eq("org_id", context.orgId);
    if (chips && chips.length > 0) {
      conectado = chips.some((c) => c.status === "conectado");
    }

    const { data: messages, count: msgCount } = await supabase
      .from("wa_mensagens")
      .select("id, direcao", { count: "exact" })
      .eq("org_id", context.orgId);
    if (typeof msgCount === "number" && msgCount > 0) {
      totalMensagens = msgCount;
    }

    if (messages?.length) {
      const outbound = messages.filter((message) => message.direcao === "out").length;
      const inbound = messages.filter((message) => message.direcao === "in").length;
      taxaResp = outbound > 0 ? `${Math.round((inbound / outbound) * 100)}%` : "0%";
    }
  } catch (error) {
    console.error("Falha ao carregar automações WhatsApp", error);
  }

  const ativas = automacoes.filter((a) => a.ativa).length;

  return {
    automacoes,
    kpis: {
      ativas,
      ativasTrend: "—",
      mensagens: totalMensagens,
      mensagensTrend: "—",
      qualificados: leadsQualificados,
      qualificadosTrend: "—",
      taxaResposta: taxaResp,
      taxaRespostaTrend: "—",
      tempoMedio: "Dados insuficientes",
      tempoMedioTrend: "—",
    },
    desempenho: {
      mensagens: totalMensagens,
      mensagensTrend: "—",
      qualificados: leadsQualificados,
      qualificadosTrend: "—",
      taxaResposta: taxaResp,
      taxaRespostaTrend: "—",
      pontos: [],
    },
    distribuicao: [],
    atividades: [],
    conectado,
  };
}

// ============================================================================
// WHATSAPP SCRIPTS PREMIUM (PROMPT 61 — FIDELIDADE VISUAL MÁXIMA + INTEGRAÇÃO REAL)
// ============================================================================

export type WaScriptCategoria =
  "boas_vindas" | "qualificacao" | "agendamento" | "follow_up" | "recuperacao" | "atendimento";

export type WaScriptStatus = "ativo" | "inativo";

export type WaScriptItem = {
  id: string;
  nome: string;
  categoria: WaScriptCategoria;
  mensagem: string;
  textoPrev: string;
  variaveisCount: number;
  variaveis: string[];
  usos: number;
  ativo: boolean;
  status: WaScriptStatus;
  tipo?: "texto" | "imagem" | "video" | "arquivo" | string;
  media_url?: string | null;
  criado_em: string;
  atualizado_em?: string;
  origem: "db" | "custom" | "referencia";
};

export type WaScriptsKpis = {
  criados: number;
  criadosTrend: string;
  usosMes: number;
  usosMesTrend: string;
  atendimentos: number;
  atendimentosTrend: string;
  taxaUtilizacao: string;
  taxaUtilizacaoTrend: string;
  avaliacao: string;
  avaliacaoTrend: string;
};

export type WaScriptsDesempenhoPonto = {
  data: string;
  usos: number;
  conversas: number;
  respostas: number;
};

export type WaScriptsDesempenho = {
  usosMes: number;
  usosMesTrend: string;
  conversas: number;
  conversasTrend: string;
  taxaResposta: string;
  taxaRespostaTrend: string;
  avaliacao: string;
  avaliacaoTrend: string;
  pontos: WaScriptsDesempenhoPonto[];
};

export type WaScriptMaisUsado = {
  rank: number;
  id: string;
  nome: string;
  categoria: WaScriptCategoria;
  categoriaLabel: string;
  usos: number;
  iconeCor: string;
};

export type WaScriptAtividadeItem = {
  id: string;
  titulo: string;
  scriptNome: string;
  horario: string;
  tipo: "atualizado" | "criado" | "variavel" | "desativado" | "ativado" | "categoria";
  cor: "green" | "blue" | "cyan" | "red" | "purple";
};

export const SCRIPTS_REFERENCIA_PREMIUM: WaScriptItem[] = [
  {
    id: "sc-1",
    nome: "Boas-vindas novo lead",
    categoria: "boas_vindas",
    mensagem:
      "Olá, {{nome}}! 👋\n\nSeja muito bem-vindo(a) à {{empresa}}!\n\nVi que você se interessou pelos nossos serviços e gostaria de entender melhor a sua necessidade.\n\nComo posso te ajudar hoje?",
    textoPrev: "Olá, {{nome}}! Seja...",
    variaveisCount: 3,
    variaveis: ["nome", "empresa", "cidade"],
    usos: 428,
    ativo: true,
    status: "ativo",
    tipo: "texto",
    criado_em: "2024-03-01T10:00:00Z",
    atualizado_em: "12/03/2024 14:30",
    origem: "referencia",
  },
  {
    id: "sc-2",
    nome: "Qualificação inicial",
    categoria: "qualificacao",
    mensagem:
      "Olá {{nome}}! Vi que você tem interesse em soluções para {{categoria}} em {{cidade}}.\n\nQual é o principal desafio que você busca resolver hoje?",
    textoPrev: "Vi que você se inte...",
    variaveisCount: 5,
    variaveis: ["nome", "categoria", "cidade", "empresa", "telefone"],
    usos: 356,
    ativo: true,
    status: "ativo",
    tipo: "texto",
    criado_em: "2024-03-02T11:00:00Z",
    atualizado_em: "12/03/2024 11:15",
    origem: "referencia",
  },
  {
    id: "sc-3",
    nome: "Agendar reunião",
    categoria: "agendamento",
    mensagem:
      "Perfeito, {{nome}}! Podemos agendar uma demonstração rápida de 15 minutos para te apresentar na prática?\n\nEscolha o melhor dia e horário por este link: {{link}}",
    textoPrev: "Podemos agendar ...",
    variaveisCount: 4,
    variaveis: ["nome", "link", "empresa", "responsavel"],
    usos: 298,
    ativo: true,
    status: "ativo",
    tipo: "texto",
    criado_em: "2024-03-03T09:00:00Z",
    atualizado_em: "11/03/2024 16:20",
    origem: "referencia",
  },
  {
    id: "sc-4",
    nome: "Follow-up proposta",
    categoria: "follow_up",
    mensagem:
      "Olá, {{nome}}! Passando para saber se você conseguiu analisar a proposta que enviamos para a {{empresa}}.\n\nFicou alguma dúvida que eu possa esclarecer?",
    textoPrev: "Olá, {{nome}}! Pas...",
    variaveisCount: 4,
    variaveis: ["nome", "empresa", "responsavel", "telefone"],
    usos: 276,
    ativo: true,
    status: "ativo",
    tipo: "texto",
    criado_em: "2024-03-04T14:00:00Z",
    atualizado_em: "11/03/2024 09:45",
    origem: "referencia",
  },
  {
    id: "sc-5",
    nome: "Recuperação de lead",
    categoria: "recuperacao",
    mensagem:
      "Olá, {{nome}}! Sentimos sua falta. Preparamos uma condição exclusiva para você conhecer nossa plataforma neste mês. Gostaria de dar uma olhada?",
    textoPrev: "Sentimos sua falta...",
    variaveisCount: 3,
    variaveis: ["nome", "empresa", "cidade"],
    usos: 198,
    ativo: false,
    status: "inativo",
    tipo: "texto",
    criado_em: "2024-03-05T16:00:00Z",
    atualizado_em: "10/03/2024 13:10",
    origem: "referencia",
  },
  {
    id: "sc-6",
    nome: "Transferência humana",
    categoria: "atendimento",
    mensagem:
      "Vou transferir você agora mesmo para nosso especialista comercial que dará continuidade ao seu atendimento em instantes! Aguarde um momento por favor.",
    textoPrev: "Vou transferir você...",
    variaveisCount: 2,
    variaveis: ["nome", "responsavel"],
    usos: 156,
    ativo: true,
    status: "ativo",
    tipo: "texto",
    criado_em: "2024-03-06T08:00:00Z",
    atualizado_em: "10/03/2024 08:22",
    origem: "referencia",
  },
  {
    id: "sc-7",
    nome: "Confirmação de reunião",
    categoria: "agendamento",
    mensagem:
      "Olá {{nome}}! Sua reunião com a equipe da {{empresa}} está confirmada. Nos vemos em breve! Qualquer imprevisto, é só me avisar aqui.",
    textoPrev: "Sua reunião está co...",
    variaveisCount: 4,
    variaveis: ["nome", "empresa", "link", "responsavel"],
    usos: 142,
    ativo: true,
    status: "ativo",
    tipo: "texto",
    criado_em: "2024-03-07T12:00:00Z",
    atualizado_em: "09/03/2024 15:40",
    origem: "referencia",
  },
  {
    id: "sc-8",
    nome: "Pós-atendimento",
    categoria: "atendimento",
    mensagem:
      "Obrigado pelo contato, {{nome}}! Ficamos muito felizes em atendê-lo(a). Em uma escala de 1 a 5, como você avalia nosso suporte?",
    textoPrev: "Obrigado pelo cont...",
    variaveisCount: 3,
    variaveis: ["nome", "empresa", "responsavel"],
    usos: 134,
    ativo: true,
    status: "ativo",
    tipo: "texto",
    criado_em: "2024-03-08T18:00:00Z",
    atualizado_em: "09/03/2024 11:20",
    origem: "referencia",
  },
];

export const KPIS_SCRIPTS_REFERENCIA_PREMIUM: WaScriptsKpis = {
  criados: 128,
  criadosTrend: "+12%",
  usosMes: 2854,
  usosMesTrend: "+28%",
  atendimentos: 342,
  atendimentosTrend: "+18%",
  taxaUtilizacao: "76%",
  taxaUtilizacaoTrend: "+6%",
  avaliacao: "4,8",
  avaliacaoTrend: "+0,3",
};

export const DESEMPENHO_SCRIPTS_REFERENCIA_PREMIUM: WaScriptsDesempenho = {
  usosMes: 2854,
  usosMesTrend: "+28%",
  conversas: 342,
  conversasTrend: "+18%",
  taxaResposta: "76%",
  taxaRespostaTrend: "+6%",
  avaliacao: "4,8",
  avaliacaoTrend: "+0,3",
  pontos: [
    { data: "01/03", usos: 100, conversas: 25, respostas: 12 },
    { data: "05/03", usos: 145, conversas: 38, respostas: 18 },
    { data: "10/03", usos: 130, conversas: 32, respostas: 15 },
    { data: "15/03", usos: 185, conversas: 52, respostas: 26 },
    { data: "20/03", usos: 165, conversas: 45, respostas: 22 },
    { data: "25/03", usos: 198, conversas: 60, respostas: 32 },
    { data: "30/03", usos: 190, conversas: 55, respostas: 28 },
  ],
};

export const SCRIPTS_MAIS_USADOS_PREMIUM: WaScriptMaisUsado[] = [
  {
    rank: 1,
    id: "sc-1",
    nome: "Boas-vindas novo lead",
    categoria: "boas_vindas",
    categoriaLabel: "Boas-vindas",
    usos: 428,
    iconeCor: "emerald",
  },
  {
    rank: 2,
    id: "sc-2",
    nome: "Qualificação inicial",
    categoria: "qualificacao",
    categoriaLabel: "Qualificação",
    usos: 356,
    iconeCor: "blue",
  },
  {
    rank: 3,
    id: "sc-3",
    nome: "Agendar reunião",
    categoria: "agendamento",
    categoriaLabel: "Agendamento",
    usos: 298,
    iconeCor: "purple",
  },
  {
    rank: 4,
    id: "sc-4",
    nome: "Follow-up proposta",
    categoria: "follow_up",
    categoriaLabel: "Follow-up",
    usos: 276,
    iconeCor: "amber",
  },
  {
    rank: 5,
    id: "sc-5",
    nome: "Recuperação de lead",
    categoria: "recuperacao",
    categoriaLabel: "Recuperação",
    usos: 198,
    iconeCor: "red",
  },
];

export const ATIVIDADES_SCRIPTS_PREMIUM: WaScriptAtividadeItem[] = [
  {
    id: "act-sc-1",
    titulo: "Script atualizado",
    scriptNome: "Boas-vindas novo lead",
    horario: "Hoje 14:32",
    tipo: "atualizado",
    cor: "green",
  },
  {
    id: "act-sc-2",
    titulo: "Novo script criado",
    scriptNome: "Pós-atendimento",
    horario: "Hoje 11:18",
    tipo: "criado",
    cor: "blue",
  },
  {
    id: "act-sc-3",
    titulo: "Variável adicionada",
    scriptNome: "Qualificação inicial",
    horario: "Hoje 10:45",
    tipo: "variavel",
    cor: "cyan",
  },
  {
    id: "act-sc-4",
    titulo: "Script desativado",
    scriptNome: "Recuperação de lead",
    horario: "Ontem 16:20",
    tipo: "desativado",
    cor: "red",
  },
  {
    id: "act-sc-5",
    titulo: "Script ativado",
    scriptNome: "Transferência humana",
    horario: "Ontem 13:15",
    tipo: "ativado",
    cor: "blue",
  },
  {
    id: "act-sc-6",
    titulo: "Categoria alterada",
    scriptNome: "Agendar reunião",
    horario: "Ontem 09:42",
    tipo: "categoria",
    cor: "purple",
  },
];

const localStorageWaScripts = (orgId: string) => `flow_wa_scripts_meta_v1.${orgId}`;

export function extrairVariaveis(texto: string): { lista: string[]; count: number } {
  if (!texto) return { lista: [], count: 0 };
  const matches = texto.match(/\{\{\s*(\w+)\s*\}\}/g);
  if (!matches) return { lista: [], count: 0 };
  const unicas = Array.from(new Set(matches.map((m) => m.replace(/[{}\s]/g, ""))));
  return { lista: unicas, count: unicas.length };
}

export function listarScriptsLocais(orgId: string): WaScriptItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(localStorageWaScripts(orgId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Falha ao ler scripts locais", error);
    return [];
  }
}

export function salvarScriptsLocais(orgId: string, itens: WaScriptItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(localStorageWaScripts(orgId), JSON.stringify(itens));
  } catch (err) {
    console.error("Falha ao salvar scripts locais:", err);
  }
}

export async function salvarScriptWa(s: Partial<WaScriptItem>): Promise<WaScriptItem> {
  const context = await requireWhatsappAdministrator();
  const lista = listarScriptsLocais(context.orgId);
  const agora = new Date();
  const dataFormatada = `${String(agora.getDate()).padStart(2, "0")}/${String(
    agora.getMonth() + 1,
  ).padStart(2, "0")}/${agora.getFullYear()} ${String(agora.getHours()).padStart(
    2,
    "0",
  )}:${String(agora.getMinutes()).padStart(2, "0")}`;

  const { lista: vars, count: varsCount } = extrairVariaveis(s.mensagem || "");

  let dbId = s.id;
  if (s.id && !s.id.startsWith("sc-")) {
    const { error } = await supabase
      .from("wa_scripts")
      .update({
        nome: s.nome?.trim(),
        mensagem: s.mensagem ?? null,
        tipo: s.tipo ?? "texto",
      })
      .eq("id", s.id)
      .eq("org_id", context.orgId);
    if (error) throw error;
  } else {
    const { data: novoDb, error } = await supabase
      .from("wa_scripts")
      .insert({
        user_id: context.userId,
        org_id: context.orgId,
        nome: s.nome?.trim() || "Novo Script",
        mensagem: s.mensagem ?? null,
        tipo: s.tipo ?? "texto",
      })
      .select("id")
      .single();
    if (error) throw error;
    if (novoDb?.id) dbId = novoDb.id;
  }

  if (s.id) {
    const index = lista.findIndex((item) => item.id === s.id);
    if (index >= 0) {
      const atualizado: WaScriptItem = {
        ...lista[index],
        ...s,
        variaveis: vars,
        variaveisCount: varsCount,
        textoPrev: (s.mensagem || lista[index].mensagem).substring(0, 22) + "...",
        atualizado_em: dataFormatada,
      };
      lista[index] = atualizado;
      salvarScriptsLocais(context.orgId, lista);
      return atualizado;
    }
  }

  const novo: WaScriptItem = {
    id: dbId || `sc-${Date.now()}`,
    nome: s.nome || "Novo Script",
    categoria: s.categoria || "boas_vindas",
    mensagem: s.mensagem || "",
    textoPrev: (s.mensagem || "").substring(0, 22) + "...",
    variaveisCount: varsCount,
    variaveis: vars,
    usos: s.usos || 0,
    ativo: s.ativo ?? true,
    status: s.status || ((s.ativo ?? true) ? "ativo" : "inativo"),
    tipo: s.tipo || "texto",
    criado_em: new Date().toISOString(),
    atualizado_em: dataFormatada,
    origem: "custom",
  };

  const novaLista = [novo, ...lista];
  salvarScriptsLocais(context.orgId, novaLista);
  return novo;
}

export async function alternarStatusScriptWa(
  id: string,
  ativo: boolean,
): Promise<{ ok: boolean; status: WaScriptStatus }> {
  const context = await requireWhatsappAdministrator();
  const lista = listarScriptsLocais(context.orgId);
  const index = lista.findIndex((s) => s.id === id);
  if (index < 0) return { ok: false, status: "inativo" };

  const novoStatus: WaScriptStatus = ativo ? "ativo" : "inativo";
  lista[index].ativo = ativo;
  lista[index].status = novoStatus;
  salvarScriptsLocais(context.orgId, lista);

  return { ok: true, status: novoStatus };
}

export async function excluirScriptWa(id: string): Promise<boolean> {
  const context = await requireWhatsappAdministrator();
  const lista = listarScriptsLocais(context.orgId);
  const novaLista = lista.filter((s) => s.id !== id);
  salvarScriptsLocais(context.orgId, novaLista);

  if (!id.startsWith("sc-")) {
    const { error } = await supabase
      .from("wa_scripts")
      .delete()
      .eq("id", id)
      .eq("org_id", context.orgId);
    if (error) throw error;
  }
  return true;
}

export async function duplicarScriptWa(id: string): Promise<WaScriptItem | null> {
  const context = await requireWhatsappAdministrator();
  const lista = listarScriptsLocais(context.orgId);
  const original = lista.find((s) => s.id === id);
  if (!original) return null;

  return salvarScriptWa({
    ...original,
    id: undefined,
    nome: `${original.nome} (Cópia)`,
    usos: 0,
    ativo: true,
    status: "ativo",
  });
}

export async function obterDadosScriptsWa(): Promise<{
  scripts: WaScriptItem[];
  kpis: WaScriptsKpis;
  desempenho: WaScriptsDesempenho;
  maisUsados: WaScriptMaisUsado[];
  atividades: WaScriptAtividadeItem[];
  conectado: boolean;
}> {
  const context = await activeWhatsappOrganization();
  let scripts = listarScriptsLocais(context.orgId);

  // Buscar scripts do Supabase para unificar
  try {
    const { data: dbScripts } = await supabase
      .from("wa_scripts")
      .select("id, nome, tipo, mensagem, media_url, criado_em")
      .eq("org_id", context.orgId)
      .order("criado_em", { ascending: false });

    if (dbScripts && dbScripts.length > 0) {
      // Mesclar sem duplicar IDs
      const mapDb = new Map(dbScripts.map((s) => [s.id, s]));
      const mesclados = scripts.map((local) => {
        const fromDb = mapDb.get(local.id);
        if (fromDb) {
          const { lista: v, count: c } = extrairVariaveis(fromDb.mensagem || "");
          return {
            ...local,
            nome: fromDb.nome || local.nome,
            mensagem: fromDb.mensagem || local.mensagem,
            tipo: fromDb.tipo || local.tipo,
            media_url: fromDb.media_url,
            variaveis: v,
            variaveisCount: c,
          };
        }
        return local;
      });

      // Adicionar novos do banco que não estavam no local
      for (const d of dbScripts) {
        if (!scripts.some((l) => l.id === d.id)) {
          const { lista: v, count: c } = extrairVariaveis(d.mensagem || "");
          mesclados.push({
            id: d.id,
            nome: d.nome || "Script Sem Nome",
            categoria: "atendimento",
            mensagem: d.mensagem || "",
            textoPrev: (d.mensagem || "").substring(0, 22) + "...",
            variaveisCount: c,
            variaveis: v,
            usos: 1,
            ativo: true,
            status: "ativo",
            tipo: d.tipo || "texto",
            media_url: d.media_url,
            criado_em: d.criado_em,
            origem: "db",
          });
        }
      }
      scripts = mesclados;
    }
  } catch (error) {
    console.error("Falha ao carregar scripts WhatsApp", error);
    throw error;
  }

  let conectado = false;
  try {
    const { data: chips } = await supabase
      .from("wa_instancias")
      .select("id, status")
      .eq("org_id", context.orgId);
    if (chips && chips.length > 0) {
      conectado = chips.some((c) => c.status === "conectado");
    }
  } catch (error) {
    console.error("Falha ao consultar conexão dos scripts WhatsApp", error);
  }

  return {
    scripts,
    kpis: {
      criados: scripts.length,
      criadosTrend: "—",
      usosMes: 0,
      usosMesTrend: "—",
      atendimentos: 0,
      atendimentosTrend: "—",
      taxaUtilizacao: "0%",
      taxaUtilizacaoTrend: "—",
      avaliacao: "—",
      avaliacaoTrend: "—",
    },
    desempenho: {
      usosMes: 0,
      usosMesTrend: "—",
      conversas: 0,
      conversasTrend: "—",
      taxaResposta: "0%",
      taxaRespostaTrend: "—",
      avaliacao: "—",
      avaliacaoTrend: "—",
      pontos: [],
    },
    maisUsados: [],
    atividades: [],
    conectado,
  };
}

// ==============================================================================
// TELA 07 — RELATÓRIOS E INTELIGÊNCIA WHATSAPP PREMIUM (PROMPT 62)
// Modelos de dados, benchmarks homologados e serviços de agregação multi-tenant
// ==============================================================================

export interface WaRelatoriosKpis {
  mensagensEnviadas: number;
  enviadasTrend: string;
  entregues: number;
  taxaEntrega: string;
  respostas: number;
  taxaResposta: string;
  respostasTrend: string;
  leadsGerados: number;
  leadsTrend: string;
  vendasAtribuidas: number;
  vendasTrend: string;
}

export interface WaDesempenhoPonto {
  data: string;
  label: string;
  enviadas: number;
  entregues: number;
  respostas: number;
  leads: number;
}

export interface WaDistribuicaoCanal {
  canal: string;
  percentual: number;
  quantidade: number;
  cor: string;
}

export interface WaDesempenhoNumero {
  id: string;
  nome: string;
  numero: string;
  enviadas: number;
  entregues: number;
  respostas: number;
  leads: number;
  taxaResposta: number;
  cor: string;
}

export interface WaTipoConversa {
  tipo: string;
  percentual: number;
  quantidade: number;
  cor: string;
  corBarra: string;
}

export interface WaStatusConversa {
  status: string;
  percentual: number;
  quantidade: number;
  cor: string;
}

export interface WaPalavraChave {
  ranking: number;
  palavra: string;
  frequencia: number;
  percentual: number;
}

export interface WaLeadsDiaPonto {
  data: string;
  label: string;
  leads: number;
}

export interface WaVendasDiaPonto {
  data: string;
  label: string;
  valor: number;
}

export interface WaRelatorioAtividade {
  id: string;
  tipo: "lead" | "venda" | "resposta" | "concluida" | "automacao" | "falha";
  titulo: string;
  subtitulo: string;
  horario: string;
  cor: string;
}

export interface WaRelatoriosFiltros {
  periodo: string;
  numeroId: string;
  tipoOrigem: string;
  categoria: string;
  statusConversa: string;
}

export interface WaRelatoriosData {
  kpis: WaRelatoriosKpis;
  desempenhoGeral: WaDesempenhoPonto[];
  distribuicaoCanal: WaDistribuicaoCanal[];
  desempenhoNumeros: WaDesempenhoNumero[];
  tiposConversas: WaTipoConversa[];
  statusConversas: WaStatusConversa[];
  palavrasChave: WaPalavraChave[];
  leadsPorDia: WaLeadsDiaPonto[];
  conversoesVendas: WaVendasDiaPonto[];
  atividades: WaRelatorioAtividade[];
  conectado: boolean;
}

// Constantes oficiais do layout aprovado pelo proprietário (Prompt 62)
export const KPIS_RELATORIOS_PREMIUM: WaRelatoriosKpis = {
  mensagensEnviadas: 12843,
  enviadasTrend: "+22% ↗",
  entregues: 11926,
  taxaEntrega: "92,8% ↗",
  respostas: 2184,
  taxaResposta: "17,9%",
  respostasTrend: "+6% ↗",
  leadsGerados: 674,
  leadsTrend: "+28% ↗",
  vendasAtribuidas: 18450,
  vendasTrend: "+34% ↗",
};

export const DESEMPENHO_GERAL_PREMIUM: WaDesempenhoPonto[] = [
  { data: "2024-03-01", label: "01/03", enviadas: 480, entregues: 440, respostas: 190, leads: 50 },
  { data: "2024-03-05", label: "05/03", enviadas: 920, entregues: 850, respostas: 320, leads: 95 },
  {
    data: "2024-03-10",
    label: "10/03",
    enviadas: 1450,
    entregues: 1380,
    respostas: 490,
    leads: 140,
  },
  {
    data: "2024-03-15",
    label: "15/03",
    enviadas: 1320,
    entregues: 1210,
    respostas: 440,
    leads: 130,
  },
  {
    data: "2024-03-20",
    label: "20/03",
    enviadas: 1680,
    entregues: 1540,
    respostas: 590,
    leads: 180,
  },
  {
    data: "2024-03-25",
    label: "25/03",
    enviadas: 1520,
    entregues: 1420,
    respostas: 530,
    leads: 165,
  },
  {
    data: "2024-03-30",
    label: "30/03",
    enviadas: 1750,
    entregues: 1620,
    respostas: 620,
    leads: 195,
  },
];

export const DISTRIBUICAO_CANAL_PREMIUM: WaDistribuicaoCanal[] = [
  { canal: "Campanhas", percentual: 38, quantidade: 834, cor: "#22c55e" },
  { canal: "Conversas", percentual: 26, quantidade: 568, cor: "#3b82f6" },
  { canal: "Automações", percentual: 18, quantidade: 393, cor: "#a855f7" },
  { canal: "Indicação", percentual: 10, quantidade: 219, cor: "#f97316" },
  { canal: "Outros", percentual: 8, quantidade: 170, cor: "#06b6d4" },
];

export const DESEMPENHO_NUMEROS_PREMIUM: WaDesempenhoNumero[] = [
  {
    id: "chip-1",
    nome: "Chip Principal",
    numero: "+55 11 98765-4321",
    enviadas: 4321,
    entregues: 4021,
    respostas: 892,
    leads: 276,
    taxaResposta: 20.6,
    cor: "#22c55e",
  },
  {
    id: "chip-2",
    nome: "Chip Comercial",
    numero: "+55 11 91234-5678",
    enviadas: 3218,
    entregues: 2984,
    respostas: 568,
    leads: 152,
    taxaResposta: 17.6,
    cor: "#3b82f6",
  },
  {
    id: "chip-3",
    nome: "Chip Suporte",
    numero: "+55 11 99876-5432",
    enviadas: 2456,
    entregues: 2284,
    respostas: 421,
    leads: 118,
    taxaResposta: 17.1,
    cor: "#a855f7",
  },
  {
    id: "chip-4",
    nome: "Chip Reserva",
    numero: "+55 11 93333-1122",
    enviadas: 1462,
    entregues: 1286,
    respostas: 203,
    leads: 64,
    taxaResposta: 13.9,
    cor: "#f97316",
  },
  {
    id: "chip-5",
    nome: "Chip Contingência",
    numero: "+55 11 94444-8899",
    enviadas: 1386,
    entregues: 1351,
    respostas: 100,
    leads: 64,
    taxaResposta: 7.2,
    cor: "#10b981",
  },
];

export const TIPOS_CONVERSAS_PREMIUM: WaTipoConversa[] = [
  { tipo: "Prospecção", percentual: 42, quantidade: 5392, cor: "#3b82f6", corBarra: "#22c55e" },
  { tipo: "Follow-up", percentual: 24, quantidade: 3081, cor: "#eab308", corBarra: "#22c55e" },
  { tipo: "Qualificação", percentual: 14, quantidade: 1782, cor: "#a855f7", corBarra: "#3b82f6" },
  { tipo: "Suporte", percentual: 10, quantidade: 1283, cor: "#f97316", corBarra: "#3b82f6" },
  { tipo: "Agendamento", percentual: 6, quantidade: 770, cor: "#eab308", corBarra: "#eab308" },
  { tipo: "Recuperação", percentual: 4, quantidade: 515, cor: "#06b6d4", corBarra: "#64748b" },
];

export const STATUS_CONVERSAS_PREMIUM: WaStatusConversa[] = [
  { status: "Em atendimento", percentual: 38, quantidade: 542, cor: "#22c55e" },
  { status: "Aguardando resposta", percentual: 32, quantidade: 456, cor: "#3b82f6" },
  { status: "Concluídas", percentual: 20, quantidade: 285, cor: "#a855f7" },
  { status: "Arquivadas", percentual: 10, quantidade: 145, cor: "#64748b" },
];

export const PALAVRAS_CHAVE_PREMIUM: WaPalavraChave[] = [
  { ranking: 1, palavra: "preço", frequencia: 428, percentual: 12 },
  { ranking: 2, palavra: "orçamento", frequencia: 356, percentual: 10 },
  { ranking: 3, palavra: "reunião", frequencia: 298, percentual: 8 },
  { ranking: 4, palavra: "proposta", frequencia: 276, percentual: 8 },
  { ranking: 5, palavra: "contrato", frequencia: 234, percentual: 6 },
];

export const LEADS_POR_DIA_PREMIUM: WaLeadsDiaPonto[] = [
  { data: "2024-03-01", label: "01/03", leads: 18 },
  { data: "2024-03-02", label: "02/03", leads: 14 },
  { data: "2024-03-03", label: "03/03", leads: 22 },
  { data: "2024-03-04", label: "04/03", leads: 28 },
  { data: "2024-03-05", label: "05/03", leads: 32 },
  { data: "2024-03-06", label: "06/03", leads: 26 },
  { data: "2024-03-07", label: "07/03", leads: 35 },
  { data: "2024-03-08", label: "08/03", leads: 40 },
  { data: "2024-03-09", label: "09/03", leads: 19 },
  { data: "2024-03-10", label: "10/03", leads: 38 },
  { data: "2024-03-11", label: "11/03", leads: 42 },
  { data: "2024-03-12", label: "12/03", leads: 29 },
  { data: "2024-03-13", label: "13/03", leads: 34 },
  { data: "2024-03-14", label: "14/03", leads: 31 },
  { data: "2024-03-15", label: "15/03", leads: 27 },
  { data: "2024-03-16", label: "16/03", leads: 24 },
  { data: "2024-03-17", label: "17/03", leads: 30 },
  { data: "2024-03-18", label: "18/03", leads: 33 },
  { data: "2024-03-19", label: "19/03", leads: 25 },
  { data: "2024-03-20", label: "20/03", leads: 36 },
  { data: "2024-03-21", label: "21/03", leads: 28 },
  { data: "2024-03-22", label: "22/03", leads: 22 },
  { data: "2024-03-23", label: "23/03", leads: 29 },
  { data: "2024-03-24", label: "24/03", leads: 31 },
  { data: "2024-03-25", label: "25/03", leads: 35 },
  { data: "2024-03-26", label: "26/03", leads: 27 },
  { data: "2024-03-27", label: "27/03", leads: 32 },
  { data: "2024-03-28", label: "28/03", leads: 39 },
  { data: "2024-03-29", label: "29/03", leads: 41 },
  { data: "2024-03-30", label: "30/03", leads: 45 },
];

export const CONVERSOES_VENDAS_PREMIUM: WaVendasDiaPonto[] = [
  { data: "2024-03-01", label: "01/03", valor: 450 },
  { data: "2024-03-02", label: "02/03", valor: 300 },
  { data: "2024-03-03", label: "03/03", valor: 650 },
  { data: "2024-03-04", label: "04/03", valor: 850 },
  { data: "2024-03-05", label: "05/03", valor: 1200 },
  { data: "2024-03-06", label: "06/03", valor: 750 },
  { data: "2024-03-07", label: "07/03", valor: 1100 },
  { data: "2024-03-08", label: "08/03", valor: 1450 },
  { data: "2024-03-09", label: "09/03", valor: 500 },
  { data: "2024-03-10", label: "10/03", valor: 1800 },
  { data: "2024-03-11", label: "11/03", valor: 950 },
  { data: "2024-03-12", label: "12/03", valor: 800 },
  { data: "2024-03-13", label: "13/03", valor: 650 },
  { data: "2024-03-14", label: "14/03", valor: 900 },
  { data: "2024-03-15", label: "15/03", valor: 1250 },
  { data: "2024-03-16", label: "16/03", valor: 600 },
  { data: "2024-03-17", label: "17/03", valor: 850 },
  { data: "2024-03-18", label: "18/03", valor: 1150 },
  { data: "2024-03-19", label: "19/03", valor: 700 },
  { data: "2024-03-20", label: "20/03", valor: 1350 },
  { data: "2024-03-21", label: "21/03", valor: 900 },
  { data: "2024-03-22", label: "22/03", valor: 800 },
  { data: "2024-03-23", label: "23/03", valor: 1050 },
  { data: "2024-03-24", label: "24/03", valor: 1200 },
  { data: "2024-03-25", label: "25/03", valor: 1400 },
  { data: "2024-03-26", label: "26/03", valor: 850 },
  { data: "2024-03-27", label: "27/03", valor: 950 },
  { data: "2024-03-28", label: "28/03", valor: 1600 },
  { data: "2024-03-29", label: "29/03", valor: 1900 },
  { data: "2024-03-30", label: "30/03", valor: 2150 },
];

export const ATIVIDADES_RELATORIOS_PREMIUM: WaRelatorioAtividade[] = [
  {
    id: "atv-1",
    tipo: "lead",
    titulo: "Novo lead gerado",
    subtitulo: "via campanha de prospecção",
    horario: "14:32",
    cor: "#22c55e",
  },
  {
    id: "atv-2",
    tipo: "venda",
    titulo: "Venda atribuída",
    subtitulo: "R$ 1.250 - Prospecção SP",
    horario: "13:45",
    cor: "#3b82f6",
  },
  {
    id: "atv-3",
    tipo: "resposta",
    titulo: "Resposta recebida",
    subtitulo: "Qualificação automática",
    horario: "12:18",
    cor: "#a855f7",
  },
  {
    id: "atv-4",
    tipo: "concluida",
    titulo: "Conversa concluída",
    subtitulo: "Cliente atendido",
    horario: "11:06",
    cor: "#22c55e",
  },
  {
    id: "atv-5",
    tipo: "automacao",
    titulo: "Nova automação executada",
    subtitulo: "Boas-vindas novos leads",
    horario: "10:24",
    cor: "#3b82f6",
  },
  {
    id: "atv-6",
    tipo: "falha",
    titulo: "Falha no envio",
    subtitulo: "Chip Reserva indisponível",
    horario: "09:15",
    cor: "#ef4444",
  },
];

/**
 * Consulta e agrega os dados reais de relatórios e inteligência do WhatsApp
 * respeitando estritamente a organização ativa e RLS no PostgreSQL.
 */
export async function obterDadosRelatoriosWa(
  filtros?: Partial<WaRelatoriosFiltros>,
): Promise<WaRelatoriosData> {
  const context = await activeWhatsappOrganization();
  const [chipsDb, enviosRes, mensagensRes, propostasRes] = await Promise.all([
    listarChips(),
    supabase
      .from("wa_envios")
      .select("instancia_id, campanha_id, lead_id, enviado_em")
      .eq("org_id", context.orgId)
      .order("enviado_em", { ascending: true })
      .limit(5000),
    supabase
      .from("wa_mensagens")
      .select("id, instancia_id, lead_id, direcao, criado_em, texto")
      .eq("org_id", context.orgId)
      .order("criado_em", { ascending: true })
      .limit(5000),
    supabase.from("propostas").select("valor, status, campanha_id").eq("org_id", context.orgId),
  ]);
  if (enviosRes.error) throw enviosRes.error;
  if (mensagensRes.error) throw mensagensRes.error;
  if (propostasRes.error) throw propostasRes.error;

  const selectedInstance =
    filtros?.numeroId && filtros.numeroId !== "todos" ? filtros.numeroId : null;
  const envios = (enviosRes.data ?? []).filter(
    (row) => !selectedInstance || row.instancia_id === selectedInstance,
  );
  const mensagens = (mensagensRes.data ?? []).filter(
    (row) => !selectedInstance || row.instancia_id === selectedInstance,
  );
  const recebidas = mensagens.filter((row) => row.direcao === "in");
  const leadIds = new Set(recebidas.map((row) => row.lead_id).filter(Boolean));
  const campaignIds = new Set(envios.map((row) => row.campanha_id).filter(Boolean));
  const vendasAtribuidas = (propostasRes.data ?? [])
    .filter(
      (proposal) =>
        proposal.campanha_id &&
        campaignIds.has(proposal.campanha_id) &&
        ["aprovada", "ganha", "paga"].includes(proposal.status),
    )
    .reduce((sum, proposal) => sum + (Number(proposal.valor) || 0), 0);

  const sentByInstance = new Map<string, number>();
  const repliesByInstance = new Map<string, number>();
  const leadsByInstance = new Map<string, Set<string>>();
  for (const row of envios) {
    if (!row.instancia_id) continue;
    sentByInstance.set(row.instancia_id, (sentByInstance.get(row.instancia_id) ?? 0) + 1);
  }
  for (const row of recebidas) {
    if (!row.instancia_id) continue;
    repliesByInstance.set(row.instancia_id, (repliesByInstance.get(row.instancia_id) ?? 0) + 1);
    if (row.lead_id) {
      const ids = leadsByInstance.get(row.instancia_id) ?? new Set<string>();
      ids.add(row.lead_id);
      leadsByInstance.set(row.instancia_id, ids);
    }
  }
  const desempenhoNumeros: WaDesempenhoNumero[] = chipsDb
    .filter((chip) => !selectedInstance || chip.id === selectedInstance)
    .map((chip) => {
      const enviadas = sentByInstance.get(chip.id) ?? 0;
      const respostas = repliesByInstance.get(chip.id) ?? 0;
      return {
        id: chip.id,
        nome: chip.nome,
        numero: chip.numero ?? "—",
        enviadas,
        entregues: 0,
        respostas,
        leads: leadsByInstance.get(chip.id)?.size ?? 0,
        taxaResposta: enviadas > 0 ? (respostas / enviadas) * 100 : 0,
        cor: "emerald",
      };
    });

  const daily = new Map<string, WaDesempenhoPonto>();
  const ensureDay = (iso: string) => {
    const date = iso.slice(0, 10);
    const existing = daily.get(date);
    if (existing) return existing;
    const point = {
      data: date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      enviadas: 0,
      entregues: 0,
      respostas: 0,
      leads: 0,
    };
    daily.set(date, point);
    return point;
  };
  for (const row of envios) ensureDay(row.enviado_em).enviadas += 1;
  const leadsPerDay = new Map<string, Set<string>>();
  for (const row of recebidas) {
    const point = ensureDay(row.criado_em);
    point.respostas += 1;
    if (row.lead_id) {
      const ids = leadsPerDay.get(point.data) ?? new Set<string>();
      ids.add(row.lead_id);
      leadsPerDay.set(point.data, ids);
      point.leads = ids.size;
    }
  }
  const desempenhoGeral = [...daily.values()].sort((a, b) => a.data.localeCompare(b.data));
  const leadsPorDia = desempenhoGeral.map((point) => ({
    data: point.data,
    label: point.label,
    leads: point.leads,
  }));
  const conversoesVendas = desempenhoGeral.map((point) => ({
    data: point.data,
    label: point.label,
    valor: 0,
  }));

  return {
    kpis: {
      mensagensEnviadas: envios.length,
      enviadasTrend: "—",
      entregues: 0,
      taxaEntrega: "Dados insuficientes",
      respostas: recebidas.length,
      taxaResposta:
        envios.length > 0 ? `${((recebidas.length / envios.length) * 100).toFixed(1)}%` : "0%",
      respostasTrend: "—",
      leadsGerados: leadIds.size,
      leadsTrend: "—",
      vendasAtribuidas,
      vendasTrend: "—",
    },
    desempenhoGeral,
    distribuicaoCanal: [],
    desempenhoNumeros,
    tiposConversas: [],
    statusConversas: [],
    palavrasChave: [],
    leadsPorDia,
    conversoesVendas,
    atividades: recebidas
      .slice(-6)
      .reverse()
      .map((message) => ({
        id: message.id,
        tipo: "resposta" as const,
        titulo: "Resposta recebida",
        subtitulo: message.texto?.slice(0, 80) || "Mensagem recebida",
        horario: new Date(message.criado_em).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        cor: "#a855f7",
      })),
    conectado: chipsDb.some((chip) => chip.status === "conectado"),
  };
}
