// Tela 04 — Acompanhamento de Propostas (Gestão → Propostas → Acompanhamento)
// Fiel ao layout visual final aprovado com máxima fidelidade, KPIs executivos,
// gráficos analíticos (Evolução, Funil de Conversão, Status), abas de acompanhamento,
// tabela paginada com status reais, painel lateral detalhado com linha do tempo e sugestões de IA.

import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Grid,
  HelpCircle,
  History,
  Info,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Sliders,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import { VerPropostaModal } from "./VerPropostaModal";
import type { PropostaComercialItem } from "./propostas-data";

export interface AcompanhamentoItem {
  id: string;
  identificador: string;
  empresa: string;
  empresaAvatar?: string;
  empresaIniciais: string;
  avatarBg: string;
  segmento: string;
  localizacao: string;
  assunto: string;
  valor: number;
  valorFormatado: string;
  status:
    | "visualizada"
    | "enviada"
    | "em_negociacao"
    | "respondida"
    | "aceita"
    | "rejeitada"
    | "em_revisao"
    | "rascunho"
    | "expirada";
  statusRotulo: string;
  ultimaAtividade: string;
  ultimaAtividadeDescricao: string;
  visualizacoes: number;
  respostas: number;
  responsavelNome: string;
  responsavelAvatar: string;
  dataCriacao: string;
  validade: string;
  dataValidadeLimite: string;
  origem: string;
  modeloUtilizado: string;
  timeline: {
    evento: string;
    dataHora: string;
    tipo: "visualizada" | "enviada" | "aprovada" | "criada" | "resposta" | "aceita" | "rejeitada";
  }[];
  arquivos?: {
    nome: string;
    tamanho: string;
    tipo: string;
  }[];
  observacoes?: string;
}

