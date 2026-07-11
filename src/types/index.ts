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
