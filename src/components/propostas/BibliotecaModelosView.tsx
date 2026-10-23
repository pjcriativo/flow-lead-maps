// Tela 03 — Biblioteca de Modelos (Gestão → Propostas → Biblioteca de Modelos)
// Fiel ao layout visual aprovado da referência, com galeria de modelos, filtros avançados,
// pré-visualização lateral A4 e transferência perfeita para o Criador Profissional.
import React, { useMemo, useState } from "react";
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe,
  Grid,
  Image as ImageIcon,
  Layers,
  Layout,
  LayoutGrid,
  LayoutTemplate,
  List,
  Lock,
  Maximize2,
  Minimize2,
  Monitor,
  MoreVertical,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Sliders,
  Smartphone,
  Sparkles,
  Star,
  Tablet,
  Tag,
  Target,
  Trash2,
  User,
  Users,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface ModeloBiblioteca {
  id: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  categoria: "comercial" | "marketing" | "consultoria" | "implantacao" | "outros";
  tipoProposta: "mensal" | "unico" | "consultoria" | "implantacao" | "personalizado";
  segmento: "odonto" | "imob" | "academia" | "restaurante" | "ecommerce" | "outros";
  status: "oficial" | "meu" | "ia";
  badgeDestaque?: string;
  badgeOficial?: boolean;
  tags: string[];
  capaBg: string;
  capaImagem: string;
  capaTitulo: string;
  capaSubtitulo: string;
  secoes: string[];
  clienteExemplo?: string;
}

