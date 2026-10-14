import { supabase } from "@/integrations/supabase/client";
import type {
  CampaignTemplateContract,
  CorporateSignatureItem,
  CustomTemplateItem,
  EmailTemplateItem,
  SignatureData,
  TemplateVariables,
} from "@/types/templates";
import {
  DEFAULT_SIGNATURE_DATA,
  OFFICIAL_CORPORATE_SIGNATURES,
  OFFICIAL_EMAIL_TEMPLATES,
  interpolateVariables,
  renderSignatureHtml,
} from "@/components/campanhas-premium/templates/templates-data";

/**
 * Obter identificadores de autenticação e organização ativa para isolamento multi-tenant estrito.
 */
export async function obterContextoOrgAtiva(): Promise<{
  userId: string;
  orgId: string;
  userName: string;
  userEmail: string;
  companyName: string;
  phone: string;
  replyToEmail: string;
  avatarUrl: string;
}> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id || "anon-user";
  const userEmail = authData.user?.email || "contato@flowbusiness.com.br";

  let orgId = userId;
  let userName = "Marcos Gonçalves";
  let companyName = "Flow Business";
  let phone = "+55 11 98765-4321";
  let replyToEmail = userEmail;
  let avatarUrl = "";

  try {
    const [{ data: perfil }, { data: membership }] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone, avatar_url, reply_to_email, company_name")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("memberships").select("org_id").eq("user_id", userId).maybeSingle(),
    ]);

    if (perfil) {
      if (perfil.full_name) userName = perfil.full_name.trim();
      if (perfil.company_name) companyName = perfil.company_name.trim();
      if (perfil.phone) phone = perfil.phone.trim();
      if (perfil.reply_to_email) replyToEmail = perfil.reply_to_email.trim();
      if (perfil.avatar_url) avatarUrl = perfil.avatar_url.trim();
    }

    if (membership?.org_id) {
      orgId = membership.org_id;
    }
  } catch (err) {
    console.warn(
      "Não foi possível carregar perfil completo da org, usando dados padrão autorizados:",
      err,
    );
  }

  return {
    userId,
    orgId,
    userName,
    userEmail,
    companyName,
    phone,
    replyToEmail,
    avatarUrl,
  };
}

/**
 * Carrega as variáveis de organização para autopreenchimento de templates.
 */
export async function carregarVariaveisOrganizacao(): Promise<TemplateVariables> {
  const ctx = await obterContextoOrgAtiva();
  return {
    nome_remetente: ctx.userName,
    empresa_remetente: ctx.companyName,
    telefone_remetente: ctx.phone,
    site_remetente: "https://flowbusiness.com.br",
  };
}

// Chaves de armazenamento isoladas por Organização
const STORAGE_FAVORITOS_KEY = (orgId: string) => `flow_business_templates_favoritos_${orgId}`;
const STORAGE_CUSTOM_TEMPLATES_KEY = (orgId: string) => `flow_business_templates_custom_${orgId}`;
const STORAGE_DEFAULT_SIGNATURE_KEY = (orgId: string) => `flow_business_signature_default_${orgId}`;

/**
 * Listar IDs dos templates favoritados pela organização.
 */
export function listarFavoritosOrg(orgId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_FAVORITOS_KEY(orgId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Alternar status de favorito para a organização ativa.
 */
export function alternarFavoritoOrg(orgId: string, templateId: string): boolean {
  if (typeof window === "undefined") return false;
  const favs = new Set(listarFavoritosOrg(orgId));
  const isFav = favs.has(templateId);
  if (isFav) {
    favs.delete(templateId);
  } else {
    favs.add(templateId);
  }
  localStorage.setItem(STORAGE_FAVORITOS_KEY(orgId), JSON.stringify(Array.from(favs)));
  return !isFav;
}

/**
 * Listar modelos personalizados da organização ativa.
 */
export function listarModelosPersonalizadosOrg(orgId: string): CustomTemplateItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_TEMPLATES_KEY(orgId));
    if (raw) return JSON.parse(raw);

    // Modelo padrão inicial para enriquecer o painel direito conforme layout de referência
    const inicial: CustomTemplateItem = {
      id: "meu-template-institucional",
      nome: "Meu Template Institucional",
      descricao:
        "Template oficial da nossa organização com apresentação institucional e proposta de valor.",
      categoria: "institucional",
      categoriaLabel: "Personalizado",
      badgeVariant: "purple",
      assuntoPadrao: "Solução completa para o seu negócio — Proposta institucional",
      preheaderPadrao: "Apresentamos nossas soluções corporativas sob medida.",
      ctaTexto: "Conhecer Solução",
      ctaUrl: "https://flowbusiness.com.br/solucao",
      temaEscuro: false,
      variaveisSuportadas: [
        "nome",
        "empresa",
        "cidade",
        "nome_remetente",
        "empresa_remetente",
        "telefone_remetente",
        "site_remetente",
      ],
      conteudoHtml: OFFICIAL_EMAIL_TEMPLATES[0].conteudoHtml,
      orgId,
      userId: "owner",
      isPersonalizado: true,
      isFavorito: true,
      criadoEm: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      atualizadoEm: "Atualizado há 5 dias",
    };
    return [inicial];
  } catch {
    return [];
  }
}