export const ITENS_ACOMPANHAMENTO_DATA: AcompanhamentoItem[] = [
  {
    id: "prop_1",
    identificador: "#PROP-2026-001",
    empresa: "Clinica Sorriso Mais",
    empresaIniciais: "CS",
    avatarBg: "bg-red-500/20 text-red-400 border border-red-500/30",
    segmento: "Clínica Odontológica",
    localizacao: "Curitiba - PR",
    assunto: "Proposta de Gestão de Leads e Agendamento",
    valor: 12500,
    valorFormatado: "R$ 12.500,00",
    status: "visualizada",
    statusRotulo: "Visualizada",
    ultimaAtividade: "Hoje 10:24",
    ultimaAtividadeDescricao: "Proposta visualizada pelo cliente",
    visualizacoes: 5,
    respostas: 2,
    responsavelNome: "Marcos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "07/10/2026 às 14:32",
    validade: "30 dias",
    dataValidadeLimite: "06/11/2026",
    origem: "Site / Formulário",
    modeloUtilizado: "Serviços Mensais",
    timeline: [
      { evento: "Visualizada", dataHora: "Hoje às 10:24", tipo: "visualizada" },
      { evento: "Enviada", dataHora: "07/10/2026 às 15:12", tipo: "enviada" },
      { evento: "Aprovada", dataHora: "07/10/2026 às 14:32", tipo: "aprovada" },
      { evento: "Criada", dataHora: "07/10/2026 às 14:30", tipo: "criada" },
    ],
    arquivos: [
      { nome: "Proposta_SorrisoMais_v2.pdf", tamanho: "2.4 MB", tipo: "PDF" },
      { nome: "Tabela_Precos_Mensal.pdf", tamanho: "680 KB", tipo: "PDF" },
    ],
    observacoes: "Cliente demonstrou alto interesse no módulo de recuperação de ausências via WhatsApp.",
  },
  {
    id: "prop_2",
    identificador: "#PROP-2026-002",
    empresa: "Studio Caiobá",
    empresaIniciais: "SC",
    avatarBg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    segmento: "Barbearia",
    localizacao: "Matinhos - PR",
    assunto: "Automação de Atendimento WhatsApp",
    valor: 7800,
    valorFormatado: "R$ 7.800,00",
    status: "enviada",
    statusRotulo: "Enviada",
    ultimaAtividade: "Ontem 16:40",
    ultimaAtividadeDescricao: "Enviado por WhatsApp para proprietário",
    visualizacoes: 3,
    respostas: 1,
    responsavelNome: "Ana",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "06/10/2026 às 16:00",
    validade: "15 dias",
    dataValidadeLimite: "21/10/2026",
    origem: "Google Maps",
    modeloUtilizado: "Proposta Express",
    timeline: [
      { evento: "Enviada", dataHora: "Ontem às 16:40", tipo: "enviada" },
      { evento: "Aprovada", dataHora: "Ontem às 16:15", tipo: "aprovada" },
      { evento: "Criada", dataHora: "Ontem às 15:45", tipo: "criada" },
    ],
    arquivos: [{ nome: "Proposta_StudioCaioba.pdf", tamanho: "1.1 MB", tipo: "PDF" }],
    observacoes: "Aguardando confirmação sobre forma de pagamento parcelada.",
  },
  {
    id: "prop_3",
    identificador: "#PROP-2026-003",
    empresa: "Parelheiros Advocacia",
    empresaIniciais: "PA",
    avatarBg: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    segmento: "Escritório Jurídico",
    localizacao: "São Paulo - SP",
    assunto: "Proposta de Prospecção e Marketing",
    valor: 18900,
    valorFormatado: "R$ 18.900,00",
    status: "em_negociacao",
    statusRotulo: "Em negociação",
    ultimaAtividade: "Ontem 14:12",
    ultimaAtividadeDescricao: "Contraproposta recebida via e-mail",
    visualizacoes: 7,
    respostas: 3,
    responsavelNome: "Carlos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "05/10/2026 às 11:20",
    validade: "30 dias",
    dataValidadeLimite: "04/11/2026",
    origem: "Indicação",
    modeloUtilizado: "Consultoria Comercial",
    timeline: [
      { evento: "Contraproposta", dataHora: "Ontem às 14:12", tipo: "resposta" },
      { evento: "Visualizada", dataHora: "06/10 às 09:30", tipo: "visualizada" },
      { evento: "Enviada", dataHora: "05/10 às 14:00", tipo: "enviada" },
      { evento: "Criada", dataHora: "05/10 às 11:20", tipo: "criada" },
    ],
    arquivos: [{ nome: "Proposta_ParelheirosAdv.pdf", tamanho: "3.2 MB", tipo: "PDF" }],
    observacoes: "Negociando inclusão de treinamento de fechamento para sócios.",
  },
  {
    id: "prop_4",
    identificador: "#PROP-2026-004",
    empresa: "Costa Advocacia",
    empresaIniciais: "CA",
    avatarBg: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
    segmento: "Advocacia",
    localizacao: "Curitiba - PR",
    assunto: "Captura e Qualificação de Leads",
    valor: 9800,
    valorFormatado: "R$ 9.800,00",
    status: "respondida",
    statusRotulo: "Respondida",
    ultimaAtividade: "26/10/2026 11:20",
    ultimaAtividadeDescricao: "Dúvida sobre escopo respondida",
    visualizacoes: 4,
    respostas: 1,
    responsavelNome: "Juliana",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "04/10/2026 às 09:15",
    validade: "20 dias",
    dataValidadeLimite: "24/10/2026",
    origem: "Google Maps",
    modeloUtilizado: "Landing Page + Tráfego",
    timeline: [
      { evento: "Respondida", dataHora: "26/10 às 11:20", tipo: "resposta" },
      { evento: "Visualizada", dataHora: "25/10 às 16:45", tipo: "visualizada" },
      { evento: "Enviada", dataHora: "04/10 às 10:00", tipo: "enviada" },
      { evento: "Criada", dataHora: "04/10 às 09:15", tipo: "criada" },
    ],
    arquivos: [{ nome: "Proposta_CostaAdv.pdf", tamanho: "1.8 MB", tipo: "PDF" }],
    observacoes: "Cliente solicitou case de sucesso no mesmo segmento de direito tributário.",
  },
  {
    id: "prop_5",
    identificador: "#PROP-2026-005",
    empresa: "Dra. Julia Lins",
    empresaIniciais: "JL",
    avatarBg: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    segmento: "Odontologia",
    localizacao: "Florianópolis - SC",
    assunto: "Plano Completo de Marketing Digital",
    valor: 15600,
    valorFormatado: "R$ 15.600,00",
    status: "aceita",
    statusRotulo: "Aceita",
    ultimaAtividade: "24/10/2026 09:15",
    ultimaAtividadeDescricao: "Aceite formal assinado digitalmente",
    visualizacoes: 6,
    respostas: 2,
    responsavelNome: "Marcos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "03/10/2026 às 17:30",
    validade: "30 dias",
    dataValidadeLimite: "02/11/2026",
    origem: "Site / Formulário",
    modeloUtilizado: "Serviços Mensais",
    timeline: [
      { evento: "Aceite formal", dataHora: "24/10 às 09:15", tipo: "aceita" },
      { evento: "Visualizada", dataHora: "23/10 às 14:00", tipo: "visualizada" },
      { evento: "Enviada", dataHora: "03/10 às 18:00", tipo: "enviada" },
      { evento: "Criada", dataHora: "03/10 às 17:30", tipo: "criada" },
    ],
    arquivos: [
      { nome: "Proposta_JuliaLins_Assinada.pdf", tamanho: "2.8 MB", tipo: "PDF" },
      { nome: "Comprovante_Assinatura.pdf", tamanho: "410 KB", tipo: "PDF" },
    ],
    observacoes: "Proposta fechada com sucesso! Encaminhada para emissão de contrato e onboarding.",
  },
  {
    id: "prop_6",
    identificador: "#PROP-2026-006",
    empresa: "Conrad Marcel",
    empresaIniciais: "CM",
    avatarBg: "bg-red-500/20 text-red-400 border border-red-500/30",
    segmento: "Consultório Odontológico",
    localizacao: "São Paulo - SP",
    assunto: "Automação de Follow-up e Agendamento",
    valor: 8400,
    valorFormatado: "R$ 8.400,00",
    status: "rejeitada",
    statusRotulo: "Rejeitada",
    ultimaAtividade: "22/10/2026 16:50",
    ultimaAtividadeDescricao: "Cliente optou por adiar investimento",
    visualizacoes: 2,
    respostas: 1,
    responsavelNome: "Ana",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "02/10/2026 às 14:00",
    validade: "15 dias",
    dataValidadeLimite: "17/10/2026",
    origem: "Outbound",
    modeloUtilizado: "Implantação de CRM",
    timeline: [
      { evento: "Recusa informada", dataHora: "22/10 às 16:50", tipo: "rejeitada" },
      { evento: "Visualizada", dataHora: "20/10 às 11:00", tipo: "visualizada" },
      { evento: "Enviada", dataHora: "02/10 às 15:30", tipo: "enviada" },
      { evento: "Criada", dataHora: "02/10 às 14:00", tipo: "criada" },
    ],
    arquivos: [{ nome: "Proposta_ConradMarcel.pdf", tamanho: "1.2 MB", tipo: "PDF" }],
    observacoes: "Reabrir contato no início do próximo trimestre orçamentário.",
  },
  {
    id: "prop_7",
    identificador: "#PROP-2026-007",
    empresa: "VK Odontologia",
    empresaIniciais: "VK",
    avatarBg: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    segmento: "Odontologia",
    localizacao: "Belo Horizonte - MG",
    assunto: "Proposta de Crescimento Comercial",
    valor: 22300,
    valorFormatado: "R$ 22.300,00",
    status: "visualizada",
    statusRotulo: "Visualizada",
    ultimaAtividade: "21/10/2026 13:44",
    ultimaAtividadeDescricao: "Proposta aberta 3x no mesmo dia",
    visualizacoes: 5,
    respostas: 1,
    responsavelNome: "Carlos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "01/10/2026 às 10:30",
    validade: "30 dias",
    dataValidadeLimite: "31/10/2026",
    origem: "Site / Formulário",
    modeloUtilizado: "Serviços Mensais",
    timeline: [
      { evento: "Visualizada", dataHora: "21/10 às 13:44", tipo: "visualizada" },
      { evento: "Enviada", dataHora: "01/10 às 11:45", tipo: "enviada" },
      { evento: "Criada", dataHora: "01/10 às 10:30", tipo: "criada" },
    ],
    arquivos: [{ nome: "Proposta_VKOdonto.pdf", tamanho: "2.1 MB", tipo: "PDF" }],
    observacoes: "Lead quente, decisor solicitou ligação de alinhamento.",
  },
  {
    id: "prop_8",
    identificador: "#PROP-2026-008",
    empresa: "Heloisa Barbosa",
    empresaIniciais: "HB",
    avatarBg: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    segmento: "Consultório Odontológico",
    localizacao: "Rio de Janeiro - RJ",
    assunto: "Gestão de Tráfego e Captação de Leads",
    valor: 11700,
    valorFormatado: "R$ 11.700,00",
    status: "enviada",
    statusRotulo: "Enviada",
    ultimaAtividade: "20/10/2026 15:32",
    ultimaAtividadeDescricao: "Aguardando primeira abertura pelo lead",
    visualizacoes: 3,
    respostas: 0,
    responsavelNome: "Juliana",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "28/09/2026 às 15:00",
    validade: "20 dias",
    dataValidadeLimite: "18/10/2026",
    origem: "Google Maps",
    modeloUtilizado: "Landing Page + Tráfego",
    timeline: [
      { evento: "Enviada", dataHora: "20/10 às 15:32", tipo: "enviada" },
      { evento: "Aprovada", dataHora: "20/10 às 14:00", tipo: "aprovada" },
      { evento: "Criada", dataHora: "28/09 às 15:00", tipo: "criada" },
    ],
    arquivos: [{ nome: "Proposta_HeloisaBarbosa.pdf", tamanho: "1.5 MB", tipo: "PDF" }],
    observacoes: "Enviar lembrete amigável via WhatsApp se não houver leitura em 48h.",
  },
  {
    id: "prop_9",
    identificador: "#PROP-2026-009",
    empresa: "Clínica COST",
    empresaIniciais: "CC",
    avatarBg: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    segmento: "Odontologia",
    localizacao: "Porto Alegre - RS",
    assunto: "Implantação de CRM e Automação",
    valor: 16800,
    valorFormatado: "R$ 16.800,00",
    status: "em_revisao",
    statusRotulo: "Em revisão",
    ultimaAtividade: "18/10/2026 11:10",
    ultimaAtividadeDescricao: "Revisão interna de escopo técnico",
    visualizacoes: 1,
    respostas: 0,
    responsavelNome: "Marcos",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "27/09/2026 às 08:45",
    validade: "30 dias",
    dataValidadeLimite: "27/10/2026",
    origem: "Indicação",
    modeloUtilizado: "Implantação de CRM",
    timeline: [
      { evento: "Em revisão", dataHora: "18/10 às 11:10", tipo: "criada" },
      { evento: "Criada", dataHora: "27/09 às 08:45", tipo: "criada" },
    ],
    arquivos: [{ nome: "Rascunho_ClinicaCOST.pdf", tamanho: "2.3 MB", tipo: "PDF" }],
    observacoes: "Ajustando número de licenças de usuários adicionais.",
  },
  {
    id: "prop_10",
    identificador: "#PROP-2026-010",
    empresa: "Dourados Odontologia",
    empresaIniciais: "DO",
    avatarBg: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
    segmento: "Odontologia",
    localizacao: "Dourados - MS",
    assunto: "Proposta de Marketing Multicanal",
    valor: 10900,
    valorFormatado: "R$ 10.900,00",
    status: "rascunho",
    statusRotulo: "Rascunho",
    ultimaAtividade: "15/10/2026 09:40",
    ultimaAtividadeDescricao: "Montagem da estrutura inicial",
    visualizacoes: 0,
    respostas: 0,
    responsavelNome: "Ana",
    responsavelAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    dataCriacao: "25/09/2026 às 09:00",
    validade: "30 dias",
    dataValidadeLimite: "25/10/2026",
    origem: "Google Maps",
    modeloUtilizado: "Plano SEO e Posicionamento",
    timeline: [{ evento: "Rascunho criado", dataHora: "15/10 às 09:40", tipo: "criada" }],
    arquivos: [],
    observacoes: "Falta definir valor das fotos profissionais do consultório.",
  },
];