export const MODELOS_BIBLIOTECA_DATA: ModeloBiblioteca[] = [
  {
    id: "mensal",
    titulo: "Proposta de Serviços Mensais",
    subtitulo: "Ideal para marketing, prospecção e gestão de leads contínua.",
    descricao:
      "Modelo completo para apresentação de serviços mensais de marketing, prospecção e gestão de leads.",
    categoria: "comercial",
    tipoProposta: "mensal",
    segmento: "odonto",
    status: "oficial",
    badgeDestaque: "Mais utilizado",
    badgeOficial: true,
    tags: ["Marketing", "Comercial", "Serviços mensais"],
    capaBg: "from-neutral-900 via-neutral-950 to-black",
    capaImagem:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Proposta Comercial",
    capaSubtitulo: "Soluções para acelerar o crescimento do seu negócio.",
    clienteExemplo: "Clínica Sorriso Mais",
    secoes: [
      "Capa profissional",
      "Diagnóstico do cliente",
      "Escopo de serviços",
      "Cronograma de implantação",
      "Investimento e condições",
      "Bônus e diferenciais",
      "Garantia",
      "Próximos passos",
    ],
  },
  {
    id: "landing_trafego",
    titulo: "Proposta Landing Page + Tráfego",
    subtitulo: "Criação de sites e campanhas para geração de leads.",
    descricao:
      "Apresentação comercial estratégica unindo desenvolvimento de landing pages de alta conversão e mídia de tráfego pago.",
    categoria: "marketing",
    tipoProposta: "unico",
    segmento: "ecommerce",
    status: "oficial",
    badgeOficial: true,
    tags: ["Marketing", "Implantação"],
    capaBg: "from-neutral-900 to-slate-950",
    capaImagem:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Proposta Landing Page + Tráfego",
    capaSubtitulo: "Estrutura visual de alta conversão com tráfego acelerado.",
    clienteExemplo: "Dr. Conrad Marcel",
    secoes: [
      "Capa profissional",
      "Estrutura da Landing Page",
      "Planejamento de Mídia",
      "Cronograma de Lançamento",
      "Investimento & Anúncios",
      "Garantia de Entrega",
      "Próximos passos",
    ],
  },
  {
    id: "consultoria",
    titulo: "Consultoria Comercial",
    subtitulo: "Diagnóstico e planejamento estratégico para aumentar vendas.",
    descricao:
      "Modelo premium para consultores B2B realizarem diagnósticos de funil, revisão de processos e plano de ação estruturado.",
    categoria: "consultoria",
    tipoProposta: "consultoria",
    segmento: "imob",
    status: "oficial",
    badgeOficial: true,
    tags: ["Consultoria", "Comercial"],
    capaBg: "from-neutral-900 to-stone-950",
    capaImagem:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Proposta de Consultoria Comercial",
    capaSubtitulo: "Diagnóstico profundo e mapa estratégico de aceleração.",
    clienteExemplo: "Imobiliária Prime Haus",
    secoes: [
      "Capa executiva",
      "Diagnóstico atual do funil",
      "Metodologia da consultoria",
      "Entregáveis e etapas",
      "Condições comerciais",
      "Garantia e compromisso",
    ],
  },
  {
    id: "seo",
    titulo: "Plano SEO e Posicionamento",
    subtitulo: "Estratégia completa de SEO local e posicionamento orgânico.",
    descricao:
      "Estrutura validada para propostas de otimização em motores de busca, Google Meu Negócio e autoridade orgânica digital.",
    categoria: "marketing",
    tipoProposta: "mensal",
    segmento: "odonto",
    status: "oficial",
    badgeOficial: true,
    tags: ["Marketing", "SEO"],
    capaBg: "from-neutral-900 to-zinc-950",
    capaImagem:
      "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Proposta de Posicionamento",
    capaSubtitulo: "Alcance o topo das buscas do Google e conquiste relevância.",
    clienteExemplo: "Dourados Odontologia",
    secoes: [
      "Capa técnica",
      "Auditoria SEO inicial",
      "Otimização on-page & off-page",
      "Gestão de Perfil de Empresa",
      "Métricas e relatórios",
      "Investimento mensal",
    ],
  },
  {
    id: "express",
    titulo: "Proposta Express",
    subtitulo: "Modelo simplificado para envio rápido.",
    descricao:
      "Proposta de 2 a 3 páginas focada em fechamentos ágeis para oportunidades de menor complexidade ou prazos curtos.",
    categoria: "comercial",
    tipoProposta: "unico",
    segmento: "restaurante",
    status: "oficial",
    badgeOficial: true,
    tags: ["Comercial", "Rápido"],
    capaBg: "from-neutral-900 to-neutral-950",
    capaImagem:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Proposta Express",
    capaSubtitulo: "Resumo executivo objetivo e direto ao ponto.",
    clienteExemplo: "Bistrô Vila Mariana",
    secoes: [
      "Capa expressa",
      "Escopo de trabalho",
      "Valores e condições",
      "Aceite rápido",
    ],
  },
  {
    id: "personalizada",
    titulo: "Proposta Personalizada",
    subtitulo: "Modelo flexível para diferentes segmentos.",
    descricao:
      "Base modular e flexível com seções intercambiáveis, pronta para atender propostas customizadas de alto ticket.",
    categoria: "comercial",
    tipoProposta: "personalizado",
    segmento: "outros",
    status: "meu",
    badgeDestaque: "Customizado",
    tags: ["Personalizado", "Comercial"],
    capaBg: "from-neutral-900 to-slate-950",
    capaImagem:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Proposta Personalizada",
    capaSubtitulo: "Proposta sob medida desenvolvida especificamente para sua empresa.",
    clienteExemplo: "Escritório Parelheiros",
    secoes: [
      "Capa sob medida",
      "Contexto e desafio",
      "Solução sugerida",
      "Equipe dedicada",
      "Cronograma e marcos",
      "Investimento flexível",
      "Próximos passos",
    ],
  },
  {
    id: "crm",
    titulo: "Implantação de CRM e Automação",
    subtitulo: "Implementação e treinamento da plataforma.",
    descricao:
      "Estrutura voltada para integração de pipelines comerciais, automação de WhatsApp e treinamento das equipes de vendas.",
    categoria: "implantacao",
    tipoProposta: "implantacao",
    segmento: "imob",
    status: "oficial",
    badgeOficial: true,
    tags: ["Implantação", "Tecnologia"],
    capaBg: "from-neutral-900 to-indigo-950",
    capaImagem:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Implantação de CRM e Automação",
    capaSubtitulo: "Estruture sua máquina de vendas com tecnologia e processos.",
    clienteExemplo: "Grupo Imobiliário Alfa",
    secoes: [
      "Capa corporativa",
      "Arquitetura de dados",
      "Fluxos de automação",
      "Plano de onboarding e capacitação",
      "Custos de implantação",
      "SLA e suporte",
    ],
  },
  {
    id: "redes_sociais",
    titulo: "Gestão de Redes Sociais",
    subtitulo: "Estratégia, produção de conteúdo e gestão de mídias.",
    descricao:
      "Planejamento editorial, criação de peças, vídeos curtos e gerenciamento de comunidade para Instagram e LinkedIn.",
    categoria: "marketing",
    tipoProposta: "mensal",
    segmento: "academia",
    status: "oficial",
    badgeOficial: true,
    tags: ["Marketing", "Redes Sociais"],
    capaBg: "from-neutral-900 to-pink-950",
    capaImagem:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Gestão de Redes Sociais",
    capaSubtitulo: "Presença digital estratégica com engajamento e posicionamento.",
    clienteExemplo: "Academia Iron Fit",
    secoes: [
      "Capa criativa",
      "Linha editorial e persona",
      "Frequência de postagens",
      "Relatórios de métricas",
      "Investimento mensal",
    ],
  },
  {
    id: "treinamento",
    titulo: "Proposta de Treinamento",
    subtitulo: "Capacitação da equipe e implantação de processos.",
    descricao:
      "Treinamentos presenciais ou remotos de prospecção ativa, qualificação de leads e fechamento de vendas.",
    categoria: "consultoria",
    tipoProposta: "consultoria",
    segmento: "outros",
    status: "oficial",
    badgeOficial: true,
    tags: ["Treinamento", "Consultoria"],
    capaBg: "from-neutral-900 to-amber-950",
    capaImagem:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Proposta de Treinamento",
    capaSubtitulo: "Capacite seu time para atingir o nível máximo de produtividade.",
    clienteExemplo: "TechVendas Treinamentos",
    secoes: [
      "Capa institucional",
      "Objetivos de aprendizado",
      "Módulos do treinamento",
      "Material didático",
      "Investimento e agenda",
    ],
  },
  {
    id: "trafego_meta",
    titulo: "Tráfego Pago & Meta Ads",
    subtitulo: "Estratégia de mídia paga para captação direta de clientes.",
    descricao:
      "Campanhas de tráfego pago no Google e Meta com foco estrito em custo por lead (CPL) e taxa de conversão comercial.",
    categoria: "marketing",
    tipoProposta: "mensal",
    segmento: "ecommerce",
    status: "meu",
    tags: ["Marketing", "Tráfego"],
    capaBg: "from-neutral-900 to-blue-950",
    capaImagem:
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Campanhas de Tráfego Pago",
    capaSubtitulo: "Mídia focada em retorno sobre investimento.",
    clienteExemplo: "Loja Virtual Express",
    secoes: ["Capa", "Diagnóstico de contas", "Estratégia de canais", "Valores"],
  },
  {
    id: "auditoria_vendas",
    titulo: "Auditoria de Vendas & Processos",
    subtitulo: "Diagnóstico aprofundado dos gargalos comerciais.",
    descricao:
      "Varredura técnica de ponta a ponta: do lead inbound/outbound até a assinatura de contrato e onboarding.",
    categoria: "consultoria",
    tipoProposta: "consultoria",
    segmento: "imob",
    status: "ia",
    badgeDestaque: "Gerado por IA",
    tags: ["Consultoria", "Vendas"],
    capaBg: "from-neutral-900 to-purple-950",
    capaImagem:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Auditoria Comercial",
    capaSubtitulo: "Identifique gargalos e multiplique sua taxa de conversão.",
    clienteExemplo: "Grupo Imóveis Sul",
    secoes: ["Capa", "Análise de funil", "Entregáveis", "Cronograma"],
  },
  {
    id: "site_whatsapp",
    titulo: "Site Institucional + WhatsApp",
    subtitulo: "Portal institucional responsivo integrado ao WhatsApp Business.",
    descricao:
      "Site leve e otimizado com rotas de conversão direta para o aplicativo de mensagens da equipe comercial.",
    categoria: "implantacao",
    tipoProposta: "unico",
    segmento: "restaurante",
    status: "meu",
    tags: ["Implantação", "Desenvolvimento"],
    capaBg: "from-neutral-900 to-emerald-950",
    capaImagem:
      "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=600&auto=format&fit=crop&q=80",
    capaTitulo: "Site Institucional",
    capaSubtitulo: "Conversão direta e rápida para seu WhatsApp.",
    clienteExemplo: "Cantina Bella Donna",
    secoes: ["Capa", "Escopo do site", "Integrações", "Orçamento"],
  },
];

