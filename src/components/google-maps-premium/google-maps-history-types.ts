/**
 * Tipos e Contratos para o Histórico de Buscas — Google Maps Premium (Tela 05)
 */

import type { Lead } from "@/lib/leads-api";

export type SearchHistoryStatus =
  "concluida" | "parcial" | "interrompida" | "erro" | "nao_confirmado";

export interface SearchHistoryItem {
  id: string;
  listId: string | null;
  externalRunId: string | null;
  dataHora: string; // ISO date string
  timestamp: number;
  nicho: string;
  categoria: string;
  cidade: string;
  uf: string;
  raioKm: number;
  solicitado: number;
  encontrados: number;
  ineditos: number;
  duplicatas: number;
  status: SearchHistoryStatus;
  statusLabel: string;
  tempoColeta: string | null; // e.g. "18min 42s" ou null para dado indisponível
  nomeLista: string | null;
  center: { lat: number; lng: number } | null;
  emailsCount: number;
  telefonesCount: number;
  instagramCount: number;
  leads?: Lead[];
  hasRecoverableResults: boolean;
  rawConfig?: {
    buscarEmails?: boolean;
    filtrosCaptura?: string[];
    [key: string]: unknown;
  };
}

export interface SearchHistoryIndicators {
  totalBuscas: number;
  totalBuscasSub: string;
  leadsColetados: number;
  leadsColetadosSub: string;
  leadsIneditos: number;
  leadsIneditosSub: string;
  listasCriadas: number;
  listasCriadasSub: string;
  tempoTotalColeta: string;
  tempoTotalColetaSub: string;
  taxaSucessoFormatada: string;
  taxaSucessoSub: string;
}

export type SearchHistoryPeriod = "7d" | "30d" | "90d" | "tudo";

export interface SearchHistoryFilters {
  periodo: SearchHistoryPeriod;
  status: string; // "todos" ou SearchHistoryStatus
  nicho: string; // "todos" ou string específico
  cidadeUf: string; // "todas" ou "Cidade - UF"
  categoria: string; // "todas" ou string específico
  buscaTexto: string;
}
