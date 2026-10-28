// Visão do catálogo de modelos na tela Provedores & Modelos. Lógica PURA: transforma as linhas de ia_modelos
// em linhas de tabela, filtra, busca e pagina. Quando a migration do catálogo ainda não foi aplicada, a
// classificação vem do mesmo classificador da Edge e é exibida como "inferida" — nunca como confirmada.
import {
  CATEGORIAS,
  classificarModelo,
  modeloElegivelParaCeo,
  ROTULO_CATEGORIA,
  type Categoria,
  type PrecoExtra,
} from "../../supabase/functions/_shared/ia-catalogo.ts";
import type { ModeloLinha } from "./ia-config.ts";

export { CATEGORIAS, ROTULO_CATEGORIA, type Categoria };

export type EstadoModelo =
  "indisponivel" | "homologado" | "habilitado" | "sem_preco" | "configurado";

export type LinhaCatalogo = ModeloLinha & {
  categorias: Categoria[];
  classificacao: "inferida" | "manual";
  disponibilidade: "disponivel" | "indisponivel" | "desconhecida";
  endpoint: string;
  familia: string | null;
  snapshot: string | null;
  modalidadesEntrada: string[];
  modalidadesSaida: string[];
  chatCeo: boolean;
  contextoTokens: number | null;
  saidaMaxTokens: number | null;
  precosExtra: PrecoExtra[];
  precoOrigem: string | null;
  precoFonte: string | null;
  precoAtualizadoEm: string | null;
  vistoEm: string | null;
  primeiroVistoEm: string | null;
  homologadoEm: string | null;
  estado: EstadoModelo;
  /** Estar na API não é estar ativo: indisponível, sem preço, configurado (tem preço), habilitado (Super Admin ligou), homologado (teste real). */
  semPreco: boolean;
};

type Cru = ModeloLinha & Record<string, unknown>;

const lista = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
const numero = (v: unknown): number | null =>
  v === null || v === undefined || v === "" || !Number.isFinite(Number(v)) ? null : Number(v);

export function montarLinha(m: Cru): LinhaCatalogo {
  const inferido = classificarModelo(m.id);
  const guardadas = lista(m.categorias).filter((c): c is Categoria =>
    (CATEGORIAS as readonly string[]).includes(c),
  );
  const categorias = guardadas.length ? guardadas : inferido.categorias;
  const manual = m.classificacao_origem === "manual";
  const disp = m.disponibilidade;
  const disponibilidade: LinhaCatalogo["disponibilidade"] =
    disp === "disponivel" || disp === "indisponivel" ? disp : "desconhecida";
  const temTokens = m.usd_in_mtok !== null && m.usd_out_mtok !== null;
  const extras = Array.isArray(m.precos_extra) ? (m.precos_extra as PrecoExtra[]) : [];
  const chatCeo = typeof m.chat_ceo === "boolean" ? m.chat_ceo : inferido.chatCeo;
  const semPreco = chatCeo ? !temTokens : extras.length === 0 && !temTokens;
  const homologadoEm = (m.homologado_em as string | null | undefined) ?? null;
  const estado: EstadoModelo =
    disponibilidade === "indisponivel"
      ? "indisponivel"
      : m.ativo && homologadoEm
        ? "homologado"
        : m.ativo
          ? "habilitado"
          : semPreco
            ? "sem_preco"
            : "configurado";
  return {
    ...m,
    categorias,
    classificacao: manual ? "manual" : "inferida",
    disponibilidade,
    endpoint:
      typeof m.endpoint === "string" && m.endpoint !== "desconhecido"
        ? m.endpoint
        : inferido.endpoint,
    familia: (m.familia as string | null | undefined) ?? inferido.familia,
    snapshot: (m.snapshot as string | null | undefined) ?? inferido.snapshot,
    modalidadesEntrada: lista(m.modalidades_entrada).length
      ? lista(m.modalidades_entrada)
      : inferido.modalidadesEntrada,
    modalidadesSaida: lista(m.modalidades_saida).length
      ? lista(m.modalidades_saida)
      : inferido.modalidadesSaida,
    chatCeo,
    contextoTokens: numero(m.contexto_tokens),
    saidaMaxTokens: numero(m.saida_max_tokens),
    precosExtra: extras,
    precoOrigem: (m.preco_origem as string | null | undefined) ?? null,
    precoFonte: (m.preco_fonte as string | null | undefined) ?? null,
    precoAtualizadoEm: (m.preco_atualizado_em as string | null | undefined) ?? null,
    vistoEm: (m.visto_em as string | null | undefined) ?? null,
    primeiroVistoEm: (m.primeiro_visto_em as string | null | undefined) ?? null,
    homologadoEm,
    estado,
    semPreco,
  };
}