interface BibliotecaModelosViewProps {
  onUsarModelo: (modeloId: string) => void;
  onPersonalizarModelo: (modeloId: string) => void;
  onVoltarPainel?: () => void;
}

export function BibliotecaModelosView({
  onUsarModelo,
  onPersonalizarModelo,
  onVoltarPainel,
}: BibliotecaModelosViewProps) {
  // Lista de modelos (permitindo adicionar novos rascunhos locais)
  const [modelos, setModelos] = useState<ModeloBiblioteca[]>(MODELOS_BIBLIOTECA_DATA);
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState<string>("mensal");

  // Filtros
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>([]);
  const [segmentosSelecionados, setSegmentosSelecionados] = useState<string[]>([]);
  const [statusSelecionados, setStatusSelecionados] = useState<string[]>([]);

  // Ordenação e Visualização
  const [ordenacao, setOrdenacao] = useState<"mais_utilizados" | "recentes" | "alfabetico">(
    "mais_utilizados"
  );
  const [modoVisualizacao, setModoVisualizacao] = useState<"grid" | "list">("grid");

  // Controles do Painel de Pré-visualização
  const [dispositivoPreview, setDispositivoPreview] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [secoesAbertas, setSecoesAbertas] = useState(true);

  // Modais
  const [modalNovoModeloAberto, setModalNovoModeloAberto] = useState(false);
  const [modalIdentidadeAberto, setModalIdentidadeAberto] = useState(false);
  const [modalIaAberto, setModalIaAberto] = useState(false);

  // Form de Novo Modelo
  const [novoModeloForm, setNovoModeloForm] = useState({
    titulo: "",
    subtitulo: "",
    descricao: "",
    categoria: "comercial",
    tipoProposta: "mensal",
    segmento: "outros",
    corPrimaria: "#f97316",
    corSecundaria: "#121620",
  });

  // Modelo Selecionado Atual
  const modeloSelecionado =
    modelos.find((m) => m.id === modeloSelecionadoId) || modelos[0];

  // Alternar checkbox de filtros
  const toggleFiltro = (
    lista: string[],
    setLista: React.Dispatch<React.SetStateAction<string[]>>,
    valor: string
  ) => {
    if (lista.includes(valor)) {
      setLista(lista.filter((x) => x !== valor));
    } else {
      setLista([...lista, valor]);
    }
  };

  // Modelos Filtrados
  const modelosFiltrados = useMemo(() => {
    return modelos.filter((m) => {
      // Busca por texto
      if (busca.trim()) {
        const query = busca.toLowerCase();
        const bateuNome = m.titulo.toLowerCase().includes(query);
        const bateuSub = m.subtitulo.toLowerCase().includes(query);
        const bateuDesc = m.descricao.toLowerCase().includes(query);
        const bateuTags = m.tags.some((t) => t.toLowerCase().includes(query));
        if (!bateuNome && !bateuSub && !bateuDesc && !bateuTags) return false;
      }

      // Categoria
      if (categoriaAtiva !== "todos" && m.categoria !== categoriaAtiva) {
        return false;
      }

      // Tipo de Proposta
      if (tiposSelecionados.length > 0 && !tiposSelecionados.includes(m.tipoProposta)) {
        return false;
      }

      // Segmento
      if (segmentosSelecionados.length > 0 && !segmentosSelecionados.includes(m.segmento)) {
        return false;
      }

      // Status
      if (statusSelecionados.length > 0 && !statusSelecionados.includes(m.status)) {
        return false;
      }

      return true;
    });
  }, [modelos, busca, categoriaAtiva, tiposSelecionados, segmentosSelecionados, statusSelecionados]);

  // Contagens para os Filtros
  const contagens = useMemo(() => {
    const cats: Record<string, number> = {
      todos: modelos.length,
      comercial: 0,
      marketing: 0,
      consultoria: 0,
      implantacao: 0,
      outros: 0,
    };
    const tipos: Record<string, number> = {
      mensal: 0,
      unico: 0,
      consultoria: 0,
      implantacao: 0,
      personalizado: 0,
    };
    const segs: Record<string, number> = {
      todos: modelos.length,
      odonto: 0,
      imob: 0,
      academia: 0,
      restaurante: 0,
      ecommerce: 0,
      outros: 0,
    };
    const stats: Record<string, number> = {
      todos: modelos.length,
      oficial: 0,
      meu: 0,
      ia: 0,
    };

    modelos.forEach((m) => {
      if (cats[m.categoria] !== undefined) cats[m.categoria]++;
      if (tipos[m.tipoProposta] !== undefined) tipos[m.tipoProposta]++;
      if (segs[m.segmento] !== undefined) segs[m.segmento]++;
      if (stats[m.status] !== undefined) stats[m.status]++;
    });

    return { cats, tipos, segs, stats };
  }, [modelos]);

  // Handler de Novo Modelo Local
  const handleCriarNovoModelo = () => {
    if (!novoModeloForm.titulo.trim()) {
      toast.error("Por favor, preencha o nome do modelo.");
      return;
    }

    const novoId = `custom_${Date.now()}`;
    const novo: ModeloBiblioteca = {
      id: novoId,
      titulo: novoModeloForm.titulo,
      subtitulo: novoModeloForm.subtitulo || "Modelo customizado da sua organização.",
      descricao:
        novoModeloForm.descricao ||
        "Modelo personalizado criado com seções modulares e identidade corporativa.",
      categoria: novoModeloForm.categoria as any,
      tipoProposta: novoModeloForm.tipoProposta as any,
      segmento: novoModeloForm.segmento as any,
      status: "meu",
      badgeDestaque: "Novo",
      tags: ["Personalizado", "Minha Marca"],
      capaBg: "from-neutral-900 to-neutral-950",
      capaImagem:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&auto=format&fit=crop&q=80",
      capaTitulo: novoModeloForm.titulo,
      capaSubtitulo: novoModeloForm.subtitulo || "Proposta comercial exclusiva.",
      clienteExemplo: "Cliente Selecionado",
      secoes: [
        "Capa profissional",
        "Diagnóstico do cliente",
        "Escopo de serviços",
        "Condições comerciais",
      ],
    };

    setModelos([novo, ...modelos]);
    setModeloSelecionadoId(novoId);
    setModalNovoModeloAberto(false);
    toast.success(`Modelo "${novo.titulo}" criado com sucesso!`);
  };

  return (
    <div className="mx-auto max-w-[1720px] px-3.5 pb-16 pt-5 sm:px-6 lg:px-8 space-y-4 antialiased text-neutral-100">
      {/* =========================================================================
          1. CABEÇALHO DO MÓDULO & BREADCRUMB
         ========================================================================= */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f95d14] shadow-md shadow-orange-500/10">
            <LayoutTemplate className="size-6" />
          </div>
          <div>
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-400"
            >
              <Building2 className="size-3.5 text-neutral-500" />
              <span>Gestão</span>
              <ChevronRight className="size-3 text-neutral-600" />
              <button
                type="button"
                onClick={onVoltarPainel}
                className="hover:text-neutral-200 transition-colors"
              >
                Propostas
              </button>
              <ChevronRight className="size-3 text-neutral-600" />
              <span className="text-neutral-200">Biblioteca de Modelos</span>
            </nav>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl mt-1">
              Biblioteca de Modelos
            </h1>
            <p className="mt-0.5 text-xs text-neutral-400 sm:text-sm">
              Modelos profissionais e prontos para usar nas suas propostas comerciais.
            </p>
          </div>
        </div>

        {/* Botão Novo Modelo */}
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
          2. CARDS SUPERIORES DE DESTAQUE (4 CARDS)
         ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Modelos Profissionais (Ativo com glow laranja) */}
        <button
          type="button"
          onClick={() => {
            setCategoriaAtiva("todos");
            setStatusSelecionados([]);
            toast.info("Exibindo todos os modelos profissionais.");
          }}
          className="group relative flex items-start gap-3 p-4 rounded-2xl border border-orange-500/50 bg-[#0c1017]/95 shadow-lg shadow-orange-500/5 text-left transition-all hover:border-orange-500 hover:bg-[#121620]"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-[#f97316] group-hover:scale-105 transition-transform shadow-md shadow-orange-500/10">
            <LayoutTemplate className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">
              Modelos Profissionais
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
              Templates prontos e personalizáveis para diferentes tipos de negócio.
            </p>
          </div>
        </button>

        {/* Card 2: Identidade da sua Marca (Roxo) */}
        <button
          type="button"
          onClick={() => setModalIdentidadeAberto(true)}
          className="group relative flex items-start gap-3 p-4 rounded-2xl border border-purple-500/30 bg-[#0c1017]/95 shadow-lg shadow-purple-500/5 text-left transition-all hover:border-purple-500/60 hover:bg-[#121620]"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-[#c084fc] group-hover:scale-105 transition-transform shadow-md shadow-purple-500/10">
            <Palette className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Identidade da sua Marca
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
              Use suas cores, logo e estilo em todos os modelos.
            </p>
          </div>
        </button>

        {/* Card 3: Criação com IA (Azul) */}
        <button
          type="button"
          onClick={() => setModalIaAberto(true)}
          className="group relative flex items-start gap-3 p-4 rounded-2xl border border-blue-500/30 bg-[#0c1017]/95 shadow-lg shadow-blue-500/5 text-left transition-all hover:border-blue-500/60 hover:bg-[#121620]"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-[#60a5fa] group-hover:scale-105 transition-transform shadow-md shadow-blue-500/10">
            <Wand2 className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
              Criação com IA
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
              Gere novos modelos com o apoio da inteligência artificial.
            </p>
          </div>
        </button>

        {/* Card 4: Templates do Mercado (Verde) */}
        <button
          type="button"
          onClick={() => {
            setStatusSelecionados(["oficial"]);
            toast.info("Filtrando modelos oficiais e validados do mercado.");
          }}
          className="group relative flex items-start gap-3 p-4 rounded-2xl border border-emerald-500/30 bg-[#0c1017]/95 shadow-lg shadow-emerald-500/5 text-left transition-all hover:border-emerald-500/60 hover:bg-[#121620]"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[#34d399] group-hover:scale-105 transition-transform shadow-md shadow-emerald-500/10">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
              Templates do Mercado
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
              Modelos validados e testados para alta conversão.
            </p>
          </div>
        </button>
      </section>

      {/* =========================================================================
          3. ÁREA PRINCIPAL: FILTROS (ESQ) + GALERIA (CENTRO) + PREVIEW (DIR)
         ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* =======================================================================
            COLUNA 1: FILTROS LATERAIS (lg:col-span-3 xl:col-span-2)
           ======================================================================= */}
        <div className="lg:col-span-3 xl:col-span-2 rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-4 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-1 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-[#f97316]" />
              <h2 className="text-sm font-bold text-white">Filtros</h2>
            </div>
            {(categoriaAtiva !== "todos" ||
              tiposSelecionados.length > 0 ||
              segmentosSelecionados.length > 0 ||
              statusSelecionados.length > 0 ||
              busca) && (
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setCategoriaAtiva("todos");
                  setTiposSelecionados([]);
                  setSegmentosSelecionados([]);
                  setStatusSelecionados([]);
                  toast.info("Filtros limpos");
                }}
                className="text-[11px] text-orange-400 hover:underline"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Campo de Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar modelos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#121620] pl-8.5 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Grupo 1: Categoria */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Categoria
            </span>
            {[
              { id: "todos", rotulo: "Todos" },
              { id: "comercial", rotulo: "Comercial" },
              { id: "marketing", rotulo: "Marketing" },
              { id: "consultoria", rotulo: "Consultoria" },
              { id: "implantacao", rotulo: "Implantação" },
              { id: "outros", rotulo: "Outros" },
            ].map((cat) => {
              const ativa = categoriaAtiva === cat.id;
              const count = contagens.cats[cat.id] ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoriaAtiva(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left",
                    ativa
                      ? "bg-gradient-to-r from-orange-600 to-[#f97316] text-white font-bold shadow-md shadow-orange-600/20"
                      : "text-neutral-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="truncate">{cat.rotulo}</span>
                  <span
                    className={cn(
                      "text-[10px] font-mono px-1.5 py-0.5 rounded-md",
                      ativa ? "bg-black/20 text-white" : "bg-white/5 text-neutral-500"
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grupo 2: Tipo de proposta */}
          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Tipo de proposta
            </span>
            {[
              { id: "mensal", rotulo: "Serviços mensais" },
              { id: "unico", rotulo: "Projeto único" },
              { id: "consultoria", rotulo: "Consultoria" },
              { id: "implantacao", rotulo: "Implantação" },
              { id: "personalizado", rotulo: "Pacote personalizado" },
            ].map((t) => {
              const checado = tiposSelecionados.includes(t.id);
              const count = contagens.tipos[t.id] ?? 0;
              return (
                <label
                  key={t.id}
                  className="flex items-center justify-between text-xs text-neutral-300 hover:text-white cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <input
                      type="checkbox"
                      checked={checado}
                      onChange={() =>
                        toggleFiltro(tiposSelecionados, setTiposSelecionados, t.id)
                      }
                      className="rounded border-white/20 bg-white/5 accent-orange-500"
                    />
                    <span className="truncate">{t.rotulo}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">{count}</span>
                </label>
              );
            })}
          </div>

          {/* Grupo 3: Segmento */}
          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Segmento
            </span>
            {[
              { id: "odonto", rotulo: "Clínicas Odontológicas" },
              { id: "imob", rotulo: "Imobiliárias" },
              { id: "academia", rotulo: "Academias" },
              { id: "restaurante", rotulo: "Restaurantes" },
              { id: "ecommerce", rotulo: "E-commerce" },
              { id: "outros", rotulo: "Outros" },
            ].map((s) => {
              const checado = segmentosSelecionados.includes(s.id);
              const count = contagens.segs[s.id] ?? 0;
              return (
                <label
                  key={s.id}
                  className="flex items-center justify-between text-xs text-neutral-300 hover:text-white cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <input
                      type="checkbox"
                      checked={checado}
                      onChange={() =>
                        toggleFiltro(segmentosSelecionados, setSegmentosSelecionados, s.id)
                      }
                      className="rounded border-white/20 bg-white/5 accent-orange-500"
                    />
                    <span className="truncate">{s.rotulo}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">{count}</span>
                </label>
              );
            })}
          </div>

          {/* Grupo 4: Status */}
          <div className="space-y-1.5 pt-1 border-t border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
              Status
            </span>
            {[
              { id: "oficial", rotulo: "Modelos oficiais" },
              { id: "meu", rotulo: "Meus modelos" },
              { id: "ia", rotulo: "Modelos da IA" },
            ].map((st) => {
              const checado = statusSelecionados.includes(st.id);
              const count = contagens.stats[st.id] ?? 0;
              return (
                <label
                  key={st.id}
                  className="flex items-center justify-between text-xs text-neutral-300 hover:text-white cursor-pointer py-0.5"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    <input
                      type="checkbox"
                      checked={checado}
                      onChange={() =>
                        toggleFiltro(statusSelecionados, setStatusSelecionados, st.id)
                      }
                      className="rounded border-white/20 bg-white/5 accent-orange-500"
                    />
                    <span className="truncate">{st.rotulo}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500">{count}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* =======================================================================
            COLUNA 2: GALERIA CENTRAL DE MODELOS (lg:col-span-9 xl:col-span-6)
           ======================================================================= */}
        <div className="lg:col-span-9 xl:col-span-6 space-y-3.5">
          {/* Barra Superior da Galeria: Contagem + Ordenação + Toggle Grid/List */}
          <div className="flex items-center justify-between rounded-2xl border border-[#1e2638] bg-[#0c1017]/90 px-4 py-2.5 shadow-md">
            <div>
              <span className="text-sm font-bold text-white">
                {modelosFiltrados.length} modelo{modelosFiltrados.length !== 1 ? "s" : ""}{" "}
                encontrado{modelosFiltrados.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Dropdown de Ordenação */}
              <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                <span className="hidden sm:inline">Ordenar por:</span>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  className="rounded-lg border border-white/10 bg-[#121620] px-2.5 py-1 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="mais_utilizados">Mais utilizados</option>
                  <option value="recentes">Mais recentes</option>
                  <option value="alfabetico">Ordem alfabética</option>
                </select>
              </div>

              {/* Botões Grid / List */}
              <div className="flex items-center rounded-lg border border-white/10 bg-[#121620] p-0.5">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("grid")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    modoVisualizacao === "grid"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  )}
                  title="Visualização em grade"
                >
                  <LayoutGrid className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("list")}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    modoVisualizacao === "list"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  )}
                  title="Visualização em lista"
                >
                  <List className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Modelos (3 Colunas no Desktop) */}
          {modelosFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-[#0c1017]/90 p-12 text-center space-y-3">
              <Search className="size-10 text-neutral-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhum modelo encontrado</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Tente ajustar os filtros laterais ou busque por outro termo para encontrar o
                modelo ideal.
              </p>
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setCategoriaAtiva("todos");
                  setTiposSelecionados([]);
                  setSegmentosSelecionados([]);
                  setStatusSelecionados([]);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-orange-500 text-xs font-bold text-white"
              >
                Limpar todos os filtros
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-3.5",
                modoVisualizacao === "grid"
                  ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
                  : "grid-cols-1"
              )}
            >
              {modelosFiltrados.map((m) => {
                const selecionado = modeloSelecionadoId === m.id;

                return (
                  <div
                    key={m.id}
                    onClick={() => setModeloSelecionadoId(m.id)}
                    className={cn(
                      "group relative flex flex-col rounded-2xl border bg-[#0c1017]/95 overflow-hidden transition-all cursor-pointer shadow-lg",
                      selecionado
                        ? "border-orange-500 ring-2 ring-orange-500/30 shadow-orange-500/10"
                        : "border-[#1e2638] hover:border-white/20 hover:bg-[#121620]"
                    )}
                  >
                    {/* Capa Visual do Modelo */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
                      <img
                        src={m.capaImagem}
                        alt={m.titulo}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      {/* Accent Geométrica Laranja */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-orange-500/40 via-transparent to-transparent pointer-events-none" />

                      {/* Badges no topo da Capa */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
                        {m.badgeDestaque && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-purple-600/90 text-white shadow-md">
                            {m.badgeDestaque}
                          </span>
                        )}
                        {m.badgeOficial && !m.badgeDestaque && (
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-black/60 text-neutral-300 backdrop-blur-sm border border-white/10">
                            Oficial
                          </span>
                        )}
                      </div>

                      {/* Textos dentro da Capa */}
                      <div className="absolute bottom-2.5 left-2.5 right-2.5 text-left z-10">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-orange-400 block">
                          Flow Business
                        </span>
                        <h4 className="text-xs font-bold text-white leading-tight truncate">
                          {m.capaTitulo}
                        </h4>
                        <p className="text-[9px] text-neutral-300 line-clamp-1 mt-0.5">
                          {m.capaSubtitulo}
                        </p>
                      </div>
                    </div>

                    {/* Informações Textuais Abaixo da Capa */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                          {m.titulo}
                        </h3>
                        <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                          {m.subtitulo}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                          {m.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="px-2 py-0.5 rounded-md text-[9px] font-semibold bg-white/5 border border-white/10 text-neutral-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Botões de Ação do Card */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onUsarModelo(m.id);
                          }}
                          className="w-full py-1.5 rounded-xl bg-[#ea580c] hover:bg-[#f97316] text-white text-xs font-bold text-center transition-all shadow-md shadow-orange-600/20 active:scale-[0.98]"
                        >
                          Usar modelo
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModeloSelecionadoId(m.id);
                            toast.success(`Exibindo prévia de "${m.titulo}"`);
                          }}
                          className="w-full py-1.5 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-neutral-200 hover:text-white text-xs font-semibold text-center transition-colors"
                        >
                          Visualizar
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =======================================================================
            COLUNA 3: PAINEL DIREITO DE PRÉ-VISUALIZAÇÃO (xl:col-span-4)
           ======================================================================= */}
        <div className="lg:col-span-12 xl:col-span-4 rounded-2xl border border-[#1e2638] bg-[#0c1017]/95 p-4 shadow-xl space-y-4">
          {/* Cabeçalho do Painel */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-[#f97316]" />
              <h2 className="text-sm font-bold text-white">Pré-visualização</h2>
            </div>

            {/* Alternância de Viewport */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#121620] p-0.5">
              <button
                type="button"
                onClick={() => setDispositivoPreview("desktop")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  dispositivoPreview === "desktop"
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Desktop"
              >
                <Monitor className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setDispositivoPreview("tablet")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  dispositivoPreview === "tablet"
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Tablet"
              >
                <Tablet className="size-3" />
              </button>
              <button
                type="button"
                onClick={() => setDispositivoPreview("mobile")}
                className={cn(
                  "p-1.5 rounded-md transition-colors",
                  dispositivoPreview === "mobile"
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white"
                )}
                title="Mobile"
              >
                <Smartphone className="size-3" />
              </button>
            </div>
          </div>

          {/* Miniatura do Documento A4 */}
          <div
            className={cn(
              "mx-auto rounded-xl border border-white/10 bg-[#07090e] p-3 shadow-2xl transition-all relative overflow-hidden",
              dispositivoPreview === "desktop" && "w-full aspect-[1/1.3]",
              dispositivoPreview === "tablet" && "w-[85%] aspect-[1/1.3]",
              dispositivoPreview === "mobile" && "w-[65%] aspect-[1/1.3]"
            )}
          >
            {/* Logo e Header da Proposta */}
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-md bg-[#ea580c] font-black text-white text-[10px]">
                  F
                </span>
                <span className="text-[11px] font-bold text-white tracking-tight">
                  Flow Business
                </span>
              </div>
              <span className="text-[9px] font-mono text-neutral-500">PROPOSTA #2026-0717</span>
            </div>

            {/* Imagem de Capa do Documento */}
            <div className="relative mt-2.5 aspect-[16/9] w-full rounded-lg overflow-hidden bg-neutral-900 border border-white/5">
              <img
                src={modeloSelecionado.capaImagem}
                alt={modeloSelecionado.titulo}
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Accent laranja diagonal */}
              <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tl from-[#ea580c] to-transparent rotate-45 pointer-events-none opacity-80" />
            </div>

            {/* Título & Subtítulo da Capa */}
            <div className="mt-3 space-y-1">
              <span className="text-[8px] font-bold uppercase tracking-wider text-orange-400 block">
                Solução Comercial
              </span>
              <h3 className="text-sm font-black text-white leading-tight">
                {modeloSelecionado.capaTitulo}
              </h3>
              <p className="text-[10px] text-neutral-400 line-clamp-2 leading-snug">
                {modeloSelecionado.capaSubtitulo}
              </p>
            </div>

            {/* Metadados do Cliente Demonstrativo */}
            <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-2 space-y-1 text-[9px]">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Preparado para:</span>
                <span className="font-bold text-white">
                  {modeloSelecionado.clienteExemplo || "Clínica Sorriso Mais"}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Data & Validade:</span>
                <span className="text-neutral-300 font-mono">07/10/2026 · 30 dias</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Responsável:</span>
                <span className="text-neutral-300">Marcos Gonçalves</span>
              </div>
            </div>
          </div>

          {/* Detalhes do Modelo */}
          <div className="space-y-2 pt-1 border-t border-white/5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white leading-tight">
                {modeloSelecionado.titulo}
              </h3>
              {modeloSelecionado.badgeOficial && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-[#c084fc] border border-purple-500/30">
                  Modelo oficial
                </span>
              )}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              {modeloSelecionado.descricao}
            </p>

            {/* Tags do Modelo */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {modeloSelecionado.tags.map((tg) => (
                <span
                  key={tg}
                  className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/5 border border-white/10 text-neutral-300"
                >
                  {tg}
                </span>
              ))}
            </div>
          </div>

          {/* Botões de Ação Principais */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => onUsarModelo(modeloSelecionado.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/25 hover:brightness-110 active:scale-[0.98]"
            >
              <FileText className="size-4" />
              <span>Usar este modelo</span>
            </button>

            <button
              type="button"
              onClick={() => onPersonalizarModelo(modeloSelecionado.id)}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-neutral-200 hover:text-white text-xs font-semibold transition-colors"
            >
              <Pencil className="size-3.5" />
              <span>Personalizar</span>
            </button>
          </div>

          {/* Seção Acordeão: O Que Inclui */}
          <div className="rounded-xl border border-white/5 bg-[#121620]/60 p-3 space-y-2">
            <button
              type="button"
              onClick={() => setSecoesAbertas(!secoesAbertas)}
              className="w-full flex items-center justify-between text-xs font-bold text-white"
            >
              <div className="flex items-center gap-1.5">
                <Layers className="size-3.5 text-neutral-400" />
                <span>O que inclui</span>
              </div>
              {secoesAbertas ? (
                <ChevronUp className="size-4 text-neutral-400" />
              ) : (
                <ChevronDown className="size-4 text-neutral-400" />
              )}
            </button>

            {secoesAbertas && (
              <ul className="space-y-1.5 pt-1 text-[11px] text-neutral-300">
                {modeloSelecionado.secoes.map((sec) => (
                  <li key={sec} className="flex items-center gap-2">
                    <Check className="size-3.5 text-emerald-400 shrink-0 stroke-[2.5]" />
                    <span className="truncate">{sec}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. MODAL NOVO MODELO PERSONALIZADO
         ========================================================================= */}
      <Dialog open={modalNovoModeloAberto} onOpenChange={setModalNovoModeloAberto}>
        <DialogContent className="max-w-xl bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <LayoutTemplate className="size-5 text-[#f97316]" />
              <span>Criar Novo Modelo de Proposta</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            {/* Nome do Modelo */}
            <div>
              <label className="font-semibold text-neutral-300 block mb-1">
                Nome do modelo *
              </label>
              <input
                type="text"
                placeholder="Ex: Proposta Consultoria Premium"
                value={novoModeloForm.titulo}
                onChange={(e) =>
                  setNovoModeloForm({ ...novoModeloForm, titulo: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Subtítulo / Resumo */}
            <div>
              <label className="font-semibold text-neutral-300 block mb-1">
                Subtítulo do modelo
              </label>
              <input
                type="text"
                placeholder="Ex: Foco em diagnóstico rápido e aumento de margem"
                value={novoModeloForm.subtitulo}
                onChange={(e) =>
                  setNovoModeloForm({ ...novoModeloForm, subtitulo: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="font-semibold text-neutral-300 block mb-1">Descrição</label>
              <textarea
                rows={3}
                placeholder="Descreva para qual situação ou tipo de cliente este modelo é ideal..."
                value={novoModeloForm.descricao}
                onChange={(e) =>
                  setNovoModeloForm({ ...novoModeloForm, descricao: e.target.value })
                }
                className="w-full rounded-xl border border-white/10 bg-[#121620] p-3 text-xs text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none resize-none"
              />
            </div>

            {/* Categoria e Tipo */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-neutral-300 block mb-1">Categoria</label>
                <select
                  value={novoModeloForm.categoria}
                  onChange={(e) =>
                    setNovoModeloForm({ ...novoModeloForm, categoria: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="comercial">Comercial</option>
                  <option value="marketing">Marketing</option>
                  <option value="consultoria">Consultoria</option>
                  <option value="implantacao">Implantação</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-neutral-300 block mb-1">
                  Tipo de proposta
                </label>
                <select
                  value={novoModeloForm.tipoProposta}
                  onChange={(e) =>
                    setNovoModeloForm({ ...novoModeloForm, tipoProposta: e.target.value })
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#121620] px-3 py-2 text-xs text-white focus:border-orange-500 focus:outline-none"
                >
                  <option value="mensal">Serviços mensais</option>
                  <option value="unico">Projeto único</option>
                  <option value="consultoria">Consultoria</option>
                  <option value="implantacao">Implantação</option>
                  <option value="personalizado">Pacote personalizado</option>
                </select>
              </div>
            </div>

            {/* Cores de Identidade */}
            <div>
              <label className="font-semibold text-neutral-300 block mb-1.5">
                Cores do Modelo
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={novoModeloForm.corPrimaria}
                    onChange={(e) =>
                      setNovoModeloForm({ ...novoModeloForm, corPrimaria: e.target.value })
                    }
                    className="size-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-[11px] text-neutral-300">
                    {novoModeloForm.corPrimaria}
                  </span>
                </div>
                <span className="text-neutral-500 text-xs">Primária (destaque)</span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-white/5 flex gap-2">
            <button
              type="button"
              onClick={() => setModalNovoModeloAberto(false)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-xs font-semibold text-neutral-300"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCriarNovoModelo}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#ea580c] to-[#f97316] text-xs font-bold text-white shadow-md shadow-orange-600/20 hover:brightness-110"
            >
              Criar modelo
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          5. MODAL IDENTIDADE DA SUA MARCA (CONFIGURAÇÃO VISUAL)
         ========================================================================= */}
      <Dialog open={modalIdentidadeAberto} onOpenChange={setModalIdentidadeAberto}>
        <DialogContent className="max-w-lg bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Palette className="size-5 text-[#c084fc]" />
              <span>Identidade Visual da Marca</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 text-xs">
            <p className="text-neutral-400">
              Personalize o logo, tipografia e paleta padrão que serão aplicados automaticamente
              nas propostas e capas geradas.
            </p>

            <div className="p-3 rounded-xl border border-white/5 bg-[#121620] space-y-2">
              <span className="font-semibold text-white block">Logo da Empresa</span>
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center font-bold text-orange-400 text-lg">
                  F
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => toast.info("Selecione um arquivo de imagem PNG ou SVG")}
                    className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-white"
                  >
                    Alterar logo
                  </button>
                  <span className="text-[10px] text-neutral-500 block mt-1">
                    Recomendado: 400x120px transparente
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-white/5 bg-[#121620]">
                <span className="font-semibold text-white block mb-1">Cor Primária</span>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-[#f97316] border border-white/20" />
                  <span className="font-mono text-neutral-300 text-[11px]">#F97316</span>
                </div>
              </div>

              <div className="p-3 rounded-xl border border-white/5 bg-[#121620]">
                <span className="font-semibold text-white block mb-1">Cor Secundária</span>
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-md bg-[#0c1017] border border-white/20" />
                  <span className="font-mono text-neutral-300 text-[11px]">#0C1017</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-white/5 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setModalIdentidadeAberto(false);
                toast.success("Identidade da marca atualizada para as prévias!");
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/20"
            >
              Salvar preferências
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          6. MODAL CRIAÇÃO COM IA (PREVIEW DEMONSTRATIVO)
         ========================================================================= */}
      <Dialog open={modalIaAberto} onOpenChange={setModalIaAberto}>
        <DialogContent className="max-w-md bg-[#0c1017] border border-[#1b2232] text-white p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Wand2 className="size-5 text-[#60a5fa]" />
              <span>Criação de Modelo com IA</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs text-neutral-300">
            <p className="leading-relaxed">
              Descreva seu serviço, nicho de atuação e modelo de precificação. A IA do Flow Business
              montará a estrutura de tópicos, copy persuasiva e escopo de proposta ideal.
            </p>
            <textarea
              rows={4}
              placeholder="Ex: Crie um modelo de proposta para academias de CrossFit com plano trimestral, aulas experimentais e taxa de matrícula..."
              className="w-full rounded-xl border border-white/10 bg-[#121620] p-3 text-xs text-white placeholder-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>

          <DialogFooter className="mt-4 pt-3 border-t border-white/5 flex gap-2">
            <button
              type="button"
              onClick={() => setModalIaAberto(false)}
              className="px-4 py-2 rounded-xl border border-white/10 bg-[#121620] hover:bg-white/10 text-xs font-semibold text-neutral-300"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                setModalIaAberto(false);
                toast.success("Rascunho de IA preparado para personalização!");
                onPersonalizarModelo("mensal");
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/20"
            >
              Gerar rascunho
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
