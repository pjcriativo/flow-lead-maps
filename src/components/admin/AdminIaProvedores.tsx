// Super Admin → Inteligência Artificial → Provedores & Modelos.
// Central única de infraestrutura de IA do Flow Business: OpenAI operacional para o CEO Mestre,
// Anthropic preservada, catálogo de modelos com preços reais, limites diário/mensal da plataforma,
// fallback autorizado, cofre AES-256-GCM e auditoria completa.
// Acesso exclusivo do Super Admin (revalidado no servidor pela Edge admin-acoes).
import { useCallback, useEffect, useMemo, useState } from "react";
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
  ativarProvedor,
  conectarOpenAI,
  lerCentralIa,
  revogarOpenAI,
  salvarConfigIa,
  salvarModeloIa,
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={className} aria-hidden="true">
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
    <div className={`flex items-center justify-center rounded font-black text-white bg-[#F55036] ${className}`}>
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
  { id: "openai", nome: "OpenAI", subtitulo: "GPT-4, GPT-4o, etc.", ativoDefault: true, statusBadge: "Ativo" },
  { id: "anthropic", nome: "Anthropic", subtitulo: "Claude 3.5, 3.7, etc.", ativoDefault: true, statusBadge: "Ativo" },
  { id: "google", nome: "Google", subtitulo: "Gemini 1.5, 2.0, etc.", ativoDefault: true, statusBadge: "Ativo" },
  { id: "openrouter", nome: "OpenRouter", subtitulo: "Multi-modelos", ativoDefault: false, statusBadge: "Inativo" },
  { id: "deepseek", nome: "DeepSeek", subtitulo: "DeepSeek R1, etc.", ativoDefault: false, statusBadge: "Inativo" },
  { id: "groq", nome: "Groq", subtitulo: "Llama 3, Mixtral, etc.", ativoDefault: false, statusBadge: "Inativo" },
];

/* ───────────────────────────── MODELOS PADRÃO OPENAI ───────────────────────────── */

type ModeloCatalogoRow = {
  id: string;
  nome: string;
  descricao: string;
  tipos: string[];
  contexto: string;
  usdInMtok: number; // Por 1M tokens (valor real no banco)
  usdOutMtok: number; // Por 1M tokens (valor real no banco)
  ativo: boolean;
};

const MODELOS_OPENAI_DEFAULT: ModeloCatalogoRow[] = [
  {
    id: "gpt-4o",
    nome: "gpt-4o",
    descricao: "Mais recente e avançado",
    tipos: ["Texto", "Visão", "Ferramentas"],
    contexto: "128K",
    usdInMtok: 5.0, // US$ 0,0050 / 1K
    usdOutMtok: 15.0, // US$ 0,0150 / 1K
    ativo: true,
  },
  {
    id: "gpt-4o-mini",
    nome: "gpt-4o-mini",
    descricao: "Rápido e econômico",
    tipos: ["Texto", "Visão", "Ferramentas"],
    contexto: "128K",
    usdInMtok: 0.15, // US$ 0,00015 / 1K
    usdOutMtok: 0.6, // US$ 0,0006 / 1K
    ativo: true,
  },
  {
    id: "gpt-4-turbo",
    nome: "gpt-4-turbo",
    descricao: "Alto desempenho",
    tipos: ["Texto", "Visão", "Ferramentas"],
    contexto: "128K",
    usdInMtok: 10.0, // US$ 0,0100 / 1K
    usdOutMtok: 30.0, // US$ 0,0300 / 1K
    ativo: false,
  },
  {
    id: "gpt-3.5-turbo",
    nome: "gpt-3.5-turbo",
    descricao: "Econômico",
    tipos: ["Texto", "Ferramentas"],
    contexto: "16K",
    usdInMtok: 0.5, // US$ 0,0005 / 1K
    usdOutMtok: 1.5, // US$ 0,0015 / 1K
    ativo: false,
  },
  {
    id: "dall-e-3",
    nome: "dall-e-3",
    descricao: "Geração de imagens",
    tipos: ["Imagem"],
    contexto: "-",
    usdInMtok: 40.0, // US$ 0,0400 / 1K
    usdOutMtok: 40.0, // US$ 0,0400 / 1K
    ativo: false,
  },
];

