// Serviço da Central de IA (Super Admin). Tudo passa pela Edge `admin-acoes`, que revalida o papel de
// super admin no servidor. A chave da OpenAI só trafega NO ENVIO (POST autenticado) e nunca volta: a
// leitura devolve apenas estado e a máscara. Nada aqui grava em localStorage ou loga a chave.
import { adminAcao } from "@/services/admin";
import type { ModeloLinha, ProvedorId, StatusConexao, VisaoOrg } from "@/lib/ia-config";

export type ProvedorEstado = {
  provider: ProvedorId;
  ativo: boolean;
  conexao_status: StatusConexao;
  conexao_verificada_em: string | null;
  conexao_detalhe: string | null;
  catalogo_sincronizado_em?: string | null;
  catalogo_total?: number | null;
  chave: {
    configurada: boolean;
    origem: "cofre" | "ambiente" | null;
    mascarada: string | null;
    atualizada_em: string | null;
  };
};

export type ConfigIa = {
  provedor_ceo: ProvedorId;
  modelo_padrao: string | null;
  modelo_ceo: string | null;
  modelos_por_papel: Record<string, string>;
  /** economico, analise_complexa, visao, imagem, transcricao, voz — ausente até a migration do catálogo. */
  modelos_por_capacidade?: Record<string, string>;
  fallback_provider: ProvedorId | null;
  fallback_modelo: string | null;
  teto_org_dia_usd: number;
  teto_org_mes_usd: number;
};

export type EventoIa = {
  id: number;
  criado_em: string;
  provider: string | null;
  tipo: string;
  modelo: string | null;
  status: string | null;
  detalhe: string | null;
  org_id: string | null;
};

export type ConsumoModelo = {
  modelo: string;
  execucoes: number;
  falhas: number;
  tokens_in: number;
  tokens_out: number;
  custo_usd: number;
};

export type CentralIa =
  | { disponivel: false; motivo: string }
  | {
      disponivel: true;
      config: ConfigIa;
      provedores: ProvedorEstado[];
      modelos: ModeloLinha[];
      /** false até a migration do catálogo: a classificação mostrada é inferida no navegador. */
      catalogo_migrado?: boolean;
      modelos_permitidos: string[];
      eventos: EventoIa[];
      consumo: ConsumoModelo[];
      visao_orgs: VisaoOrg[];
    };

export type ResultadoIa = { ok: boolean; reason?: string; detalhe?: string } & Record<
  string,
  unknown
>;

export async function lerCentralIa(): Promise<CentralIa> {
  const r = await adminAcao("ia_central_ler");
  if (!r.ok) throw new Error(r.detalhe || r.reason || "Falha ao ler a Central de IA.");
  if (r.disponivel !== true)
    return { disponivel: false, motivo: String(r.motivo ?? "indisponivel") };
  return r as unknown as CentralIa;
}

/** A chave é enviada uma vez; o chamador deve limpar o campo logo depois. */
export const conectarOpenAI = (chave: string): Promise<ResultadoIa> =>
  adminAcao("ia_openai_conectar", { chave });
export const testarOpenAI = (): Promise<ResultadoIa> => adminAcao("ia_openai_testar");
export const revogarOpenAI = (): Promise<ResultadoIa> => adminAcao("ia_openai_revogar");
export const ativarProvedor = (provider: ProvedorId, ativo: boolean): Promise<ResultadoIa> =>
  adminAcao("ia_provedor_ativar", { provider, ativo });
/** Atualiza o catálogo a partir de GET /v1/models (gratuito). Preços e ativações não são tocados. */
export const sincronizarCatalogoOpenAI = (): Promise<ResultadoIa> =>
  adminAcao("ia_catalogo_sincronizar");
export const salvarModeloIa = (m: {
  id: string;
  ativo: boolean;
  usd_in_mtok: number | null;
  usd_out_mtok: number | null;
  rotulo?: string;
  /** exigido pelo servidor para ALTERAR um preço já cadastrado */
  confirmar_preco?: boolean;
  categorias?: string[];
  contexto_tokens?: number | null;
  saida_max_tokens?: number | null;
  suporta_estruturadas?: boolean | null;
  precos_extra?: { item: string; unidade: string; usd: number; modo: string }[];
  preco_fonte?: string | null;
}): Promise<ResultadoIa> => adminAcao("ia_modelo_salvar", m);
export const salvarConfigIa = (c: Partial<ConfigIa>): Promise<ResultadoIa> =>
  adminAcao("ia_config_salvar", c as Record<string, unknown>);
export const salvarOrcamentoOrg = (
  orgId: string,
  dia: number | null,
  mes: number | null,
): Promise<ResultadoIa> =>
  adminAcao("ia_orcamento_org_salvar", { org_id: orgId, teto_dia_usd: dia, teto_mes_usd: mes });
