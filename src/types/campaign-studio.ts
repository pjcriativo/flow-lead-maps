// Tipos oficiais do Estúdio de Campanhas (Prompt 51 - Flow Business)
// Suporta a seleção de listas, templates, assinaturas, editor visual e agendamento.

export type StudioStepId =
  | "destinatarios"
  | "template"
  | "conteudo"
  | "assinatura"
  | "teste_revisao"
  | "agendamento";

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
  | "texto"
  | "botao"
  | "imagem"
  | "separador";

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
  ativo: boolean;
}

export interface StudioCampaignDraft {
  id: string;
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
  templateNome: string;
  assunto: string;
  preCabecalho: string;
  blocos: StudioEmailBlock[];
  programacao: StudioProgramacao;
  status: "rascunho" | "em_revisao" | "agendada";
  criadoEm: string;
  atualizadoEm: string;
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
