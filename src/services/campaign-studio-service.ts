import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type {
  StudioCampaignDraft,
  StudioEmailBlock,
  StudioRecipient,
  StudioValidationResult,
} from "@/types/campaign-studio";
import {
  DEFAULT_SIGNATURE_DATA,
  OFFICIAL_CORPORATE_SIGNATURES,
  OFFICIAL_EMAIL_TEMPLATES,
  renderSignatureHtml,
} from "@/components/campanhas-premium/templates/templates-data";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import { throwPersistenceError } from "@/lib/persistence-errors";
import {
  loadStudioLists,
  type SimpleStudioListItem,
  type StudioListRepository,
} from "@/lib/campaign-studio-lists";
import { obterAssinaturaPadraoOrg, obterContextoOrgAtiva } from "./templates-service";

export type SimpleListaItem = SimpleStudioListItem;
export interface StudioLeadOption {
  id: string;
  nome: string;
  email: string | null;
  elegibilidade: "sem_email" | "nao_validado" | "descadastro";
}

const blockSchema = z.object({
  id: z.string(),
  tipo: z.enum(["cabecalho", "mensagem", "cta", "rodape", "texto", "botao", "imagem", "separador"]),
  titulo: z.string(),
  subtitulo: z.string(),
  conteudoHtml: z.string().nullable().optional(),
  conteudoTexto: z.string().nullable().optional(),
  ctaTexto: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  imagemUrl: z.string().nullable().optional(),
  ativo: z.boolean(),
});
const filtersSchema = z.object({
  comEmail: z.boolean(),
  qualificados: z.boolean(),
  novosLeads: z.boolean(),
});
const scheduleSchema = z.object({
  modo: z.enum(["imediato", "agendar"]),
  dataEnvio: z.string(),
  horarioEnvio: z.string(),
  fusoHorario: z.string(),
});
const saveResultSchema = z.object({
  campaignId: z.string().uuid(),
  revision: z.number().int().positive(),
  updatedAt: z.string(),
});

