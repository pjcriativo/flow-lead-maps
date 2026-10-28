// Super Admin → Inteligência Artificial → Provedores & Modelos.
// Central única de infraestrutura de IA do Flow Business: OpenAI operacional para o CEO Mestre,
// Anthropic preservada, catálogo de modelos com preços reais, limites diário/mensal da plataforma,
// fallback autorizado, cofre AES-256-GCM e auditoria completa.
// Acesso exclusivo do Super Admin (revalidado no servidor pela Edge admin-acoes).
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Cpu,
  DollarSign,
  ExternalLink,
  Eye,
  EyeOff,
  Home,
  Info,
  KeyRound,
  Layers,
  Loader2,
  PlugZap,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sliders,
  Sparkles,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  ROTULO_CONEXAO,
  alertaDeConsumo,
  formatarUsdCurto,
  ordenarModelos,
  percentualDoTeto,
  traduzirMotivoIa,
  validarChaveOpenAI,
  validarPrecos,
  type ModeloLinha,
  type ProvedorId,
} from "@/lib/ia-config";
import {
  CATEGORIAS,
  ROTULO_CATEGORIA,
  ROTULO_ESTADO,
  contarPorCategoria,
  filtrarCatalogo,
  formatarContexto,
  formatarPrecoMtok,
  montarLinha,
  opcoesModeloCeo,
  ordenarCatalogo,
  paginar,
  type FiltroCategoria,
  type FiltroStatus,
  type LinhaCatalogo,
} from "@/lib/ia-catalogo-view";
import {
  CAPACIDADES,
  ROTULO_CAPACIDADE,
  ITENS_PRECO,
  MODOS_PROCESSAMENTO,
  ROTULO_UNIDADE,
  UNIDADES_PRECO,
  modeloServeCapacidade,
  type Capacidade,
} from "../../../supabase/functions/_shared/ia-catalogo.ts";
import {
  ativarProvedor,
  conectarOpenAI,
  lerCentralIa,
  revogarOpenAI,
  salvarConfigIa,
  salvarModeloIa,
  sincronizarCatalogoOpenAI,
  testarOpenAI,
  type CentralIa,
  type ConfigIa,
  type ProvedorEstado,
  type ResultadoIa,
} from "@/services/ia-admin";

/* ───────────────────────────── LOGOS DOS PROVEDORES (SVG) ───────────────────────────── */

function OpenAILogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.0993 3.8558L12.5973 8.3829l2.02-1.1638a.0804.0804 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.402-.686zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.1802 2.8106v.8643zm-9.2425 4.5377l-2.4603-1.42 2.4603-1.42 2.4603 1.42-2.4603 1.42z" />
    </svg>
  );
}

function AnthropicLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.827 3.5h3.693L24 20.5h-3.693l-1.976-4.757H9.67L7.693 20.5H4L10.48 3.5h3.347zm2.348 9.387l-2.348-5.645-2.348 5.645h4.696z" />
    </svg>
  );
}

function GoogleLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

function OpenRouterLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className={className}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16M14 6l6 6-6 6M10 18l-6-6 6-6" />
    </svg>
  );
}

function DeepSeekLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.93V18h-2v-1.07c-2.83-.48-5-2.94-5-5.93 0-3.31 2.69-6 6-6s6 2.69 6 6c0 2.99-2.17 5.45-5 5.93z" />
    </svg>
  );
}

function GroqLogo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded font-black text-white bg-[#F55036] ${className}`}
    >
      q
    </div>
  );
}

/* ───────────────────────────── DADOS BASE DOS PROVEDORES ───────────────────────────── */

type ProvedorUiItem = {
  id: string;
  nome: string;
  subtitulo: string;
  ativoDefault: boolean;
  statusBadge: "Ativo" | "Inativo";
};

const PROVEDORES_GRID: ProvedorUiItem[] = [
  {
    id: "openai",
    nome: "OpenAI",
    subtitulo: "Catálogo dinâmico da API",
    ativoDefault: false,
    statusBadge: "Inativo",
  },
  {
    id: "anthropic",
    nome: "Anthropic",
    subtitulo: "Claude (operacional)",
    ativoDefault: false,
    statusBadge: "Inativo",
  },
  {
    id: "google",
    nome: "Google",
    subtitulo: "Em breve",
    ativoDefault: false,
    statusBadge: "Inativo",
  },
  {
    id: "openrouter",
    nome: "OpenRouter",
    subtitulo: "Em breve",
    ativoDefault: false,
    statusBadge: "Inativo",
  },
  {
    id: "deepseek",
    nome: "DeepSeek",
    subtitulo: "Em breve",
    ativoDefault: false,
    statusBadge: "Inativo",
  },
  { id: "groq", nome: "Groq", subtitulo: "Em breve", ativoDefault: false, statusBadge: "Inativo" },
];

/* ───────────────────────────── COMPONENTE PRINCIPAL ───────────────────────────── */

const POR_PAGINA = 25;

/** Seletor de modelo: só lista o que o servidor aceita; nada de opção fixa. */
function SeletorModelo({
  valor,
  opcoes,
  onTrocar,
  ocupado,
  vazio,
  limpavel = false,
}: {
  valor: string;
  opcoes: LinhaCatalogo[];
  onTrocar: (v: string) => void;
  ocupado: boolean;
  vazio: string;
  limpavel?: boolean;
}) {
  const foraDaLista = valor !== "" && !opcoes.some((o) => o.id === valor);
  return (
    <select
      value={valor}
      disabled={ocupado || (opcoes.length === 0 && valor === "")}
      onChange={(e) => onTrocar(e.target.value)}
      className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 text-xs text-white focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316] disabled:opacity-60"
    >
      {valor === "" && <option value="">{opcoes.length ? "— selecione —" : vazio}</option>}
      {valor !== "" && limpavel && <option value="">— não definido —</option>}
      {foraDaLista && <option value={valor}>{valor} (não elegível agora)</option>}
      {opcoes.map((o) => (
        <option key={o.id} value={o.id}>
          {o.rotulo && o.rotulo !== o.id ? `${o.rotulo} (${o.id})` : o.id}
        </option>
      ))}
    </select>
  );
}
type EditExtra = { item: string; unidade: string; usd: string; modo: string };

