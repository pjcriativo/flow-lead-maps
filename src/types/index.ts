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

/** Redesign do site de um lead (gerado por IA na Fase 3). Origem: tabela `redesigns`. */
export interface Redesign {
  id: string;
  lead_id: string;
  /** URL do site atual do lead (o "antes"). */
  site_original_url: string | null;
  /** HTML gerado pela IA. */
  html_gerado: string | null;
  /** HTML após edição do usuário (o que vai para publicação). */
  html_editado: string | null;
  status: RedesignStatus;
  modelo: string | null;
  custo_usd: number | null;
  observacoes: string | null;
  /** ISO datetime. */
  criado_em: string;
  gerado_em: string | null;
  updated_at: string;
  /** ISO datetime — criado_em + 15 dias. Registro fica p/ histórico após expirar. */
  expira_em: string | null;
  /** Nome do negócio (join com leads) — para exibir. */
  lead_nome?: string;
}

/* -------------------------------------------------------------------------- */
/* FASE 4 — Publicação (sites TEMPORÁRIOS)                                     */
/* -------------------------------------------------------------------------- */

/**
 * Ciclo de vida do site publicado: publicado → aprovado/reprovado/expirado.
 * Expira em 15 dias se não resolvido. Ao excluir/expirar: apaga os arquivos do
 * Storage, mas MANTÉM o registro (arquivos_removidos = true).
 */
export type SitePublicadoStatus = "publicado" | "aprovado" | "reprovado" | "expirado";

/**
 * Site gerado publicado num caminho temporário
 * (flowleads.flowgenius.com.br/site/<slug>), sem o cliente conectar conta.
 */
export interface SitePublicado {
  id: string;
  lead_id: string;
  /** Redesign de origem (o HTML publicado veio dele). */
  redesign_id: string;
  slug: string;
  url_publica: string;
  status: SitePublicadoStatus;
  /** ISO datetime. */
  publicado_em: string;
  /** ISO datetime — publicado_em + 15 dias. */
  expira_em: string;
  /** true quando os arquivos foram apagados do Storage (excluído/expirado). */
  arquivos_removidos: boolean;
  /** Nome do negócio (join com leads) — para exibir sem depender do slug. */
  lead_nome?: string;
}

/** Lead com redesign pronto e ainda SEM site publicado (candidato a publicar). */
export interface LeadPublicavel {
  lead_id: string;
  lead_nome: string;
  /** Redesign pronto que será publicado (entrada da publish). */
  redesign_id: string;
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