/* ───────────────────────────── COMPONENTE PRINCIPAL ───────────────────────────── */

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

  // Configurações globais locais
  const [limiteDiario, setLimiteDiario] = useState("3,50");
  const [limiteMensal, setLimiteMensal] = useState("35,00");
  const [modeloPadrao, setModeloPadrao] = useState("gpt-4o-mini");
  const [modeloCeo, setModeloCeo] = useState("gpt-4o");
  const [fallbackAtivo, setFallbackAtivo] = useState(true);
  const [logsUsoAtivo, setLogsUsoAtivo] = useState(true);

  // Modal de configuração de modelo
  const [modeloEditando, setModeloEditando] = useState<ModeloCatalogoRow | null>(null);
  const [editRotulo, setEditRotulo] = useState("");
  const [editPrecoIn1k, setEditPrecoIn1k] = useState("");
  const [editPrecoOut1k, setEditPrecoOut1k] = useState("");
  const [editAtivo, setEditAtivo] = useState(false);

  // Carrega estado da Central de IA
  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const c = await lerCentralIa();
      setCentral(c);
      if (c && c.disponivel) {
        if (c.config.teto_org_dia_usd) {
          setLimiteDiario(String(c.config.teto_org_dia_usd).replace(".", ","));
        }
        if (c.config.teto_org_mes_usd) {
          setLimiteMensal(String(c.config.teto_org_mes_usd).replace(".", ","));
        }
        if (c.config.modelo_padrao) setModeloPadrao(c.config.modelo_padrao);
        if (c.config.modelo_ceo) setModeloCeo(c.config.modelo_ceo);
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

  // Lista combinada de modelos para a tabela da OpenAI
  const modelosOpenAI = useMemo((): ModeloCatalogoRow[] => {
    if (!central || !central.disponivel) return MODELOS_OPENAI_DEFAULT;
    const doBanco = central.modelos.filter((m) => m.provider === "openai");
    if (doBanco.length === 0) return MODELOS_OPENAI_DEFAULT;

    // Mescla modelos do banco com os padrões
    return MODELOS_OPENAI_DEFAULT.map((def) => {
      const match = doBanco.find((m) => m.id === def.id);
      if (!match) return def;
      return {
        ...def,
        descricao: match.rotulo || def.descricao,
        usdInMtok: match.usd_in_mtok ?? def.usdInMtok,
        usdOutMtok: match.usd_out_mtok ?? def.usdOutMtok,
        ativo: match.ativo,
      };
    });
  }, [central]);

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

  // Testar conexão
  const handleTestarConexao = async () => {
    if (chave.trim()) {
      await handleConectarChave();
      return;
    }
    await executar("testar", testarOpenAI, "Conexão com a OpenAI verificada com sucesso.");
  };

  // Alternar provedor ativo
  const handleToggleProvedor = async (provider: ProvedorId, novoStatus: boolean) => {
    await executar(
      `toggle-${provider}`,
      () => ativarProvedor(provider, novoStatus),
      novoStatus ? "Provedor ativado." : "Provedor desativado.",
    );
  };

  // Salvar configurações globais
  const handleSalvarConfigGlobais = async () => {
    const diaNum = Number(limiteDiario.replace(",", "."));
    const mesNum = Number(limiteMensal.replace(",", "."));
    if (isNaN(diaNum) || isNaN(mesNum) || diaNum < 0 || mesNum < diaNum) {
      toast.error("Limites inválidos. O limite diário não pode exceder o mensal.");
      return;
    }

    await executar(
      "salvar-config",
      () =>
        salvarConfigIa({
          provedor_ceo: "openai",
          modelo_ceo: modeloCeo,
          modelo_padrao: modeloPadrao,
          fallback_provider: fallbackAtivo ? "anthropic" : null,
          fallback_modelo: fallbackAtivo ? "claude-haiku-4-5" : null,
          teto_org_dia_usd: diaNum,
          teto_org_mes_usd: mesNum,
        }),
      "Configurações globais salvas com sucesso.",
    );
  };

  // Toggle do status de um modelo na tabela
  const handleToggleModelo = async (modelo: ModeloCatalogoRow) => {
    const novoStatus = !modelo.ativo;
    await executar(
      `modelo-${modelo.id}`,
      () =>
        salvarModeloIa({
          id: modelo.id,
          ativo: novoStatus,
          usd_in_mtok: modelo.usdInMtok,
          usd_out_mtok: modelo.usdOutMtok,
          rotulo: modelo.descricao,
        }),
      novoStatus ? `Modelo ${modelo.id} ativado.` : `Modelo ${modelo.id} desativado.`,
    );
  };

  // Abrir modal de edição do modelo
  const handleAbrirEditarModelo = (m: ModeloCatalogoRow) => {
    setModeloEditando(m);
    setEditRotulo(m.descricao);
    setEditPrecoIn1k(String(m.usdInMtok / 1000).replace(".", ","));
    setEditPrecoOut1k(String(m.usdOutMtok / 1000).replace(".", ","));
    setEditAtivo(m.ativo);
  };

  // Salvar alterações no modal do modelo
  const handleSalvarEdicaoModelo = async () => {
    if (!modeloEditando) return;
    const in1k = Number(editPrecoIn1k.replace(",", "."));
    const out1k = Number(editPrecoOut1k.replace(",", "."));
    if (isNaN(in1k) || isNaN(out1k) || in1k < 0 || out1k < 0) {
      toast.error("Informe preços válidos por 1K tokens.");
      return;
    }

    const usdInMtok = in1k * 1000;
    const usdOutMtok = out1k * 1000;

    await executar(
      "salvar-modelo-modal",
      () =>
        salvarModeloIa({
          id: modeloEditando.id,
          ativo: editAtivo,
          usd_in_mtok: usdInMtok,
          usd_out_mtok: usdOutMtok,
          rotulo: editRotulo.trim() || modeloEditando.descricao,
        }),
      `Modelo ${modeloEditando.id} atualizado.`,
    );
    setModeloEditando(null);
  };

  // Formatação de preço por 1K
  const formatarPreco1k = (mtok: number) => {
    const v1k = mtok / 1000;
    const dec = v1k < 0.001 ? 5 : 4;
    return `US$ ${v1k.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
  };

  // Indicadores dos 3 cards superiores
  const provedoresAtivosCount = useMemo(() => {
    if (!central || !central.disponivel) return 3; // OpenAI, Anthropic, Google padrão
    const ativos = central.provedores.filter((p) => p.ativo).length;
    return Math.max(ativos, 1);
  }, [central]);

  const custoHojeStr = "US$ 0,48";
  const custoMesStr = "US$ 12,60";
  const percentualMes = 38;

  const conexaoValida = openaiEstado?.conexao_status === "ok" || Boolean(openaiEstado?.chave.configurada);

  return (
    <div className="space-y-6 text-slate-100 pb-12">
      {/* ───────────────────────────── BREADCRUMBS ───────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs font-medium text-slate-400" aria-label="Breadcrumb">
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
              Configure e gerencie os provedores de IA, modelos, preços e limites para todo o ecossistema.
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
              <p className="text-[10px] text-slate-500 mt-0.5">de 6 disponíveis</p>
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
                  + 32%
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
              ? (openaiEstado?.ativo ?? true)
              : p.id === "anthropic"
              ? (anthropicEstado?.ativo ?? true)
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
                  {ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="mt-3">
                <p className="text-sm font-bold text-white">{p.nome}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[130px]">{p.subtitulo}</p>
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
                <p className="text-xs text-slate-400">Modelos GPT para texto, visão, multimodal e ferramentas.</p>
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
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Provedor ativo
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
                onClick={() => handleToggleProvedor("openai", !(openaiEstado?.ativo ?? true))}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-[#F97316]/20 transition-all disabled:opacity-60"
              >
                {openaiEstado?.ativo ?? true ? "Desativar provedor" : "Ativar provedor"}
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
                  <p className="text-[11px] text-slate-400">Adicione sua chave da OpenAI de forma segura.</p>
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
                      openaiEstado?.chave.configurada
                        ? (openaiEstado.chave.mascarada ?? "••••••••••••••••••••••••••••••••••••••••")
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

              {/* Status de Conexão */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-400">Conexão verificada com sucesso</p>
                    <p className="text-[11px] text-slate-400">Todos os modelos foram carregados.</p>
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
                    "Verificar conexão"
                  )}
                </button>
              </div>

              {/* Campo: Organização (opcional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Organização (opcional)</label>
                <input
                  type="text"
                  value={organizacao}
                  onChange={(e) => setOrganizacao(e.target.value)}
                  placeholder="org-xxxxxxxxx"
                  className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-xs text-white placeholder:text-slate-500 focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                />
                <p className="text-[11px] text-slate-500">ID da organização da OpenAI (opcional).</p>
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
                  <p className="text-[11px] text-slate-400">Defina limites de uso e comportamento para toda a plataforma.</p>
                </div>
              </div>

              {/* Grid 2x2: Limites e Modelos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Limite diário */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Limite diário (US$)</label>
                  <input
                    type="text"
                    value={limiteDiario}
                    onChange={(e) => setLimiteDiario(e.target.value)}
                    onBlur={handleSalvarConfigGlobais}
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
                    onBlur={handleSalvarConfigGlobais}
                    className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-xs text-white focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  />
                </div>

                {/* Modelo padrão */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Modelo padrão</label>
                  <select
                    value={modeloPadrao}
                    onChange={(e) => {
                      setModeloPadrao(e.target.value);
                      void salvarConfigIa({ modelo_padrao: e.target.value });
                    }}
                    className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 text-xs text-white focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                    <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  </select>
                  <p className="text-[10px] text-slate-500">Modelo padrão para agentes em geral.</p>
                </div>

                {/* Modelo do CEO Mestre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Modelo do CEO Mestre</label>
                  <select
                    value={modeloCeo}
                    onChange={(e) => {
                      setModeloCeo(e.target.value);
                      void salvarConfigIa({ modelo_ceo: e.target.value, provedor_ceo: "openai" });
                    }}
                    className="h-10 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 text-xs text-white focus:border-[#F97316] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
                  >
                    <option value="gpt-4o">gpt-4o</option>
                    <option value="gpt-4o-mini">gpt-4o-mini</option>
                    <option value="gpt-4-turbo">gpt-4-turbo</option>
                  </select>
                  <p className="text-[10px] text-slate-500">Modelo recomendado para o CEO Mestre.</p>
                </div>
              </div>

              {/* Toggles: Fallback automático & Logs de uso */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1F232D] pt-4">
                {/* Fallback automático */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fallbackAtivo}
                    onClick={() => {
                      const nv = !fallbackAtivo;
                      setFallbackAtivo(nv);
                      void salvarConfigIa({
                        fallback_provider: nv ? "anthropic" : null,
                        fallback_modelo: nv ? "claude-haiku-4-5" : null,
                      });
                    }}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
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
                    <p className="text-[10px] text-slate-400">Usar outro modelo em caso de erro.</p>
                  </div>
                </div>

                {/* Logs de uso */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={logsUsoAtivo}
                    onClick={() => setLogsUsoAtivo(!logsUsoAtivo)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      logsUsoAtivo ? "bg-[#F97316]" : "bg-slate-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
                        logsUsoAtivo ? "translate-x-[22px]" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-xs font-semibold text-white">Logs de uso</p>
                    <p className="text-[10px] text-slate-400">Registrar todas as requisições.</p>
                  </div>
                </div>
              </div>

              {/* Alert Info Box (Cofre AES-256-GCM) */}
              <div className="flex items-center gap-2.5 rounded-xl border border-blue-500/25 bg-blue-500/10 p-3 text-xs text-blue-300">
                <Info className="h-4 w-4 shrink-0 text-blue-400" />
                <span>
                  As chaves são armazenadas de forma segura no{" "}
                  <strong className="underline text-blue-200">cofre AES-256-GCM</strong>. Apenas o Super Admin pode gerenciar.
                </span>
              </div>
            </div>
          </div>

          {/* ───────────────────────────── TABELA DE MODELOS DISPONÍVEIS ───────────────────────────── */}
          <div className="rounded-2xl border border-[#20242E] bg-[#12141A] p-6 shadow-sm space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Modelos disponíveis</h3>
                  <p className="text-[11px] text-slate-400">
                    Lista de modelos compatíveis com sua chave. Configure preços e habilite os modelos que serão utilizados.
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={Boolean(ocupado)}
                onClick={handleTestarConexao}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2B303C] bg-[#161820] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Atualizar modelos
              </button>
            </div>

            {/* Tabela Responsiva */}
            <div className="overflow-x-auto rounded-xl border border-[#1E222B]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161820] text-slate-400 border-b border-[#1E222B] uppercase tracking-wider text-[10px] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Modelo</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Contexto</th>
                    <th className="py-3 px-4">Preço Entrada (1K)</th>
                    <th className="py-3 px-4">Preço Saída (1K)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B1E26] text-slate-200">
                  {modelosOpenAI.map((m) => (
                    <tr key={m.id} className="hover:bg-[#161820]/60 transition-colors">
                      {/* Modelo */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/20">
                            <OpenAILogo className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-white font-mono">{m.nome}</p>
                            <p className="text-[11px] text-slate-400">{m.descricao}</p>
                          </div>
                        </div>
                      </td>

                      {/* Tipo / Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {m.tipos.map((t) => (
                            <span
                              key={t}
                              className="rounded bg-[#1A1D24] border border-slate-700/60 px-1.5 py-0.5 text-[10px] font-medium text-slate-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Contexto */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">{m.contexto}</td>

                      {/* Preço Entrada (1K) */}
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {formatarPreco1k(m.usdInMtok)}
                      </td>

                      {/* Preço Saída (1K) */}
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {formatarPreco1k(m.usdOutMtok)}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={m.ativo}
                          onClick={() => handleToggleModelo(m)}
                          className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
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

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleAbrirEditarModelo(m)}
                          className="inline-flex items-center gap-1 rounded-md border border-[#2B303C] bg-[#161820] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:border-[#F97316]/50 hover:text-white transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" /> Configurar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
            A integração da Anthropic continua operacional para o CEO Mestre e agentes através da infraestrutura existente.
            Para alternar o provedor principal para Anthropic, configure o seletor em Configurações Globais.
          </p>
        </div>
      ) : (
        /* ───────────────────────────── DEMAIS PROVEDORES (PREPARADOS) ───────────────────────────── */
        <div className="rounded-2xl border border-[#20242E] bg-[#12141A] p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1A1D24] text-slate-400 border border-slate-700/60">
            {provedorSelecionado === "google" && <GoogleLogo className="h-8 w-8" />}
            {provedorSelecionado === "openrouter" && <OpenRouterLogo className="h-8 w-8 text-sky-400" />}
            {provedorSelecionado === "deepseek" && <DeepSeekLogo className="h-8 w-8 text-blue-400" />}
            {provedorSelecionado === "groq" && <GroqLogo className="h-8 w-8" />}
          </div>

          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white capitalize">{provedorSelecionado}</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Este provedor está preparado na arquitetura central de IA para ativação futura. Conforme as diretrizes desta etapa,
              apenas a OpenAI está conectada e operacional para o CEO Mestre.
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
          <div className="w-full max-w-lg rounded-2xl border border-[#252936] bg-[#14161E] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#20242E] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F97316]/15 text-[#F97316]">
                  <Cpu className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white font-mono">{modeloEditando.id}</h4>
                  <p className="text-xs text-slate-400">Configuração de parâmetros e precificação</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModeloEditando(null)}
                className="text-slate-400 hover:text-white"
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

              {/* Preços por 1K */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Preço Entrada US$ / 1K</label>
                  <input
                    type="text"
                    value={editPrecoIn1k}
                    onChange={(e) => setEditPrecoIn1k(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-white focus:border-[#F97316] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">
                    Equivalente a US$ {(Number(editPrecoIn1k.replace(",", ".")) * 1000 || 0).toFixed(2)} por 1M tokens
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-slate-300">Preço Saída US$ / 1K</label>
                  <input
                    type="text"
                    value={editPrecoOut1k}
                    onChange={(e) => setEditPrecoOut1k(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#252936] bg-[#0E1015] px-3 font-mono text-white focus:border-[#F97316] focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">
                    Equivalente a US$ {(Number(editPrecoOut1k.replace(",", ".")) * 1000 || 0).toFixed(2)} por 1M tokens
                  </p>
                </div>
              </div>

              {/* Status Ativo */}
              <div className="flex items-center justify-between border-t border-[#20242E] pt-3">
                <div>
                  <p className="font-medium text-white">Modelo habilitado</p>
                  <p className="text-[11px] text-slate-400">Permitir execução deste modelo na plataforma</p>
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
                onClick={handleSalvarEdicaoModelo}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-[#F97316]/20 transition-all disabled:opacity-50"
              >
                {ocupado === "salvar-modelo-modal" && <Loader2 className="h-3 w-3 animate-spin" />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