interface AcompanhamentoPropostasViewProps {
  onNovaProposta: () => void;
  onAbrirNoCriador: (modeloId?: string) => void;
  onVoltarPainel?: () => void;
}

export function AcompanhamentoPropostasView({
  onNovaProposta,
  onAbrirNoCriador,
  onVoltarPainel,
}: AcompanhamentoPropostasViewProps) {
  // Lista de Propostas
  const [itens, setItens] = useState<AcompanhamentoItem[]>(ITENS_ACOMPANHAMENTO_DATA);
  const [selecionadaId, setSelecionadaId] = useState<string>("prop_1");

  // Filtros Superiores & Abas
  const [abaAtiva, setAbaAtiva] = useState<
    "todas" | "visualizadas" | "respondidas" | "negociacao" | "aceitas" | "rejeitadas" | "expiradas"
  >("todas");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("all");
  const [filtroResponsavel, setFiltroResponsavel] = useState("all");
  const [filtroOrigem, setFiltroOrigem] = useState("all");
  const [periodoSelecionado, setPeriodoSelecionado] = useState("Últimos 30 dias");

  // Visualização e Paginação
  const [modoVisualizacao, setModoVisualizacao] = useState<"tabela" | "cards">("tabela");
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Abas do Painel Direito de Detalhes
  const [abaDetalhes, setAbaDetalhes] = useState<"visao_geral" | "atividades" | "arquivos" | "observacoes">(
    "visao_geral"
  );
  const [painelLateralAberto, setPainelLateralAberto] = useState(true);

  // Modais
  const [modalVerPropostaAberto, setModalVerPropostaAberto] = useState(false);
  const [filtrosAvancadosAberto, setFiltrosAvancadosAberto] = useState(false);

  // Proposta Selecionada
  const propostaAtiva = itens.find((p) => p.id === selecionadaId) || itens[0];

  // Filtro Dinâmico
  const propostasFiltradas = useMemo(() => {
    return itens.filter((p) => {
      // Filtro por Aba
      if (abaAtiva === "visualizadas" && p.status !== "visualizada") return false;
      if (abaAtiva === "respondidas" && p.status !== "respondida") return false;
      if (abaAtiva === "negociacao" && p.status !== "em_negociacao") return false;
      if (abaAtiva === "aceitas" && p.status !== "aceita") return false;
      if (abaAtiva === "rejeitadas" && p.status !== "rejeitada") return false;
      if (abaAtiva === "expiradas" && p.status !== "expirada") return false;

      // Filtro por Status Select
      if (filtroStatus !== "all" && p.status !== filtroStatus) return false;

      // Filtro por Responsável
      if (
        filtroResponsavel !== "all" &&
        p.responsavelNome.toLowerCase() !== filtroResponsavel.toLowerCase()
      )
        return false;

      // Filtro por Origem
      if (filtroOrigem !== "all" && !p.origem.toLowerCase().includes(filtroOrigem.toLowerCase()))
        return false;

      // Busca Textual
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const matchEmpresa = p.empresa.toLowerCase().includes(termo);
        const matchAssunto = p.assunto.toLowerCase().includes(termo);
        const matchIdentificador = p.identificador.toLowerCase().includes(termo);
        const matchSegmento = p.segmento.toLowerCase().includes(termo);
        if (!matchEmpresa && !matchAssunto && !matchIdentificador && !matchSegmento) return false;
      }

      return true;
    });
  }, [itens, abaAtiva, filtroStatus, filtroResponsavel, filtroOrigem, busca]);

  // Paginação Calculada
  const totalPaginas = Math.ceil(propostasFiltradas.length / itensPorPagina) || 1;
  const propostasPaginadas = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return propostasFiltradas.slice(inicio, inicio + itensPorPagina);
  }, [propostasFiltradas, paginaAtual, itensPorPagina]);

  // Exportar Relatório Real
  const handleExportarRelatorio = () => {
    const cabecalho = "ID,Empresa,Segmento,Assunto,Valor,Status,Visualizacoes,Respostas,Responsavel,DataCriacao\n";
    const linhas = propostasFiltradas
      .map(
        (p) =>
          `"${p.identificador}","${p.empresa}","${p.segmento}","${p.assunto}","${p.valorFormatado}","${p.statusRotulo}","${p.visualizacoes}","${p.respostas}","${p.responsavelNome}","${p.dataCriacao}"`
      )
      .join("\n");

    const blob = new Blob([cabecalho + linhas], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_acompanhamento_propostas_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório de propostas exportado com sucesso em CSV!");
  };

  // Conversão para item compatível com VerPropostaModal
  const propostaParaModal: PropostaComercialItem | null = useMemo(() => {
    if (!propostaAtiva) return null;
    return {
      id: propostaAtiva.id,
      identificador: propostaAtiva.identificador,
      lead_nome: propostaAtiva.empresa,
      segmento: propostaAtiva.segmento,
      assunto: propostaAtiva.assunto,
      valor: propostaAtiva.valor,
      valorFormatado: propostaAtiva.valorFormatado,
      status: (propostaAtiva.status === "em_negociacao"
        ? "em_revisao"
        : propostaAtiva.status === "respondida"
        ? "visualizada"
        : propostaAtiva.status) as any,
      statusRotulo: propostaAtiva.statusRotulo,
      data: propostaAtiva.dataCriacao.split(" às ")[0],
      responsavelNome: propostaAtiva.responsavelNome,
      responsavelAvatar: propostaAtiva.responsavelAvatar,
      origem: propostaAtiva.origem,
      resumoComercial: propostaAtiva.observacoes || propostaAtiva.assunto,
      validade: propostaAtiva.validade,
      diasRestantes: 30,
      servicos: [
        {
          nome: propostaAtiva.assunto,
          descricao: `Serviço comercial sob medida baseado no modelo ${propostaAtiva.modeloUtilizado}.`,
          valor: propostaAtiva.valorFormatado,
        },
      ],
      historico: propostaAtiva.timeline.map((t) => ({
        data: t.dataHora.split(" às ")[0],
        hora: t.dataHora.includes(" às ") ? t.dataHora.split(" às ")[1] : "10:00",
        evento: t.evento,
        usuario: propostaAtiva.responsavelNome,
      })),
      arquivos: propostaAtiva.arquivos || [],
    };
  }, [propostaAtiva]);

  return (
    <div className="mx-auto max-w-[1720px] px-3.5 pb-16 pt-5 sm:px-6 lg:px-8 space-y-5 antialiased text-neutral-100 selection:bg-[#f95d14]/30 selection:text-white">
      {/* =========================================================================
          1. CABEÇALHO & BREADCRUMBS
         ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
          >
            <span className="hover:text-neutral-200 cursor-pointer">Gestão</span>
            <ChevronRight className="size-3 text-neutral-600" />
            <button
              type="button"
              onClick={onVoltarPainel}
              className="hover:text-neutral-200 transition-colors"
            >
              Propostas
            </button>
            <ChevronRight className="size-3 text-neutral-600" />
            <span className="text-neutral-200 font-semibold">Acompanhamento</span>
          </nav>

          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <FileText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Acompanhamento de Propostas
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Monitore o desempenho das suas propostas, visualizações, respostas e conversões.
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Ação da Direita */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Seletor de Período */}
          <div className="relative">
            <button
              type="button"
              className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181d2a]"
            >
              <Calendar className="size-3.5 text-neutral-400" />
              <span>{periodoSelecionado}</span>
              <ChevronDown className="size-3.5 text-neutral-500 ml-0.5" />
            </button>
          </div>

          {/* Exportar Relatório */}
          <button
            type="button"
            onClick={handleExportarRelatorio}
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-[#121620] px-3.5 text-xs font-semibold text-neutral-200 transition-all hover:border-white/20 hover:bg-[#181d2a] hover:text-white"
          >
            <Download className="size-3.5 text-neutral-400" />
            <span>Exportar relatório</span>
          </button>

          {/* Nova Proposta */}
          <button
            type="button"
            onClick={onNovaProposta}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Nova proposta</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. SEIS CARDS DE INDICADORES EXECUTIVOS (KPIs)
         ========================================================================= */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Card 1: Total de Propostas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Total de propostas</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-orange-500/10 border border-orange-500/20 text-[#f97316]">
              <FileText className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">29</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+16% vs. período anterior</span>
          </div>
        </div>

        {/* Card 2: Visualizações */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Visualizações</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-[#3b82f6]">
              <Eye className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">48</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+33% vs. período anterior</span>
          </div>
        </div>

        {/* Card 3: Respostas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Respostas</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20 text-[#a855f7]">
              <MessageSquare className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">12</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+50% vs. período anterior</span>
          </div>
        </div>

        {/* Card 4: Propostas Aceitas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Propostas aceitas</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[#10b981]">
              <CheckCircle2 className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">8</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+60% vs. período anterior</span>
          </div>
        </div>

        {/* Card 5: Propostas Rejeitadas */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Propostas rejeitadas</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-[#ef4444]">
              <XCircle className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">4</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-red-400">
            <TrendingDown className="size-3" />
            <span>-20% vs. período anterior</span>
          </div>
        </div>

        {/* Card 6: Taxa de Conversão */}
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0c1017] p-4 transition-all hover:border-white/10 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-400">Taxa de conversão</span>
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-[#f59e0b]">
              <Trophy className="size-3.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">27,6%</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-emerald-400">
            <TrendingUp className="size-3" />
            <span>+8% vs. período anterior</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. TRÊS PAINÉIS DE GRÁFICOS (Evolução, Funil, Status)
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* GRÁFICO 1: Evolução de Propostas (Linhas) */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold text-white tracking-wide">Evolução de Propostas</h2>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400 bg-[#121620] px-2.5 py-1 rounded-lg border border-white/5">
              <span>Últimos 30 dias</span>
              <ChevronDown className="size-3 text-neutral-500" />
            </div>
          </div>

          {/* Gráfico SVG de Linhas */}
          <div className="relative h-48 w-full pt-4">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 160">
              {/* Grid Lines Horizontais */}
              <line x1="30" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="30" y1="55" x2="390" y2="55" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="30" y1="90" x2="390" y2="90" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1="30" y1="125" x2="390" y2="125" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

              {/* Rótulos do Eixo Y */}
              <text x="10" y="24" fill="#737373" fontSize="9" fontFamily="monospace">40</text>
              <text x="10" y="59" fill="#737373" fontSize="9" fontFamily="monospace">30</text>
              <text x="10" y="94" fill="#737373" fontSize="9" fontFamily="monospace">20</text>
              <text x="10" y="129" fill="#737373" fontSize="9" fontFamily="monospace">10</text>

              {/* Linha 1: Enviadas (Azul #3b82f6) */}
              <path
                d="M 40 120 C 90 100, 150 90, 200 65 C 260 45, 320 35, 380 20"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="380" cy="20" r="3.5" fill="#3b82f6" />

              {/* Linha 2: Visualizadas (Roxo #a855f7) */}
              <path
                d="M 40 135 C 90 115, 150 100, 200 80 C 260 65, 320 50, 380 35"
                fill="none"
                stroke="#a855f7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="380" cy="35" r="3.5" fill="#a855f7" />

              {/* Linha 3: Respondidas (Laranja #f97316) */}
              <path
                d="M 40 148 C 90 135, 150 120, 200 105 C 260 95, 320 85, 380 75"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="380" cy="75" r="3.5" fill="#f97316" />

              {/* Linha 4: Aceitas (Verde #10b981) */}
              <path
                d="M 40 152 C 90 145, 150 135, 200 125 C 260 118, 320 105, 380 95"
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="380" cy="95" r="3.5" fill="#10b981" />

              {/* Rótulos do Eixo X */}
              <text x="35" y="152" fill="#737373" fontSize="8" fontFamily="monospace">01/10</text>
              <text x="90" y="152" fill="#737373" fontSize="8" fontFamily="monospace">05/10</text>
              <text x="145" y="152" fill="#737373" fontSize="8" fontFamily="monospace">10/10</text>
              <text x="200" y="152" fill="#737373" fontSize="8" fontFamily="monospace">15/10</text>
              <text x="255" y="152" fill="#737373" fontSize="8" fontFamily="monospace">20/10</text>
              <text x="310" y="152" fill="#737373" fontSize="8" fontFamily="monospace">25/10</text>
              <text x="365" y="152" fill="#737373" fontSize="8" fontFamily="monospace">31/10</text>
            </svg>
          </div>

          {/* Legenda das Séries */}
          <div className="flex items-center justify-center gap-4 pt-3 border-t border-white/5 text-[10px] text-neutral-300">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#3b82f6]" />
              <span>Enviadas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#a855f7]" />
              <span>Visualizadas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#f97316]" />
              <span>Respondidas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-[#10b981]" />
              <span>Aceitas</span>
            </span>
          </div>
        </div>

        {/* GRÁFICO 2: Funil de Conversão */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white tracking-wide">Funil de Conversão</h2>
              <span title="Baseado em propostas únicas que avançaram em cada etapa">
                <Info className="size-3 text-neutral-500 cursor-help" />
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400 bg-[#121620] px-2.5 py-1 rounded-lg border border-white/5">
              <span>Últimos 30 dias</span>
              <ChevronDown className="size-3 text-neutral-500" />
            </div>
          </div>

          {/* Estrutura Visual do Funil */}
          <div className="flex flex-col items-center justify-center py-2 space-y-2">
            {/* Etapa 1: Enviadas */}
            <div className="w-full flex items-center justify-between gap-3">
              <div className="h-9 flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-blue-500/20">
                <span>29 Propostas enviadas</span>
              </div>
              <div className="w-16 text-right">
                <span className="font-mono text-xs font-bold text-white block">100%</span>
                <span className="text-[10px] text-neutral-500">29 enviadas</span>
              </div>
            </div>

            {/* Etapa 2: Visualizações */}
            <div className="w-[88%] flex items-center justify-between gap-3">
              <div className="h-9 flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-purple-500/20">
                <span>48 Visualizações</span>
              </div>
              <div className="w-16 text-right">
                <span className="font-mono text-xs font-bold text-purple-300 block">165%</span>
                <span className="text-[10px] text-neutral-500">48 aberturas</span>
              </div>
            </div>

            {/* Etapa 3: Respostas */}
            <div className="w-[72%] flex items-center justify-between gap-3">
              <div className="h-9 flex-1 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-orange-500/20">
                <span>12 Respostas</span>
              </div>
              <div className="w-16 text-right">
                <span className="font-mono text-xs font-bold text-orange-300 block">41%</span>
                <span className="text-[10px] text-neutral-500">12 respostas</span>
              </div>
            </div>

            {/* Etapa 4: Aceitas */}
            <div className="w-[56%] flex items-center justify-between gap-3">
              <div className="h-9 flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-emerald-500/20">
                <span>8 Aceitas</span>
              </div>
              <div className="w-16 text-right">
                <span className="font-mono text-xs font-bold text-emerald-400 block">27.6%</span>
                <span className="text-[10px] text-neutral-500">8 aceites</span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center text-[10px] text-neutral-400 border-t border-white/5">
            Média de conversão de leads em propostas aceitas: <strong className="text-white">27,6%</strong>
          </div>
        </div>

        {/* GRÁFICO 3: Status das Propostas (Donut) */}
        <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-xs font-bold text-white tracking-wide">Status das Propostas</h2>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400 bg-[#121620] px-2.5 py-1 rounded-lg border border-white/5">
              <span>Últimos 30 dias</span>
              <ChevronDown className="size-3 text-neutral-500" />
            </div>
          </div>

          {/* Donut e Breakdown */}
          <div className="flex items-center justify-between gap-4 py-2">
            {/* SVG Donut */}
            <div className="relative size-36 shrink-0 flex items-center justify-center">
              <svg className="size-full -rotate-90" viewBox="0 0 100 100">
                {/* Rascunho (17%) - Slate */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#64748b"
                  strokeWidth="11"
                  strokeDasharray="40 200"
                  strokeDashoffset="0"
                />
                {/* Em revisão (10%) - Yellow */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="11"
                  strokeDasharray="24 200"
                  strokeDashoffset="-40"
                />
                {/* Aprovada (28%) - Blue */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="11"
                  strokeDasharray="66 200"
                  strokeDashoffset="-64"
                />
                {/* Enviada (28%) - Cyan */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="11"
                  strokeDasharray="40 200"
                  strokeDashoffset="-130"
                />
                {/* Aceita (10%) - Emerald */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="11"
                  strokeDasharray="24 200"
                  strokeDashoffset="-170"
                />
                {/* Rejeitada (14%) - Red */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="11"
                  strokeDasharray="30 200"
                  strokeDashoffset="-194"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold font-mono text-white leading-tight">29</span>
                <span className="text-[10px] text-neutral-400">Propostas</span>
              </div>
            </div>

            {/* Lista de Legendas com Porcentagens */}
            <div className="flex-1 space-y-1.5 text-[11px] pr-1">
              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#64748b]" />
                  <span>Rascunho</span>
                </span>
                <span className="font-mono text-neutral-400">5 <span className="text-[10px] text-neutral-600">(17%)</span></span>
              </div>

              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#eab308]" />
                  <span>Em revisão</span>
                </span>
                <span className="font-mono text-neutral-400">3 <span className="text-[10px] text-neutral-600">(10%)</span></span>
              </div>

              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#3b82f6]" />
                  <span>Aprovada</span>
                </span>
                <span className="font-mono text-neutral-400">8 <span className="text-[10px] text-neutral-600">(28%)</span></span>
              </div>

              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#06b6d4]" />
                  <span>Enviada</span>
                </span>
                <span className="font-mono text-neutral-400">8 <span className="text-[10px] text-neutral-600">(28%)</span></span>
              </div>

              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#a855f7]" />
                  <span>Visualizada</span>
                </span>
                <span className="font-mono text-neutral-400">8 <span className="text-[10px] text-neutral-600">(28%)</span></span>
              </div>

              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#10b981]" />
                  <span>Aceita</span>
                </span>
                <span className="font-mono text-neutral-400">3 <span className="text-[10px] text-neutral-600">(10%)</span></span>
              </div>

              <div className="flex items-center justify-between text-neutral-300">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-[#ef4444]" />
                  <span>Rejeitada</span>
                </span>
                <span className="font-mono text-neutral-400">4 <span className="text-[10px] text-neutral-600">(14%)</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. ABAS DE ACOMPANHAMENTO
         ========================================================================= */}
      <nav aria-label="Abas de Acompanhamento" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {/* Todas as Propostas */}
        <button
          type="button"
          onClick={() => {
            setAbaAtiva("todas");
            setPaginaAtual(1);
          }}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "todas"
              ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white border-orange-500 shadow-md shadow-orange-600/20"
              : "bg-[#121620] text-neutral-300 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          <FileText className="size-3.5" />
          <span>Todas as Propostas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/20 font-mono">29</span>
        </button>

        {/* Visualizadas */}
        <button
          type="button"
          onClick={() => {
            setAbaAtiva("visualizadas");
            setPaginaAtual(1);
          }}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "visualizadas"
              ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20"
              : "bg-[#121620] text-neutral-300 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          <Eye className="size-3.5 text-purple-400" />
          <span>Visualizadas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">8</span>
        </button>

        {/* Respondidas */}
        <button
          type="button"
          onClick={() => {
            setAbaAtiva("respondidas");
            setPaginaAtual(1);
          }}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "respondidas"
              ? "bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/20"
              : "bg-[#121620] text-neutral-300 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          <MessageSquare className="size-3.5 text-sky-400" />
          <span>Respondidas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">4</span>
        </button>

        {/* Em Negociação */}
        <button
          type="button"
          onClick={() => {
            setAbaAtiva("negociacao");
            setPaginaAtual(1);
          }}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "negociacao"
              ? "bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-600/20"
              : "bg-[#121620] text-neutral-300 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          <Clock className="size-3.5 text-amber-400" />
          <span>Em Negociação</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">3</span>
        </button>

        {/* Aceitas */}
        <button
          type="button"
          onClick={() => {
            setAbaAtiva("aceitas");
            setPaginaAtual(1);
          }}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "aceitas"
              ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20"
              : "bg-[#121620] text-neutral-300 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          <CheckCircle2 className="size-3.5 text-emerald-400" />
          <span>Aceitas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">8</span>
        </button>

        {/* Rejeitadas */}
        <button
          type="button"
          onClick={() => {
            setAbaAtiva("rejeitadas");
            setPaginaAtual(1);
          }}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "rejeitadas"
              ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20"
              : "bg-[#121620] text-neutral-300 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          <XCircle className="size-3.5 text-red-400" />
          <span>Rejeitadas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">4</span>
        </button>

        {/* Expiradas */}
        <button
          type="button"
          onClick={() => {
            setAbaAtiva("expiradas");
            setPaginaAtual(1);
          }}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
            abaAtiva === "expiradas"
              ? "bg-neutral-700 text-white border-neutral-600 shadow-md"
              : "bg-[#121620] text-neutral-300 border-white/5 hover:bg-white/10 hover:text-white"
          )}
        >
          <AlertCircle className="size-3.5 text-neutral-400" />
          <span>Expiradas</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 font-mono">2</span>
        </button>
      </nav>

      {/* =========================================================================
          5. BARRA DE BUSCA E FILTROS COMBINADOS
         ========================================================================= */}
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#0c1017] p-3 shadow-sm">
        {/* Campo de Busca */}
        <div className="relative min-w-[280px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <input
            type="text"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPaginaAtual(1);
            }}
            placeholder="Buscar por lead, empresa ou assunto..."
            className="w-full rounded-xl border border-white/5 bg-[#121620] pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <select
            value={filtroStatus}
            onChange={(e) => {
              setFiltroStatus(e.target.value);
              setPaginaAtual(1);
            }}
            aria-label="Filtro por status"
            className="rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
          >
            <option value="all">Todos os status</option>
            <option value="visualizada">Visualizada</option>
            <option value="enviada">Enviada</option>
            <option value="em_negociacao">Em negociação</option>
            <option value="respondida">Respondida</option>
            <option value="aceita">Aceita</option>
            <option value="rejeitada">Rejeitada</option>
            <option value="em_revisao">Em revisão</option>
            <option value="rascunho">Rascunho</option>
          </select>

          {/* Responsável */}
          <select
            value={filtroResponsavel}
            onChange={(e) => {
              setFiltroResponsavel(e.target.value);
              setPaginaAtual(1);
            }}
            aria-label="Filtro por responsável"
            className="rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
          >
            <option value="all">Todos os responsáveis</option>
            <option value="marcos">Marcos</option>
            <option value="ana">Ana</option>
            <option value="carlos">Carlos</option>
            <option value="juliana">Juliana</option>
          </select>

          {/* Origem */}
          <select
            value={filtroOrigem}
            onChange={(e) => {
              setFiltroOrigem(e.target.value);
              setPaginaAtual(1);
            }}
            aria-label="Filtro por origem"
            className="rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs text-neutral-300 focus:border-orange-500/50 focus:outline-none"
          >
            <option value="all">Todas as origens</option>
            <option value="site">Site / Formulário</option>
            <option value="google maps">Google Maps</option>
            <option value="indicação">Indicação</option>
            <option value="outbound">Outbound</option>
          </select>

          {/* Filtros Avançados */}
          <button
            type="button"
            onClick={() => setFiltrosAvancadosAberto(!filtrosAvancadosAberto)}
            className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-[#121620] px-3 py-2 text-xs font-semibold text-neutral-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Sliders className="size-3.5 text-neutral-400" />
            <span>Filtros avançados</span>
          </button>

          {/* Alternar Visualização */}
          <div className="flex items-center rounded-xl border border-white/5 bg-[#121620] p-0.5">
            <button
              type="button"
              onClick={() => setModoVisualizacao("tabela")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                modoVisualizacao === "tabela" ? "bg-orange-500 text-white" : "text-neutral-400 hover:text-white"
              )}
              title="Visualização em tabela"
            >
              <List className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao("cards")}
              className={cn(
                "p-1.5 rounded-lg transition-colors",
                modoVisualizacao === "cards" ? "bg-orange-500 text-white" : "text-neutral-400 hover:text-white"
              )}
              title="Visualização em cards"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. CONTEÚDO PRINCIPAL: TABELA + PAINEL DIREITO DE DETALHES
         ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Coluna Esquerda/Central: Tabela de Propostas (xl:col-span-8 ou xl:col-span-12 se painel fechado) */}
        <div className={cn("transition-all", painelLateralAberto ? "xl:col-span-8" : "xl:col-span-12")}>
          <div className="rounded-2xl border border-white/5 bg-[#0c1017] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-300 border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#10141d]/80 text-[11px] font-semibold text-neutral-400">
                    <th className="py-3 px-3 w-8 text-center">
                      <input
                        type="checkbox"
                        aria-label="Selecionar todas as propostas"
                        className="rounded border-white/20 bg-neutral-900 text-orange-500 focus:ring-0"
                      />
                    </th>
                    <th className="py-3 px-3">Lead / Empresa</th>
                    <th className="py-3 px-3">Assunto</th>
                    <th className="py-3 px-3 text-right">Valor</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Última atividade</th>
                    <th className="py-3 px-3 text-center">Visualizações</th>
                    <th className="py-3 px-3 text-center">Respostas</th>
                    <th className="py-3 px-3">Responsável</th>
                    <th className="py-3 px-3 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {propostasPaginadas.map((p) => {
                    const ativa = p.id === selecionadaId;

                    return (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelecionadaId(p.id);
                          setPainelLateralAberto(true);
                        }}
                        className={cn(
                          "cursor-pointer transition-colors group",
                          ativa
                            ? "bg-orange-500/10 border-l-2 border-l-[#f97316]"
                            : "hover:bg-[#121620]/60"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            aria-label={`Selecionar proposta ${p.identificador}`}
                            checked={ativa}
                            onChange={() => setSelecionadaId(p.id)}
                            className="rounded border-white/20 bg-neutral-900 text-orange-500 focus:ring-0"
                          />
                        </td>

                        {/* Lead / Empresa */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-[10px]",
                                p.avatarBg
                              )}
                            >
                              {p.empresaIniciais}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-white block truncate leading-tight group-hover:text-orange-300 transition-colors">
                                {p.empresa}
                              </span>
                              <span className="text-[10px] text-neutral-400 block truncate mt-0.5">
                                {p.segmento}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Assunto */}
                        <td className="py-3 px-3 font-medium text-neutral-200 max-w-[200px] truncate">
                          {p.assunto}
                        </td>

                        {/* Valor */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-white whitespace-nowrap">
                          {p.valorFormatado}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border",
                              p.status === "visualizada"
                                ? "bg-purple-500/15 text-purple-400 border-purple-500/25"
                                : p.status === "enviada"
                                ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                                : p.status === "em_negociacao"
                                ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                                : p.status === "respondida"
                                ? "bg-sky-500/15 text-sky-400 border-sky-500/25"
                                : p.status === "aceita"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                : p.status === "rejeitada"
                                ? "bg-red-500/15 text-red-400 border-red-500/25"
                                : p.status === "em_revisao"
                                ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/25"
                                : "bg-slate-500/15 text-slate-400 border-slate-500/25"
                            )}
                          >
                            <span className="size-1.5 rounded-full bg-current" />
                            {p.statusRotulo}
                          </span>
                        </td>

                        {/* Última Atividade */}
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-neutral-300 whitespace-nowrap">
                          {p.ultimaAtividade}
                        </td>

                        {/* Visualizações */}
                        <td className="py-3 px-3 text-center font-mono text-xs text-neutral-300">
                          {p.visualizacoes}
                        </td>

                        {/* Respostas */}
                        <td className="py-3 px-3 text-center font-mono text-xs text-neutral-300">
                          {p.respostas}
                        </td>

                        {/* Responsável */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <img
                              src={p.responsavelAvatar}
                              alt={p.responsavelNome}
                              className="size-5 rounded-full object-cover border border-white/20"
                            />
                            <span className="text-neutral-300 text-xs">{p.responsavelNome}</span>
                          </div>
                        </td>

                        {/* Ações */}
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelecionadaId(p.id);
                                setModalVerPropostaAberto(true);
                              }}
                              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                              title="Visualizar documento"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                toast.success(`Proposta ${p.identificador} encaminhada para follow-up!`);
                              }}
                              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                              title="Enviar lembrete"
                            >
                              <Send className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onAbrirNoCriador("mensal");
                                toast.info("Abrindo proposta no Criador Profissional...");
                              }}
                              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10"
                              title="Mais opções"
                            >
                              <MoreVertical className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação Inferior da Tabela */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 border-t border-white/5 bg-[#10141d]/60 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual <= 1}
                  className="p-1 rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setPaginaAtual(pg)}
                    className={cn(
                      "size-7 rounded-lg text-xs font-mono font-semibold transition-all",
                      paginaAtual === pg
                        ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                        : "text-neutral-400 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual >= totalPaginas}
                  className="p-1 rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="size-4" />
                </button>

                <select
                  value={itensPorPagina}
                  onChange={(e) => {
                    setItensPorPagina(Number(e.target.value));
                    setPaginaAtual(1);
                  }}
                  aria-label="Itens por página"
                  className="rounded-lg border border-white/10 bg-[#121620] px-2 py-1 text-xs text-neutral-300 focus:outline-none ml-2"
                >
                  <option value={5}>5 por página</option>
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                </select>
              </div>

              <span className="font-mono text-[11px] text-neutral-400">
                Mostrando 1 - {Math.min(itensPorPagina, propostasFiltradas.length)} de{" "}
                <strong className="text-white">{propostasFiltradas.length}</strong> propostas
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Painel Lateral da Proposta Selecionada + Sugestões de IA (xl:col-span-4) */}
        {painelLateralAberto && (
          <aside aria-label="Detalhes da proposta selecionada" className="xl:col-span-4 space-y-4">
            {/* Card Principal de Detalhes da Proposta */}
            <div className="rounded-2xl border border-white/5 bg-[#0c1017] p-4 shadow-sm space-y-4">
              {/* Header do Painel com Close */}
              <div className="flex items-start justify-between gap-3 border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-full font-bold text-xs",
                      propostaAtiva.avatarBg
                    )}
                  >
                    {propostaAtiva.empresaIniciais}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white tracking-tight">
                        {propostaAtiva.empresa}
                      </h2>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold border",
                          propostaAtiva.status === "visualizada"
                            ? "bg-purple-500/15 text-purple-400 border-purple-500/25"
                            : propostaAtiva.status === "aceita"
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                            : "bg-blue-500/15 text-blue-400 border-blue-500/25"
                        )}
                      >
                        {propostaAtiva.statusRotulo}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {propostaAtiva.segmento} • {propostaAtiva.localizacao}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPainelLateralAberto(false)}
                  className="p-1 rounded-lg text-neutral-500 hover:text-white hover:bg-white/10"
                  title="Recolher painel"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Título da Proposta e Identificador */}
              <div>
                <h3 className="text-sm font-bold text-white leading-snug">
                  {propostaAtiva.assunto}
                </h3>
                <span className="font-mono text-[11px] text-neutral-500 block mt-0.5">
                  {propostaAtiva.identificador}
                </span>
              </div>

              {/* 4 Abas do Painel */}
              <div className="flex items-center gap-1 border-b border-white/5 pb-2 text-xs">
                <button
                  type="button"
                  onClick={() => setAbaDetalhes("visao_geral")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                    abaDetalhes === "visao_geral"
                      ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Visão Geral
                </button>
                <button
                  type="button"
                  onClick={() => setAbaDetalhes("atividades")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                    abaDetalhes === "atividades"
                      ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Atividades
                </button>
                <button
                  type="button"
                  onClick={() => setAbaDetalhes("arquivos")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                    abaDetalhes === "arquivos"
                      ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Arquivos
                </button>
                <button
                  type="button"
                  onClick={() => setAbaDetalhes("observacoes")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-semibold transition-all",
                    abaDetalhes === "observacoes"
                      ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  Observações
                </button>
              </div>

              {/* Conteúdo da Aba: Visão Geral */}
              {abaDetalhes === "visao_geral" && (
                <div className="space-y-4">
                  {/* Grid de 6 Atributos Comerciais */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-white/5 bg-[#121620]/60 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-400 block">Valor da proposta</span>
                      <span className="font-mono text-base font-bold text-white">
                        {propostaAtiva.valorFormatado}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block">Validade</span>
                      <span className="font-semibold text-white flex items-center gap-1">
                        <Clock className="size-3 text-orange-400" />
                        <span>{propostaAtiva.validade}</span>
                      </span>
                      <span className="text-[10px] text-neutral-500 block font-mono">
                        {propostaAtiva.dataValidadeLimite}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block">Responsável</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <img
                          src={propostaAtiva.responsavelAvatar}
                          alt={propostaAtiva.responsavelNome}
                          className="size-4 rounded-full object-cover border border-white/20"
                        />
                        <span className="font-medium text-neutral-200">
                          {propostaAtiva.responsavelNome} Gonçalves
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block">Data de criação</span>
                      <span className="font-mono text-[11px] text-neutral-300">
                        {propostaAtiva.dataCriacao}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block">Origem</span>
                      <span className="font-medium text-neutral-200">
                        {propostaAtiva.origem}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-neutral-400 block">Modelo utilizado</span>
                      <span className="font-medium text-orange-400">
                        {propostaAtiva.modeloUtilizado}
                      </span>
                    </div>
                  </div>

                  {/* Card: Última Atividade */}
                  <div className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/10 text-xs">
                    <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wide block mb-1">
                      Última atividade
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white">
                        <Eye className="size-4 text-purple-400" />
                        <span className="font-semibold">{propostaAtiva.ultimaAtividadeDescricao}</span>
                      </div>
                      <span className="font-mono text-[11px] text-purple-300">
                        {propostaAtiva.ultimaAtividade}
                      </span>
                    </div>
                  </div>

                  {/* Linha do Tempo Comercial (Timeline) */}
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide block">
                      Linha do tempo
                    </span>
                    <div className="space-y-2 border-l border-white/10 pl-3 ml-1.5">
                      {propostaAtiva.timeline.map((item, idx) => (
                        <div key={idx} className="relative flex items-center justify-between text-xs">
                          <span
                            className={cn(
                              "absolute -left-[17px] size-2 rounded-full ring-4 ring-[#0c1017]",
                              item.tipo === "visualizada"
                                ? "bg-purple-500"
                                : item.tipo === "enviada"
                                ? "bg-blue-500"
                                : item.tipo === "aprovada"
                                ? "bg-emerald-500"
                                : item.tipo === "aceita"
                                ? "bg-emerald-400"
                                : item.tipo === "rejeitada"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            )}
                          />
                          <span className="font-medium text-neutral-200">{item.evento}</span>
                          <span className="font-mono text-[10px] text-neutral-400">
                            {item.dataHora}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botões de Ação do Painel */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModalVerPropostaAberto(true)}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:brightness-110 active:scale-[0.98] transition-all"
                      >
                        <Eye className="size-3.5" />
                        <span>Ver proposta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onAbrirNoCriador("mensal");
                          toast.success("Proposta carregada para edição no Criador Profissional!");
                        }}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-xs font-bold text-white transition-all"
                      >
                        <Pencil className="size-3.5 text-neutral-400" />
                        <span>Editar</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          toast.success(`Proposta ${propostaAtiva.identificador} duplicada com sucesso!`);
                        }}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-white/5 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
                      >
                        <Copy className="size-3 text-neutral-400" />
                        <span>Duplicar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toast.success(`Disparo comercial agendado para ${propostaAtiva.empresa}!`);
                        }}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-white/5 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
                      >
                        <Send className="size-3 text-neutral-400" />
                        <span>Enviar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          toast.info("Opções comerciais: Exportar PDF, Reabrir, Marcar como Perdida");
                        }}
                        className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-white/5 bg-[#121620] hover:bg-white/10 text-[11px] font-semibold text-neutral-300"
                      >
                        <span>Mais ações</span>
                        <ChevronDown className="size-3 text-neutral-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Conteúdo da Aba: Atividades */}
              {abaDetalhes === "atividades" && (
                <div className="space-y-3 text-xs">
                  <p className="text-neutral-400 text-[11px]">
                    Histórico detalhado de interações e rastreamento de acessos do cliente:
                  </p>
                  <div className="space-y-2">
                    {propostaAtiva.timeline.map((t, i) => (
                      <div key={i} className="p-2.5 rounded-xl border border-white/5 bg-[#121620] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{t.evento}</span>
                          <span className="font-mono text-[10px] text-neutral-400">{t.dataHora}</span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Origem: Link seguro criptografado com token de rastreamento.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conteúdo da Aba: Arquivos */}
              {abaDetalhes === "arquivos" && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-neutral-400">Documentos anexados</span>
                    <button
                      type="button"
                      onClick={() => toast.info("Upload de anexos comerciais")}
                      className="text-[10px] text-orange-400 hover:underline"
                    >
                      + Anexar
                    </button>
                  </div>
                  {propostaAtiva.arquivos && propostaAtiva.arquivos.length > 0 ? (
                    <div className="space-y-2">
                      {propostaAtiva.arquivos.map((arq, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-[#121620]"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-orange-400" />
                            <div>
                              <span className="font-medium text-white block text-xs">{arq.nome}</span>
                              <span className="font-mono text-[10px] text-neutral-500">{arq.tamanho}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toast.success(`Iniciando download de ${arq.nome}`)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white"
                          >
                            <Download className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-neutral-500 text-xs">
                      Nenhum arquivo anexado a esta proposta.
                    </div>
                  )}
                </div>
              )}

              {/* Conteúdo da Aba: Observações */}
              {abaDetalhes === "observacoes" && (
                <div className="space-y-3 text-xs">
                  <span className="text-[11px] font-semibold text-neutral-400 block">
                    Anotações comerciais da equipe
                  </span>
                  <textarea
                    rows={4}
                    defaultValue={propostaAtiva.observacoes || ""}
                    placeholder="Adicione observações sobre a negociação..."
                    className="w-full rounded-xl border border-white/10 bg-[#121620] p-3 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => toast.success("Observações salvas com sucesso!")}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-600 to-[#f97316] text-xs font-bold text-white shadow-sm"
                  >
                    Salvar anotação
                  </button>
                </div>
              )}
            </div>

            {/* CARD: SUGESTÕES DE IA (Fiel ao layout final da referência) */}
            <div className="rounded-2xl border border-purple-500/20 bg-[#0c1017] p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                    <Sparkles className="size-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white tracking-wide">Sugestões de IA</h3>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Carregando catálogo completo de sugestões preditivas...")}
                  className="text-[11px] font-semibold text-purple-400 hover:underline"
                >
                  Ver todas
                </button>
              </div>

              {/* 3 Recomendações da Referência */}
              <div className="space-y-2">
                {/* Sugestão 1: Enviar lembrete */}
                <div
                  onClick={() => {
                    toast.success(
                      `Lembrete inteligente preparado para ${propostaAtiva.empresa}: "Olá! Notamos que você analisou nossa proposta. Podemos agendar 10min para tirar dúvidas?"`
                    );
                  }}
                  className="group flex items-start gap-3 p-2.5 rounded-xl border border-white/5 bg-[#121620] hover:border-purple-500/40 hover:bg-[#181a2b] transition-all cursor-pointer"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500/20">
                    <Bell className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white block text-xs group-hover:text-purple-300 transition-colors">
                      Enviar lembrete de acompanhamento
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                      O cliente visualizou sua proposta, mas ainda não respondeu.
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 text-neutral-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all self-center" />
                </div>

                {/* Sugestão 2: Call de Apresentação */}
                <div
                  onClick={() => {
                    toast.success("Convite para call de alinhamento gerado no Google Calendar!");
                  }}
                  className="group flex items-start gap-3 p-2.5 rounded-xl border border-white/5 bg-[#121620] hover:border-purple-500/40 hover:bg-[#181a2b] transition-all cursor-pointer"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20">
                    <Calendar className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white block text-xs group-hover:text-blue-300 transition-colors">
                      Sugerir call de apresentação
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                      Proponha uma reunião para esclarecer dúvidas.
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 text-neutral-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all self-center" />
                </div>

                {/* Sugestão 3: Destacar ROI */}
                <div
                  onClick={() => {
                    toast.info("Slide de estimativa de ROI adicionado à prévia da proposta!");
                  }}
                  className="group flex items-start gap-3 p-2.5 rounded-xl border border-white/5 bg-[#121620] hover:border-purple-500/40 hover:bg-[#181a2b] transition-all cursor-pointer"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20">
                    <Trophy className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white block text-xs group-hover:text-emerald-300 transition-colors">
                      Destacar ROI e resultados
                    </span>
                    <p className="text-[10px] text-neutral-400 mt-0.5 leading-snug">
                      Inclua mais dados de retorno sobre o investimento.
                    </p>
                  </div>
                  <ChevronRight className="size-3.5 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all self-center" />
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* =========================================================================
          7. MODAL DE VISUALIZAÇÃO COMPLETA DA PROPOSTA
         ========================================================================= */}
      <VerPropostaModal
        proposta={propostaParaModal}
        aberto={modalVerPropostaAberto}
        onFechar={() => setModalVerPropostaAberto(false)}
      />
    </div>
  );
}