export const ROTULO_ESTADO: Record<EstadoModelo, string> = {
  indisponivel: "Indisponível",
  homologado: "Homologado",
  habilitado: "Habilitado",
  sem_preco: "Preço não configurado",
  configurado: "Configurado",
};

export type FiltroCategoria = "todas" | Categoria;
export type FiltroStatus =
  "todos" | "habilitados" | "desabilitados" | "sem_preco" | "indisponiveis" | "novos";

/** "Novo" = visto pela primeira vez na última sincronização ou depois (janela de 7 dias, informativa). */
const JANELA_NOVO_MS = 7 * 24 * 3600 * 1000;

export function filtrarCatalogo(
  linhas: readonly LinhaCatalogo[],
  f: { busca: string; categoria: FiltroCategoria; status: FiltroStatus; agora?: number },
): LinhaCatalogo[] {
  const q = f.busca.trim().toLowerCase();
  const agora = f.agora ?? Date.now();
  return linhas.filter((l) => {
    if (q && !`${l.id} ${l.rotulo ?? ""} ${l.familia ?? ""}`.toLowerCase().includes(q))
      return false;
    if (f.categoria !== "todas" && !l.categorias.includes(f.categoria)) return false;
    switch (f.status) {
      case "habilitados":
        return l.ativo;
      case "desabilitados":
        return !l.ativo && l.disponibilidade !== "indisponivel";
      case "sem_preco":
        return l.semPreco;
      case "indisponiveis":
        return l.disponibilidade === "indisponivel";
      case "novos":
        return (
          l.primeiroVistoEm !== null &&
          agora - Date.parse(l.primeiroVistoEm) <= JANELA_NOVO_MS &&
          !l.ativo
        );
      default:
        return true;
    }
  });
}

export function contarPorCategoria(
  linhas: readonly LinhaCatalogo[],
): Record<FiltroCategoria, number> {
  const r = { todas: linhas.length } as Record<FiltroCategoria, number>;
  for (const c of CATEGORIAS) r[c] = linhas.filter((l) => l.categorias.includes(c)).length;
  return r;
}

/** Habilitados primeiro, depois disponíveis; indisponíveis por último; desempate por id. */
export function ordenarCatalogo(linhas: readonly LinhaCatalogo[]): LinhaCatalogo[] {
  const peso = (l: LinhaCatalogo) => (l.disponibilidade === "indisponivel" ? 2 : l.ativo ? 0 : 1);
  return [...linhas].sort((a, b) => peso(a) - peso(b) || a.id.localeCompare(b.id));
}

export function paginar<T>(
  itens: readonly T[],
  pagina: number,
  porPagina: number,
): { itens: T[]; pagina: number; paginas: number } {
  const paginas = Math.max(1, Math.ceil(itens.length / porPagina));
  const p = Math.min(Math.max(1, pagina), paginas);
  return { itens: itens.slice((p - 1) * porPagina, p * porPagina), pagina: p, paginas };
}

/** US$ por 1M de tokens. Exibe "—" quando não há preço: nunca 0 fingindo gratuidade. */
export const formatarPrecoMtok = (v: number | null | undefined): string =>
  v === null || v === undefined || !Number.isFinite(Number(v))
    ? "—"
    : `US$ ${Number(v).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })}`;

export const formatarContexto = (v: number | null): string =>
  v === null
    ? "—"
    : v >= 1_000_000
      ? `${(v / 1_000_000).toLocaleString("pt-BR")}M`
      : v >= 1000
        ? `${Math.round(v / 1000)}K`
        : String(v);

/** Opções do seletor "Modelo do CEO Mestre": só texto compatível com o runtime, habilitado e precificado. */
export function opcoesModeloCeo(linhas: readonly LinhaCatalogo[]): LinhaCatalogo[] {
  return ordenarCatalogo(
    linhas.filter((l) =>
      modeloElegivelParaCeo({
        id: l.id,
        provider: l.provider,
        ativo: l.ativo,
        usd_in_mtok: l.usd_in_mtok,
        usd_out_mtok: l.usd_out_mtok,
        categorias: l.categorias,
        chat_ceo: l.chatCeo,
        disponibilidade: l.disponibilidade,
      }),
    ),
  );
}
