// Tipos oficiais do Estúdio de Campanhas (Prompt 51 - Flow Business)
// Suporta a seleção de listas, templates, assinaturas, editor visual e agendamento.

export type StudioStepId = "destinatarios" | "conteudo" | "revisao";

export interface StudioStep {
  id: StudioStepId;
  numero: number;
  label: string;
}

export interface StudioFiltrosEnvio {
  comEmail: boolean;
  qualificados: boolean;
  novosLeads: boolean;
}

export interface StudioProgramacao {
  modo: "imediato" | "agendar";
  dataEnvio: string; // YYYY-MM-DD
  horarioEnvio: string; // HH:mm
  fusoHorario: string; // Ex: "America/Sao_Paulo"
}

export type BlockType =
  | "cabecalho"
  | "mensagem"
  | "cta"
  | "rodape"
  | "titulo"
  | "texto"
  | "botao"
  | "imagem"
  | "separador"
  | "espacamento"
  | "duas_colunas"
  | "assinatura";

export type StudioBlockAlignment = "left" | "center" | "right";

export interface StudioEmailBlock {
  id: string;
  tipo: BlockType;
  titulo: string;
  subtitulo: string;
  conteudoHtml?: string;
  conteudoTexto?: string;
  ctaTexto?: string;
  ctaUrl?: string;
  imagemUrl?: string;
  imagemAlt?: string;
  imagemLargura?: number;
  colunaEsquerdaTexto?: string;
  colunaDireitaTexto?: string;
  negrito?: boolean;
  italico?: boolean;
  alinhamento?: StudioBlockAlignment;
  tamanhoFonte?: number;
  corTexto?: string;
  corFundo?: string;
  espacamento?: number;
  origem?: "template" | "personalizado" | "assinatura";
  tagHtml?: string;
  ativo: boolean;
}

export interface StudioCampaignDraft {
  id: string | null;
  revisao: number;
  orgId: string;
  userId: string;
  nome: string;
  listaId: string | null;
  listaNome: string;
  totalLeads: number;
  leadsComEmail: number;
  leadsQualificados: number;
  quantidadeSelecionada: number;
  filtrosEnvio: StudioFiltrosEnvio;
  leadsIdsSelecionados: string[];
  remetenteNome: string;
  remetenteEmail: string;
  responderPara: string;
  assinaturaId: string;
  assinaturaNome: string;
  templateId: string;
  templateVersao: string;
  templateNome: string;
  templateHtmlSnapshot: string;
  templateConfigSnapshot: Record<string, string | number | boolean | null>;
  assinaturaHtmlSnapshot: string;
  assunto: string;
  preCabecalho: string;
  blocos: StudioEmailBlock[];
  programacao: StudioProgramacao;
  status: "rascunho" | "em_revisao";
  criadoEm: string;
  atualizadoEm: string;
}

export type RecipientEligibility =
  "sem_email" | "nao_validado" | "elegivel_confirmado" | "bloqueado" | "descadastro" | "reclamacao";

export interface StudioRecipient {
  leadId: string;
  email: string | null;
  selecionado: boolean;
  elegibilidade: RecipientEligibility;
  motivoExclusao: string | null;
}

export interface StudioValidationResult {
  assuntoPreenchido: boolean;
  templateAplicado: boolean;
  assinaturaDefinida: boolean;
  destinatariosValidos: number;
  remetenteValido: boolean;
  podeAvancar: boolean;
  avisos: string[];
  bloqueios: string[];
}
