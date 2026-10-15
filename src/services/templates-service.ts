import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { getActiveOrganizationContext } from "@/lib/active-organization";
import { throwPersistenceError } from "@/lib/persistence-errors";
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
  OFFICIAL_EMAIL_TEMPLATES,
  interpolateVariables,
  renderSignatureHtml,
} from "@/components/campanhas-premium/templates/templates-data";

const templateCategorySchema = z.enum([
  "comercial",
  "proposta",
  "newsletter",
  "eventos",
  "follow_up",
  "relacionamento",
  "diagnostico",
  "institucional",
  "reuniao",
  "lancamento",
  "educativo",
  "reativacao",
]);

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
  const activeOrganization = await getActiveOrganizationContext();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user || authData.user.id !== activeOrganization.userId) {
    throw authError ?? new Error("Usuário não autenticado.");
  }
  const [{ data: profile, error: profileError }, { data: organization, error: orgError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, phone, avatar_url, reply_to_email")
        .eq("id", activeOrganization.userId)
        .maybeSingle(),
      supabase.from("orgs").select("nome").eq("id", activeOrganization.orgId).maybeSingle(),
    ]);
  if (profileError) throw profileError;
  if (orgError) throw orgError;
  if (!organization) throw new Error("Organização ativa não encontrada.");
  const userEmail = authData.user.email?.trim() ?? "";
  return {
    userId: activeOrganization.userId,
    orgId: activeOrganization.orgId,
    userName: profile?.full_name?.trim() ?? "",
    userEmail,
    companyName: organization.nome.trim(),
    phone: profile?.phone?.trim() ?? "",
    replyToEmail: profile?.reply_to_email?.trim() || userEmail,
    avatarUrl: profile?.avatar_url?.trim() ?? "",
  };
}

async function validateOrganization(orgId: string) {
  const context = await obterContextoOrgAtiva();
  if (context.orgId !== orgId)
    throw new Error("A organização solicitada não é a organização ativa.");
  return context;
}

export async function carregarVariaveisOrganizacao(): Promise<TemplateVariables> {
  const context = await obterContextoOrgAtiva();
  return {
    nome_remetente: context.userName,
    empresa_remetente: context.companyName,
    telefone_remetente: context.phone,
    site_remetente: "",
  };
}

export async function listarFavoritosOrg(orgId: string): Promise<string[]> {
  const context = await validateOrganization(orgId);
  const { data, error } = await supabase
    .from("template_favoritos")
    .select("template_id")
    .eq("org_id", orgId)
    .eq("user_id", context.userId);
  if (error) throwPersistenceError(error);
  return (data ?? []).map((favorite) => favorite.template_id);
}

export async function alternarFavoritoOrg(
  orgId: string,
  templateId: string,
  tipo: "email" | "assinatura" = "email",
): Promise<boolean> {
  const context = await validateOrganization(orgId);
  const { data: existing, error: readError } = await supabase
    .from("template_favoritos")
    .select("id")
    .eq("org_id", orgId)
    .eq("user_id", context.userId)
    .eq("template_id", templateId)
    .eq("tipo", tipo)
    .maybeSingle();
  if (readError) throwPersistenceError(readError);
  if (existing) {
    const { error } = await supabase.from("template_favoritos").delete().eq("id", existing.id);
    if (error) throwPersistenceError(error);
    return false;
  }
  const { error } = await supabase.from("template_favoritos").insert({
    org_id: orgId,
    user_id: context.userId,
    template_id: templateId,
    tipo,
  });
  if (error) throwPersistenceError(error);
  return true;
}

export async function listarModelosPersonalizadosOrg(orgId: string): Promise<CustomTemplateItem[]> {
  await validateOrganization(orgId);
  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_global", false)
    .order("atualizado_em", { ascending: false });
  if (error) throwPersistenceError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    versao: String(row.versao),
    nome: row.nome,
    descricao: row.descricao ?? "",
    categoria: templateCategorySchema.parse(row.categoria),
    categoriaLabel: row.categoria_label,
    badgeVariant: "purple",
    assuntoPadrao: row.assunto_padrao,
    preheaderPadrao: row.preheader_padrao ?? "",
    conteudoHtml: row.conteudo_html,
    variaveisSuportadas: row.variaveis_suportadas,
    ctaTexto: row.cta_texto ?? "",
    ctaUrl: row.cta_url ?? "",
    temaEscuro: row.tema_escuro,
    isPersonalizado: true,
    orgId,
    userId: row.created_by ?? "",
    templateOrigemId: row.template_origem_id ?? undefined,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
  }));
}