/**
 * Salvar ou atualizar um modelo personalizado.
 */
export function salvarModeloPersonalizadoOrg(
  orgId: string,
  template: Partial<CustomTemplateItem> & {
    nome: string;
    categoria: EmailTemplateItem["categoria"];
  },
): CustomTemplateItem {
  if (typeof window === "undefined") {
    throw new Error("Armazenamento indisponível no ambiente de execução.");
  }
  const lista = listarModelosPersonalizadosOrg(orgId);
  const now = new Date().toISOString();

  const id = template.id || `custom-${Date.now()}`;
  const index = lista.findIndex((item) => item.id === id);

  const novoModelo: CustomTemplateItem = {
    id,
    nome: template.nome,
    descricao: template.descricao || "Template personalizado criado pela organização.",
    categoria: template.categoria,
    categoriaLabel: "Personalizado",
    badgeVariant: "purple",
    assuntoPadrao: template.assuntoPadrao || "Apresentação comercial exclusiva",
    preheaderPadrao: template.preheaderPadrao || "Detalhes comerciais relevantes",
    ctaTexto: template.ctaTexto || "Saiba mais",
    ctaUrl: template.ctaUrl || "https://flowbusiness.com.br",
    temaEscuro: !!template.temaEscuro,
    variaveisSuportadas: template.variaveisSuportadas || [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
    ],
    conteudoHtml: template.conteudoHtml || OFFICIAL_EMAIL_TEMPLATES[0].conteudoHtml,
    orgId,
    userId: "owner",
    isPersonalizado: true,
    isFavorito: template.isFavorito ?? false,
    criadoEm: index >= 0 ? lista[index].criadoEm : now,
    atualizadoEm: "Atualizado recentemente",
  };

  if (index >= 0) {
    lista[index] = novoModelo;
  } else {
    lista.unshift(novoModelo);
  }

  localStorage.setItem(STORAGE_CUSTOM_TEMPLATES_KEY(orgId), JSON.stringify(lista));
  return novoModelo;
}

/**
 * Obter a assinatura padrão da organização.
 */
export function obterAssinaturaPadraoOrg(orgId: string): {
  id: string;
  data: SignatureData;
  definida: boolean;
} {
  if (typeof window === "undefined") {
    return { id: "executiva-classica", data: DEFAULT_SIGNATURE_DATA, definida: true };
  }
  try {
    const raw = localStorage.getItem(STORAGE_DEFAULT_SIGNATURE_KEY(orgId));
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        id: parsed.id || "executiva-classica",
        data: parsed.data || DEFAULT_SIGNATURE_DATA,
        definida: true,
      };
    }
  } catch {
    // fallback
  }

  return {
    id: "executiva-classica",
    data: DEFAULT_SIGNATURE_DATA,
    definida: true,
  };
}

/**
 * Definir assinatura padrão para a organização ativa.
 */
export function definirAssinaturaPadraoOrg(
  orgId: string,
  signatureId: string,
  signatureData?: SignatureData,
): void {
  if (typeof window === "undefined") return;
  const payload = {
    id: signatureId,
    data: signatureData || DEFAULT_SIGNATURE_DATA,
    definidaEm: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_DEFAULT_SIGNATURE_KEY(orgId), JSON.stringify(payload));
}

/**
 * Prepara o contrato de template para envio futuro ao Estúdio de Campanhas (Prompt 51).
 */
export function prepararContratoEstudio(params: {
  template: EmailTemplateItem;
  variaveis: TemplateVariables;
  assinatura?: CorporateSignatureItem;
  dadosAssinatura?: SignatureData;
  orgId: string;
}): CampaignTemplateContract {
  const htmlInterpolar = interpolateVariables(params.template.conteudoHtml, params.variaveis);
  let assinaturaHtml = "";

  if (params.assinatura) {
    assinaturaHtml = renderSignatureHtml(
      params.assinatura.htmlTemplate,
      params.dadosAssinatura || DEFAULT_SIGNATURE_DATA,
    );
  }

  return {
    templateId: params.template.id,
    templateNome: params.template.nome,
    templateTipo: "email",
    categoria: params.template.categoria,
    versao: "1.0",
    assunto: interpolateVariables(params.template.assuntoPadrao, params.variaveis),
    preheader: interpolateVariables(params.template.preheaderPadrao, params.variaveis),
    htmlRenderizado: htmlInterpolar,
    variaveisUtilizadas: params.variaveis as Record<string, string>,
    assinaturaId: params.assinatura?.id,
    assinaturaHtml,
    orgId: params.orgId,
    timestamp: new Date().toISOString(),
  };
}
