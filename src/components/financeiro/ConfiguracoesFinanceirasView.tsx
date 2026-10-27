// Tela 06: Configurações Financeiras (Gestão → Financeiro → Configurações)
// Reprodução fiel ao layout da imagem de referência aprovada com máxima fidelidade visual,
// 6 indicadores superiores, 9 abas de configuração, tabela de contas com seleção e detalhes à direita,
// cards inferiores de categorias, formas de pagamento, regras de cobrança, centros de custo, notificações e permissões.

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Banknote,
  Bell,
  Bot,
  Briefcase,
  Building,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Cpu,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  FileCheck,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Filter,
  GraduationCap,
  Headphones,
  History,
  Info,
  KeyRound,
  Landmark,
  Layers,
  Lock,
  Mail,
  Megaphone,
  MoreHorizontal,
  MoreVertical,
  Pencil,
  Percent,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import type { TelaFinanceiroId } from "./FinanceiroSidebarNav";
import {
  CONTAS_FINANCEIRAS_INICIAIS,
  CATEGORIAS_FINANCEIRAS_INICIAIS,
  FORMAS_PAGAMENTO_INICIAIS,
  REGRAS_COBRANCA_INICIAIS,
  CENTROS_CUSTO_INICIAIS,
  NOTIFICACOES_FINANCEIRAS_INICIAIS,
  PERMISSOES_ACESSO_INICIAIS,
  INTEGRACOES_FINANCEIRAS_INICIAIS,
  LOGS_AUDITORIA_INICIAIS,
  type ContaFinanceiraConfig,
  type CategoriaFinanceiraConfig,
  type FormaPagamentoConfig,
  type RegraCobrancaConfig,
  type CentroCustoConfig,
  type NotificacaoFinanceiraConfig,
  type PermissaoFinanceiraConfig,
  type IntegracaoFinanceiraItem,
  type LogAuditoriaItem,
} from "./configuracoes-data";

interface ConfiguracoesFinanceirasViewProps {
  onMudarTela: (tela: TelaFinanceiroId) => void;
}

export type AbaConfiguracao =
  | "contas"
  | "categorias"
  | "formas_pagamento"
  | "regras_cobranca"
  | "centros_custo"
  | "notificacoes"
  | "integracoes"
  | "permissoes"
  | "logs_auditoria";