export async function salvarModeloPersonalizadoOrg(
  orgId: string,
  userId: string,
  template: Partial<CustomTemplateItem> & {
    nome: string;
    categoria: EmailTemplateItem["categoria"];
  },
): Promise<CustomTemplateItem> {
  const context = await validateOrganization(orgId);
  if (context.userId !== userId)
    throw new Error("O criador não corresponde ao usuário autenticado.");
  const payload = {
    org_id: orgId,
    nome: template.nome,
    descricao: template.descricao ?? "Template personalizado criado pela organização.",
    categoria: template.categoria,
    categoria_label: "Personalizado",
    assunto_padrao: template.assuntoPadrao ?? "Apresentação comercial exclusiva",
    preheader_padrao: template.preheaderPadrao ?? "Detalhes comerciais relevantes",
    cta_texto: template.ctaTexto ?? "Saiba mais",
    cta_url: template.ctaUrl ?? "",
    tema_escuro: template.temaEscuro ?? false,
    variaveis_suportadas: template.variaveisSuportadas ?? [
      "nome",
      "empresa",
      "cidade",
      "nome_remetente",
    ],
    conteudo_html: template.conteudoHtml ?? OFFICIAL_EMAIL_TEMPLATES[0].conteudoHtml,
    template_origem_id: template.templateOrigemId ?? null,
    template_origem_versao: template.versao ?? "1.0",
    is_global: false,
  };
  const operation = template.id
    ? supabase
        .from("email_templates")
        .update(payload)
        .eq("id", template.id)
        .eq("org_id", orgId)
        .select("id")
        .single()
    : supabase
        .from("email_templates")
        .insert({ ...payload, created_by: userId })
        .select("id")
        .single();
  const { data, error } = await operation;
  if (error) throwPersistenceError(error);
  const saved = (await listarModelosPersonalizadosOrg(orgId)).find((item) => item.id === data.id);
  if (!saved) throw new Error("O template salvo não pôde ser recuperado.");
  return saved;
}

export async function excluirModeloPersonalizadoOrg(
  orgId: string,
  templateId: string,
): Promise<void> {
  await validateOrganization(orgId);
  const { data, error } = await supabase
    .from("email_templates")
    .delete()
    .eq("id", templateId)
    .eq("org_id", orgId)
    .eq("is_global", false)
    .select("id")
    .maybeSingle();
  if (error) throwPersistenceError(error);
  if (!data) throw new Error("Template não encontrado ou exclusão não autorizada.");
}

export async function duplicarModeloPersonalizadoOrg(
  orgId: string,
  userId: string,
  template: CustomTemplateItem,
): Promise<CustomTemplateItem> {
  return salvarModeloPersonalizadoOrg(orgId, userId, {
    ...template,
    id: undefined,
    nome: `${template.nome} — cópia`,
    templateOrigemId: template.templateOrigemId ?? template.id,
  });
}

export async function obterAssinaturaPadraoOrg(orgId: string): Promise<{
  id: string;
  data: SignatureData;
  definida: boolean;
  nomeModelo?: string;
  htmlSeguro?: string;
}> {
  await validateOrganization(orgId);
  const { data, error } = await supabase
    .from("assinaturas_corporativas")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_padrao", true)
    .eq("is_global", false)
    .maybeSingle();
  if (error) throwPersistenceError(error);
  if (!data) return { id: "executiva-classica", data: DEFAULT_SIGNATURE_DATA, definida: false };
  return {
    id: data.id,
    definida: true,
    nomeModelo: data.nome,
    htmlSeguro: data.html_template,
    data: {
      nome: data.nome,
      cargo: data.cargo ?? "",
      empresa: data.empresa ?? "",
      logoUrl: data.logo_url ?? undefined,
      telefone: data.telefone ?? "",
      email: data.email ?? "",
      site: data.site ?? "",
      endereco: data.endereco ?? undefined,
      linkedin: data.linkedin ?? undefined,
      instagram: data.instagram ?? undefined,
      whatsapp: data.whatsapp ?? undefined,
    },
  };
}

