// Tipos oficiais da Biblioteca de Templates e Assinaturas Corporativas do Flow Business.
// Contrato estruturado e desacoplado, preparado para consumo futuro pelo Estúdio de Campanhas (Prompt 51).

export type TemplateCategory =
  | "comercial"
  | "proposta"
  | "newsletter"
  | "eventos"
  | "follow_up"
  | "relacionamento"
  | "diagnostico"
  | "institucional"
  | "reuniao"
  | "lancamento"
  | "educativo"
  | "reativacao";

export interface TemplateVariables {
  nome?: string;
  empresa?: string;
  cidade?: string;
  nome_remetente?: string;
  empresa_remetente?: string;
  telefone_remetente?: string;
  site_remetente?: string;
  [key: string]: string | undefined;
}

export interface EmailTemplateItem {
  id: string;
  nome: string;
  descricao: string;
  categoria: TemplateCategory;
  categoriaLabel: string;
  badgeVariant: "blue" | "amber" | "purple" | "teal" | "emerald" | "rose" | "zinc";
  assuntoPadrao: string;
  preheaderPadrao: string;
  conteudoHtml: string;
  variaveisSuportadas: string[];
  ctaTexto: string;
  ctaUrl: string;
  temaEscuro: boolean;
  isFavorito?: boolean;
  isPersonalizado?: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface SignatureData {
  nome: string;
  cargo: string;
  empresa: string;
  logoUrl?: string;
  avatarUrl?: string;
  telefone: string;
  email: string;
  site: string;
  endereco?: string;
  linkedin?: string;
  instagram?: string;
  whatsapp?: string;
}

export interface CorporateSignatureItem {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  badgeLabel: string;
  badgeVariant: "emerald" | "blue" | "purple" | "amber" | "zinc";
  htmlTemplate: string;
  isPadrao?: boolean;
  isFavorito?: boolean;
  isPersonalizado?: boolean;
  dadosExemplo: SignatureData;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface CustomTemplateItem extends EmailTemplateItem {
  orgId: string;
  userId: string;
  templateOrigemId?: string;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Contrato estrito de passagem para o futuro Estúdio de Campanhas (Prompt 51).
 * Não inicia envios nem executa mutações no backend de campanhas neste prompt.
 */
export interface CampaignTemplateContract {
  templateId: string;
  templateNome: string;
  templateTipo: "email" | "assinatura";
  categoria: string;
  versao: string;
  assunto: string;
  preheader: string;
  htmlRenderizado: string;
  variaveisUtilizadas: Record<string, string>;
  assinaturaId?: string;
  assinaturaHtml?: string;
  orgId: string;
  timestamp: string;
}
