// Catálogo de modelos para a Tela 02 (assistente do CEO). Com a flag desligada, ou com a Central de IA
// ainda não publicada no banco, nada muda: vale a lista estática de Claude. Nenhum segredo trafega aqui.
import { rpc } from "@/services/agente-ceo-admin";
import { definirModelosExtras, type ModeloCatalogo } from "@/lib/modelos-ia";

export const IA_CENTRAL_HABILITADA = import.meta.env.VITE_IA_CENTRAL === "true";

export type CatalogoIa = {
  /** false = Central não publicada / flag desligada → usar a lista estática. */
  disponivel: boolean;
  provedorCeo: string | null;
  modeloCeo: string | null;
  /** O provedor escolhido para o CEO está conectado e o modelo é válido? */
  ceoPronto: boolean;
  modelos: ModeloCatalogo[];
};

export const CATALOGO_INDISPONIVEL: CatalogoIa = {
  disponivel: false,
  provedorCeo: null,
  modeloCeo: null,
  ceoPronto: true,
  modelos: [],
};

type Bruto = {
  provedor_ceo?: string;
  modelo_ceo?: string | null;
  ceo_pronto?: boolean;
  modelos?: {
    id: string;
    provider: string;
    rotulo?: string;
    usd_in_mtok?: number | null;
    usd_out_mtok?: number | null;
  }[];
};

export function lerCatalogo(bruto: unknown): CatalogoIa {
  const b = (bruto ?? {}) as Bruto;
  if (!Array.isArray(b.modelos)) return CATALOGO_INDISPONIVEL;
  const modelos: ModeloCatalogo[] = b.modelos
    .filter((m) => m && typeof m.id === "string" && m.usd_in_mtok != null && m.usd_out_mtok != null)
    .map((m) => ({
      id: m.id,
      provider: m.provider,
      rotulo: m.rotulo || m.id,
      usdEntrada: Number(m.usd_in_mtok),
      usdSaida: Number(m.usd_out_mtok),
    }));
  return {
    disponivel: true,
    provedorCeo: b.provedor_ceo ?? null,
    modeloCeo: b.modelo_ceo ?? null,
    ceoPronto: b.ceo_pronto === true,
    modelos,
  };
}

export async function carregarCatalogoIa(): Promise<CatalogoIa> {
  if (!IA_CENTRAL_HABILITADA) return CATALOGO_INDISPONIVEL;
  try {
    const cat = lerCatalogo(await rpc("ia_modelos_disponiveis", {}));
    definirModelosExtras(cat.modelos);
    return cat;
  } catch {
    // RPC ausente (migration não aplicada) ou sem sessão: comportamento anterior, sem erro na tela
    definirModelosExtras([]);
    return CATALOGO_INDISPONIVEL;
  }
}