export async function salvarAssinaturaOrg(params: {
  orgId: string;
  id?: string;
  modeloOrigemId?: string;
  modeloOrigemVersao?: string;
  data: SignatureData;
  htmlSeguro: string;
  padrao?: boolean;
}): Promise<string> {
  const context = await validateOrganization(params.orgId);
  let signatureId = params.id;
  if (!signatureId && params.modeloOrigemId) {
    const { data: existing, error: existingError } = await supabase
      .from("assinaturas_corporativas")
      .select("id")
      .eq("org_id", params.orgId)
      .eq("modelo_origem_id", params.modeloOrigemId)
      .eq("is_global", false)
      .limit(1)
      .maybeSingle();
    if (existingError) throwPersistenceError(existingError);
    signatureId = existing?.id;
  }
  const payload = {
    org_id: params.orgId,
    nome: params.data.nome,
    cargo: params.data.cargo,
    empresa: params.data.empresa,
    logo_url: params.data.logoUrl ?? null,
    telefone: params.data.telefone,
    email: params.data.email,
    site: params.data.site,
    endereco: params.data.endereco ?? null,
    linkedin: params.data.linkedin ?? null,
    instagram: params.data.instagram ?? null,
    whatsapp: params.data.whatsapp ?? null,
    html_template: params.htmlSeguro,
    dados: {
      nome: params.data.nome,
      cargo: params.data.cargo,
      empresa: params.data.empresa,
      logoUrl: params.data.logoUrl ?? null,
      avatarUrl: params.data.avatarUrl ?? null,
      telefone: params.data.telefone,
      email: params.data.email,
      site: params.data.site,
      endereco: params.data.endereco ?? null,
      linkedin: params.data.linkedin ?? null,
      instagram: params.data.instagram ?? null,
      whatsapp: params.data.whatsapp ?? null,
    },
    is_padrao: false,
    is_global: false,
    modelo_origem_id: params.modeloOrigemId ?? null,
    modelo_origem_versao: params.modeloOrigemVersao ?? "1.0",
  };
  const operation = signatureId
    ? supabase
        .from("assinaturas_corporativas")
        .update(payload)
        .eq("id", signatureId)
        .eq("org_id", params.orgId)
        .select("id")
        .single()
    : supabase
        .from("assinaturas_corporativas")
        .insert({ ...payload, created_by: context.userId })
        .select("id")
        .single();
  const { data, error } = await operation;
  if (error) throwPersistenceError(error);
  if (params.padrao) await definirAssinaturaPadraoOrg(params.orgId, data.id);
  return data.id;
}

export async function listarAssinaturasOrg(orgId: string): Promise<CorporateSignatureItem[]> {
  await validateOrganization(orgId);
  const { data, error } = await supabase
    .from("assinaturas_corporativas")
    .select("*")
    .eq("org_id", orgId)
    .eq("is_global", false)
    .order("atualizado_em", { ascending: false });
  if (error) throwPersistenceError(error);
  return (data ?? []).map((row) => ({
    id: row.id,
    nome: row.nome,
    descricao: `${row.cargo ?? ""} ${row.empresa ?? ""}`.trim(),
    categoria: "personalizada",
    badgeLabel: "Personalizada",
    badgeVariant: "purple",
    htmlTemplate: row.html_template,
    isPadrao: row.is_padrao,
    isPersonalizado: true,
    versao: String(row.versao),
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em,
    dadosExemplo: {
      nome: row.nome,
      cargo: row.cargo ?? "",
      empresa: row.empresa ?? "",
      logoUrl: row.logo_url ?? undefined,
      telefone: row.telefone ?? "",
      email: row.email ?? "",
      site: row.site ?? "",
      endereco: row.endereco ?? undefined,
      linkedin: row.linkedin ?? undefined,
      instagram: row.instagram ?? undefined,
      whatsapp: row.whatsapp ?? undefined,
    },
  }));
}

export async function excluirAssinaturaOrg(orgId: string, signatureId: string): Promise<void> {
  await validateOrganization(orgId);
  const { data, error } = await supabase
    .from("assinaturas_corporativas")
    .delete()
    .eq("id", signatureId)
    .eq("org_id", orgId)
    .eq("is_global", false)
    .eq("is_padrao", false)
    .select("id")
    .maybeSingle();
  if (error) throwPersistenceError(error);
  if (!data) throw new Error("A assinatura padrão não pode ser excluída.");
}

export async function definirAssinaturaPadraoOrg(
  orgId: string,
  signatureId: string,
): Promise<void> {
  await validateOrganization(orgId);
  const { error } = await supabase.rpc("definir_assinatura_padrao", {
    p_org_id: orgId,
    p_assinatura_id: signatureId,
  });
  if (error) throwPersistenceError(error);
}

export function prepararContratoEstudio(params: {
  template: EmailTemplateItem;
  variaveis: TemplateVariables;
  assinatura?: CorporateSignatureItem;
  dadosAssinatura?: SignatureData;
  orgId: string;
}): CampaignTemplateContract {
  const htmlRenderizado = interpolateVariables(params.template.conteudoHtml, params.variaveis);
  const assinaturaHtml = params.assinatura
    ? renderSignatureHtml(
        params.assinatura.htmlTemplate,
        params.dadosAssinatura ?? DEFAULT_SIGNATURE_DATA,
      )
    : "";
  return {
    templateId: params.template.id,
    templateNome: params.template.nome,
    templateTipo: "email",
    categoria: params.template.categoria,
    versao: params.template.versao ?? "1.0",
    assunto: interpolateVariables(params.template.assuntoPadrao, params.variaveis),
    preheader: interpolateVariables(params.template.preheaderPadrao, params.variaveis),
    htmlRenderizado,
    variaveisUtilizadas: Object.fromEntries(
      Object.entries(params.variaveis).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    ),
    assinaturaId: params.assinatura?.id,
    assinaturaHtml,
    orgId: params.orgId,
    timestamp: new Date().toISOString(),
  };
}