export function AdminIaProvedores() {
  const [central, setCentral] = useState<CentralIa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Provedor selecionado no grid
  const [provedorSelecionado, setProvedorSelecionado] = useState<string>("openai");

  // Estado da chave da OpenAI
  const [chave, setChave] = useState("");
  const [verChave, setVerChave] = useState(false);
  const [organizacao, setOrganizacao] = useState("");

  // Ocupação de botões
  const [ocupado, setOcupado] = useState<string | null>(null);

  // Configurações globais locais (espelho do que está salvo no servidor)
  const [limiteDiario, setLimiteDiario] = useState("3,50");
  const [limiteMensal, setLimiteMensal] = useState("35,00");
  const [modeloPadrao, setModeloPadrao] = useState("");
  const [modeloCeo, setModeloCeo] = useState("");
  const [porCapacidade, setPorCapacidade] = useState<Record<string, string>>({});
  const [fallbackAtivo, setFallbackAtivo] = useState(false);

  // Catálogo: busca, filtros, paginação e detalhe
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<FiltroCategoria>("todas");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [pagina, setPagina] = useState(1);
  const [expandido, setExpandido] = useState<string | null>(null);

  // Modal de configuração de modelo
  const [modeloEditando, setModeloEditando] = useState<LinhaCatalogo | null>(null);
  const [editRotulo, setEditRotulo] = useState("");
  const [editPrecoIn, setEditPrecoIn] = useState("");
  const [editPrecoOut, setEditPrecoOut] = useState("");
  const [editAtivo, setEditAtivo] = useState(false);
  const [editContexto, setEditContexto] = useState("");
  const [editSaidaMax, setEditSaidaMax] = useState("");
  const [editFonte, setEditFonte] = useState("");
  const [editCategorias, setEditCategorias] = useState<string[]>([]);
  const [editExtras, setEditExtras] = useState<EditExtra[]>([]);
  const [confirmandoPreco, setConfirmandoPreco] = useState(false);

  // Carrega estado da Central de IA
  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const c = await lerCentralIa();
      setCentral(c);
      if (c && c.disponivel) {
        setLimiteDiario(String(c.config.teto_org_dia_usd).replace(".", ","));
        setLimiteMensal(String(c.config.teto_org_mes_usd).replace(".", ","));
        setModeloPadrao(c.config.modelo_padrao ?? "");
        setModeloCeo(c.config.modelo_ceo ?? "");
        setPorCapacidade(c.config.modelos_por_capacidade ?? {});
        setFallbackAtivo(Boolean(c.config.fallback_provider));
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao ler a Central de IA.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  // Provedores resolvidos
  const openaiEstado = useMemo(() => {
    if (!central || !central.disponivel) return null;
    return central.provedores.find((p) => p.provider === "openai") ?? null;
  }, [central]);

  const anthropicEstado = useMemo(() => {
    if (!central || !central.disponivel) return null;
    return central.provedores.find((p) => p.provider === "anthropic") ?? null;
  }, [central]);

  const catalogoMigrado = central?.disponivel ? central.catalogo_migrado === true : false;

  // Catálogo OpenAI: SOMENTE o que o banco guarda (sincronizado da API). Sem lista fixa.
  const linhasOpenAI = useMemo((): LinhaCatalogo[] => {
    if (!central || !central.disponivel) return [];
    return central.modelos
      .filter((m) => m.provider === "openai")
      .map((m) => montarLinha(m as Parameters<typeof montarLinha>[0]));
  }, [central]);

  const contagemCategoria = useMemo(() => contarPorCategoria(linhasOpenAI), [linhasOpenAI]);

  const linhasFiltradas = useMemo(
    () =>
      ordenarCatalogo(
        filtrarCatalogo(linhasOpenAI, { busca, categoria: filtroCategoria, status: filtroStatus }),
      ),
    [linhasOpenAI, busca, filtroCategoria, filtroStatus],
  );
  const paginaAtual = useMemo(
    () => paginar(linhasFiltradas, pagina, POR_PAGINA),
    [linhasFiltradas, pagina],
  );

  const resumoCatalogo = useMemo(
    () => ({
      total: linhasOpenAI.length,
      disponiveis: linhasOpenAI.filter((l) => l.disponibilidade !== "indisponivel").length,
      habilitados: linhasOpenAI.filter((l) => l.ativo).length,
      homologados: linhasOpenAI.filter((l) => l.estado === "homologado").length,
    }),
    [linhasOpenAI],
  );

  // Seletores: só o que o servidor aceita. Sem opção fixa.
  const opcoesCeo = useMemo(() => opcoesModeloCeo(linhasOpenAI), [linhasOpenAI]);
  const permitidos = useMemo(
    () => new Set(central?.disponivel ? central.modelos_permitidos : []),
    [central],
  );
  const opcoesCapacidade = useCallback(
    (cap: Capacidade) =>
      ordenarCatalogo(
        linhasOpenAI.filter(
          (l) =>
            l.ativo &&
            l.disponibilidade !== "indisponivel" &&
            modeloServeCapacidade(cap, {
              categorias: l.categorias,
              chatCeo: l.chatCeo,
              ativo: l.ativo,
            }) &&
            (!["economico", "analise_complexa", "visao"].includes(cap) || permitidos.has(l.id)),
        ),
      ),
    [linhasOpenAI, permitidos],
  );

  // Executa uma ação contra a API
  const executar = async (
    id: string,
    fn: () => Promise<ResultadoIa>,
    sucesso: string,
    limpar = false,
  ) => {
    setOcupado(id);
    try {
      const r = await fn();
      if (r.ok) {
        toast.success(sucesso);
        if (limpar) setChave(""); // A chave nunca fica no estado após o envio
        await carregar();
        return r;
      } else {
        toast.error(traduzirMotivoIa(r.reason));
        return null;
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operação não concluída.");
      return null;
    } finally {
      setOcupado(null);
    }
  };

  // Salvar chave da OpenAI
  const handleConectarChave = async () => {
    const limpa = chave.trim();
    const formato = validarChaveOpenAI(limpa);
    if (!formato.ok) {
      toast.error(formato.erro);
      return;
    }
    await executar(
      "conectar",
      () => conectarOpenAI(limpa),
      "Chave validada e armazenada no cofre AES-256-GCM.",
      true,
    );
  };

  // Testar conexão: autenticação válida ≠ permissão efetiva sobre o modelo do CEO
  const handleTestarConexao = async () => {
    if (chave.trim()) {
      await handleConectarChave();
      return;
    }
    setOcupado("testar");
    try {
      const r = await testarOpenAI();
      if (!r.ok) {
        toast.error(traduzirMotivoIa(r.reason));
      } else if (r.modelo_ceo_acessivel === false) {
        toast.warning(
          `Chave válida (${r.total_modelos} modelos listados), mas o projeto NÃO tem acesso ao modelo do CEO (${r.modelo_ceo}).`,
        );
      } else {
        toast.success(
          `Conexão confirmada: ${r.total_modelos} modelos listados pela OpenAI. Agora habilite e precifique o modelo desejado na tabela.`,
        );
      }
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operação não concluída.");
    } finally {
      setOcupado(null);
    }
  };

  // Atualizar modelos: GET /v1/models (gratuito). Preços, ativações e ajustes manuais são preservados.
  const handleSincronizar = async () => {
    setOcupado("sincronizar");
    try {
      const r = await sincronizarCatalogoOpenAI();
      if (
        !r.ok &&
        (r.reason === "migration_catalogo_pendente" || r.reason === "acao_desconhecida")
      ) {
        // schema/Edge antigos: sincroniza o que já é suportado (modelos de chat) em vez de travar o fluxo
        const antigo = await testarOpenAI();
        if (!antigo.ok) {
          toast.error(traduzirMotivoIa(antigo.reason));
          return;
        }
        toast.success(
          `Modelos de texto atualizados (${antigo.modelos_compativeis ?? 0} compatíveis com o CEO). O catálogo completo (imagem, áudio, etc.) depende da migration pendente.`,
        );
        await carregar();
        return;
      }
      if (!r.ok) {
        toast.error(traduzirMotivoIa(r.reason));
        return;
      }
      const n = (v: unknown) => (Array.isArray(v) ? v.length : 0);
      toast.success(
        `Catálogo atualizado: ${r.total_api} modelos na API, ${n(r.novos)} novos, ${n(r.indisponiveis)} indisponíveis.`,
      );
      if (n(r.indisponiveis_em_uso) > 0)
        toast.warning(
          `Atenção: modelo em uso na configuração não é mais listado pela OpenAI (${(r.indisponiveis_em_uso as string[]).join(", ")}).`,
        );
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operação não concluída.");
    } finally {
      setOcupado(null);
    }
  };

  // Alternar provedor ativo
  const handleToggleProvedor = async (provider: ProvedorId, novoStatus: boolean) => {
    await executar(
      `toggle-${provider}`,
      () => ativarProvedor(provider, novoStatus),
      novoStatus ? "Provedor ativado." : "Provedor desativado.",
    );
  };

  // Limites: só enviados quando mudam (blur sem alteração não grava nada)
  const handleSalvarLimites = async () => {
    if (!central || !central.disponivel) return;
    const diaNum = Number(limiteDiario.replace(",", "."));
    const mesNum = Number(limiteMensal.replace(",", "."));
    if (isNaN(diaNum) || isNaN(mesNum) || diaNum < 0 || mesNum < diaNum) {
      toast.error("Limites inválidos. O limite diário não pode exceder o mensal.");
      return;
    }
    if (
      diaNum === Number(central.config.teto_org_dia_usd) &&
      mesNum === Number(central.config.teto_org_mes_usd)
    )
      return;
    await executar(
      "salvar-limites",
      () => salvarConfigIa({ teto_org_dia_usd: diaNum, teto_org_mes_usd: mesNum }),
      "Limites salvos.",
    );
  };

  // Troca de modelo: sempre ação explícita do Super Admin; o resultado (ou o erro) é mostrado
  const handleTrocarModelo = async (campo: "modelo_padrao" | "modelo_ceo", valor: string) => {
    if (!valor) return;
    await executar(
      `cfg-${campo}`,
      () =>
        salvarConfigIa(
          campo === "modelo_ceo"
            ? { modelo_ceo: valor, provedor_ceo: "openai" }
            : { modelo_padrao: valor },
        ),
      campo === "modelo_ceo" ? "Modelo do CEO Mestre salvo." : "Modelo padrão salvo.",
    );
  };

  const handleTrocarCapacidade = async (cap: Capacidade, valor: string) => {
    await executar(
      `cap-${cap}`,
      () =>
        salvarConfigIa({
          modelos_por_capacidade: { ...porCapacidade, [cap]: valor },
        }),
      `${ROTULO_CAPACIDADE[cap]} salvo.`,
    );
  };

  const handleToggleFallback = async () => {
    const novo = !fallbackAtivo;
    await executar(
      "cfg-fallback",
      () =>
        salvarConfigIa({
          fallback_provider: novo ? "anthropic" : null,
          fallback_modelo: novo ? "claude-haiku-4-5" : null,
        }),
      novo ? "Fallback autorizado ativado." : "Fallback desativado.",
    );
  };

  // Abrir modal de edição do modelo
  const handleAbrirEditarModelo = (m: LinhaCatalogo) => {
    setModeloEditando(m);
    setEditRotulo(m.rotulo ?? m.id);
    setEditPrecoIn(m.usd_in_mtok === null ? "" : String(m.usd_in_mtok).replace(".", ","));
    setEditPrecoOut(m.usd_out_mtok === null ? "" : String(m.usd_out_mtok).replace(".", ","));
    setEditAtivo(m.ativo);
    setEditContexto(m.contextoTokens === null ? "" : String(m.contextoTokens));
    setEditSaidaMax(m.saidaMaxTokens === null ? "" : String(m.saidaMaxTokens));
    setEditFonte(m.precoFonte ?? "");
    setEditCategorias(m.categorias);
    setEditExtras(
      m.precosExtra.map((p) => ({
        item: p.item,
        unidade: p.unidade,
        usd: String(p.usd).replace(".", ","),
        modo: p.modo,
      })),
    );
    setConfirmandoPreco(false);
  };

  // Habilitar um modelo exige o provedor ativo; sem isto o usuário ficaria preso entre provedor e modelo
  const garantirProvedorAtivo = async (): Promise<boolean> => {
    if (openaiEstado?.ativo) return true;
    const r = await ativarProvedor("openai", true);
    if (!r.ok) {
      toast.error(traduzirMotivoIa(r.reason));
      return false;
    }
    return true;
  };

  // Habilitar/desabilitar direto na tabela (sem alterar preços)
  const handleToggleModelo = async (modelo: LinhaCatalogo) => {
    const novoStatus = !modelo.ativo;
    if (novoStatus && modelo.semPreco) {
      toast.error("Configure o preço antes de habilitar o modelo.");
      handleAbrirEditarModelo(modelo);
      return;
    }
    if (novoStatus && !(await garantirProvedorAtivo())) return;
    await executar(
      `modelo-${modelo.id}`,
      () =>
        salvarModeloIa({
          id: modelo.id,
          ativo: novoStatus,
          usd_in_mtok: modelo.usd_in_mtok,
          usd_out_mtok: modelo.usd_out_mtok,
          rotulo: modelo.rotulo ?? modelo.id,
          ...(catalogoMigrado ? { precos_extra: modelo.precosExtra } : {}),
        }),
      novoStatus ? `Modelo ${modelo.id} habilitado.` : `Modelo ${modelo.id} desabilitado.`,
    );
  };

  // Salvar alterações no modal do modelo
  const handleSalvarEdicaoModelo = async () => {
    if (!modeloEditando) return;
    const num = (v: string) => (v.trim() === "" ? null : Number(v.replace(",", ".")));
    const pin = num(editPrecoIn);
    const pout = num(editPrecoOut);
    for (const p of [pin, pout]) {
      if (p !== null && (!Number.isFinite(p) || p < 0 || p > 1000)) {
        toast.error("Preços por 1M de tokens devem estar entre 0 e 1000.");
        return;
      }
    }
    const extras = editExtras.map((e) => ({
      item: e.item,
      unidade: e.unidade,
      usd: num(e.usd),
      modo: e.modo,
    }));
    if (extras.some((e) => e.usd === null || !Number.isFinite(e.usd))) {
      toast.error("Preencha o valor de todos os preços adicionais.");
      return;
    }
    const int = (v: string) => (v.trim() === "" ? null : Number(v));
    const mudouPreco =
      pin !== modeloEditando.usd_in_mtok ||
      pout !== modeloEditando.usd_out_mtok ||
      JSON.stringify(extras.map((e) => [e.item, e.unidade, e.modo, e.usd])) !==
        JSON.stringify(modeloEditando.precosExtra.map((e) => [e.item, e.unidade, e.modo, e.usd]));
    const haPrecoAntes =
      modeloEditando.usd_in_mtok !== null ||
      modeloEditando.usd_out_mtok !== null ||
      modeloEditando.precosExtra.length > 0;
    if (mudouPreco && haPrecoAntes && !confirmandoPreco) {
      setConfirmandoPreco(true);
      return;
    }
    if (editAtivo && !(await garantirProvedorAtivo())) return;
    const r = await executar(
      "salvar-modelo-modal",
      () =>
        salvarModeloIa({
          id: modeloEditando.id,
          ativo: editAtivo,
          usd_in_mtok: pin,
          usd_out_mtok: pout,
          rotulo: editRotulo.trim() || modeloEditando.id,
          confirmar_preco: confirmandoPreco,
          ...(catalogoMigrado
            ? {
                precos_extra: extras as {
                  item: string;
                  unidade: string;
                  usd: number;
                  modo: string;
                }[],
                contexto_tokens: int(editContexto),
                saida_max_tokens: int(editSaidaMax),
                preco_fonte: editFonte.trim() || null,
                ...(editCategorias.join() !== modeloEditando.categorias.join()
                  ? { categorias: editCategorias }
                  : {}),
              }
            : {}),
        }),
      `Modelo ${modeloEditando.id} atualizado.`,
    );
    if (r) setModeloEditando(null);
    else setConfirmandoPreco(false);
  };

  // Indicadores dos 3 cards superiores — valores reais da Central (nenhum número fixo)
  const provedoresAtivosCount = useMemo(() => {
    if (!central || !central.disponivel) return 0;
    return central.provedores.filter((p) => p.ativo).length;
  }, [central]);

  const gasto = useMemo(() => {
    if (!central || !central.disponivel) return null;
    return central.visao_orgs.reduce(
      (a, o) => ({
        dia: a.dia + Number(o.custo_dia_usd || 0),
        mes: a.mes + Number(o.custo_mes_usd || 0),
      }),
      { dia: 0, mes: 0 },
    );
  }, [central]);
  const custoHojeStr = gasto ? formatarUsdCurto(gasto.dia) : "—";
  const custoMesStr = gasto ? formatarUsdCurto(gasto.mes) : "—";
  const percentualMes = gasto
    ? percentualDoTeto(gasto.mes, Number(limiteMensal.replace(",", ".")) || 0)
    : 0;

  const conexaoStatus = openaiEstado?.conexao_status ?? "nao_configurado";
  const conexaoInfo = ROTULO_CONEXAO[conexaoStatus];
  const mensagemConexao =
    openaiEstado?.chave.origem === "ambiente"
      ? "Há uma chave no ambiente do servidor, ainda não verificada. Clique em “Salvar e verificar” (com o campo vazio usa essa chave; colando outra, ela vai para o cofre)."
      : "Cole a chave e clique em “Salvar e verificar”.";

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* ───────────────────────────── BREADCRUMBS ───────────────────────────── */}
      <nav
        className="flex items-center gap-2 text-xs font-medium text-slate-400"
        aria-label="Breadcrumb"
      >
        <Home className="h-3.5 w-3.5 text-[#F97316]" />
        <span>Inteligência Artificial</span>
        <ChevronRight className="h-3 w-3 text-slate-600" />
        <span className="text-white font-semibold">Provedores & Modelos</span>
      </nav>

      {/* ───────────────────────────── CABEÇALHO & INDICADORES SUPERIORES ───────────────────────────── */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Título */}
        <div className="flex items-start gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F97316]/15 text-[#F97316] border border-[#F97316]/30 shadow-lg shadow-[#F97316]/10">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Provedores & Modelos</h1>
            <p className="mt-1 text-xs text-slate-400">
              Configure e gerencie os provedores de IA, modelos, preços e limites para todo o
              ecossistema.
            </p>
          </div>
        </div>

        {/* 3 Indicadores Superiores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto">
          {/* Card 1: Provedores ativos */}
          <div className="flex items-center gap-3.5 rounded-xl border border-[#20242E] bg-[#12141A] p-3.5 min-w-[190px] shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Provedores ativos</p>
              <p className="text-xl font-bold text-white tracking-tight leading-none mt-1">
                {provedoresAtivosCount}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">de 2 integrados</p>
            </div>
          </div>

          {/* Card 2: Custo hoje */}
          <div className="flex items-center gap-3.5 rounded-xl border border-[#20242E] bg-[#12141A] p-3.5 min-w-[210px] shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400">Custo hoje</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold text-white tracking-tight leading-none">
                  {custoHojeStr}
                </span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-400">
                  {gasto
                    ? percentualDoTeto(gasto.dia, Number(limiteDiario.replace(",", ".")) || 0)
                    : 0}
                  %
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">de US$ {limiteDiario}</p>
            </div>
          </div>

          {/* Card 3: Custo este mês */}
          <div className="flex items-center gap-3.5 rounded-xl border border-[#20242E] bg-[#12141A] p-3.5 min-w-[220px] shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/10 text-[#F97316]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-slate-400">Custo este mês</p>
              <p className="text-xl font-bold text-white tracking-tight leading-none mt-1">
                {custoMesStr}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span>de US$ {limiteMensal}</span>
                <span className="font-semibold text-slate-400">{percentualMes}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#F97316] transition-all duration-500"
                  style={{ width: `${percentualMes}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────── SELEÇÃO VISUAL DE PROVEDORES (6 CARDS) ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {PROVEDORES_GRID.map((p) => {
          const selecionado = provedorSelecionado === p.id;
          const ativo =
            p.id === "openai"
              ? Boolean(openaiEstado?.ativo)
              : p.id === "anthropic"
                ? Boolean(anthropicEstado?.ativo)
                : p.ativoDefault;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvedorSelecionado(p.id)}
              className={`relative flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-150 ${
                selecionado
                  ? "border-[#F97316] bg-[#161820] shadow-md shadow-[#F97316]/10 ring-1 ring-[#F97316]"
                  : "border-[#1F232C] bg-[#111317] hover:border-slate-700 hover:bg-[#14161C]"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1A1D24] text-white">
                  {p.id === "openai" && <OpenAILogo className="h-5 w-5 text-emerald-400" />}
                  {p.id === "anthropic" && <AnthropicLogo className="h-5 w-5 text-amber-200" />}
                  {p.id === "google" && <GoogleLogo className="h-5 w-5" />}
                  {p.id === "openrouter" && <OpenRouterLogo className="h-5 w-5 text-sky-400" />}
                  {p.id === "deepseek" && <DeepSeekLogo className="h-5 w-5 text-blue-400" />}
                  {p.id === "groq" && <GroqLogo className="h-5 w-5" />}
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                    ativo
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {ativo
                    ? "Ativo"
                    : p.id === "openai" || p.id === "anthropic"
                      ? "Inativo"
                      : "Em breve"}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-sm font-bold text-white">{p.nome}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                  {p.subtitulo}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ───────────────────────────── PAINEL DO PROVEDOR OPENAI ───────────────────────────── */}
      {provedorSelecionado === "openai" ? (
        <div className="space-y-6">
          {/* Header do Provedor Selecionado */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#20242E] bg-[#12141A] p-5 md:flex-row md:items-center md:justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#10A37F] text-white shadow-md shadow-[#10A37F]/25">
                <OpenAILogo className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">OpenAI</h2>
                <p className="text-xs text-slate-400">
                  Modelos GPT para texto, visão, multimodal e ferramentas.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded bg-[#1A1D25] border border-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    📄 Texto
                  </span>
                  <span className="rounded bg-[#1A1D25] border border-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    👁️ Visão
                  </span>
                  <span className="rounded bg-[#1A1D25] border border-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    🖼️ Imagem
                  </span>
                  <span className="rounded bg-[#1A1D25] border border-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    🎙️ Áudio
                  </span>
                  <span className="rounded bg-[#1A1D25] border border-slate-700/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                    🔧 Ferramentas
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  openaiEstado?.ativo
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-slate-700 bg-slate-800 text-slate-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${openaiEstado?.ativo ? "bg-emerald-400" : "bg-slate-500"}`}
                />
                {openaiEstado?.ativo ? "Provedor ativo" : "Provedor inativo"}
              </span>

              <a
                href="https://platform.openai.com/docs"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2B303C] bg-[#161820] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
              >
                Documentação <ExternalLink className="h-3 w-3" />
              </a>

              <button
                type="button"
                disabled={Boolean(ocupado)}
                onClick={handleTestarConexao}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2B303C] bg-[#161820] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {ocupado === "testar" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Teste de conexão
              </button>

              <button
                type="button"
                disabled={Boolean(ocupado)}
                onClick={() => handleToggleProvedor("openai", !openaiEstado?.ativo)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#F97316]/20 transition-all disabled:opacity-60"
              >
                {openaiEstado?.ativo ? "Desativar provedor" : "Ativar provedor"}
              </button>
            </div>
          </div>

          {/* Grid de Configurações: API (Esquerda) e Globais (Direita) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Card Esquerdo: Configuração da API */}
            <div className="rounded-2xl border border-[#20242E] bg-[#12141A] p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Configuração da API</h3>
                  <p className="text-[11px] text-slate-400">
                    Adicione sua chave da OpenAI de forma segura.
                  </p>
                </div>
              </div>

              {/* Campo: Chave da API */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Chave da API</label>
                <div className="relative">
                  {/* type="password" */}
                  <input
                    type={verChave ? "text" : "password"}
                    autoComplete="off"
                    value={chave}
                    onChange={(e) => setChave(e.target.value)}
                    placeholder={
                      openaiEstado?.chave.origem === "cofre"
                        ? (openaiEstado.chave.mascarada ?? "Chave salva no cofre")
                        : openaiEstado?.chave.origem === "ambiente"
                          ? "Chave do ambiente do servidor (não exibida)"
                          : "sk-proj-..."
                    }
                    className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 pr-10 font-mono text-xs text-white placeholder:text-slate-500 focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  />
                  <button
                    type="button"
                    onClick={() => setVerChave(!verChave)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {verChave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Status de Conexão (estado real devolvido pelo servidor) */}
              <div
                className={`flex items-center justify-between rounded-xl border p-3.5 ${
                  conexaoInfo.tom === "ok"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : conexaoInfo.tom === "erro"
                      ? "border-red-500/30 bg-red-500/10"
                      : "border-slate-700 bg-slate-800/40"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {conexaoInfo.tom === "ok" ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle
                      className={`h-5 w-5 shrink-0 ${conexaoInfo.tom === "erro" ? "text-red-400" : "text-slate-400"}`}
                    />
                  )}
                  <div>
                    <p className="text-xs font-bold text-white">{conexaoInfo.rotulo}</p>
                    <p className="text-[11px] text-slate-400">
                      {openaiEstado?.conexao_detalhe ?? mensagemConexao}
                      {openaiEstado?.conexao_verificada_em
                        ? ` · ${new Date(openaiEstado.conexao_verificada_em).toLocaleString("pt-BR")}`
                        : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={Boolean(ocupado)}
                  onClick={handleTestarConexao}
                  className="rounded-lg border border-[#F97316]/50 bg-transparent px-3 py-1.5 text-xs font-semibold text-[#F97316] hover:bg-[#F97316]/10 transition-colors disabled:opacity-50"
                >
                  {ocupado === "conectar" || ocupado === "testar" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Salvar e verificar"
                  )}
                </button>
              </div>

              {/* Campo: Organização (opcional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Organização (opcional)</label>
                <input
                  type="text"
                  value={organizacao}
                  disabled
                  onChange={(e) => setOrganizacao(e.target.value)}
                  placeholder="org-xxxxxxxxx"
                  className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-xs text-white placeholder:text-slate-500 focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                />
                <p className="text-[11px] text-slate-500">
                  Em breve: ainda não é enviado à OpenAI.
                </p>
              </div>
            </div>

            {/* Card Direito: Configurações Globais */}
            <div className="rounded-2xl border border-[#20242E] bg-[#12141A] p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
                  <Sliders className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Configurações globais</h3>
                  <p className="text-[11px] text-slate-400">
                    Defina limites de uso e comportamento para toda a plataforma.
                  </p>
                </div>
              </div>

              {/* Limites e modelos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Limite diário */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Limite diário (US$)</label>
                  <input
                    type="text"
                    value={limiteDiario}
                    onChange={(e) => setLimiteDiario(e.target.value)}
                    onBlur={handleSalvarLimites}
                    className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-xs text-white focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  />
                </div>

                {/* Limite mensal */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Limite mensal (US$)</label>
                  <input
                    type="text"
                    value={limiteMensal}
                    onChange={(e) => setLimiteMensal(e.target.value)}
                    onBlur={handleSalvarLimites}
                    className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-xs text-white focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  />
                </div>

                {/* Modelo padrão */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Modelo padrão</label>
                  <SeletorModelo
                    valor={modeloPadrao}
                    opcoes={opcoesCeo}
                    ocupado={Boolean(ocupado)}
                    vazio="Habilite e precifique um modelo de texto"
                    onTrocar={(v) => void handleTrocarModelo("modelo_padrao", v)}
                  />
                  <p className="text-[10px] text-slate-500">Modelo padrão para agentes em geral.</p>
                </div>

                {/* Modelo do CEO Mestre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Modelo do CEO Mestre</label>
                  <SeletorModelo
                    valor={modeloCeo}
                    opcoes={opcoesCeo}
                    ocupado={Boolean(ocupado)}
                    vazio="Habilite e precifique um modelo de texto"
                    onTrocar={(v) => void handleTrocarModelo("modelo_ceo", v)}
                  />
                  <p className="text-[10px] text-slate-500">
                    {opcoesCeo.length === 0
                      ? "Nenhum modelo elegível ainda: na tabela abaixo, informe o preço e habilite um modelo de texto."
                      : "Só modelos de texto com ferramentas, habilitados e com preço. Não é trocado automaticamente."}
                  </p>
                </div>
              </div>

              {/* Capacidades independentes */}
              <div className="space-y-3 border-t border-[#1F232D] pt-4">
                <div>
                  <p className="text-xs font-semibold text-white">Modelos por capacidade</p>
                  <p className="text-[10px] text-slate-400">
                    Cada capacidade é independente. Só aparecem modelos habilitados da categoria
                    certa; nenhuma é ligada sozinha.
                  </p>
                </div>
                {!catalogoMigrado && (
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                    Disponível após a publicação do catálogo completo (migration pendente de
                    autorização).
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CAPACIDADES.map((cap) => (
                    <div key={cap} className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-300">
                        {ROTULO_CAPACIDADE[cap]}
                      </label>
                      <SeletorModelo
                        valor={porCapacidade[cap] ?? ""}
                        opcoes={opcoesCapacidade(cap)}
                        ocupado={Boolean(ocupado) || !catalogoMigrado}
                        vazio="Nenhum modelo habilitado nesta categoria"
                        limpavel
                        onTrocar={(v) => void handleTrocarCapacidade(cap, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Fallback autorizado & registro de eventos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1F232D] pt-4">
                {/* Fallback automático */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fallbackAtivo}
                    disabled={Boolean(ocupado)}
                    onClick={() => void handleToggleFallback()}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                      fallbackAtivo ? "bg-[#F97316]" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                        fallbackAtivo ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-xs font-semibold text-white">Fallback automático</p>
                    <p className="text-[10px] text-slate-400">
                      Claude Haiku só em falha transitória da OpenAI.
                    </p>
                  </div>
                </div>

                {/* Registro de eventos: sempre ativo (auditoria), não é uma opção */}
                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                    Sempre ativo
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-white">Histórico de alterações</p>
                    <p className="text-[10px] text-slate-400">
                      Toda mudança fica registrada (veja abaixo).
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert Info Box (Cofre AES-256-GCM) */}
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-xs text-blue-300">
                <Info className="h-4 w-4 shrink-0 text-blue-400" />
                <span>
                  As chaves são armazenadas de forma segura no{" "}
                  <strong className="underline text-blue-200">cofre AES-256-GCM</strong>. Apenas o
                  Super Admin pode gerenciar.
                </span>
              </div>
            </div>
          </div>

          {/* ───────────────────────────── CATÁLOGO DE MODELOS (DINÂMICO) ───────────────────────────── */}
          <div className="rounded-2xl border border-[#20242E] bg-[#12141A] p-6 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Modelos disponíveis</h3>
                  <p className="text-[11px] text-slate-400">
                    Catálogo lido da API da OpenAI para a sua chave. Preços em US$ por 1M de tokens
                    (ou na unidade indicada).
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={Boolean(ocupado)}
                onClick={() => void handleSincronizar()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2B303C] bg-[#161820] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-50"
              >
                {ocupado === "sincronizar" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Atualizar modelos
              </button>
            </div>

            {/* Resumo e última sincronização */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
              <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1">
                {resumoCatalogo.total} no catálogo
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1">
                {resumoCatalogo.disponiveis} disponíveis na API
              </span>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400">
                {resumoCatalogo.habilitados} habilitados
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1">
                {resumoCatalogo.homologados} homologados
              </span>
              <span className="ml-auto">
                Última sincronização:{" "}
                {openaiEstado?.catalogo_sincronizado_em
                  ? new Date(openaiEstado.catalogo_sincronizado_em).toLocaleString("pt-BR")
                  : "nunca sincronizado"}
              </span>
            </div>

            {!catalogoMigrado && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-[11px] text-amber-300">
                O catálogo completo ainda não foi publicado no banco. A classificação abaixo é
                inferida do ID neste navegador e a sincronização completa fica indisponível até a
                migration ser autorizada.
              </p>
            )}

            {/* Busca e filtros */}
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                type="search"
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por nome ou ID…"
                className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 text-xs text-white placeholder:text-slate-500 focus:border-[#F97316] focus:outline-none lg:max-w-xs"
              />
              <select
                value={filtroStatus}
                onChange={(e) => {
                  setFiltroStatus(e.target.value as FiltroStatus);
                  setPagina(1);
                }}
                className="h-9 rounded-lg border border-[#252936] bg-[#0E1015] px-3 text-xs text-white focus:border-[#F97316] focus:outline-none"
              >
                <option value="todos">Todos os status</option>
                <option value="habilitados">Habilitados</option>
                <option value="desabilitados">Desabilitados</option>
                <option value="sem_preco">Preço não configurado</option>
                <option value="novos">Novos (7 dias)</option>
                <option value="indisponiveis">Indisponíveis</option>
              </select>
              <span className="text-[11px] text-slate-400">
                {linhasFiltradas.length} de {resumoCatalogo.total} modelos
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(["todas", ...CATEGORIAS] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setFiltroCategoria(c);
                    setPagina(1);
                  }}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    filtroCategoria === c
                      ? "border-[#F97316] bg-[#F97316]/15 text-white"
                      : "border-slate-700 bg-[#161820] text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {c === "todas" ? "Todos" : ROTULO_CATEGORIA[c]} ({contagemCategoria[c]})
                </button>
              ))}
            </div>

            {/* Tabela Responsiva */}
            <div className="overflow-x-auto rounded-xl border border-[#1E222B]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161820] text-slate-400 border-b border-[#1E222B] uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Modelo</th>
                    <th className="py-3 px-4">Categorias</th>
                    <th className="py-3 px-4">Contexto</th>
                    <th className="py-3 px-4">Entrada (US$/1M tok)</th>
                    <th className="py-3 px-4">Saída (US$/1M tok)</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Habilitado</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B1E26] text-slate-200">
                  {paginaAtual.itens.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 px-4 text-center text-slate-400">
                        {resumoCatalogo.total === 0
                          ? "Nenhum modelo sincronizado ainda. Conecte a chave e use “Atualizar modelos”."
                          : "Nenhum modelo para este filtro."}
                      </td>
                    </tr>
                  )}
                  {paginaAtual.itens.map((m) => {
                    const aberto = expandido === m.id;
                    const semTokens = m.usd_in_mtok === null && m.usd_out_mtok === null;
                    const extra = m.precosExtra[0];
                    return (
                      <Fragment key={m.id}>
                        <tr className="hover:bg-[#161820]/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => setExpandido(aberto ? null : m.id)}
                              aria-expanded={aberto}
                              className="flex items-center gap-3 text-left"
                            >
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">
                                <OpenAILogo className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-white font-mono">{m.id}</p>
                                <p className="text-[11px] text-slate-400">
                                  {m.rotulo && m.rotulo !== m.id ? m.rotulo : (m.familia ?? "—")}
                                </p>
                              </div>
                              <ChevronRight
                                className={`h-3.5 w-3.5 text-slate-500 transition-transform ${aberto ? "rotate-90" : ""}`}
                              />
                            </button>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {m.categorias.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="rounded bg-[#1A1D24] border border-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                                >
                                  {ROTULO_CATEGORIA[t]}
                                </span>
                              ))}
                              {m.categorias.length > 3 && (
                                <span className="text-[10px] text-slate-500">
                                  +{m.categorias.length - 3}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {formatarContexto(m.contextoTokens)}
                          </td>

                          <td className="py-3.5 px-4 font-mono text-slate-200">
                            {semTokens && extra
                              ? `US$ ${extra.usd} ${ROTULO_UNIDADE[extra.unidade]}`
                              : formatarPrecoMtok(m.usd_in_mtok)}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-200">
                            {semTokens ? "—" : formatarPrecoMtok(m.usd_out_mtok)}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                m.estado === "indisponivel"
                                  ? "border-red-500/40 bg-red-500/10 text-red-400"
                                  : m.estado === "habilitado" || m.estado === "homologado"
                                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                                    : m.estado === "sem_preco"
                                      ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                                      : "border-slate-700 bg-slate-800 text-slate-300"
                              }`}
                            >
                              {ROTULO_ESTADO[m.estado]}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={m.ativo}
                              aria-label={`Habilitar ${m.id}`}
                              disabled={Boolean(ocupado) || m.disponibilidade === "indisponivel"}
                              onClick={() => void handleToggleModelo(m)}
                              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                                m.ativo ? "bg-emerald-500" : "bg-slate-700"
                              }`}
                            >
                              <span
                                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-md transition-transform ${
                                  m.ativo ? "translate-x-[18px]" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarModelo(m)}
                              className="inline-flex items-center gap-1 rounded-md border border-[#2B303C] bg-[#161820] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-[#F97316]/50 hover:text-white transition-colors"
                            >
                              <Sliders className="h-3 w-3" /> Configurar
                            </button>
                          </td>
                        </tr>

                        {aberto && (
                          <tr className="bg-[#0F1117]">
                            <td colSpan={8} className="px-4 py-4">
                              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-[11px] sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                  <dt className="text-slate-500">Classificação</dt>
                                  <dd className="text-slate-200">
                                    {m.classificacao === "manual"
                                      ? "Ajustada manualmente"
                                      : "Inferida do ID — confirme na documentação"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Endpoint compatível</dt>
                                  <dd className="font-mono text-slate-200">{m.endpoint}</dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Entrada → saída</dt>
                                  <dd className="text-slate-200">
                                    {m.modalidadesEntrada.join(", ")} →{" "}
                                    {m.modalidadesSaida.join(", ")}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Família / snapshot</dt>
                                  <dd className="font-mono text-slate-200">
                                    {m.familia ?? "—"} / {m.snapshot ?? "alias (sem data)"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Contexto / saída máxima</dt>
                                  <dd className="text-slate-200">
                                    {formatarContexto(m.contextoTokens)} /{" "}
                                    {formatarContexto(m.saidaMaxTokens)}
                                    {m.contextoTokens === null && " (não informado)"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">
                                    Uso no CEO (texto + ferramentas)
                                  </dt>
                                  <dd className="text-slate-200">
                                    {m.chatCeo ? "Compatível" : "Não compatível"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Preço</dt>
                                  <dd className="text-slate-200">
                                    {m.semPreco
                                      ? "Não configurado"
                                      : `${m.precoOrigem === "manual" ? "Manual" : (m.precoOrigem ?? "Informado")}${
                                          m.precoAtualizadoEm
                                            ? ` em ${new Date(m.precoAtualizadoEm).toLocaleDateString("pt-BR")}`
                                            : ""
                                        }`}
                                    {m.precoFonte ? ` — fonte: ${m.precoFonte}` : ""}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Visto na API</dt>
                                  <dd className="text-slate-200">
                                    {m.vistoEm ? new Date(m.vistoEm).toLocaleString("pt-BR") : "—"}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="text-slate-500">Homologação funcional</dt>
                                  <dd className="text-slate-200">
                                    {m.homologadoEm
                                      ? new Date(m.homologadoEm).toLocaleString("pt-BR")
                                      : "Não realizada (exige teste pago autorizado)"}
                                  </dd>
                                </div>
                                {m.precosExtra.length > 0 && (
                                  <div className="sm:col-span-2 lg:col-span-3">
                                    <dt className="text-slate-500">Preços adicionais</dt>
                                    <dd className="text-slate-200">
                                      {m.precosExtra
                                        .map(
                                          (p) =>
                                            `${p.item}: US$ ${p.usd} ${ROTULO_UNIDADE[p.unidade]} (${p.modo})`,
                                        )
                                        .join(" · ")}
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {paginaAtual.paginas > 1 && (
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Página {paginaAtual.pagina} de {paginaAtual.paginas}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={paginaAtual.pagina <= 1}
                    onClick={() => setPagina(paginaAtual.pagina - 1)}
                    className="rounded-md border border-[#2B303C] bg-[#161820] px-3 py-1 text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={paginaAtual.pagina >= paginaAtual.paginas}
                    onClick={() => setPagina(paginaAtual.pagina + 1)}
                    className="rounded-md border border-[#2B303C] bg-[#161820] px-3 py-1 text-slate-300 hover:text-white disabled:opacity-40"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ───────────────────────────── HISTÓRICO DE ALTERAÇÕES ───────────────────────────── */}
          <details className="rounded-2xl border border-[#20242E] bg-[#12141A] p-5 shadow-sm">
            <summary className="flex cursor-pointer items-center gap-2 text-sm font-bold text-white">
              <ScrollText className="h-4 w-4 text-[#F97316]" /> Histórico de alterações
            </summary>
            <ul className="mt-3 space-y-1.5 text-[11px] text-slate-300">
              {(central && central.disponivel ? central.eventos : []).length === 0 && (
                <li className="text-slate-500">Nenhum evento registrado.</li>
              )}
              {(central && central.disponivel ? central.eventos : []).slice(0, 30).map((ev) => (
                <li key={ev.id} className="flex flex-wrap gap-x-3 border-b border-[#1B1E26] pb-1.5">
                  <span className="text-slate-500">
                    {new Date(ev.criado_em).toLocaleString("pt-BR")}
                  </span>
                  <span className="font-semibold text-white">{ev.tipo}</span>
                  {ev.status && <span className="text-slate-400">{ev.status}</span>}
                  {ev.detalhe && <span className="text-slate-300">{ev.detalhe}</span>}
                </li>
              ))}
            </ul>
          </details>
        </div>
      ) : provedorSelecionado === "anthropic" ? (
        /* ───────────────────────────── PAINEL ANTHROPIC (PRESERVADO) ───────────────────────────── */
        <div className="rounded-2xl border border-[#20242E] bg-[#12141A] p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-900/40 text-amber-200 border border-amber-800/50">
                <AnthropicLogo className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Anthropic (Claude)</h3>
                <p className="text-xs text-slate-400">Integração nativa operacional preservada.</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Provedor ativo
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            A integração da Anthropic continua operacional para o CEO Mestre e agentes através da
            infraestrutura existente. Para alternar o provedor principal para Anthropic, configure o
            seletor em Configurações Globais.
          </p>
        </div>
      ) : (
        /* ───────────────────────────── DEMAIS PROVEDORES (PREPARADOS) ───────────────────────────── */
        <div className="rounded-2xl border border-[#20242E] bg-[#12141A] p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A1D24] text-slate-400 border border-slate-700/60">
            {provedorSelecionado === "google" && <GoogleLogo className="h-8 w-8" />}
            {provedorSelecionado === "openrouter" && (
              <OpenRouterLogo className="h-8 w-8 text-sky-400" />
            )}
            {provedorSelecionado === "deepseek" && (
              <DeepSeekLogo className="h-8 w-8 text-blue-400" />
            )}
            {provedorSelecionado === "groq" && <GroqLogo className="h-8 w-8" />}
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white capitalize">{provedorSelecionado}</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Este provedor está preparado na arquitetura central de IA para ativação futura.
              Conforme as diretrizes desta etapa, apenas a OpenAI está conectada e operacional para
              o CEO Mestre.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/60 px-3 py-1 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
            Serviço preparado para homologação futura
          </div>
        </div>
      )}

      {/* ───────────────────────────── MODAL DE CONFIGURAÇÃO DE MODELO ───────────────────────────── */}
      {modeloEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in-0">
          <div className="max-h-[90vh] w-full max-w-lg space-y-5 overflow-y-auto rounded-2xl border border-[#252936] bg-[#14161E] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#20242E] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white font-mono">{modeloEditando.id}</h4>
                  <p className="text-xs text-slate-400">
                    Configuração de parâmetros e precificação
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModeloEditando(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Rótulo */}
              <div className="space-y-1.5">
                <label className="font-medium text-slate-300">Rótulo / Descrição</label>
                <input
                  type="text"
                  value={editRotulo}
                  onChange={(e) => setEditRotulo(e.target.value)}
                  className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 text-white focus:border-[#F97316] focus:outline-none"
                />
              </div>

              {/* Categorias (ajuste manual da classificação inferida) */}
              {catalogoMigrado && (
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Categorias</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIAS.map((c) => {
                      const marcada = editCategorias.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          aria-pressed={marcada}
                          onClick={() =>
                            setEditCategorias(
                              marcada
                                ? editCategorias.filter((x) => x !== c)
                                : [...editCategorias, c],
                            )
                          }
                          className={`rounded-full border px-2.5 py-1 text-[11px] ${
                            marcada
                              ? "border-[#F97316] bg-[#F97316]/15 text-white"
                              : "border-slate-700 bg-[#161820] text-slate-400"
                          }`}
                        >
                          {ROTULO_CATEGORIA[c]}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {modeloEditando.classificacao === "manual"
                      ? "Classificação ajustada por você; a sincronização não a sobrescreve."
                      : "Inferida do ID. Se alterar, passa a ser manual e a sincronização a preserva."}
                  </p>
                </div>
              )}

              {/* Preços por 1M de tokens */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Entrada — US$ / 1M tokens</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editPrecoIn}
                    onChange={(e) => {
                      setEditPrecoIn(e.target.value);
                      setConfirmandoPreco(false);
                    }}
                    className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-white focus:border-[#F97316] focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Saída — US$ / 1M tokens</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={editPrecoOut}
                    onChange={(e) => {
                      setEditPrecoOut(e.target.value);
                      setConfirmandoPreco(false);
                    }}
                    className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-white focus:border-[#F97316] focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500">
                Use o valor publicado pela OpenAI por 1 milhão de tokens. Em branco = sem preço
                (modelo não pode ser habilitado para texto). O valor fica registrado como “manual”.
              </p>

              {/* Preços adicionais: cache, áudio, imagem, vídeo, ferramentas */}
              {catalogoMigrado && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-slate-300">Preços adicionais</label>
                    <button
                      type="button"
                      disabled={editExtras.length >= 20}
                      onClick={() => {
                        setEditExtras([
                          ...editExtras,
                          { item: "entrada_cache", unidade: "1M_tokens", usd: "", modo: "padrao" },
                        ]);
                        setConfirmandoPreco(false);
                      }}
                      className="rounded-md border border-[#2B303C] bg-[#161820] px-2 py-1 text-[11px] text-slate-300 hover:text-white"
                    >
                      + Adicionar
                    </button>
                  </div>
                  {editExtras.map((e, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_80px_90px_auto] gap-1.5">
                      <select
                        value={e.item}
                        onChange={(ev) => {
                          setEditExtras(
                            editExtras.map((x, j) =>
                              j === i ? { ...x, item: ev.target.value } : x,
                            ),
                          );
                          setConfirmandoPreco(false);
                        }}
                        className="h-8 rounded-md border border-[#252936] bg-[#0E1015] px-1 text-white"
                      >
                        {ITENS_PRECO.map((it) => (
                          <option key={it} value={it}>
                            {it}
                          </option>
                        ))}
                      </select>
                      <select
                        value={e.unidade}
                        onChange={(ev) => {
                          setEditExtras(
                            editExtras.map((x, j) =>
                              j === i ? { ...x, unidade: ev.target.value } : x,
                            ),
                          );
                          setConfirmandoPreco(false);
                        }}
                        className="h-8 rounded-md border border-[#252936] bg-[#0E1015] px-1 text-white"
                      >
                        {UNIDADES_PRECO.map((u) => (
                          <option key={u} value={u}>
                            {ROTULO_UNIDADE[u]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={e.usd}
                        placeholder="US$"
                        onChange={(ev) => {
                          setEditExtras(
                            editExtras.map((x, j) =>
                              j === i ? { ...x, usd: ev.target.value } : x,
                            ),
                          );
                          setConfirmandoPreco(false);
                        }}
                        className="h-8 rounded-md border border-[#252936] bg-[#0E1015] px-2 font-mono text-white"
                      />
                      <select
                        value={e.modo}
                        onChange={(ev) => {
                          setEditExtras(
                            editExtras.map((x, j) =>
                              j === i ? { ...x, modo: ev.target.value } : x,
                            ),
                          );
                          setConfirmandoPreco(false);
                        }}
                        className="h-8 rounded-md border border-[#252936] bg-[#0E1015] px-1 text-white"
                      >
                        {MODOS_PROCESSAMENTO.map((mo) => (
                          <option key={mo} value={mo}>
                            {mo}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label="Remover preço"
                        onClick={() => {
                          setEditExtras(editExtras.filter((_, j) => j !== i));
                          setConfirmandoPreco(false);
                        }}
                        className="px-1 text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {editExtras.length === 0 && (
                    <p className="text-[10px] text-slate-500">
                      Modelos de imagem, áudio, voz ou vídeo precisam de ao menos um preço na
                      unidade que cobram.
                    </p>
                  )}
                </div>
              )}

              {/* Limites e fonte */}
              {catalogoMigrado && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Contexto (tokens)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editContexto}
                      placeholder="não informado"
                      onChange={(e) => setEditContexto(e.target.value)}
                      className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-white focus:border-[#F97316] focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-slate-300">Saída máxima (tokens)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editSaidaMax}
                      placeholder="não informado"
                      onChange={(e) => setEditSaidaMax(e.target.value)}
                      className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-white focus:border-[#F97316] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="font-medium text-slate-300">Fonte do preço</label>
                    <input
                      type="text"
                      value={editFonte}
                      placeholder="ex.: página oficial de preços da OpenAI, consultada em…"
                      onChange={(e) => setEditFonte(e.target.value)}
                      className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 text-white focus:border-[#F97316] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Status Ativo */}
              <div className="flex items-center justify-between border-t border-[#20242E] pt-3">
                <div>
                  <p className="font-medium text-white">Modelo habilitado</p>
                  <p className="text-[11px] text-slate-400">
                    Permitir o uso deste modelo na plataforma. Estar na API não o habilita.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editAtivo}
                  onClick={() => setEditAtivo(!editAtivo)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                    editAtivo ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                      editAtivo ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {confirmandoPreco && (
                <p className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] text-amber-300">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Este modelo já tem preço cadastrado. Clique em “Confirmar alteração de preço” para
                  sobrescrevê-lo.
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#20242E] pt-4">
              <button
                type="button"
                onClick={() => setModeloEditando(null)}
                className="rounded-lg border border-[#2B303C] px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={ocupado === "salvar-modelo-modal"}
                onClick={() => void handleSalvarEdicaoModelo()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-[#F97316]/20 transition-all disabled:opacity-50"
              >
                {ocupado === "salvar-modelo-modal" && <Loader2 className="h-3 w-3 animate-spin" />}
                {confirmandoPreco ? "Confirmar alteração de preço" : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
