// Tipos centrais do Flow Leads.
// REGRA-MÃE (anti-retrabalho): TODA tela consome os tipos daqui. Nada de objeto
// inline com campos inventados. As Edge Functions futuras devolverão estes mesmos
// formatos, então ligar a API = trocar o corpo do serviço, sem tocar nas telas.
import type { Database } from "@/integrations/supabase/types";

/** Lead — origem: tabela `leads` (Fase 1, já em produção). */
export type Lead = Database["public"]["Tables"]["leads"]["Row"];

/* -------------------------------------------------------------------------- */
/* FASE 2 — Proposta                                                          */
/* -------------------------------------------------------------------------- */

/** Status de uma proposta comercial. */
export type PropostaStatus = "rascunho" | "enviada" | "respondida";

/** Proposta enviada a um lead. */
export interface Proposta {
  id: string;
  lead_id: string;
  /** Nome do negócio, denormalizado para exibir sem join. */
  lead_nome: string;
  assunto: string;
  /** Corpo do e-mail (rapport + motivo do site ruim; sem preço na 1ª abordagem). */
  corpo: string;
  /** Valor em R$. Nulo na primeira abordagem (sem preço). */
  valor: number | null;
  status: PropostaStatus;
  /** ISO datetime. */
  criada_em: string;
  enviada_em: string | null;
  respondida_em: string | null;
}

/** Status de um contrato. */
export type ContratoStatus = "rascunho" | "gerado" | "assinado" | "cancelado";

/** Contrato de serviço gerado para um lead (a partir de uma proposta aceita). */
export interface Contrato {
  id: string;
  lead_id: string;
  /** Nome do negócio, denormalizado para exibir sem join. */
  lead_nome: string;
  /** Liga à proposta de origem (Fase 2, tela Propostas) quando existir. */
  proposta_id: string | null;
  titulo: string;
  /** Valor em R$. */
  valor: number;
  status: ContratoStatus;
  /** ISO datetime. */
  criado_em: string;
  assinado_em: string | null;
  /** HTML do contrato para preview (gerado por template ou IA). */
  conteudo_html: string;
}

/* -------------------------------------------------------------------------- */
/* FASE 3 — Redesign                                                          */
/* -------------------------------------------------------------------------- */

/** Status da geração do redesign. */
export type RedesignStatus = "pendente" | "gerando" | "pronto" | "erro";

/** Redesign do site de um lead (gerado por IA na Fase 3). */
export interface Redesign {
  id: string;
  lead_id: string;
  /** Nome do negócio, denormalizado para exibir sem join. */
  lead_nome: string;
  /** URL do site atual do lead (o "antes"). */
  site_original_url: string | null;
  /** URL/《preview》do site gerado (o "depois"). */
  preview_url: string | null;
  status: RedesignStatus;
  /** ISO datetime. */
  criado_em: string;
  gerado_em: string | null;
  observacoes: string | null;
}

/* -------------------------------------------------------------------------- */
/* FASE 4 — Publicação                                                        */
/* -------------------------------------------------------------------------- */

/** Status da publicação do site gerado. */
export type PublicacaoStatus = "nao_publicado" | "publicando" | "publicado" | "erro";

/** Publicação de um site gerado (Fase 4) — liga a um Redesign. */
export interface Publicacao {
  id: string;
  /** Redesign de origem (Fase 3, tela Redesign). */
  redesign_id: string;
  lead_id: string;
  /** Nome do negócio, denormalizado para exibir sem join. */
  lead_nome: string;
  /** URL pública final (ex.: lead.flowleads.com.br/nome). */
  url_publica: string | null;
  status: PublicacaoStatus;
  publicado_em: string | null;
}

/** Status de pagamento de um registro financeiro. */
export type PagamentoStatus = "pendente" | "pago" | "atrasado" | "cancelado";

/** Registro financeiro (parcela/cobrança) ligado a um lead/contrato. */
export interface RegistroFinanceiro {
  id: string;
  lead_id: string;
  /** Nome do negócio, denormalizado para exibir sem join. */
  lead_nome: string;
  /** Liga ao contrato (Fase 2, tela Contratos) quando existir. */
  contrato_id: string | null;
  descricao: string;
  /** Valor em R$. */
  valor: number;
  status: PagamentoStatus;
  /** ISO date do vencimento. */
  vencimento: string;
  pago_em: string | null;
}