export function ConfiguracoesFinanceirasView({ onMudarTela }: ConfiguracoesFinanceirasViewProps) {
  // Aba principal de configuração
  const [abaAtiva, setAbaAtiva] = useState<AbaConfiguracao>("contas");

  // Estado das Contas Financeiras
  const [contas, setContas] = useState<ContaFinanceiraConfig[]>(CONTAS_FINANCEIRAS_INICIAIS);
  const [contaSelecionadaId, setContaSelecionadaId] = useState<string>("cta-1");
  const [buscaConta, setBuscaConta] = useState("");
  const [paginaContas, setPaginaContas] = useState(1);

  // Aba interna do painel lateral direito "Detalhes da Conta"
  const [abaDetalheConta, setAbaDetalheConta] = useState<"visao_geral" | "extrato" | "configuracoes" | "integracao">(
    "visao_geral"
  );

  // Estado das Categorias
  const [categorias, setCategorias] = useState<CategoriaFinanceiraConfig[]>(CATEGORIAS_FINANCEIRAS_INICIAIS);
  const [abaCategoriaTipo, setAbaCategoriaTipo] = useState<"Receita" | "Despesa">("Receita");

  // Estado de Formas de Pagamento
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoConfig[]>(FORMAS_PAGAMENTO_INICIAIS);

  // Estado de Regras de Cobrança
  const [regrasCobranca, setRegrasCobranca] = useState<RegraCobrancaConfig[]>(REGRAS_COBRANCA_INICIAIS);

  // Estado de Centros de Custo
  const [centrosCusto, setCentrosCusto] = useState<CentroCustoConfig[]>(CENTROS_CUSTO_INICIAIS);

  // Estado de Notificações
  const [notificacoes, setNotificacoes] = useState<NotificacaoFinanceiraConfig[]>(NOTIFICACOES_FINANCEIRAS_INICIAIS);

  // Estado de Permissões
  const [permissoes, setPermissoes] = useState<PermissaoFinanceiraConfig[]>(PERMISSOES_ACESSO_INICIAIS);

  // Estado de Integrações e Logs
  const [integracoes, setIntegracoes] = useState<IntegracaoFinanceiraItem[]>(INTEGRACOES_FINANCEIRAS_INICIAIS);
  const [logs, setLogs] = useState<LogAuditoriaItem[]>(LOGS_AUDITORIA_INICIAIS);

  // Modais
  const [modalNovaContaAberto, setModalNovaContaAberto] = useState(false);
  const [modalEditarContaAberto, setModalEditarContaAberto] = useState(false);
  const [modalExtratoAberto, setModalExtratoAberto] = useState(false);
  const [modalNovaCategoriaAberto, setModalNovaCategoriaAberto] = useState(false);
  const [modalNovaFormaAberto, setModalNovaFormaAberto] = useState(false);
  const [modalNovaRegraAberto, setModalNovaRegraAberto] = useState(false);
  const [modalNovoCentroAberto, setModalNovoCentroAberto] = useState(false);
  const [modalConfigNotificacoesAberto, setModalConfigNotificacoesAberto] = useState(false);
  const [modalGerenciarPermissoesAberto, setModalGerenciarPermissoesAberto] = useState(false);

  // Form Nova Conta
  const [novoNomeConta, setNovoNomeConta] = useState("");
  const [novaInstituicao, setNovaInstituicao] = useState("Inter");
  const [novoCodigoInstituicao, setNovoCodigoInstituicao] = useState("341");
  const [novoTipoConta, setNovoTipoConta] = useState<ContaFinanceiraConfig["tipo"]>("Conta Corrente");
  const [novaAgencia, setNovaAgencia] = useState("0001");
  const [novoNumeroConta, setNovoNumeroConta] = useState("");
  const [novoSaldoInicial, setNovoSaldoInicial] = useState("");
  const [novoLimiteConta, setNovoLimiteConta] = useState("");
  const [novaContaPadrao, setNovaContaPadrao] = useState(false);

  // Form Nova Categoria
  const [novoNomeCat, setNovoNomeCat] = useState("");
  const [novoTipoCat, setNovoTipoCat] = useState<"Receita" | "Despesa">("Receita");
  const [novaCorCat, setNovaCorCat] = useState("#f97316");
  const [novaDescCat, setNovoDescCat] = useState("");

  // Form Nova Forma de Pagamento
  const [novoNomeForma, setNovoNomeForma] = useState("");
  const [novaTaxaForma, setNovaTaxaForma] = useState("0%");
  const [novoPrazoForma, setNovoPrazoForma] = useState("Imediato");

  // Form Nova Regra
  const [novoNomeRegra, setNovoNomeRegra] = useState("");
  const [novaDescRegra, setNovoDescRegra] = useState("");
  const [novoCanalRegra, setNovoCanalRegra] = useState("WhatsApp");

  // Form Novo Centro de Custo
  const [novoNomeCentro, setNovoNomeCentro] = useState("");
  const [novoDepCentro, setNovoDepCentro] = useState("Comercial");
  const [novoOrcamentoCentro, setNovoOrcamentoCentro] = useState("10000");

  // Conta selecionada atual
  const contaSelecionada = useMemo(() => {
    return contas.find((c) => c.id === contaSelecionadaId) || contas[0];
  }, [contas, contaSelecionadaId]);

  // Contas filtradas pela busca
  const contasFiltradas = useMemo(() => {
    if (!buscaConta.trim()) return contas;
    const termo = buscaConta.toLowerCase();
    return contas.filter(
      (c) =>
        c.nome.toLowerCase().includes(termo) ||
        c.instituicao.toLowerCase().includes(termo) ||
        c.codigoInstituicao.includes(termo) ||
        c.agencia.includes(termo) ||
        c.conta.includes(termo)
    );
  }, [contas, buscaConta]);

  // Contagem de Indicadores
  const totalContas = contas.length;
  const contasAtivas = contas.filter((c) => c.status === "ativa").length;

  const totalCategorias = categorias.length;
  const categoriasReceitas = categorias.filter((c) => c.tipo === "Receita").length;
  const categoriasDespesas = categorias.filter((c) => c.tipo === "Despesa").length;

  const totalFormas = formasPagamento.length;
  const totalRegras = regrasCobranca.length;
  const totalCentros = centrosCusto.length;
  const totalPermissoes = permissoes.length;

  // Alternar Conta Padrão
  const handleDefinirContaPadrao = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setContas((prev) =>
      prev.map((c) => ({
        ...c,
        contaPadrao: c.id === id,
      }))
    );
    const contaAlvo = contas.find((c) => c.id === id);
    toast.success(`Conta "${contaAlvo?.nome || "selecionada"}" definida como padrão da organização.`);
  };

  // Salvar Nova Conta
  const handleCriarConta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeConta.trim()) {
      toast.error("Informe o nome da conta financeira.");
      return;
    }

    const valorSaldo = parseFloat(novoSaldoInicial.replace(/\./g, "").replace(",", ".")) || 0;
    const valorLimite = parseFloat(novoLimiteConta.replace(/\./g, "").replace(",", ".")) || undefined;

    const nova: ContaFinanceiraConfig = {
      id: `cta-${Date.now()}`,
      nome: novoNomeConta,
      instituicao: novaInstituicao,
      codigoInstituicao: novoCodigoInstituicao,
      tipo: novoTipoConta,
      saldo: valorSaldo,
      status: "ativa",
      contaPadrao: novaContaPadrao || contas.length === 0,
      agencia: novaAgencia || "0001",
      conta: novoNumeroConta || "000000-0",
      limite: valorLimite,
      bancoLogo: novaInstituicao.toLowerCase().includes("nubank")
        ? "nubank"
        : novaInstituicao.toLowerCase().includes("btg")
        ? "btg"
        : novaInstituicao.toLowerCase().includes("mercado")
        ? "mercadopago"
        : "inter",
      extratoRecente: [
        {
          id: `ext-${Date.now()}`,
          data: "27/10/2026",
          descricao: "Abertura / Saldo Inicial",
          valor: valorSaldo,
          tipo: "credito",
        },
      ],
    };

    setContas((prev) => {
      if (novaContaPadrao) {
        return [...prev.map((c) => ({ ...c, contaPadrao: false })), nova];
      }
      return [...prev, nova];
    });

    setContaSelecionadaId(nova.id);
    setModalNovaContaAberto(false);
    setNovoNomeConta("");
    setNovoNumeroConta("");
    setNovoSaldoInicial("");
    setNovoLimiteConta("");
    toast.success(`Conta "${nova.nome}" cadastrada com sucesso!`);
  };

  // Salvar Nova Categoria
  const handleCriarCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeCat.trim()) {
      toast.error("Informe o nome da categoria.");
      return;
    }
    const nova: CategoriaFinanceiraConfig = {
      id: `cat-${Date.now()}`,
      nome: novoNomeCat,
      tipo: novoTipoCat,
      cor: novaCorCat,
      status: "ativa",
      descricao: novoDescCat || "Categoria cadastrada manualmente",
      icone: "Folder",
    };
    setCategorias((prev) => [...prev, nova]);
    setModalNovaCategoriaAberto(false);
    setNovoNomeCat("");
    setNovoDescCat("");
    toast.success(`Categoria "${nova.nome}" criada com sucesso!`);
  };

  // Salvar Nova Forma
  const handleCriarForma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeForma.trim()) {
      toast.error("Informe o nome da forma de pagamento.");
      return;
    }
    const nova: FormaPagamentoConfig = {
      id: `fp-${Date.now()}`,
      nome: novoNomeForma,
      tipo: "Recebimento",
      taxa: novaTaxaForma || "0%",
      prazoCompensacao: novoPrazoForma || "Imediato",
      status: "ativa",
      iconTipo: "pix",
      descricao: "Forma de pagamento adicionada manualmente",
    };
    setFormasPagamento((prev) => [...prev, nova]);
    setModalNovaFormaAberto(false);
    setNovoNomeForma("");
    toast.success(`Forma de pagamento "${nova.nome}" criada com sucesso!`);
  };

  // Salvar Nova Regra
  const handleCriarRegra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeRegra.trim()) {
      toast.error("Informe o nome da regra.");
      return;
    }
    const nova: RegraCobrancaConfig = {
      id: `reg-${Date.now()}`,
      nome: novoNomeRegra,
      descricao: novaDescRegra || "Notificação preventiva de vencimento",
      evento: "Cobrança a vencer",
      canal: novoCanalRegra,
      status: "ativa",
      frequencia: "Única",
      horario: "09:00",
      antecedencia: "3 dias antes",
    };
    setRegrasCobranca((prev) => [...prev, nova]);
    setModalNovaRegraAberto(false);
    setNovoNomeRegra("");
    setNovoDescRegra("");
    toast.success(`Regra de cobrança "${nova.nome}" configurada com sucesso!`);
  };

  // Salvar Novo Centro de Custo
  const handleCriarCentro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNomeCentro.trim()) {
      toast.error("Informe o nome do centro de custo.");
      return;
    }
    const orc = parseFloat(novoOrcamentoCentro.replace(/\./g, "").replace(",", ".")) || 10000;
    const novo: CentroCustoConfig = {
      id: `cc-${Date.now()}`,
      nome: novoNomeCentro,
      descricao: "Centro de custo departamental",
      tipo: "Departamento",
      departamento: novoDepCentro,
      responsavel: "Marcos Gonçalves",
      orcamentoPrevisto: orc,
      gastosRealizados: 0,
      limite: orc * 1.2,
      status: "ativa",
    };
    setCentrosCusto((prev) => [...prev, novo]);
    setModalNovoCentroAberto(false);
    setNovoNomeCentro("");
    toast.success(`Centro de custo "${novo.nome}" cadastrado com sucesso!`);
  };

  // Renderizar Logotipo do Banco
  const renderLogoBanco = (logo: string) => {
    switch (logo) {
      case "inter":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#ff7a00] text-white font-black text-sm shadow-md shadow-orange-600/30">
            m
          </div>
        );
      case "nubank":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#820ad1] text-white font-bold text-xs shadow-md shadow-purple-600/30">
            nu
          </div>
        );
      case "btg":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#001e38] text-sky-400 font-black text-[10px] tracking-tighter border border-sky-400/30 shadow-md">
            btg
          </div>
        );
      case "mercadopago":
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-[#009ee3] text-white font-black text-xs shadow-md shadow-sky-500/30">
            <HandshakeIcon className="size-5" />
          </div>
        );
      default:
        return (
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30">
            <Landmark className="size-4" />
          </div>
        );
    }
  };

  // Renderizar Ícone de Forma de Pagamento
  const renderIconForma = (tipo: FormaPagamentoConfig["iconTipo"]) => {
    switch (tipo) {
      case "pix":
        return (
          <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Zap className="size-3.5 fill-emerald-400" />
          </div>
        );
      case "cartao_credito":
        return (
          <div className="flex size-6 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
            <CreditCard className="size-3.5" />
          </div>
        );
      case "boleto":
        return (
          <div className="flex size-6 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Receipt className="size-3.5" />
          </div>
        );
      case "transferencia":
        return (
          <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <ArrowUpRight className="size-3.5" />
          </div>
        );
      case "dinheiro":
        return (
          <div className="flex size-6 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <Banknote className="size-3.5" />
          </div>
        );
      case "cartao_debito":
        return (
          <div className="flex size-6 items-center justify-center rounded-lg bg-neutral-700/40 text-neutral-400">
            <CreditCard className="size-3.5" />
          </div>
        );
      default:
        return (
          <div className="flex size-6 items-center justify-center rounded-lg bg-white/10 text-neutral-300">
            <DollarSign className="size-3.5" />
          </div>
        );
    }
  };

  return (
    <div className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 flex flex-col gap-5 overflow-x-hidden">
      {/* =========================================================================
          1. CABEÇALHO & BREADCRUMBS
         ========================================================================= */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <button
              type="button"
              onClick={() => onMudarTela("painel")}
              className="hover:text-neutral-300 transition-colors"
            >
              Gestão
            </button>
            <span className="text-neutral-600">›</span>
            <button
              type="button"
              onClick={() => onMudarTela("painel")}
              className="hover:text-neutral-300 transition-colors"
            >
              Financeiro
            </button>
            <span className="text-neutral-600">›</span>
            <span className="flex items-center gap-1.5 font-medium text-orange-400">
              <span className="flex size-3.5 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 text-[9px] font-bold">
                ●
              </span>
              Configurações
            </span>
          </div>

          {/* Título e Subtítulo */}
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Configurações Financeiras
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Gerencie contas, categorias, formas de pagamento e regras financeiras da sua empresa.
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. SEIS INDICADORES SUPERIORES
         ========================================================================= */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* 1. Contas Financeiras */}
        <div
          onClick={() => setAbaAtiva("contas")}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5",
            abaAtiva === "contas"
              ? "border-orange-500/40 bg-[#0e131d] shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
              : "border-white/5 bg-[#0c1017] hover:border-white/10 hover:bg-[#0e131d]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-300">Contas Financeiras</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400 border border-blue-500/20">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{totalContas}</span>
            <span className="text-[11px] text-emerald-400 font-medium">{contasAtivas} contas ativas</span>
          </div>
        </div>

        {/* 2. Categorias */}
        <div
          onClick={() => setAbaAtiva("categorias")}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5",
            abaAtiva === "categorias"
              ? "border-orange-500/40 bg-[#0e131d] shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
              : "border-white/5 bg-[#0c1017] hover:border-white/10 hover:bg-[#0e131d]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-300">Categorias</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
              <Calendar className="size-3.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{totalCategorias}</span>
            <span className="text-[11px] text-neutral-300 font-medium">
              <span className="text-emerald-400 font-semibold">{categoriasReceitas} receitas</span> •{" "}
              <span className="text-rose-400 font-semibold">{categoriasDespesas} despesas</span>
            </span>
          </div>
        </div>

        {/* 3. Formas de Pagamento */}
        <div
          onClick={() => setAbaAtiva("formas_pagamento")}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5",
            abaAtiva === "formas_pagamento"
              ? "border-orange-500/40 bg-[#0e131d] shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
              : "border-white/5 bg-[#0c1017] hover:border-white/10 hover:bg-[#0e131d]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-300">Formas de Pagamento</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
              <CreditCard className="size-3.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{totalFormas}</span>
            <span className="text-[11px] text-sky-400 font-medium truncate">Pix, Cartão, Boleto...</span>
          </div>
        </div>

        {/* 4. Regras de Cobrança */}
        <div
          onClick={() => setAbaAtiva("regras_cobranca")}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5",
            abaAtiva === "regras_cobranca"
              ? "border-orange-500/40 bg-[#0e131d] shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
              : "border-white/5 bg-[#0c1017] hover:border-white/10 hover:bg-[#0e131d]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-300">Regras de Cobrança</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
              <Shield className="size-3.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{totalRegras}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Configurações ativas</span>
          </div>
        </div>

        {/* 5. Centros de Custo */}
        <div
          onClick={() => setAbaAtiva("centros_custo")}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5",
            abaAtiva === "centros_custo"
              ? "border-orange-500/40 bg-[#0e131d] shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
              : "border-white/5 bg-[#0c1017] hover:border-white/10 hover:bg-[#0e131d]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-300">Centros de Custo</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
              <Building className="size-3.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{totalCentros}</span>
            <span className="text-[11px] text-cyan-400 font-medium">Departamentos</span>
          </div>
        </div>

        {/* 6. Usuários com Acesso */}
        <div
          onClick={() => setAbaAtiva("permissoes")}
          className={cn(
            "p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5",
            abaAtiva === "permissoes"
              ? "border-orange-500/40 bg-[#0e131d] shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/20"
              : "border-white/5 bg-[#0c1017] hover:border-white/10 hover:bg-[#0e131d]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-300">Usuários com Acesso</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/15 text-red-400 border border-red-500/20">
              <Users className="size-3.5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">{totalPermissoes}</span>
            <span className="text-[11px] text-sky-400 font-medium">Equipe e permissões</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. NOVE ABAS HORIZONTAIS DE CONFIGURAÇÃO
         ========================================================================= */}
      <nav
        aria-label="Abas de Configuração Financeira"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
      >
        <button
          type="button"
          onClick={() => setAbaAtiva("contas")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "contas"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <Wallet className={cn("size-3.5", abaAtiva === "contas" ? "text-orange-400" : "text-neutral-400")} />
          <span>Contas Financeiras</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("categorias")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "categorias"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <Layers className={cn("size-3.5", abaAtiva === "categorias" ? "text-orange-400" : "text-neutral-400")} />
          <span>Categorias</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("formas_pagamento")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "formas_pagamento"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <CreditCard className={cn("size-3.5", abaAtiva === "formas_pagamento" ? "text-orange-400" : "text-neutral-400")} />
          <span>Formas de Pagamento</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("regras_cobranca")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "regras_cobranca"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <Shield className={cn("size-3.5", abaAtiva === "regras_cobranca" ? "text-orange-400" : "text-neutral-400")} />
          <span>Regras de Cobrança</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("centros_custo")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "centros_custo"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <Building className={cn("size-3.5", abaAtiva === "centros_custo" ? "text-orange-400" : "text-neutral-400")} />
          <span>Centros de Custo</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("notificacoes")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "notificacoes"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <Bell className={cn("size-3.5", abaAtiva === "notificacoes" ? "text-orange-400" : "text-neutral-400")} />
          <span>Notificações</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("integracoes")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "integracoes"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <Cpu className={cn("size-3.5", abaAtiva === "integracoes" ? "text-orange-400" : "text-neutral-400")} />
          <span>Integrações</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("permissoes")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "permissoes"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <KeyRound className={cn("size-3.5", abaAtiva === "permissoes" ? "text-orange-400" : "text-neutral-400")} />
          <span>Permissões</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("logs_auditoria")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "logs_auditoria"
              ? "border-orange-500/50 bg-[#161214] text-white shadow-sm ring-1 ring-orange-500/30"
              : "border-white/5 bg-[#0c1017] text-neutral-400 hover:text-white hover:bg-[#121620]"
          )}
        >
          <History className={cn("size-3.5", abaAtiva === "logs_auditoria" ? "text-orange-400" : "text-neutral-400")} />
          <span>Logs de Auditoria</span>
        </button>
      </nav>

      {/* =========================================================================
          4. LAYOUT PRINCIPAL: CONTAS FINANCEIRAS + DETALHES DA CONTA
          (Exibido fielmente na visão geral e aba "contas")
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Bloco Contas Financeiras (2/3 da largura no desktop: col-span-8) */}
        <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-4">
          {/* Cabeçalho do Card */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-neutral-300">
                <Landmark className="size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Contas Financeiras</h2>
                <p className="text-xs text-neutral-400">
                  Cadastro e gestão das contas bancárias e carteiras digitais da sua empresa.
                </p>
              </div>
            </div>

            {/* Busca & Botão Nova Conta */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 size-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={buscaConta}
                  onChange={(e) => setBuscaConta(e.target.value)}
                  placeholder="Buscar conta por nome, banco ou agência..."
                  className="w-full h-9 rounded-xl border border-white/10 bg-[#121620] pl-8 pr-3 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none transition-all"
                />
              </div>

              <button
                type="button"
                onClick={() => setModalNovaContaAberto(true)}
                className="flex h-9 items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 text-xs font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition-all shrink-0"
              >
                <Plus className="size-3.5" />
                <span>Nova conta</span>
              </button>
            </div>
          </div>

          {/* Tabela de Contas */}
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0d13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Nome da conta</th>
                  <th className="py-3 px-3">Instituição</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3 text-right">Saldo atual</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Conta padrão</th>
                  <th className="py-3 px-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500">
                      Nenhuma conta financeira encontrada.
                    </td>
                  </tr>
                ) : (
                  contasFiltradas.map((conta) => {
                    const selecionada = conta.id === contaSelecionadaId;

                    return (
                      <tr
                        key={conta.id}
                        onClick={() => setContaSelecionadaId(conta.id)}
                        className={cn(
                          "cursor-pointer transition-colors group",
                          selecionada ? "bg-orange-500/[0.04]" : "hover:bg-white/[0.02]"
                        )}
                      >
                        {/* Nome da Conta */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-3">
                            {renderLogoBanco(conta.bancoLogo)}
                            <div>
                              <div className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                                {conta.nome}
                              </div>
                              <div className="text-[10px] text-neutral-400">{conta.instituicao}</div>
                            </div>
                          </div>
                        </td>

                        {/* Instituição */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-white">{conta.instituicao}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{conta.codigoInstituicao}</div>
                        </td>

                        {/* Tipo */}
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border",
                              conta.tipo === "Carteira Digital"
                                ? "bg-purple-500/15 text-purple-300 border-purple-500/30"
                                : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                            )}
                          >
                            {conta.tipo}
                          </span>
                        </td>

                        {/* Saldo Atual */}
                        <td className="py-3 px-3 text-right">
                          <div className="font-mono font-bold text-white text-[13px]">
                            {formatBRL(conta.saldo)}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Ativa
                          </span>
                        </td>

                        {/* Conta Padrão Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => handleDefinirContaPadrao(conta.id, e)}
                            title={conta.contaPadrao ? "Conta padrão ativa" : "Definir como conta padrão"}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                              conta.contaPadrao ? "bg-orange-600" : "bg-neutral-800 hover:bg-neutral-700"
                            )}
                          >
                            <span
                              className={cn(
                                "pointer-events-none inline-block size-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                                conta.contaPadrao ? "translate-x-4" : "translate-x-0"
                              )}
                            />
                          </button>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContaSelecionadaId(conta.id);
                                setModalEditarContaAberto(true);
                              }}
                              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                              title="Editar conta"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setContaSelecionadaId(conta.id);
                                setModalExtratoAberto(true);
                              }}
                              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                              title="Visualizar extrato"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.info(`Ações extras para ${conta.nome}`);
                              }}
                              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                              title="Mais opções"
                            >
                              <MoreVertical className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Rodapé da Tabela: Paginação */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 text-xs text-neutral-400">
            {/* Controles de página */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaContas === 1}
                onClick={() => setPaginaContas((p) => Math.max(1, p - 1))}
                className="size-7 rounded-lg border border-white/5 bg-[#121620] flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPaginaContas(1)}
                className={cn(
                  "size-7 rounded-lg text-xs font-bold transition-all",
                  paginaContas === 1
                    ? "bg-orange-600 text-white shadow-sm"
                    : "border border-white/5 bg-[#121620] text-neutral-400 hover:text-white"
                )}
              >
                1
              </button>
              <button
                type="button"
                onClick={() => setPaginaContas(2)}
                className={cn(
                  "size-7 rounded-lg text-xs font-bold transition-all",
                  paginaContas === 2
                    ? "bg-orange-600 text-white shadow-sm"
                    : "border border-white/5 bg-[#121620] text-neutral-400 hover:text-white"
                )}
              >
                2
              </button>
              <button
                type="button"
                onClick={() => setPaginaContas(3)}
                className={cn(
                  "size-7 rounded-lg text-xs font-bold transition-all",
                  paginaContas === 3
                    ? "bg-orange-600 text-white shadow-sm"
                    : "border border-white/5 bg-[#121620] text-neutral-400 hover:text-white"
                )}
              >
                3
              </button>
              <button
                type="button"
                disabled={paginaContas === 3}
                onClick={() => setPaginaContas((p) => Math.min(3, p + 1))}
                className="size-7 rounded-lg border border-white/5 bg-[#121620] flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            <span>
              Mostrando 1 - {contasFiltradas.length} de {totalContas} contas
            </span>
          </div>
        </div>

        {/* Bloco Detalhes da Conta (1/3 da largura no desktop: col-span-4) */}
        <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-4">
          {/* Cabeçalho do Card */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-orange-400" />
              <h3 className="text-sm font-bold text-white">Detalhes da Conta</h3>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Ativa
            </span>
          </div>

          {/* Destaque da Conta Selecionada */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#121620] border border-white/5">
            {renderLogoBanco(contaSelecionada.bancoLogo)}
            <div>
              <h4 className="font-bold text-white text-sm">{contaSelecionada.nome}</h4>
              <p className="text-xs text-neutral-400">{contaSelecionada.instituicao}</p>
            </div>
          </div>

          {/* 4 Abas do Detalhe */}
          <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-white/5 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setAbaDetalheConta("visao_geral")}
              className={cn(
                "flex-1 py-1.5 rounded-lg transition-all text-center",
                abaDetalheConta === "visao_geral"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Visão Geral
            </button>
            <button
              type="button"
              onClick={() => setAbaDetalheConta("extrato")}
              className={cn(
                "flex-1 py-1.5 rounded-lg transition-all text-center",
                abaDetalheConta === "extrato"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Extrato
            </button>
            <button
              type="button"
              onClick={() => setAbaDetalheConta("configuracoes")}
              className={cn(
                "flex-1 py-1.5 rounded-lg transition-all text-center",
                abaDetalheConta === "configuracoes"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Configurações
            </button>
            <button
              type="button"
              onClick={() => setAbaDetalheConta("integracao")}
              className={cn(
                "flex-1 py-1.5 rounded-lg transition-all text-center",
                abaDetalheConta === "integracao"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Integração
            </button>
          </div>

          {/* Conteúdo da Aba: Visão Geral */}
          {abaDetalheConta === "visao_geral" && (
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Instituição</span>
                <span className="font-medium text-white">
                  {contaSelecionada.instituicao} ({contaSelecionada.codigoInstituicao})
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Tipo</span>
                <span className="font-medium text-white">{contaSelecionada.tipo}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Agência</span>
                <span className="font-mono text-white">{contaSelecionada.agencia}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Conta</span>
                <span className="font-mono text-white">{contaSelecionada.conta}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Saldo atual</span>
                <span className="font-mono font-bold text-white text-sm">
                  {formatBRL(contaSelecionada.saldo)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Limite (opcional)</span>
                <span className="font-mono font-bold text-emerald-400">
                  {contaSelecionada.limite ? formatBRL(contaSelecionada.limite) : "Não configurado"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-400">Conta padrão</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                  {contaSelecionada.contaPadrao ? (
                    <>
                      <Check className="size-3.5" />
                      Sim
                    </>
                  ) : (
                    <span className="text-neutral-400 font-normal">Não</span>
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Conteúdo da Aba: Extrato */}
          {abaDetalheConta === "extrato" && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] text-neutral-400">Últimos lançamentos registrados:</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {contaSelecionada.extratoRecente.map((item) => (
                  <div
                    key={item.id}
                    className="p-2 rounded-xl bg-[#121620] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-white text-[11px] truncate max-w-[170px]">
                        {item.descricao}
                      </div>
                      <div className="text-[10px] text-neutral-500">{item.data}</div>
                    </div>
                    <div
                      className={cn(
                        "font-mono font-bold text-[11px]",
                        item.tipo === "credito" ? "text-emerald-400" : "text-rose-400"
                      )}
                    >
                      {item.tipo === "credito" ? "+" : "-"}
                      {formatBRL(item.valor)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conteúdo da Aba: Configurações */}
          {abaDetalheConta === "configuracoes" && (
            <div className="flex flex-col gap-2.5 text-xs text-neutral-300">
              <div className="p-2.5 rounded-xl bg-[#121620] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Alerta de Saldo Baixo</div>
                  <div className="text-[10px] text-neutral-500">Notificar quando abaixo de R$ 5.000</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">Ativo</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#121620] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Reconciliação Automática</div>
                  <div className="text-[10px] text-neutral-500">Sincronização diária às 06:00</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">Ativo</span>
              </div>
            </div>
          )}

          {/* Conteúdo da Aba: Integração */}
          {abaDetalheConta === "integracao" && (
            <div className="flex flex-col gap-2.5 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-[#121620] border border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Open Finance</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Conectado
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  Leitura de extrato autorizada com criptografia de ponta a ponta.
                </p>
              </div>
            </div>
          )}

          {/* Botões de Ação na Base */}
          <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={() => setModalExtratoAberto(true)}
              className="flex items-center justify-center gap-1.5 h-9 rounded-xl bg-orange-600 text-xs font-semibold text-white shadow-md shadow-orange-600/20 hover:bg-orange-500 transition-all"
            >
              <FileSpreadsheet className="size-3.5" />
              <span>Ver extrato</span>
            </button>
            <button
              type="button"
              onClick={() => setModalEditarContaAberto(true)}
              className="flex items-center justify-center gap-1.5 h-9 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-200 hover:border-white/20 hover:text-white transition-all"
            >
              <Pencil className="size-3.5 text-neutral-400" />
              <span>Editar conta</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          5. CARDS INFERIORES — LINHA 1: CATEGORIAS | FORMAS DE PAGAMENTO | REGRAS DE COBRANÇA
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Categorias Financeiras */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <Layers className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Categorias Financeiras</h3>
                <p className="text-[11px] text-neutral-400">Organize suas receitas e despesas por categorias.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalNovaCategoriaAberto(true)}
              className="flex h-7 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-[11px] font-semibold text-white hover:bg-orange-500 transition-all shrink-0"
            >
              <Plus className="size-3" />
              <span>Nova categoria</span>
            </button>
          </div>

          {/* Abas Receitas / Despesas */}
          <div className="flex items-center gap-1 bg-[#121620] p-1 rounded-xl border border-white/5 text-[11px] font-semibold w-fit">
            <button
              type="button"
              onClick={() => setAbaCategoriaTipo("Receita")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all",
                abaCategoriaTipo === "Receita"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Receitas ({categoriasReceitas})
            </button>
            <button
              type="button"
              onClick={() => setAbaCategoriaTipo("Despesa")}
              className={cn(
                "px-3 py-1 rounded-lg transition-all",
                abaCategoriaTipo === "Despesa"
                  ? "bg-orange-600 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              )}
            >
              Despesas ({categoriasDespesas})
            </button>
          </div>

          {/* Tabela de Categorias */}
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0d13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-neutral-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Nome da categoria</th>
                  <th className="py-2.5 px-2">Tipo</th>
                  <th className="py-2.5 px-2 text-center">Cor</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categorias
                  .filter((c) => c.tipo === abaCategoriaTipo)
                  .slice(0, 6)
                  .map((cat) => (
                    <tr key={cat.id} className="hover:bg-white/[0.02]">
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <FileText className="size-3.5 text-neutral-400" />
                          <span className="font-medium text-white truncate max-w-[120px]">{cat.nome}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-[11px] text-neutral-400">{cat.tipo}</td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className="inline-block size-3 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: cat.cor }}
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          ● Ativa
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => toast.info(`Editar categoria ${cat.nome}`)}
                            className="p-1 rounded text-neutral-400 hover:text-white"
                          >
                            <Pencil className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toast.error("Exclusão de categorias vinculadas bloqueada por segurança.")}
                            className="p-1 rounded text-neutral-400 hover:text-rose-400"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
            <span>Mostrando 1 - 6 de {categorias.filter((c) => c.tipo === abaCategoriaTipo).length} categorias</span>
            <button
              type="button"
              onClick={() => setAbaAtiva("categorias")}
              className="px-2 py-0.5 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-[10px] font-semibold transition-all"
            >
              Ver todas
            </button>
          </div>
        </div>

        {/* Card 2: Formas de Pagamento */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
                <CreditCard className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Formas de Pagamento</h3>
                <p className="text-[11px] text-neutral-400">Cadastre as formas de recebimento e pagamento.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalNovaFormaAberto(true)}
              className="flex h-7 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-[11px] font-semibold text-white hover:bg-orange-500 transition-all shrink-0"
            >
              <Plus className="size-3" />
              <span>Nova forma</span>
            </button>
          </div>

          {/* Tabela de Formas */}
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0d13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-neutral-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Nome</th>
                  <th className="py-2.5 px-2">Tipo</th>
                  <th className="py-2.5 px-2 text-right">Taxa</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {formasPagamento.slice(0, 6).map((fp) => (
                  <tr key={fp.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {renderIconForma(fp.iconTipo)}
                        <span className="font-medium text-white truncate max-w-[110px]">{fp.nome}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-neutral-400">{fp.tipo}</td>
                    <td className="py-2 px-2 text-right font-mono font-semibold text-neutral-200">{fp.taxa}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border",
                          fp.status === "ativa"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}
                      >
                        ● {fp.status === "ativa" ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Editar taxas de ${fp.nome}`)}
                          className="p-1 rounded text-neutral-400 hover:text-white"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.error("Formas de pagamento padrão não podem ser deletadas.")}
                          className="p-1 rounded text-neutral-400 hover:text-rose-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
            <span>Mostrando 1 - {Math.min(6, formasPagamento.length)} de {formasPagamento.length} formas</span>
          </div>
        </div>

        {/* Card 3: Regras de Cobrança */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <Shield className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Regras de Cobrança</h3>
                <p className="text-[11px] text-neutral-400">Configure regras para suas cobranças e recebimentos.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalNovaRegraAberto(true)}
              className="flex h-7 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-[11px] font-semibold text-white hover:bg-orange-500 transition-all shrink-0"
            >
              <Plus className="size-3" />
              <span>Nova regra</span>
            </button>
          </div>

          {/* Tabela de Regras */}
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0d13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-neutral-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Nome da regra</th>
                  <th className="py-2.5 px-2">Descrição</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {regrasCobranca.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Clock className="size-3.5 text-neutral-400 shrink-0" />
                        <span className="font-semibold text-white whitespace-nowrap">{reg.nome}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-neutral-400 max-w-[130px] truncate">
                      {reg.descricao}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ● Ativa
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Editar regra ${reg.nome}`)}
                          className="p-1 rounded text-neutral-400 hover:text-white"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.error("A regra não pode ser excluída enquanto estiver ativa.")}
                          className="p-1 rounded text-neutral-400 hover:text-rose-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
            <span>Mostrando 1 - {regrasCobranca.length} de {regrasCobranca.length} regras</span>
            <button
              type="button"
              onClick={() => setAbaAtiva("regras_cobranca")}
              className="px-2 py-0.5 rounded-lg border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-[10px] font-semibold transition-all"
            >
              Ver todas
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          6. CARDS INFERIORES — LINHA 2: CENTROS DE CUSTO | NOTIFICAÇÕES | PERMISSÕES DE ACESSO
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 4: Centros de Custo */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/20">
                <Building2 className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Centros de Custo</h3>
                <p className="text-[11px] text-neutral-400">Organize seus gastos por departamento ou área.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalNovoCentroAberto(true)}
              className="flex h-7 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-[11px] font-semibold text-white hover:bg-orange-500 transition-all shrink-0"
            >
              <Plus className="size-3" />
              <span>Novo centro</span>
            </button>
          </div>

          {/* Tabela de Centros de Custo */}
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0d13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-neutral-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Nome</th>
                  <th className="py-2.5 px-2">Descrição</th>
                  <th className="py-2.5 px-2">Tipo</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {centrosCusto.slice(0, 3).map((cc) => (
                  <tr key={cc.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <Megaphone className="size-3.5 text-neutral-400" />
                        <span className="font-semibold text-white">{cc.nome}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-neutral-400 truncate max-w-[120px]">{cc.descricao}</td>
                    <td className="py-2 px-2 text-[11px] text-neutral-300">{cc.tipo}</td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ● Ativa
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Editar centro de custo ${cc.nome}`)}
                          className="p-1 rounded text-neutral-400 hover:text-white"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.error("Centro com despesas vinculadas não pode ser excluído.")}
                          className="p-1 rounded text-neutral-400 hover:text-rose-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 5: Notificações Financeiras */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20">
                <Bell className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Notificações Financeiras</h3>
                <p className="text-[11px] text-neutral-400">Configure alertas e notificações.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalConfigNotificacoesAberto(true)}
              className="flex h-7 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-[11px] font-semibold text-white hover:bg-orange-500 transition-all shrink-0"
            >
              <Settings className="size-3" />
              <span>Configurar</span>
            </button>
          </div>

          {/* Tabela de Notificações */}
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0d13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-neutral-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Nome</th>
                  <th className="py-2.5 px-2">Duração</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {notificacoes.slice(0, 3).map((not) => (
                  <tr key={not.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <FileText className="size-3.5 text-neutral-400" />
                        <span className="font-semibold text-white truncate max-w-[120px]">{not.nome}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-neutral-400 truncate max-w-[120px]">{not.duracao}</td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ● Ativa
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => toast.info(`Editar alerta ${not.nome}`)}
                          className="p-1 rounded text-neutral-400 hover:text-white"
                        >
                          <Pencil className="size-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.error("Notificação do sistema não pode ser removida.")}
                          className="p-1 rounded text-neutral-400 hover:text-rose-400"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 6: Permissões de Acesso */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 sm:p-5 flex flex-col gap-3.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400 border border-purple-500/20">
                <UserCheck className="size-3.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Permissões de Acesso</h3>
                <p className="text-[11px] text-neutral-400">Gerencie quem pode acessar o módulo financeiro.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalGerenciarPermissoesAberto(true)}
              className="flex h-7 items-center gap-1 rounded-lg bg-orange-600 px-2.5 text-[11px] font-semibold text-white hover:bg-orange-500 transition-all shrink-0"
            >
              <span>Gerenciar</span>
            </button>
          </div>

          {/* Tabela de Permissões */}
          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0d13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] text-neutral-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Usuário</th>
                  <th className="py-2.5 px-2">Função</th>
                  <th className="py-2.5 px-2">Acesso</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {permissoes.slice(0, 3).map((perm) => (
                  <tr key={perm.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-6 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold text-[10px] border border-orange-500/30">
                          {perm.avatar}
                        </div>
                        <span className="font-semibold text-white truncate max-w-[110px]">{perm.usuario}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-[11px] text-neutral-300">{perm.funcao}</td>
                    <td className="py-2 px-2 text-[11px] font-semibold text-white">{perm.acesso}</td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ● Ativa
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          7. VISUALIZAÇÕES DEDICADAS DAS OUTRAS ABAS (Quando clicadas)
         ========================================================================= */}
      {abaAtiva === "integracoes" && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1017] p-5 flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Cpu className="size-4 text-orange-400" />
                Integrações Financeiras & Conectores
              </h3>
              <p className="text-xs text-neutral-400">
                Conecte gateways de pagamento, emissão fiscal, bancos e automações com segurança.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbaAtiva("contas")}
              className="text-xs text-orange-400 hover:underline"
            >
              ← Voltar para Contas Financeiras
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {integracoes.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-white/5 bg-[#121620] flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-white text-sm">{item.nome}</h4>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        item.status === "conectado"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : item.status === "disponivel"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                          : "bg-neutral-800 text-neutral-400 border-white/5"
                      )}
                    >
                      {item.status === "conectado"
                        ? "Conectado"
                        : item.status === "disponivel"
                        ? "Disponível"
                        : "Não configurado"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{item.descricao}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-white/5">
                  <span className="text-neutral-500">Provedor: {item.provedor}</span>
                  <button
                    type="button"
                    onClick={() =>
                      item.status === "conectado"
                        ? toast.info("Integração já conectada e sincronizada.")
                        : toast.info("Fase atual de construção de frontend: conectores reais serão ativados em produção.")
                    }
                    className="text-orange-400 font-semibold hover:underline"
                  >
                    {item.status === "conectado" ? "Gerenciar" : "Configurar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {abaAtiva === "logs_auditoria" && (
        <div className="rounded-2xl border border-white/10 bg-[#0c1017] p-5 flex flex-col gap-4 mt-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="size-4 text-orange-400" />
                Logs de Auditoria & Trilha de Segurança
              </h3>
              <p className="text-xs text-neutral-400">
                Histórico imutável de alterações nas configurações e dados financeiros.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbaAtiva("contas")}
              className="text-xs text-orange-400 hover:underline"
            >
              ← Voltar para Contas Financeiras
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/5 bg-[#0a0d13]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[11px] font-semibold text-neutral-400 uppercase">
                  <th className="py-2.5 px-3">Data / Hora</th>
                  <th className="py-2.5 px-3">Usuário</th>
                  <th className="py-2.5 px-3">Ação</th>
                  <th className="py-2.5 px-3">Recurso</th>
                  <th className="py-2.5 px-3">Identificador</th>
                  <th className="py-2.5 px-3 text-center">Resultado</th>
                  <th className="py-2.5 px-3">Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 px-3 font-mono text-neutral-300">{log.dataHora}</td>
                    <td className="py-2.5 px-3 font-medium text-white">{log.usuario}</td>
                    <td className="py-2.5 px-3 text-neutral-200">{log.acao}</td>
                    <td className="py-2.5 px-3 text-neutral-400">{log.recurso}</td>
                    <td className="py-2.5 px-3 font-mono text-neutral-300">{log.identificador}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {log.resultado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-neutral-500 text-[11px]">{log.origem}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. MODAIS OPERACIONAIS
         ========================================================================= */}

      {/* Modal 1: Nova Conta Financeira */}
      <Dialog open={modalNovaContaAberto} onOpenChange={setModalNovaContaAberto}>
        <DialogContent className="max-w-lg border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Landmark className="size-4 text-orange-400" />
              Cadastrar Nova Conta Financeira
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarConta} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Nome da Conta *</label>
              <input
                type="text"
                required
                value={novoNomeConta}
                onChange={(e) => setNovoNomeConta(e.target.value)}
                placeholder="Ex: Conta Principal, Reserva de Emergência..."
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Instituição Financeira</label>
                <select
                  value={novaInstituicao}
                  onChange={(e) => {
                    const inst = e.target.value;
                    setNovaInstituicao(inst);
                    if (inst === "Inter") setNovoCodigoInstituicao("341");
                    else if (inst === "Nubank") setNovoCodigoInstituicao("260");
                    else if (inst === "BTG Pactual") setNovoCodigoInstituicao("208");
                    else if (inst === "Mercado Pago") setNovoCodigoInstituicao("323");
                    else setNovoCodigoInstituicao("001");
                  }}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-200 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="Inter">Banco Inter (341)</option>
                  <option value="Nubank">Nubank (260)</option>
                  <option value="BTG Pactual">BTG Pactual (208)</option>
                  <option value="Mercado Pago">Mercado Pago (323)</option>
                  <option value="Itaú">Itaú Unibanco (341)</option>
                  <option value="Bradesco">Bradesco (237)</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Tipo de Conta</label>
                <select
                  value={novoTipoConta}
                  onChange={(e) => setNovoTipoConta(e.target.value as ContaFinanceiraConfig["tipo"])}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-neutral-200 focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="Conta Corrente">Conta Corrente</option>
                  <option value="Conta Poupança">Conta Poupança</option>
                  <option value="Carteira Digital">Carteira Digital</option>
                  <option value="Conta de Pagamentos">Conta de Pagamentos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Agência</label>
                <input
                  type="text"
                  value={novaAgencia}
                  onChange={(e) => setNovaAgencia(e.target.value)}
                  placeholder="0001"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Número da Conta</label>
                <input
                  type="text"
                  value={novoNumeroConta}
                  onChange={(e) => setNovoNumeroConta(e.target.value)}
                  placeholder="123456-7"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Saldo Inicial (R$)</label>
                <input
                  type="text"
                  value={novoSaldoInicial}
                  onChange={(e) => setNovoSaldoInicial(e.target.value)}
                  placeholder="0,00"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Limite de Crédito (R$)</label>
                <input
                  type="text"
                  value={novoLimiteConta}
                  onChange={(e) => setNovoLimiteConta(e.target.value)}
                  placeholder="Opcional"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="checkPadrao"
                checked={novaContaPadrao}
                onChange={(e) => setNovaContaPadrao(e.target.checked)}
                className="rounded border-white/10 bg-[#121620] text-orange-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="checkPadrao" className="text-xs text-neutral-300 cursor-pointer">
                Definir como Conta Padrão da organização
              </label>
            </div>

            <DialogFooter className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setModalNovaContaAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-5 py-2 text-xs font-bold text-white shadow-lg shadow-orange-600/25 hover:brightness-110"
              >
                <Plus className="size-3.5" />
                <span>Salvar Conta</span>
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Editar Conta Financeira */}
      <Dialog open={modalEditarContaAberto} onOpenChange={setModalEditarContaAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Pencil className="size-4 text-orange-400" />
              Editar Conta: {contaSelecionada.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Nome</label>
              <input
                type="text"
                defaultValue={contaSelecionada.nome}
                onChange={(e) => {
                  const val = e.target.value;
                  setContas((prev) =>
                    prev.map((c) => (c.id === contaSelecionada.id ? { ...c, nome: val } : c))
                  );
                }}
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Agência</label>
                <input
                  type="text"
                  defaultValue={contaSelecionada.agencia}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white font-mono focus:border-orange-500/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-neutral-400 font-medium">Conta</label>
                <input
                  type="text"
                  defaultValue={contaSelecionada.conta}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white font-mono focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-3">
              <button
                type="button"
                onClick={() => {
                  setModalEditarContaAberto(false);
                  toast.success("Dados da conta financeira atualizados!");
                }}
                className="w-full rounded-xl bg-orange-600 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-all"
              >
                Salvar Alterações
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Extrato Completo */}
      <Dialog open={modalExtratoAberto} onOpenChange={setModalExtratoAberto}>
        <DialogContent className="max-w-lg border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <FileSpreadsheet className="size-4 text-orange-400" />
              Extrato Financeiro — {contaSelecionada.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-400">Saldo Atual da Conta</span>
                <div className="text-xl font-bold font-mono text-white">{formatBRL(contaSelecionada.saldo)}</div>
              </div>
              <span className="text-xs text-neutral-300 font-medium">
                {contaSelecionada.instituicao} ({contaSelecionada.agencia} / {contaSelecionada.conta})
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {contaSelecionada.extratoRecente.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl border border-white/5 bg-[#121620] flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{tx.descricao}</div>
                    <div className="text-[10px] text-neutral-500">{tx.data}</div>
                  </div>
                  <div
                    className={cn(
                      "font-mono font-bold text-sm",
                      tx.tipo === "credito" ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {tx.tipo === "credito" ? "+" : "-"}
                    {formatBRL(tx.valor)}
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setModalExtratoAberto(false)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 4: Nova Categoria */}
      <Dialog open={modalNovaCategoriaAberto} onOpenChange={setModalNovaCategoriaAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Layers className="size-4 text-orange-400" />
              Nova Categoria Financeira
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarCategoria} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Nome da Categoria *</label>
              <input
                type="text"
                required
                value={novoNomeCat}
                onChange={(e) => setNovoNomeCat(e.target.value)}
                placeholder="Ex: Treinamento, Infraestrutura..."
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Tipo</label>
                <select
                  value={novoTipoCat}
                  onChange={(e) => setNovoTipoCat(e.target.value as "Receita" | "Despesa")}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none cursor-pointer"
                >
                  <option value="Receita">Receita</option>
                  <option value="Despesa">Despesa</option>
                </select>
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Cor de Identificação</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={novaCorCat}
                    onChange={(e) => setNovaCorCat(e.target.value)}
                    className="size-9 rounded-lg border border-white/10 bg-[#121620] cursor-pointer"
                  />
                  <span className="font-mono text-neutral-300">{novaCorCat}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Descrição</label>
              <input
                type="text"
                value={novoDescCat}
                onChange={(e) => setNovoDescCat(e.target.value)}
                placeholder="Finalidade desta categoria"
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <DialogFooter className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalNovaCategoriaAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-all"
              >
                Salvar Categoria
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 5: Nova Forma de Pagamento */}
      <Dialog open={modalNovaFormaAberto} onOpenChange={setModalNovaFormaAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <CreditCard className="size-4 text-orange-400" />
              Nova Forma de Pagamento
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarForma} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Nome do Meio *</label>
              <input
                type="text"
                required
                value={novoNomeForma}
                onChange={(e) => setNovoNomeForma(e.target.value)}
                placeholder="Ex: Link de Pagamento, Carnê..."
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Taxa (%)</label>
                <input
                  type="text"
                  value={novaTaxaForma}
                  onChange={(e) => setNovaTaxaForma(e.target.value)}
                  placeholder="2,49%"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white font-mono focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Prazo de Compensação</label>
                <input
                  type="text"
                  value={novoPrazoForma}
                  onChange={(e) => setNovoPrazoForma(e.target.value)}
                  placeholder="D+1"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalNovaFormaAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-all"
              >
                Salvar Forma
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 6: Nova Regra de Cobrança */}
      <Dialog open={modalNovaRegraAberto} onOpenChange={setModalNovaRegraAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Shield className="size-4 text-orange-400" />
              Configurar Regra de Cobrança
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarRegra} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Nome da Regra *</label>
              <input
                type="text"
                required
                value={novoNomeRegra}
                onChange={(e) => setNovoNomeRegra(e.target.value)}
                placeholder="Ex: Lembrete 5 dias antes"
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Descrição da Ação</label>
              <textarea
                value={novaDescRegra}
                onChange={(e) => setNovoDescRegra(e.target.value)}
                placeholder="Ex: Enviar mensagem com chave Pix para clientes a vencer..."
                rows={2}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#121620] p-2.5 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-neutral-400 font-medium">Canal de Disparo</label>
              <select
                value={novoCanalRegra}
                onChange={(e) => setNovoCanalRegra(e.target.value)}
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none cursor-pointer"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="E-mail">E-mail</option>
                <option value="Notificação interna">Notificação interna</option>
                <option value="E-mail e WhatsApp">E-mail e WhatsApp</option>
              </select>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[11px] text-orange-300">
              Aviso: Em conformidade com as diretrizes do Flow Business, regras demonstrativas não disparam mensagens externas sem aprovação ativa.
            </div>

            <DialogFooter className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalNovaRegraAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-all"
              >
                Salvar Regra
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 7: Novo Centro de Custo */}
      <Dialog open={modalNovoCentroAberto} onOpenChange={setModalNovoCentroAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Building2 className="size-4 text-orange-400" />
              Novo Centro de Custo
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarCentro} className="flex flex-col gap-3 py-2 text-xs">
            <div>
              <label className="text-neutral-400 font-medium">Nome do Centro *</label>
              <input
                type="text"
                required
                value={novoNomeCentro}
                onChange={(e) => setNovoNomeCentro(e.target.value)}
                placeholder="Ex: Jurídico, Inovação..."
                className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-400 font-medium">Departamento</label>
                <input
                  type="text"
                  value={novoDepCentro}
                  onChange={(e) => setNovoDepCentro(e.target.value)}
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-neutral-400 font-medium">Orçamento Mensal (R$)</label>
                <input
                  type="text"
                  value={novoOrcamentoCentro}
                  onChange={(e) => setNovoOrcamentoCentro(e.target.value)}
                  placeholder="10000"
                  className="mt-1 w-full h-9 rounded-xl border border-white/10 bg-[#121620] px-3 text-white font-mono focus:border-orange-500/50 focus:outline-none"
                />
              </div>
            </div>

            <DialogFooter className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setModalNovoCentroAberto(false)}
                className="rounded-xl border border-white/10 bg-[#121620] px-4 py-2 text-xs font-semibold text-neutral-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-orange-600 px-5 py-2 text-xs font-bold text-white hover:bg-orange-500 transition-all"
              >
                Salvar Centro
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 8: Configurar Notificações */}
      <Dialog open={modalConfigNotificacoesAberto} onOpenChange={setModalConfigNotificacoesAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <Bell className="size-4 text-orange-400" />
              Notificações e Alertas Financeiros
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <p className="text-neutral-400">
              Defina quais eventos financeiros devem alertar os gestores e por quais canais.
            </p>

            <div className="space-y-2">
              {notificacoes.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-white/5 bg-[#121620] flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-white">{item.nome}</div>
                    <div className="text-[10px] text-neutral-400">{item.evento}</div>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Ativo
                  </span>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => {
                  setModalConfigNotificacoesAberto(false);
                  toast.success("Preferências de notificação salvas.");
                }}
                className="w-full rounded-xl bg-orange-600 py-2 text-xs font-bold text-white hover:bg-orange-500"
              >
                Concluir
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal 9: Gerenciar Permissões */}
      <Dialog open={modalGerenciarPermissoesAberto} onOpenChange={setModalGerenciarPermissoesAberto}>
        <DialogContent className="max-w-md border-white/10 bg-[#0c1017] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
              <UserCheck className="size-4 text-orange-400" />
              Permissões do Módulo Financeiro
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2 text-xs">
            <p className="text-neutral-400">
              Controle de privilégios de acesso baseado no modelo RBAC oficial do Flow Business.
            </p>

            <div className="space-y-2">
              {permissoes.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border border-white/5 bg-[#121620] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 items-center justify-center rounded-full bg-orange-500/20 text-orange-400 font-bold text-xs border border-orange-500/30">
                      {p.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-white">{p.usuario}</div>
                      <div className="text-[10px] text-neutral-400">{p.email}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white">
                    {p.acesso}
                  </span>
                </div>
              ))}
            </div>

            <DialogFooter className="mt-2">
              <button
                type="button"
                onClick={() => setModalGerenciarPermissoesAberto(false)}
                className="w-full rounded-xl border border-white/10 bg-[#121620] py-2 text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Subcomponente de aperto de mãos para ícone do Mercado Pago
function HandshakeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m11 17 2 2a1 1 0 1 0 3-3" />
      <path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-1.42-1.42l4.24-4.24a5 5 0 0 1 7.08 7.08l-3.54 3.54a3 3 0 0 1-4.24 0l-1.42-1.42" />
      <path d="m3 3 3 3" />
      <path d="M7 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
    </svg>
  );
}
