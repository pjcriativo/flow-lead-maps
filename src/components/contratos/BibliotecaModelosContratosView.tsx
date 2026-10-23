// Tela 03 — Modelos de Contratos (Gestão → Contratos → Modelos de Contratos)
// Fiel ao layout visual aprovado com máxima fidelidade:
// 1. Cabeçalho com breadcrumbs, título, subtítulo e botão "+ Novo modelo"
// 2. Quatro cards superiores de destaque (Modelos Profissionais, Cláusulas Inteligentes, Identidade da sua Marca, Criação com IA)
// 3. Coluna esquerda de Filtros (Busca, Categorias com contadores, Tipos de Contrato, Segmentos e Status)
// 4. Galeria central com grid de 3 colunas, capas editoriais profissionais, tags e botões "Usar modelo" / "Visualizar"
// 5. Painel direito de Pré-visualização com alternadores de dispositivo, miniatura A4, informações, botão "Usar este modelo", "Personalizar" e checklist de 13 cláusulas incluídas
import React, { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
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
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileCheck2,
  FileEdit,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Filter,
  Grid,
  GripVertical,
  HelpCircle,
  Layers,
  Layout,
  LayoutGrid,
  LayoutTemplate,
  List,
  Loader2,
  Lock,
  Mail,
  Maximize2,
  Minimize2,
  Minus,
  Monitor,
  MoreVertical,
  Palette,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  ScrollText,
  Search,
  Send,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  SquarePen,
  Star,
  Tablet,
  Tag,
  Trash2,
  TrendingUp,
  User,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ModeloContratoItem {
  id: string;
  nome: string;
  tituloCapa: string;
  subtitulo: string;
  descricao: string;
  categoria: "prestacao" | "consultoria" | "implantacao" | "suporte" | "parceria" | "outros";
  categoriaRotulo: string;
  tipoContrato: "mensal" | "projeto_unico" | "consultoria" | "suporte" | "parceria";
  tipoRotulo: string;
  segmento: string;
  statusOrigem: "oficial" | "meu_modelo" | "ia";
  statusRotulo: string;
  tags: string[];
  destaqueBadge?: string;
  imagemCapa: string;
  paginas: number;
  clausulas: string[];
}

export const CATALOGO_MODELOS_CONTRATOS: ModeloContratoItem[] = [
  {
    id: "servicos_mensais",
    nome: "Contrato de Serviços Mensais",
    tituloCapa: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS",
    subtitulo: "Soluções estratégicas para o crescimento do seu negócio.",
    descricao: "Ideal para contratos recorrentes de marketing, tráfego e gestão.",
    categoria: "prestacao",
    categoriaRotulo: "Prestação de Serviços",
    tipoContrato: "mensal",
    tipoRotulo: "Serviços mensais",
    segmento: "Clínicas Odontológicas",
    statusOrigem: "oficial",
    statusRotulo: "Modelo oficial",
    tags: ["Comercial", "Serviços mensais"],
    destaqueBadge: "Mais utilizado",
    imagemCapa: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80",
    paginas: 12,
    clausulas: [
      "Identificação das partes",
      "Objeto do contrato",
      "Escopo de serviços",
      "Obrigações da contratante",
      "Obrigações da contratada",
      "Prazo e vigência",
      "Valores e condições de pagamento",
      "Reajuste",
      "Rescisão",
      "Confidencialidade",
      "Propriedade intelectual",
      "Disposições gerais",
      "Assinaturas",
    ],
  },
  {
    id: "implantacao_sistemas",
    nome: "Contrato de Implantação de Sistemas",
    tituloCapa: "CONTRATO DE IMPLANTAÇÃO DE SISTEMAS",
    subtitulo: "Projetos de implementação, parametrização e setup técnico.",
    descricao: "Para projetos de implementação e setup de sistemas.",
    categoria: "implantacao",
    categoriaRotulo: "Implantação",
    tipoContrato: "projeto_unico",
    tipoRotulo: "Projeto único",
    segmento: "E-commerce",
    statusOrigem: "oficial",
    statusRotulo: "Modelo oficial",
    tags: ["Implantação", "Projeto único"],
    imagemCapa: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80",
    paginas: 14,
    clausulas: [
      "Identificação das partes",
      "Objeto e escopo de implementação",
      "Cronograma e marcos de entrega",
      "Homologação e aceite técnico",
      "Treinamento de equipes",
      "Garantia e suporte inicial",
      "Valores e etapas de faturamento",
      "Rescisão",
      "Confidencialidade",
      "Assinaturas",
    ],
  },
  {
    id: "consultoria",
    nome: "Contrato de Consultoria",
    tituloCapa: "CONTRATO DE CONSULTORIA",
    subtitulo: "Consultoria estratégica, diagnóstico e acompanhamento especializado.",
    descricao: "Consultoria estratégica e acompanhamento especializado.",
    categoria: "consultoria",
    categoriaRotulo: "Consultoria",
    tipoContrato: "consultoria",
    tipoRotulo: "Consultoria",
    segmento: "Imobiliárias",
    statusOrigem: "oficial",
    statusRotulo: "Modelo oficial",
    tags: ["Consultoria", "Estratégico"],
    imagemCapa: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80",
    paginas: 10,
    clausulas: [
      "Identificação das partes",
      "Objeto da consultoria",
      "Metodologia e plano de trabalho",
      "Disponibilidade de consultores",
      "Honorários e reembolso de despesas",
      "Confidencialidade rigorosa",
      "Propriedade de diagnósticos",
      "Vigência",
      "Assinaturas",
    ],
  },
  {
    id: "suporte_tecnico",
    nome: "Contrato de Suporte Técnico",
    tituloCapa: "CONTRATO DE SUPORTE TÉCNICO",
    subtitulo: "Suporte, manutenção continuada e evolução de sistemas.",
    descricao: "Suporte, manutenção e evolução de sistemas.",
    categoria: "suporte",
    categoriaRotulo: "Suporte",
    tipoContrato: "mensal",
    tipoRotulo: "Serviços mensais",
    segmento: "Outros",
    statusOrigem: "oficial",
    statusRotulo: "Modelo oficial",
    tags: ["Suporte", "Serviços mensais"],
    imagemCapa: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80",
    paginas: 8,
    clausulas: [
      "Identificação das partes",
      "Acordo de Nível de Serviço (SLA)",
      "Canais de atendimento e chamados",
      "Manutenções preventivas e corretivas",
      "Mensalidade e horas excedentes",
      "Vigência e renovação",
      "Assinaturas",
    ],
  },
  {
    id: "parceria_comercial",
    nome: "Contrato de Parceria Comercial",
    tituloCapa: "CONTRATO DE PARCERIA COMERCIAL",
    subtitulo: "Parcerias estratégicas, co-marketing e sociedades.",
    descricao: "Parcerias estratégicas e sociedades.",
    categoria: "parceria",
    categoriaRotulo: "Parceria",
    tipoContrato: "parceria",
    tipoRotulo: "Parceria comercial",
    segmento: "Academias",
    statusOrigem: "oficial",
    statusRotulo: "Modelo oficial",
    tags: ["Parceria", "Comercial"],
    imagemCapa: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80",
    paginas: 16,
    clausulas: [
      "Identificação dos parceiros",
      "Objeto da parceria",
      "Divisão de responsabilidades",
      "Repasse e comissionamento",
      "Uso de marcas e co-branding",
      "Vigência e desvinculação amigável",
      "Confidencialidade",
      "Assinaturas",
    ],
  },
  {
    id: "confidencialidade_nda",
    nome: "Contrato de Confidencialidade (NDA)",
    tituloCapa: "ACORDO DE NÃO DIVULGAÇÃO (NDA)",
    subtitulo: "Proteção de informações estratégicas, industriais e sigilosas.",
    descricao: "Proteção de informações estratégicas e sigilosas.",
    categoria: "outros",
    categoriaRotulo: "Outros",
    tipoContrato: "projeto_unico",
    tipoRotulo: "Acordo",
    segmento: "Outros",
    statusOrigem: "oficial",
    statusRotulo: "Modelo oficial",
    tags: ["Jurídico", "Acordo"],
    imagemCapa: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
    paginas: 6,
    clausulas: [
      "Qualificação das partes reveladora e receptora",
      "Definição de informações confidenciais",
      "Limitações de uso e guarda",
      "Penalidades e multas por violação",
      "Prazo de sigilo (5 anos)",
      "Foro de eleição",
      "Assinaturas",
    ],
  },
  {
    id: "desenvolvimento_site",
    nome: "Contrato de Desenvolvimento de Site",
    tituloCapa: "CONTRATO DE DESENVOLVIMENTO DE SITE",
    subtitulo: "Criação de websites, landing pages e plataformas digitais.",
    descricao: "Criação de websites e plataformas digitais.",
    categoria: "implantacao",
    categoriaRotulo: "Implantação",
    tipoContrato: "projeto_unico",
    tipoRotulo: "Projeto único",
    segmento: "Restaurantes",
    statusOrigem: "meu_modelo",
    statusRotulo: "Meus modelos",
    tags: ["Projeto único", "Implantação"],
    imagemCapa: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    paginas: 11,
    clausulas: [
      "Identificação das partes",
      "Briefing e escopo de design e código",
      "Cronograma de aprovações",
      "Hospedagem, domínio e acessos",
      "Pagamento por etapas concluídas",
      "Garantia e correções de bugs",
      "Propriedade autoral do código",
      "Assinaturas",
    ],
  },
  {
    id: "gestao_trafego",
    nome: "Contrato de Gestão de Tráfego Pago",
    tituloCapa: "CONTRATO DE GESTÃO DE TRÁFEGO PAGO",
    subtitulo: "Gestão de campanhas e mídia de performance (Meta e Google Ads).",
    descricao: "Gestão de campanhas e mídia paga.",
    categoria: "prestacao",
    categoriaRotulo: "Prestação de Serviços",
    tipoContrato: "mensal",
    tipoRotulo: "Serviços mensais",
    segmento: "Clínicas Odontológicas",
    statusOrigem: "oficial",
    statusRotulo: "Modelo oficial",
    tags: ["Marketing", "Serviços mensais"],
    imagemCapa: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
    paginas: 12,
    clausulas: [
      "Identificação das partes",
      "Canais contratados (Google Ads, Meta)",
      "Orçamento de mídia separado dos honorários",
      "Acesso aos ativos digitais e contas de anúncio",
      "Relatórios de conversão e ROI",
      "Mensalidade e taxa de sucesso",
      "Rescisão com 30 dias de aviso prévio",
      "Assinaturas",
    ],
  },
  {
    id: "producao_conteudo",
    nome: "Contrato de Produção de Conteúdo",
    tituloCapa: "CONTRATO DE PRODUÇÃO DE CONTEÚDO",
    subtitulo: "Criação e produção de conteúdo e artes para redes sociais.",
    descricao: "Criação e produção de conteúdo para redes sociais.",
    categoria: "prestacao",
    categoriaRotulo: "Prestação de Serviços",
    tipoContrato: "mensal",
    tipoRotulo: "Serviços mensais",
    segmento: "Academias",
    statusOrigem: "ia",
    statusRotulo: "Modelos da IA",
    tags: ["Marketing", "Serviços mensais"],
    imagemCapa: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80",
    paginas: 9,
    clausulas: [
      "Identificação das partes",
      "Volume mensal de posts e vídeos",
      "Diretrizes visuais e aprovação prévia",
      "Cessão de direitos de uso de imagem",
      "Remuneração mensal",
      "Vigência",
      "Assinaturas",
    ],
  },
  {
    id: "licenciamento_software",
    nome: "Contrato de Licenciamento SaaS",
    tituloCapa: "CONTRATO DE LICENCIAMENTO SAAS",
    subtitulo: "Licenciamento de software como serviço e banco de dados.",
    descricao: "Acesso à plataforma Flow Business e suporte contínuo.",
    categoria: "suporte",
    categoriaRotulo: "Suporte",
    tipoContrato: "mensal",
    tipoRotulo: "Serviços mensais",
    segmento: "E-commerce",
    statusOrigem: "oficial",
    statusRotulo: "Modelo oficial",
    tags: ["SaaS", "Recorrente"],
    imagemCapa: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80",
    paginas: 15,
    clausulas: [
      "Identificação das partes",
      "Concessão de licença não exclusiva",
      "Políticas de uso aceitável e LGPD",
      "Planos e limites de usuários",
      "Disponibilidade do serviço (Uptime)",
      "Rescisão e exportação de dados",
      "Assinaturas",
    ],
  },
  {
    id: "assessoria_juridica",
    nome: "Contrato de Assessoria Estratégica",
    tituloCapa: "CONTRATO DE ASSESSORIA",
    subtitulo: "Acompanhamento contínuo e orientação de negócios.",
    descricao: "Assessoria estratégica mensal para expansão empresarial.",
    categoria: "consultoria",
    categoriaRotulo: "Consultoria",
    tipoContrato: "consultoria",
    tipoRotulo: "Consultoria",
    segmento: "Imobiliárias",
    statusOrigem: "meu_modelo",
    statusRotulo: "Meus modelos",
    tags: ["Consultoria", "Mensal"],
    imagemCapa: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80",
    paginas: 10,
    clausulas: [
      "Partes envolvidas",
      "Escopo de reuniões e pareceres",
      "Honorários mensais e prazos",
      "Sigilo profissional",
      "Vigência",
      "Assinaturas",
    ],
  },
  {
    id: "terceirizacao_ti",
    nome: "Contrato de Terceirização e BPO",
    tituloCapa: "CONTRATO DE TERCEIRIZAÇÃO",
    subtitulo: "Prestação de serviços operacionais e infraestrutura.",
    descricao: "Operação continuada e alocação de especialistas técnicos.",
    categoria: "prestacao",
    categoriaRotulo: "Prestação de Serviços",
    tipoContrato: "mensal",
    tipoRotulo: "Serviços mensais",
    segmento: "Outros",
    statusOrigem: "ia",
    statusRotulo: "Modelos da IA",
    tags: ["BPO", "Serviços mensais"],
    imagemCapa: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80",
    paginas: 13,
    clausulas: [
      "Identificação das partes",
      "Escopo e descrição dos postos de trabalho",
      "Inexistência de vínculo empregatício com a contratante",
      "Cumprimento das obrigações trabalhistas e previdenciárias",
      "Preço mensal e faturamento",
      "Segurança e sigilo",
      "Assinaturas",
    ],
  },
];

interface BibliotecaModelosContratosViewProps {
  onSelecionarModeloParaCriador: (modeloId: string) => void;
  onVoltarPainel?: () => void;
}

export function BibliotecaModelosContratosView({
  onSelecionarModeloParaCriador,
  onVoltarPainel,
}: BibliotecaModelosContratosViewProps) {
  // Filtros
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");
  const [tipoContratoAtivo, setTipoContratoAtivo] = useState<string>("todos");
  const [segmentoAtivo, setSegmentoAtivo] = useState<string>("todos");
  const [statusAtivo, setStatusAtivo] = useState<string>("todos");

  // Ordenação e visualização
  const [ordenacao, setOrdenacao] = useState<"mais_usados" | "nome" | "recentes">("mais_usados");
  const [modoVisualizacao, setModoVisualizacao] = useState<"grid" | "lista">("grid");

  // Modelo selecionado para o painel direito
  const [modeloSelecionado, setModeloSelecionado] = useState<ModeloContratoItem>(
    CATALOGO_MODELOS_CONTRATOS[0]
  );

  // Controles de Viewport na Pré-visualização
  const [viewportPreview, setViewportPreview] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [secaoOQueIncluiAberta, setSecaoOQueIncluiAberta] = useState(true);

  // Modais demonstrativos
  const [modalNovoModeloAberto, setModalNovoModeloAberto] = useState(false);
  const [drawerClausulasAberto, setDrawerClausulasAberto] = useState(false);
  const [modalIdentidadeMarcaAberto, setModalIdentidadeMarcaAberto] = useState(false);
  const [modalIaAberto, setModalIaAberto] = useState(false);
  const [modalPreviewExpandido, setModalPreviewExpandido] = useState(false);

  // Form de novo modelo
  const [novoModeloNome, setNovoModeloNome] = useState("");
  const [novoModeloCat, setNovoModeloCat] = useState("prestacao");

  // Filtragem dos modelos
  const modelosFiltrados = useMemo(() => {
    return CATALOGO_MODELOS_CONTRATOS.filter((m) => {
      // Busca
      const matchBusca =
        !busca ||
        m.nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.descricao.toLowerCase().includes(busca.toLowerCase()) ||
        m.categoriaRotulo.toLowerCase().includes(busca.toLowerCase()) ||
        m.tags.some((t) => t.toLowerCase().includes(busca.toLowerCase()));

      // Categoria
      const matchCat = categoriaAtiva === "todos" || m.categoria === categoriaAtiva;

      // Tipo de contrato
      const matchTipo = tipoContratoAtivo === "todos" || m.tipoContrato === tipoContratoAtivo;

      // Segmento
      const matchSegmento = segmentoAtivo === "todos" || m.segmento === segmentoAtivo;

      // Status Origem
      const matchStatus = statusAtivo === "todos" || m.statusOrigem === statusAtivo;

      return matchBusca && matchCat && matchTipo && matchSegmento && matchStatus;
    });
  }, [busca, categoriaAtiva, tipoContratoAtivo, segmentoAtivo, statusAtivo]);

  // Contadores para os filtros
  const contadores = useMemo(() => {
    return {
      total: CATALOGO_MODELOS_CONTRATOS.length,
      prestacao: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.categoria === "prestacao").length,
      consultoria: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.categoria === "consultoria").length,
      implantacao: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.categoria === "implantacao").length,
      suporte: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.categoria === "suporte").length,
      parceria: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.categoria === "parceria").length,
      outros: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.categoria === "outros").length,

      mensal: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.tipoContrato === "mensal").length,
      projeto_unico: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.tipoContrato === "projeto_unico")
        .length,
      tipo_consultoria: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.tipoContrato === "consultoria")
        .length,
      tipo_suporte: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.tipoContrato === "suporte").length,
      tipo_parceria: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.tipoContrato === "parceria").length,

      clinicas: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.segmento === "Clínicas Odontológicas")
        .length,
      imobiliarias: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.segmento === "Imobiliárias").length,
      academias: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.segmento === "Academias").length,
      restaurantes: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.segmento === "Restaurantes").length,
      ecommerce: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.segmento === "E-commerce").length,
      seg_outros: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.segmento === "Outros").length,

      oficiais: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.statusOrigem === "oficial").length,
      meus_modelos: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.statusOrigem === "meu_modelo").length,
      ia_modelos: CATALOGO_MODELOS_CONTRATOS.filter((m) => m.statusOrigem === "ia").length,
    };
  }, []);

  // Ações de seleção e encaminhamento
  const handleUsarModelo = (modelo: ModeloContratoItem) => {
    toast.success(`Modelo "${modelo.nome}" selecionado!`, {
      description: "Abrindo o Criador Profissional com a estrutura deste contrato...",
    });
    onSelecionarModeloParaCriador(modelo.id);
  };

  const handlePersonalizarModelo = (modelo: ModeloContratoItem) => {
    toast.info(`Personalizando "${modelo.nome}"...`, {
      description: "Carregando configurações de identidade visual e cláusulas no editor.",
    });
    onSelecionarModeloParaCriador(modelo.id);
  };

  return (
    <div className="space-y-4">
      {/* =========================================================================
          1. CABEÇALHO DA TELA 03 & BREADCRUMBS
         ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#1b2232] pb-4">
        <div>
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
          >
            {onVoltarPainel && (
              <button
                type="button"
                onClick={onVoltarPainel}
                className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors mr-1"
                title="Voltar ao Painel"
              >
                <ArrowLeft className="size-3" />
                <span>Voltar</span>
              </button>
            )}
            <span>Gestão</span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span
              onClick={onVoltarPainel}
              className="text-neutral-400 hover:text-white cursor-pointer transition-colors"
            >
              Contratos
            </span>
            <ChevronRight className="size-3 text-neutral-600" />
            <span className="flex items-center gap-1 text-orange-400 font-semibold">
              <span className="size-1.5 rounded-full bg-orange-500" />
              Modelos de Contratos
            </span>
          </nav>

          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-sm">
              <ScrollText className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Modelos de Contratos
              </h1>
              <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
                Templates profissionais e personalizáveis para sua empresa.
              </p>
            </div>
          </div>
        </div>

        {/* Botão Superior Direito "+ Novo modelo" */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setModalNovoModeloAberto(true)}
            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] px-4 text-xs font-bold text-white shadow-lg shadow-orange-600/25 transition-all hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Novo modelo</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          2. QUATRO CARDS SUPERIORES DE DESTAQUE
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Modelos Profissionais (Laranja) */}
        <div
          onClick={() => {
            setCategoriaAtiva("todos");
            setBusca("");
          }}
          className="group relative flex items-start gap-3 p-3.5 rounded-2xl border border-orange-500/40 bg-gradient-to-r from-orange-500/15 via-[#121620] to-[#0c1017] cursor-pointer transition-all hover:border-orange-500/60 shadow-sm shadow-orange-500/10"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-[#f95d14] border border-orange-500/30">
            <ScrollText className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white leading-tight">Modelos Profissionais</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
              Templates prontos e personalizáveis para diferentes tipos de contrato.
            </p>
          </div>
        </div>

        {/* Card 2: Cláusulas Inteligentes (Roxo) */}
        <div
          onClick={() => setDrawerClausulasAberto(true)}
          className="group relative flex items-start gap-3 p-3.5 rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-500/15 via-[#121620] to-[#0c1017] cursor-pointer transition-all hover:border-purple-500/50 shadow-sm shadow-purple-950/20"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Sparkles className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white leading-tight">Cláusulas Inteligentes</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
              Biblioteca de cláusulas revisadas e organizadas por categoria.
            </p>
          </div>
        </div>

        {/* Card 3: Identidade da sua Marca (Azul) */}
        <div
          onClick={() => setModalIdentidadeMarcaAberto(true)}
          className="group relative flex items-start gap-3 p-3.5 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/15 via-[#121620] to-[#0c1017] cursor-pointer transition-all hover:border-blue-500/50 shadow-sm shadow-blue-950/20"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white leading-tight">Identidade da sua Marca</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
              Use suas cores, logo e estilo em todos os modelos.
            </p>
          </div>
        </div>

        {/* Card 4: Criação com IA (Verde / Esmeralda) */}
        <div
          onClick={() => setModalIaAberto(true)}
          className="group relative flex items-start gap-3 p-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/15 via-[#121620] to-[#0c1017] cursor-pointer transition-all hover:border-emerald-500/50 shadow-sm shadow-emerald-950/20"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Bot className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs font-bold text-white leading-tight">Criação com IA</h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
              Gere novos modelos com o apoio da inteligência artificial.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. ESTRUTURA EM TRÊS ÁREAS:
          - COLUNA ESQUERDA: Filtros (Busca, Categorias, Tipos, Segmentos, Status)
          - CENTRO: Galeria de 12 Modelos em 3 Colunas com Capas Profissionais
          - COLUNA DIREITA: Painel de Pré-visualização A4, Informações e Cláusulas
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =======================================================================
            COLUNA DA ESQUERDA: FILTROS (lg:col-span-2 xl:col-span-2)
           ======================================================================= */}
        <aside
          aria-label="Filtros de Modelos"
          className="lg:col-span-2 xl:col-span-2 rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3.5 space-y-4 shadow-md text-xs"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Filtros</h2>
            {(categoriaAtiva !== "todos" ||
              tipoContratoAtivo !== "todos" ||
              segmentoAtivo !== "todos" ||
              statusAtivo !== "todos" ||
              busca) && (
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setCategoriaAtiva("todos");
                  setTipoContratoAtivo("todos");
                  setSegmentoAtivo("todos");
                  setStatusAtivo("todos");
                }}
                className="text-[10px] text-orange-400 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar modelos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121620] pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500/50 focus:outline-none"
            />
          </div>

          {/* 1. Categorias com Contadores */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Categoria
            </span>
            <div className="space-y-1">
              {[
                { id: "todos", rotulo: "Todos", count: contadores.total },
                { id: "prestacao", rotulo: "Prestação de Serviços", count: contadores.prestacao },
                { id: "consultoria", rotulo: "Consultoria", count: contadores.consultoria },
                { id: "implantacao", rotulo: "Implantação", count: contadores.implantacao },
                { id: "suporte", rotulo: "Suporte", count: contadores.suporte },
                { id: "parceria", rotulo: "Parceria", count: contadores.parceria },
                { id: "outros", rotulo: "Outros", count: contadores.outros },
              ].map((cat) => {
                const ativa = categoriaAtiva === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaAtiva(cat.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left",
                      ativa
                        ? "bg-gradient-to-r from-orange-500/20 to-orange-500/10 text-white font-bold border border-orange-500/40"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    )}
                  >
                    <span className="truncate">{cat.rotulo}</span>
                    <span
                      className={cn(
                        "font-mono text-[10px] px-1.5 py-0.2 rounded-md",
                        ativa ? "bg-orange-500 text-white font-bold" : "text-neutral-500"
                      )}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tipo de Contrato */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Tipo de contrato
            </span>
            <div className="space-y-1">
              {[
                { id: "mensal", rotulo: "Serviços mensais", count: contadores.mensal },
                { id: "projeto_unico", rotulo: "Projeto único", count: contadores.projeto_unico },
                { id: "consultoria", rotulo: "Consultoria", count: contadores.tipo_consultoria },
                { id: "suporte", rotulo: "Suporte técnico", count: contadores.tipo_suporte },
                { id: "parceria", rotulo: "Parceria comercial", count: contadores.tipo_parceria },
              ].map((t) => (
                <label
                  key={t.id}
                  className="flex items-center justify-between text-[11px] text-neutral-400 hover:text-white cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tipoContrato"
                      checked={tipoContratoAtivo === t.id}
                      onChange={() =>
                        setTipoContratoAtivo(tipoContratoAtivo === t.id ? "todos" : t.id)
                      }
                      className="size-3 text-orange-500 border-white/20 bg-[#121620]"
                    />
                    <span>{t.rotulo}</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{t.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Segmento */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Segmento
            </span>
            <div className="space-y-1">
              {[
                { id: "todos", rotulo: "Todos", count: contadores.total },
                { id: "Clínicas Odontológicas", rotulo: "Clínicas Odontológicas", count: contadores.clinicas },
                { id: "Imobiliárias", rotulo: "Imobiliárias", count: contadores.imobiliarias },
                { id: "Academias", rotulo: "Academias", count: contadores.academias },
                { id: "Restaurantes", rotulo: "Restaurantes", count: contadores.restaurantes },
                { id: "E-commerce", rotulo: "E-commerce", count: contadores.ecommerce },
                { id: "Outros", rotulo: "Outros", count: contadores.seg_outros },
              ].map((seg) => (
                <label
                  key={seg.id}
                  className="flex items-center justify-between text-[11px] text-neutral-400 hover:text-white cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="segmento"
                      checked={segmentoAtivo === seg.id}
                      onChange={() => setSegmentoAtivo(seg.id)}
                      className="size-3 text-orange-500 border-white/20 bg-[#121620]"
                    />
                    <span>{seg.rotulo}</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{seg.count}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Status / Origem */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Status
            </span>
            <div className="space-y-1">
              {[
                { id: "todos", rotulo: "Todos", count: contadores.total },
                { id: "oficial", rotulo: "Modelos oficiais", count: contadores.oficiais },
                { id: "meu_modelo", rotulo: "Meus modelos", count: contadores.meus_modelos },
                { id: "ia", rotulo: "Modelos da IA", count: contadores.ia_modelos },
              ].map((st) => (
                <label
                  key={st.id}
                  className="flex items-center justify-between text-[11px] text-neutral-400 hover:text-white cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="statusOrigem"
                      checked={statusAtivo === st.id}
                      onChange={() => setStatusAtivo(st.id)}
                      className="size-3 text-orange-500 border-white/20 bg-[#121620]"
                    />
                    <span>{st.rotulo}</span>
                  </div>
                  <span className="font-mono text-[10px] text-neutral-500">{st.count}</span>
                </label>
              ))}
            </div>
          </div>
        </aside>

        {/* =======================================================================
            GALERIA CENTRAL: GRID COM 3 COLUNAS DE MODELOS (lg:col-span-7 xl:col-span-7)
           ======================================================================= */}
        <section aria-label="Galeria de Modelos de Contratos" className="lg:col-span-7 xl:col-span-7 space-y-3.5">
          {/* Barra de Ordenação e Controle da Galeria */}
          <div className="flex items-center justify-between rounded-2xl border border-[#1b2232] bg-[#0c1017] px-4 py-2.5 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">
                {modelosFiltrados.length} modelos encontrados
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <span>Ordenar por:</span>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  className="rounded-lg border border-white/10 bg-[#121620] px-2 py-1 text-xs text-white focus:outline-none"
                >
                  <option value="mais_usados">Mais utilizados</option>
                  <option value="nome">Nome do modelo</option>
                  <option value="recentes">Mais recentes</option>
                </select>
              </div>

              {/* Toggle Grid / Lista */}
              <div className="flex items-center gap-1 bg-[#121620] border border-white/5 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("grid")}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    modoVisualizacao === "grid"
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white"
                  )}
                  title="Grade"
                >
                  <LayoutGrid className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("lista")}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    modoVisualizacao === "lista"
                      ? "bg-orange-500 text-white"
                      : "text-neutral-400 hover:text-white"
                  )}
                  title="Lista"
                >
                  <List className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Modelos (3 Colunas Fiel à Imagem) */}
          {modelosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-[#1b2232] bg-[#0c1017] p-12 text-center space-y-3">
              <ScrollText className="size-10 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Nenhum modelo encontrado</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Tente ajustar os filtros de busca, categoria ou segmento para visualizar outros
                templates.
              </p>
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setCategoriaAtiva("todos");
                  setTipoContratoAtivo("todos");
                  setSegmentoAtivo("todos");
                  setStatusAtivo("todos");
                }}
                className="rounded-xl border border-white/10 bg-[#121620] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
              >
                Resetar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {modelosFiltrados.map((modelo) => {
                const isSelected = modeloSelecionado.id === modelo.id;

                return (
                  <div
                    key={modelo.id}
                    onClick={() => setModeloSelecionado(modelo)}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all cursor-pointer shadow-md",
                      isSelected
                        ? "border-orange-500/80 bg-gradient-to-b from-[#121620] via-[#0c1017] to-[#0c1017] shadow-orange-500/10 ring-1 ring-orange-500/50"
                        : "border-[#1b2232] bg-[#0c1017] hover:border-white/20 hover:bg-[#121620]/60"
                    )}
                  >
                    {/* Badge Superior se houver */}
                    {modelo.destaqueBadge && (
                      <span className="absolute -top-2 left-3 z-10 rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow-sm">
                        {modelo.destaqueBadge}
                      </span>
                    )}

                    {/* Capa Editorial do Documento A4 em Miniatura */}
                    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-white text-slate-900 border border-slate-200 p-3 flex flex-col justify-between shadow-inner select-none mb-3">
                      {/* Topo com Logo e Skyline Angular */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="flex size-4 items-center justify-center rounded bg-[#f95d14] text-white font-black text-[8px]">
                            F
                          </span>
                          <span className="text-[9px] font-black tracking-tight text-slate-900">
                            Flow Business
                          </span>
                        </div>
                      </div>

                      {/* Recorte Angular Moderno com Imagem no Canto Superior Direito */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-[42%] bg-cover bg-center pointer-events-none"
                        style={{
                          backgroundImage: `url('${modelo.imagemCapa}')`,
                          clipPath: "polygon(30% 0%, 100% 0%, 100% 100%, 0% 100%)",
                        }}
                      >
                        <div className="absolute inset-0 bg-[#f95d14]/30 mix-blend-multiply" />
                      </div>

                      {/* Título e Subtítulo da Capa */}
                      <div className="space-y-0.5 max-w-[55%] z-10 my-auto">
                        <p className="text-[10px] font-black uppercase text-slate-950 leading-tight">
                          {modelo.tituloCapa}
                        </p>
                        <p className="text-[7px] text-slate-600 font-medium line-clamp-2 leading-tight">
                          {modelo.subtitulo}
                        </p>
                      </div>

                      {/* Rodapé da Capa em Miniatura */}
                      <div className="pt-1 border-t border-slate-200 flex items-center justify-between text-[6px] text-slate-500 z-10">
                        <span>Pág 1 de {modelo.paginas}</span>
                        <span className="font-bold text-[#f95d14]">✓ Pronto para uso</span>
                      </div>
                    </div>

                    {/* Dados Textuais do Modelo */}
                    <div className="space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                          {modelo.nome}
                        </h4>
                        <p className="text-[10px] text-neutral-400 line-clamp-2 mt-0.5 leading-snug">
                          {modelo.descricao}
                        </p>
                      </div>

                      {/* Tags em Pílulas */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {modelo.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="rounded-md border border-white/5 bg-[#121620] px-2 py-0.5 text-[9px] font-semibold text-neutral-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Dois Botões: "Usar modelo" (Laranja) e "Visualizar" */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUsarModelo(modelo);
                          }}
                          className="w-full flex items-center justify-center gap-1 rounded-xl bg-[#ea580c] hover:bg-[#f97316] py-1.5 text-[11px] font-bold text-white transition-all shadow-sm active:scale-[0.98]"
                        >
                          <span>Usar modelo</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModeloSelecionado(modelo);
                          }}
                          className="w-full flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 py-1.5 text-[11px] font-semibold text-neutral-300 hover:text-white transition-all"
                        >
                          <span>Visualizar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* =======================================================================
            COLUNA DA DIREITA: PRÉ-VISUALIZAÇÃO DO MODELO (lg:col-span-3 xl:col-span-3)
           ======================================================================= */}
        <aside
          aria-label="Pré-visualização do Modelo"
          className="lg:col-span-3 xl:col-span-3 rounded-2xl border border-[#1b2232] bg-[#0c1017] p-3.5 space-y-3.5 shadow-md sticky top-4 text-xs"
        >
          {/* Cabeçalho do Preview com Controles de Viewport */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Pré-visualização
            </h2>

            <div className="flex items-center gap-1 bg-[#121620] border border-white/5 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setViewportPreview("desktop")}
                className={cn(
                  "p-1 rounded transition-colors",
                  viewportPreview === "desktop"
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Desktop"
              >
                <Monitor className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewportPreview("tablet")}
                className={cn(
                  "p-1 rounded transition-colors",
                  viewportPreview === "tablet"
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Tablet"
              >
                <Tablet className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setViewportPreview("mobile")}
                className={cn(
                  "p-1 rounded transition-colors",
                  viewportPreview === "mobile"
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Mobile"
              >
                <Smartphone className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setModalPreviewExpandido(true)}
                className="p-1 rounded text-neutral-400 hover:text-white"
                title="Expandir"
              >
                <Maximize2 className="size-3" />
              </button>
            </div>
          </div>

          {/* Folha A4 Realista de Pré-visualização */}
          <div className="w-full bg-white text-slate-900 rounded-xl p-4 shadow-xl border border-slate-200 space-y-3 relative overflow-hidden select-none">
            {/* Topo com Logo e Imagem Angular */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded bg-[#f95d14] text-white font-black text-[10px]">
                  F
                </span>
                <span className="text-[11px] font-extrabold tracking-tight text-slate-950">
                  Flow Business
                </span>
              </div>
            </div>

            {/* Banner Angular com Foto dos Prédios / Skyline */}
            <div className="relative min-h-[90px] overflow-hidden -mx-4 p-4 border-y border-slate-100 flex items-center justify-between">
              <div className="space-y-1 max-w-[55%] z-10">
                <h3 className="text-xs font-black uppercase text-slate-950 leading-tight">
                  {modeloSelecionado.tituloCapa}
                </h3>
                <p className="text-[8px] text-slate-600 font-medium leading-tight">
                  {modeloSelecionado.subtitulo}
                </p>
              </div>

              <div
                className="absolute right-0 top-0 bottom-0 w-[45%] bg-cover bg-center pointer-events-none"
                style={{
                  backgroundImage: `url('${modeloSelecionado.imagemCapa}')`,
                  clipPath: "polygon(25% 0%, 100% 0%, 100% 100%, 0% 100%)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#f95d14]/50 to-[#ea580c]/80 mix-blend-multiply" />
              </div>
            </div>

            {/* Dados das Partes em 2 Colunas */}
            <div className="grid grid-cols-2 gap-2 text-[8px] border-b border-slate-200 pb-2">
              <div>
                <p className="font-extrabold text-slate-900 uppercase">CONTRATANTE</p>
                <p className="font-semibold text-slate-800">Clinica Sorriso Mais</p>
                <p className="text-slate-500">CNPJ 12.345.678/0001-90</p>
              </div>
              <div>
                <p className="font-extrabold text-slate-900 uppercase">CONTRATADA</p>
                <p className="font-semibold text-slate-800">Flow Business</p>
                <p className="text-slate-500">CNPJ 98.765.432/0001-10</p>
              </div>
            </div>

            {/* Boxes Data de Emissão e Validade */}
            <div className="grid grid-cols-2 gap-2 text-[8px] text-slate-600">
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <Calendar className="size-3 text-orange-500" />
                <div>
                  <span className="text-[7px] text-slate-400 block">Data de emissão</span>
                  <span className="font-bold text-slate-800">01 de Outubro de 2026</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-slate-50 border border-slate-200">
                <Clock className="size-3 text-orange-500" />
                <div>
                  <span className="text-[7px] text-slate-400 block">Validade</span>
                  <span className="font-bold text-slate-800">12 meses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Informações Textuais do Modelo Selecionado */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white leading-tight">
                {modeloSelecionado.nome}
              </h3>
              <span className="rounded-full bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 text-[8px] font-bold text-purple-300">
                {modeloSelecionado.statusRotulo}
              </span>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              {modeloSelecionado.descricao} Inclui cláusulas completas, escopo de serviços, valores
              e condições.
            </p>

            <div className="flex flex-wrap gap-1">
              {modeloSelecionado.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="rounded-md border border-white/5 bg-[#121620] px-2 py-0.5 text-[9px] font-semibold text-neutral-300"
                >
                  {t}
                </span>
              ))}
              <span className="rounded-md border border-white/5 bg-[#121620] px-2 py-0.5 text-[9px] font-semibold text-neutral-300">
                Marketing
              </span>
            </div>
          </div>

          {/* Botões de Ação Principais: "Usar este modelo" e "Personalizar" */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleUsarModelo(modeloSelecionado)}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] py-2.5 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              <span>Usar este modelo</span>
            </button>

            <button
              type="button"
              onClick={() => handlePersonalizarModelo(modeloSelecionado)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 py-2 text-xs font-semibold text-neutral-300 hover:text-white transition-all"
            >
              <Pencil className="size-3.5" />
              <span>Personalizar</span>
            </button>
          </div>

          {/* Seção "O que inclui" (com Acordeão) */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <button
              type="button"
              onClick={() => setSecaoOQueIncluiAberta(!secaoOQueIncluiAberta)}
              className="w-full flex items-center justify-between text-xs font-bold text-white hover:text-neutral-200"
            >
              <span>O que inclui</span>
              <ChevronDown
                className={cn(
                  "size-3.5 transition-transform",
                  secaoOQueIncluiAberta && "rotate-180"
                )}
              />
            </button>

            {secaoOQueIncluiAberta && (
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px] text-neutral-300 pt-1">
                {modeloSelecionado.clausulas.map((clausula, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <Check className="size-3 text-emerald-400 shrink-0 stroke-[3]" />
                    <span className="truncate">{clausula}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* =========================================================================
          MODAIS AUXILIARES
         ========================================================================= */}
      {/* 1. Modal Novo Modelo */}
      {modalNovoModeloAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalNovoModeloAberto(false)}>
          <DialogContent className="sm:max-w-md bg-[#0c1017] border border-[#1b2232] text-white p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                <Plus className="size-4 text-orange-500" />
                Criar Novo Modelo de Contrato
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  Nome do Modelo
                </label>
                <input
                  type="text"
                  placeholder="Ex: Contrato de Mentoria Executiva"
                  value={novoModeloNome}
                  onChange={(e) => setNovoModeloNome(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">Categoria</label>
                <select
                  value={novoModeloCat}
                  onChange={(e) => setNovoModeloCat(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:border-orange-500/50 focus:outline-none"
                >
                  <option value="prestacao">Prestação de Serviços</option>
                  <option value="consultoria">Consultoria</option>
                  <option value="implantacao">Implantação</option>
                  <option value="suporte">Suporte Técnico</option>
                  <option value="parceria">Parceria Comercial</option>
                </select>
              </div>

              <p className="text-[10px] text-neutral-400 leading-snug">
                O novo modelo será aberto no Criador Profissional com estrutura modular para você
                definir as cláusulas e condições contratuais.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => setModalNovoModeloAberto(false)}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalNovoModeloAberto(false);
                  toast.success(`Modelo "${novoModeloNome || "Novo Template"}" criado!`);
                  onSelecionarModeloParaCriador("servicos_mensais");
                }}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-600/20"
              >
                Continuar no Criador
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 2. Drawer de Cláusulas Inteligentes */}
      {drawerClausulasAberto && (
        <Dialog open onOpenChange={(o) => !o && setDrawerClausulasAberto(false)}>
          <DialogContent className="sm:max-w-lg bg-[#0c1017] border border-purple-500/30 text-white p-5 rounded-2xl max-h-[85vh] flex flex-col">
            <DialogHeader className="border-b border-purple-500/20 pb-3">
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                <Sparkles className="size-4 text-purple-400" />
                Biblioteca de Cláusulas Inteligentes
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 text-xs">
              {[
                {
                  cat: "Rescisão e Penalidades",
                  titulo: "Cláusula de Aviso Prévio com Multa Proporcional",
                  desc: "Exige aviso prévio de 30 dias por escrito, com multa rescisória equivalente a 50% das mensalidades restantes.",
                },
                {
                  cat: "Reajuste Monetário",
                  titulo: "Cláusula de Reajuste pelo IPCA/IBGE",
                  desc: "Reajuste anual automático dos valores contratuais com base na variação acumulada positiva do IPCA.",
                },
                {
                  cat: "Proteção de Dados",
                  titulo: "Cláusula de Conformidade com a LGPD",
                  desc: "Adequação mútua aos preceitos da Lei Geral de Proteção de Dados (Lei 13.709/2018).",
                },
                {
                  cat: "Confidencialidade",
                  titulo: "Cláusula de Sigilo Rigoroso e Não-Divulgação",
                  desc: "Veda expressamente a revelação de estratégias, dados de clientes e métricas confidenciais.",
                },
              ].map((c, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-white/5 bg-[#121620] hover:border-purple-500/40 space-y-1 transition-all"
                >
                  <span className="text-[9px] uppercase tracking-wider text-purple-400 font-bold">
                    {c.cat}
                  </span>
                  <p className="text-xs font-bold text-white">{c.titulo}</p>
                  <p className="text-[10px] text-neutral-400 leading-snug">{c.desc}</p>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDrawerClausulasAberto(false)}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white"
              >
                Fechar Biblioteca
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 3. Modal Identidade da Marca */}
      {modalIdentidadeMarcaAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalIdentidadeMarcaAberto(false)}>
          <DialogContent className="sm:max-w-md bg-[#0c1017] border border-blue-500/30 text-white p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                <Palette className="size-4 text-blue-400" />
                Personalizar Identidade Visual dos Contratos
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  Cor Principal da sua Marca
                </label>
                <div className="flex items-center gap-2">
                  <span className="size-6 rounded-lg bg-[#f95d14] border border-white/20" />
                  <input
                    type="text"
                    defaultValue="#f95d14 (Laranja Flow)"
                    className="flex-1 rounded-xl border border-white/10 bg-[#121620] px-3 py-1.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-neutral-300">
                  Logo nos Documentos
                </label>
                <p className="text-[10px] text-neutral-400">
                  Utilizando o logotipo cadastrado na organização ativa (Flow Business).
                </p>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setModalIdentidadeMarcaAberto(false);
                  toast.success("Identidade da marca atualizada para todos os modelos!");
                }}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
              >
                Salvar Identidade
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 4. Modal Criação com IA */}
      {modalIaAberto && (
        <Dialog open onOpenChange={(o) => !o && setModalIaAberto(false)}>
          <DialogContent className="sm:max-w-md bg-[#0c1017] border border-emerald-500/30 text-white p-5 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm font-bold text-white">
                <Bot className="size-4 text-emerald-400" />
                Criação de Modelos com IA
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2 text-xs">
              <p className="text-neutral-300 leading-relaxed">
                Descreva os serviços prestados pela sua empresa e o assistente de IA estruturará um
                novo template completo com cláusulas específicas e precificação sugerida.
              </p>
              <textarea
                rows={3}
                placeholder="Ex: Contrato de assessoria para clínicas estéticas com regras de sigilo e cancelamento..."
                className="w-full rounded-xl border border-white/10 bg-[#121620] p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <DialogFooter className="gap-2 sm:justify-end border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => setModalIaAberto(false)}
                className="px-3 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalIaAberto(false);
                  toast.success("Modelo gerado com IA e enviado para o Criador!");
                  onSelecionarModeloParaCriador("servicos_mensais");
                }}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
              >
                Gerar Template
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 5. Modal Pré-visualização Expandida */}
      {modalPreviewExpandido && (
        <Dialog open onOpenChange={(o) => !o && setModalPreviewExpandido(false)}>
          <DialogContent className="sm:max-w-3xl bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="border-b border-white/10 pb-3">
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-white">
                <Eye className="size-5 text-orange-500" />
                Pré-visualização: {modeloSelecionado.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto py-4 flex justify-center">
              <div className="w-full max-w-[650px] bg-white text-slate-900 rounded-lg shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="flex size-6 items-center justify-center rounded bg-[#f95d14] text-white font-black text-xs">
                      F
                    </span>
                    <span className="text-sm font-extrabold text-slate-950">Flow Business</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Template: {modeloSelecionado.categoriaRotulo}
                  </span>
                </div>

                <div className="text-center space-y-0.5">
                  <h2 className="text-base font-black uppercase text-slate-950">
                    {modeloSelecionado.tituloCapa}
                  </h2>
                  <p className="text-[10px] text-slate-600">{modeloSelecionado.subtitulo}</p>
                </div>

                <div className="space-y-2 text-[11px] text-slate-800 pt-2 border-t border-slate-200">
                  <p className="font-bold text-slate-950">CLÁUSULAS INCLUÍDAS NESTE MODELO:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-slate-700">
                    {modeloSelecionado.clausulas.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-white/10 pt-3 flex justify-between sm:justify-between">
              <button
                type="button"
                onClick={() => setModalPreviewExpandido(false)}
                className="px-4 py-1.5 rounded-xl border border-white/10 bg-[#121620] text-xs font-semibold text-neutral-300 hover:text-white"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalPreviewExpandido(false);
                  handleUsarModelo(modeloSelecionado);
                }}
                className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white shadow-md shadow-orange-600/20"
              >
                Usar Este Modelo
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
