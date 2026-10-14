import { supabase } from "@/integrations/supabase/client";
import type {
  StudioCampaignDraft,
  StudioFiltrosEnvio,
  StudioValidationResult,
} from "@/types/campaign-studio";
import {
  OFFICIAL_CORPORATE_SIGNATURES,
  OFFICIAL_EMAIL_TEMPLATES,
} from "@/components/campanhas-premium/templates/templates-data";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import {
  loadStudioLists,
  type SimpleStudioListItem,
  type StudioListRepository,
} from "@/lib/campaign-studio-lists";
import { obterAssinaturaPadraoOrg, obterContextoOrgAtiva } from "./templates-service";

export type SimpleListaItem = SimpleStudioListItem;

// Chave isolada por organização para salvar rascunho do estúdio
const STORAGE_ESTUDIO_CURRENT_KEY = (orgId: string) =>
  `flow_business_estudio_draft_current_${orgId}`;
const STORAGE_ESTUDIO_LIST_KEY = (orgId: string) => `flow_business_estudio_drafts_list_${orgId}`;

/**
 * Carrega somente listas e contagens reais da organização ativa.
 */
export async function carregarListasEstudio(orgId: string): Promise<SimpleListaItem[]> {
  const activeOrganization = await getActiveOrganizationContext();
  if (activeOrganization.orgId !== orgId) {
    throw new Error("A organização solicitada não é a organização ativa.");
  }

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

/**
 * Cria o rascunho padrão inicial com os dados idênticos ao layout aprovado do Estúdio.
 */
export async function criarRascunhoInicial(
  orgId: string,
  preselectedListId?: string | null,
): Promise<StudioCampaignDraft> {
  const ctx = await obterContextoOrgAtiva();
  if (ctx.orgId !== orgId) throw new Error("A organização solicitada não é a organização ativa.");
  const listas = await carregarListasEstudio(orgId);

  const listaAtiva = preselectedListId
    ? listas.find((list) => list.id === preselectedListId)
    : listas[0];
  if (!listaAtiva) {
    throw new Error(
      preselectedListId
        ? "A lista selecionada não existe ou não pertence à organização ativa."
        : "Nenhuma lista de leads está disponível para esta organização.",
    );
  }

  const templateBase = OFFICIAL_EMAIL_TEMPLATES[0]; // Apresentação Comercial
  const sigPadrao = obterAssinaturaPadraoOrg(orgId);

  return {
    id: `draft_${Date.now()}`,
    orgId,
    userId: ctx.userId,
    nome: `Nova campanha — ${listaAtiva.nome}`,
    listaId: listaAtiva.id,
    listaNome: listaAtiva.nome,
    totalLeads: listaAtiva.totalLeads,
    leadsComEmail: listaAtiva.leadsComEmail,
    leadsQualificados: listaAtiva.leadsQualificados,
    quantidadeSelecionada: listaAtiva.leadsQualificados,
    filtrosEnvio: {
      comEmail: true,
      qualificados: true,
      novosLeads: true,
    },
    leadsIdsSelecionados: [],
    remetenteNome: ctx.userName,
    remetenteEmail: ctx.userEmail,
    responderPara: ctx.replyToEmail,
    assinaturaId: sigPadrao.id,
    assinaturaNome:
      OFFICIAL_CORPORATE_SIGNATURES.find((signature) => signature.id === sigPadrao.id)?.nome ?? "",
    templateId: templateBase.id,
    templateNome: templateBase.nome,
    assunto: "Uma ideia para aumentar seus resultados em Curitiba",
    preCabecalho: "Oportunidades exclusivas para expandir a captação de clientes.",
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
      {
        id: "bloco-cta",
        tipo: "cta",
        titulo: "CTA",
        subtitulo: "Botão de ação",
        ativo: true,
      },
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
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
}

/**
 * Salva rascunho com isolamento multi-tenant por orgId.
 */
export function salvarRascunhoEstudio(draft: StudioCampaignDraft): StudioCampaignDraft {
  if (typeof window === "undefined") {
    throw new Error("O armazenamento local não está disponível.");
  }
  if (!draft.orgId) throw new Error("O rascunho não possui uma organização válida.");
  const orgId = draft.orgId;
  const updated = {
    ...draft,
    atualizadoEm: new Date().toISOString(),
  };

  localStorage.setItem(STORAGE_ESTUDIO_CURRENT_KEY(orgId), JSON.stringify(updated));

  const listRaw = localStorage.getItem(STORAGE_ESTUDIO_LIST_KEY(orgId));
  const list: StudioCampaignDraft[] = listRaw ? JSON.parse(listRaw) : [];
  const idx = list.findIndex((item) => item.id === draft.id);
  if (idx >= 0) {
    list[idx] = updated;
  } else {
    list.unshift(updated);
  }
  localStorage.setItem(STORAGE_ESTUDIO_LIST_KEY(orgId), JSON.stringify(list.slice(0, 20)));
  return updated;
}

/**
 * Recupera o último rascunho salvo da organização ativa.
 */
export function obterUltimoRascunhoEstudio(orgId: string): StudioCampaignDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_ESTUDIO_CURRENT_KEY(orgId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error("Falha ao recuperar o rascunho local:", error);
  }
  return null;
}

/**
 * Validação rigorosa dos pré-requisitos antes de avançar para a revisão.
 */
export function validarRascunhoCampanha(draft: StudioCampaignDraft): StudioValidationResult {
  const avisos: string[] = [];
  const bloqueios: string[] = [];

  const assuntoPreenchido = draft.assunto.trim().length > 0;
  if (!assuntoPreenchido) {
    bloqueios.push("O assunto do e-mail é obrigatório.");
  }

  const templateAplicado = Boolean(draft.templateId && draft.templateNome);
  if (!templateAplicado) {
    bloqueios.push("Selecione um template de e-mail.");
  }

  const assinaturaDefinida = Boolean(draft.assinaturaId);
  if (!assinaturaDefinida) {
    avisos.push("Nenhuma assinatura corporativa selecionada.");
  }

  const destinatariosValidos = draft.quantidadeSelecionada;
  if (destinatariosValidos <= 0) {
    bloqueios.push("Selecione uma lista com pelo menos 1 lead elegível com e-mail.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const remetenteValido = emailRegex.test(draft.remetenteEmail);
  if (!remetenteValido) {
    bloqueios.push("O e-mail do remetente é inválido.");
  }

  // Aviso explícito sobre integração Resend (Prompt 52)
  avisos.push("Disparos reais e homologação de domínio Resend serão ativados no Prompt 52.");

  const podeAvancar = bloqueios.length === 0;

  return {
    assuntoPreenchido,
    templateAplicado,
    assinaturaDefinida,
    destinatariosValidos,
    remetenteValido,
    podeAvancar,
    avisos,
    bloqueios,
  };
}