export async function carregarListasEstudio(orgId: string): Promise<SimpleListaItem[]> {
  const activeOrganization = await getActiveOrganizationContext();
  if (activeOrganization.orgId !== orgId)
    throw new Error("A organização solicitada não é a organização ativa.");
  const repository: StudioListRepository = {
    async listLists(scopedOrgId) {
      const { data, error } = await supabase
        .from("lead_lists")
        .select("id, org_id, name, niche, city, uf")
        .eq("org_id", scopedOrgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    async listLeads(scopedOrgId, listIds) {
      const { data, error } = await supabase
        .from("leads")
        .select("list_id, email, score_breakdown")
        .eq("org_id", scopedOrgId)
        .in("list_id", listIds);
      if (error) throw error;
      return data ?? [];
    },
  };
  return loadStudioLists(repository, orgId);
}

export async function listarIdsSelecionaveis(orgId: string, listId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, email, email_opt_out")
    .eq("org_id", orgId)
    .eq("list_id", listId);
  if (error) throw error;
  return (data ?? [])
    .filter((lead) => Boolean(lead.email?.trim()) && !lead.email_opt_out)
    .map((lead) => lead.id);
}

export async function carregarDestinatariosLista(
  orgId: string,
  listId: string,
): Promise<StudioLeadOption[]> {
  const active = await getActiveOrganizationContext();
  if (active.orgId !== orgId)
    throw new Error("A organização solicitada não é a organização ativa.");
  const { data, error } = await supabase
    .from("leads")
    .select("id,business_name,email,email_opt_out")
    .eq("org_id", orgId)
    .eq("list_id", listId)
    .order("business_name");
  if (error) throw error;
  return (data ?? []).map((lead) => ({
    id: lead.id,
    nome: lead.business_name,
    email: lead.email?.trim() || null,
    elegibilidade: !lead.email?.trim()
      ? "sem_email"
      : lead.email_opt_out
        ? "descadastro"
        : "nao_validado",
  }));
}

export async function criarRascunhoInicial(
  orgId: string,
  preselectedListId?: string | null,
): Promise<StudioCampaignDraft> {
  const context = await obterContextoOrgAtiva();
  if (context.orgId !== orgId)
    throw new Error("A organização solicitada não é a organização ativa.");
  const lists = await carregarListasEstudio(orgId);
  const selectedList = preselectedListId
    ? lists.find((list) => list.id === preselectedListId)
    : undefined;
  if (preselectedListId && !selectedList)
    throw new Error("A lista selecionada não existe ou não pertence à organização ativa.");
  if (!selectedList) throw new Error("Selecione uma lista real para iniciar a campanha.");
  const [defaultSignature, selectedLeadIds] = await Promise.all([
    obterAssinaturaPadraoOrg(orgId),
    listarIdsSelecionaveis(orgId, selectedList.id),
  ]);
  const template = OFFICIAL_EMAIL_TEMPLATES[0];
  const officialSignature = OFFICIAL_CORPORATE_SIGNATURES.find(
    (signature) => signature.id === defaultSignature.id,
  );
  const now = new Date().toISOString();
  return {
    id: null,
    revisao: 0,
    orgId,
    userId: context.userId,
    nome: `Nova campanha — ${selectedList.nome}`,
    listaId: selectedList.id,
    listaNome: selectedList.nome,
    totalLeads: selectedList.totalLeads,
    leadsComEmail: selectedList.leadsComEmail,
    leadsQualificados: selectedList.leadsQualificados,
    quantidadeSelecionada: selectedLeadIds.length,
    filtrosEnvio: { comEmail: true, qualificados: true, novosLeads: true },
    leadsIdsSelecionados: selectedLeadIds,
    remetenteNome: context.userName,
    remetenteEmail: context.userEmail,
    responderPara: context.replyToEmail,
    assinaturaId: defaultSignature.id,
    assinaturaNome:
      officialSignature?.nome ?? defaultSignature.nomeModelo ?? defaultSignature.data.nome,
    assinaturaHtmlSnapshot:
      defaultSignature.htmlSeguro ??
      (officialSignature
        ? renderSignatureHtml(officialSignature.htmlTemplate, defaultSignature.data)
        : ""),
    templateId: template.id,
    templateVersao: template.versao ?? "1.0",
    templateNome: template.nome,
    templateHtmlSnapshot: template.conteudoHtml,
    templateConfigSnapshot: {},
    assunto: template.assuntoPadrao,
    preCabecalho: template.preheaderPadrao,
    blocos: [
      {
        id: "bloco-cabecalho",
        tipo: "cabecalho",
        titulo: "Cabeçalho",
        subtitulo: "Logo, banner e introdução",
        ativo: true,
      },
      {
        id: "bloco-mensagem",
        tipo: "mensagem",
        titulo: "Mensagem principal",
        subtitulo: "Texto e conteúdo do e-mail",
        ativo: true,
      },
      { id: "bloco-cta", tipo: "cta", titulo: "CTA", subtitulo: "Botão de ação", ativo: true },
      {
        id: "bloco-rodape",
        tipo: "rodape",
        titulo: "Rodapé",
        subtitulo: "Informações e contato",
        ativo: true,
      },
    ],
    programacao: {
      modo: "imediato",
      dataEnvio: "",
      horarioEnvio: "",
      fusoHorario: "America/Sao_Paulo",
    },
    status: "rascunho",
    criadoEm: now,
    atualizadoEm: now,
  };
}

function blocksToJson(blocks: StudioEmailBlock[]): Json {
  return blocks.map((block) => ({
    id: block.id,
    tipo: block.tipo,
    titulo: block.titulo,
    subtitulo: block.subtitulo,
    conteudoHtml: block.conteudoHtml ?? null,
    conteudoTexto: block.conteudoTexto ?? null,
    ctaTexto: block.ctaTexto ?? null,
    ctaUrl: block.ctaUrl ?? null,
    imagemUrl: block.imagemUrl ?? null,
    ativo: block.ativo,
  }));
}

export async function salvarRascunhoEstudio(
  draft: StudioCampaignDraft,
): Promise<StudioCampaignDraft> {
  if (!draft.listaId) throw new Error("Selecione uma lista antes de salvar.");
  const active = await getActiveOrganizationContext();
  if (active.orgId !== draft.orgId || active.userId !== draft.userId) {
    throw new Error("O rascunho não pertence ao contexto ativo.");
  }
  const payload: Json = {
    nome: draft.nome,
    listaId: draft.listaId,
    status: draft.status,
    templateId: draft.templateId,
    templateVersao: draft.templateVersao,
    templateNome: draft.templateNome,
    templateHtmlSnapshot: draft.templateHtmlSnapshot,
    templateConfigSnapshot: draft.templateConfigSnapshot,
    blocos: blocksToJson(draft.blocos),
    assinaturaId: draft.assinaturaId,
    assinaturaNome: draft.assinaturaNome,
    assinaturaHtmlSnapshot: draft.assinaturaHtmlSnapshot,
    assunto: draft.assunto,
    preCabecalho: draft.preCabecalho,
    remetenteNome: draft.remetenteNome,
    remetenteEmail: draft.remetenteEmail,
    responderPara: draft.responderPara,
    filtrosEnvio: {
      comEmail: draft.filtrosEnvio.comEmail,
      qualificados: draft.filtrosEnvio.qualificados,
      novosLeads: draft.filtrosEnvio.novosLeads,
    },
    programacao: {
      modo: draft.programacao.modo,
      dataEnvio: draft.programacao.dataEnvio,
      horarioEnvio: draft.programacao.horarioEnvio,
      fusoHorario: draft.programacao.fusoHorario,
    },
    leadsIdsSelecionados: draft.leadsIdsSelecionados,
  };
  const { data, error } = await supabase.rpc("salvar_rascunho_estudio", {
    p_org_id: draft.orgId,
    p_campanha_id: draft.id,
    p_revisao_esperada: draft.revisao,
    p_draft: payload,
  });
  if (error) throwPersistenceError(error);
  const saved = saveResultSchema.parse(data);
  return { ...draft, id: saved.campaignId, revisao: saved.revision, atualizadoEm: saved.updatedAt };
}

export async function obterRascunhoEstudio(
  campaignId: string,
  orgId: string,
): Promise<{
  draft: StudioCampaignDraft;
  recipients: StudioRecipient[];
}> {
  const context = await obterContextoOrgAtiva();
  if (context.orgId !== orgId)
    throw new Error("A organização solicitada não é a organização ativa.");
  const [
    { data: campaign, error: campaignError },
    { data: emailDraft, error: draftError },
    { data: recipients, error: recipientsError },
  ] = await Promise.all([
    supabase
      .from("campanhas")
      .select("id,org_id,user_id,list_id,nome,status,criada_em,atualizado_em,revisao")
      .eq("id", campaignId)
      .eq("org_id", orgId)
      .single(),
    supabase
      .from("campanha_email_drafts")
      .select("*")
      .eq("campanha_id", campaignId)
      .eq("org_id", orgId)
      .single(),
    supabase
      .from("campanha_email_destinatarios")
      .select("lead_id,email_snapshot,selecionado,estado_elegibilidade,motivo_exclusao")
      .eq("campanha_id", campaignId)
      .eq("org_id", orgId),
  ]);
  if (campaignError) throwPersistenceError(campaignError);
  if (draftError) throwPersistenceError(draftError);
  if (recipientsError) throwPersistenceError(recipientsError);
  const lists = await carregarListasEstudio(orgId);
  const list = lists.find((item) => item.id === campaign.list_id);
  if (!list) throw new Error("A lista vinculada à campanha não está disponível nesta organização.");
  const blocks = blockSchema
    .array()
    .parse(emailDraft.blocos)
    .map((block) => ({
      ...block,
      conteudoHtml: block.conteudoHtml ?? undefined,
      conteudoTexto: block.conteudoTexto ?? undefined,
      ctaTexto: block.ctaTexto ?? undefined,
      ctaUrl: block.ctaUrl ?? undefined,
      imagemUrl: block.imagemUrl ?? undefined,
    }));
  const selectedIds = (recipients ?? [])
    .filter((recipient) => recipient.selecionado)
    .map((recipient) => recipient.lead_id);
  const draft: StudioCampaignDraft = {
    id: campaign.id,
    revisao: campaign.revisao,
    orgId,
    userId: campaign.user_id,
    nome: campaign.nome,
    listaId: campaign.list_id,
    listaNome: list.nome,
    totalLeads: list.totalLeads,
    leadsComEmail: list.leadsComEmail,
    leadsQualificados: list.leadsQualificados,
    quantidadeSelecionada: selectedIds.length,
    filtrosEnvio: filtersSchema.parse(emailDraft.filtros_envio),
    leadsIdsSelecionados: selectedIds,
    remetenteNome: emailDraft.remetente_nome,
    remetenteEmail: emailDraft.remetente_email,
    responderPara: emailDraft.responder_para,
    assinaturaId: emailDraft.assinatura_id ?? "",
    assinaturaNome: emailDraft.assinatura_nome ?? "",
    assinaturaHtmlSnapshot: emailDraft.assinatura_html_snapshot,
    templateId: emailDraft.template_id,
    templateVersao: emailDraft.template_versao,
    templateNome: emailDraft.template_nome,
    templateHtmlSnapshot: emailDraft.template_html_snapshot,
    templateConfigSnapshot: z
      .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
      .parse(emailDraft.template_config_snapshot),
    assunto: emailDraft.assunto,
    preCabecalho: emailDraft.pre_cabecalho,
    blocos: blocks,
    programacao: scheduleSchema.parse(emailDraft.programacao),
    status: campaign.status === "em_revisao" ? "em_revisao" : "rascunho",
    criadoEm: campaign.criada_em,
    atualizadoEm: campaign.atualizado_em,
  };
  const parsedRecipients: StudioRecipient[] = (recipients ?? []).map((recipient) => ({
    leadId: recipient.lead_id,
    email: recipient.email_snapshot,
    selecionado: recipient.selecionado,
    elegibilidade: z
      .enum([
        "sem_email",
        "nao_validado",
        "elegivel_confirmado",
        "bloqueado",
        "descadastro",
        "reclamacao",
      ])
      .parse(recipient.estado_elegibilidade),
    motivoExclusao: recipient.motivo_exclusao,
  }));
  return { draft, recipients: parsedRecipients };
}

export function validarRascunhoCampanha(draft: StudioCampaignDraft): StudioValidationResult {
  const avisos: string[] = [
    "Os destinatários sem elegibilidade comprovada não poderão ser enviados.",
    "Disparos reais permanecem desativados nesta etapa.",
  ];
  const bloqueios: string[] = [];
  const assuntoPreenchido = draft.assunto.trim().length > 0;
  if (!assuntoPreenchido) bloqueios.push("O assunto do e-mail é obrigatório.");
  const templateAplicado = Boolean(
    draft.templateId && draft.templateNome && draft.templateHtmlSnapshot,
  );
  if (!templateAplicado) bloqueios.push("Selecione um template de e-mail.");
  const assinaturaDefinida = Boolean(draft.assinaturaId);
  if (!assinaturaDefinida) avisos.push("Nenhuma assinatura corporativa selecionada.");
  const destinatariosValidos = draft.leadsIdsSelecionados.length;
  if (destinatariosValidos <= 0) bloqueios.push("Selecione pelo menos um destinatário.");
  const remetenteValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.remetenteEmail);
  if (!remetenteValido) bloqueios.push("O e-mail do remetente é inválido.");
  return {
    assuntoPreenchido,
    templateAplicado,
    assinaturaDefinida,
    destinatariosValidos,
    remetenteValido,
    podeAvancar: bloqueios.length === 0,
    avisos,
    bloqueios,
  };
}
