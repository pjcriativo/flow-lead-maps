import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  Command,
  Edit,
  Eye,
  FileCode,
  FileText,
  Filter,
  Layers,
  LayoutTemplate,
  Mail,
  MoreVertical,
  PenTool,
  Plus,
  Search,
  Sparkles,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type {
  CorporateSignatureItem,
  CustomTemplateItem,
  EmailTemplateItem,
  SignatureData,
  TemplateCategory,
  TemplateVariables,
} from "@/types/templates";
import {
  DEFAULT_SIGNATURE_DATA,
  OFFICIAL_CORPORATE_SIGNATURES,
  OFFICIAL_EMAIL_TEMPLATES,
  interpolateVariables,
} from "./templates-data";
import { TemplateCard } from "./TemplateCard";
import { SignatureCard } from "./SignatureCard";
import { TemplateMiniature } from "./TemplateMiniature";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { TemplateEditorModal } from "./TemplateEditorModal";
import { SignatureEditorModal } from "./SignatureEditorModal";
import {
  alternarFavoritoOrg,
  carregarVariaveisOrganizacao,
  definirAssinaturaPadraoOrg,
  listarFavoritosOrg,
  listarModelosPersonalizadosOrg,
  obterAssinaturaPadraoOrg,
  obterContextoOrgAtiva,
  prepararContratoEstudio,
  salvarModeloPersonalizadoOrg,
} from "@/services/templates-service";

interface BibliotecaTemplatesViewProps {
  user?: {
    name: string;
    email?: string;
    avatarUrl?: string;
    initials: string;
    plan?: string;
  };
  unreadNotifications?: number;
  onBackToCampanhas?: () => void;
  onSelectTemplateForCampaign?: (templateId: string) => void;
}

type TabType = "email" | "assinaturas";

export function BibliotecaTemplatesView({
  user = {
    name: "João Silva",
    email: "joao@flowbusiness.com.br",
    avatarUrl: "",
    initials: "JS",
    plan: "Plano Pro",
  },
  unreadNotifications = 3,
  onBackToCampanhas,
  onSelectTemplateForCampaign,
}: BibliotecaTemplatesViewProps) {
  // Contexto da organização e usuário ativo (multi-tenant)
  const [orgId, setOrgId] = useState<string>("default-org");
  const [variables, setVariables] = useState<TemplateVariables>({
    nome_remetente: user.name,
    empresa_remetente: "Flow Business",
    telefone_remetente: "+55 11 98765-4321",
    site_remetente: "https://flowbusiness.com.br",
  });

  // Aba principal: Templates de E-mail vs Assinaturas Corporativas
  const [activeTab, setActiveTab] = useState<TabType>("email");

  // Filtros e busca
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");
  const [filterFavoritos, setFilterFavoritos] = useState(false);
  const [filterMeusModelos, setFilterMeusModelos] = useState(false);
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>("emails");

  // Estado de favoritos e modelos personalizados persistidos na organização
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);
  const [meusModelos, setMeusModelos] = useState<CustomTemplateItem[]>([]);
  const [assinaturaPadrao, setAssinaturaPadrao] = useState<{
    id: string;
    data: SignatureData;
    definida: boolean;
  }>({
    id: "executiva-classica",
    data: DEFAULT_SIGNATURE_DATA,
    definida: true,
  });

  // Modais
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateItem | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editorTemplate, setEditorTemplate] = useState<EmailTemplateItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSignatureEditorOpen, setIsSignatureEditorOpen] = useState(false);
  const [signatureToEdit, setSignatureToEdit] = useState<CorporateSignatureItem | null>(null);

  // Carregar dados reais da organização
  useEffect(() => {
    let active = true;
    void (async () => {
      const ctx = await obterContextoOrgAtiva();
      if (!active) return;
      setOrgId(ctx.orgId);

      const vars = await carregarVariaveisOrganizacao();
      if (!active) return;
      setVariables(vars);

      const favs = listarFavoritosOrg(ctx.orgId);
      const custom = listarModelosPersonalizadosOrg(ctx.orgId);
      const defaultSig = obterAssinaturaPadraoOrg(ctx.orgId);

      setFavoritosIds(favs);
      setMeusModelos(custom);
      setAssinaturaPadrao(defaultSig);
    })();

    return () => {
      active = false;
    };
  }, []);

  // Alternar favorito com persistência na organização
  const handleToggleFavorito = (id: string) => {
    const isNowFav = alternarFavoritoOrg(orgId, id);
    setFavoritosIds(listarFavoritosOrg(orgId));
    if (isNowFav) {
      toast.success("Modelo adicionado aos favoritos!");
    } else {
      toast.info("Modelo removido dos favoritos.");
    }
  };

  // Abrir prévia de um template
  const handleOpenPreview = (template: EmailTemplateItem) => {
    setPreviewTemplate(template);
    setIsPreviewOpen(true);
  };

  // Abrir editor de template
  const handleOpenEditor = (template: EmailTemplateItem) => {
    setEditorTemplate(template);
    setIsEditorOpen(true);
  };

  // Salvar modelo personalizado
  const handleSaveCustomTemplate = (
    data: Partial<CustomTemplateItem> & { nome: string; categoria: EmailTemplateItem["categoria"] },
  ) => {
    const saved = salvarModeloPersonalizadoOrg(orgId, data);
    setMeusModelos(listarModelosPersonalizadosOrg(orgId));
    toast.success(`Modelo "${saved.nome}" salvo com sucesso!`);
  };

  // Definir assinatura padrão
  const handleSetDefaultSignature = (sig: CorporateSignatureItem) => {
    definirAssinaturaPadraoOrg(orgId, sig.id, assinaturaPadrao.data);
    setAssinaturaPadrao({
      id: sig.id,
      data: assinaturaPadrao.data,
      definida: true,
    });
    toast.success(`Assinatura "${sig.nome}" definida como padrão da organização!`);
  };

  // Salvar edição da assinatura padrão
  const handleSaveSignature = (sigData: SignatureData, setAsDef: boolean) => {
    const currentSigId = signatureToEdit?.id || assinaturaPadrao.id;
    if (setAsDef) {
      definirAssinaturaPadraoOrg(orgId, currentSigId, sigData);
      setAssinaturaPadrao({
        id: currentSigId,
        data: sigData,
        definida: true,
      });
    }
    toast.success("Dados da assinatura atualizados com sucesso!");
  };

  // Ação "Usar template" (Preparação estrita do contrato para Estúdio Prompt 51)
  const handleUseTemplate = (template: EmailTemplateItem) => {
    const contract = prepararContratoEstudio({
      template,
      variaveis: variables,
      orgId,
    });

    toast.success(
      `Template "${template.nome}" preparado com sucesso! O contrato comercial está pronto para o futuro Estúdio de Campanhas (Prompt 51).`,
      {
        duration: 5000,
      },
    );

    onSelectTemplateForCampaign?.(template.id);
  };

  // Filtragem dos templates de e-mail
  const filteredTemplates = useMemo(() => {
    let list: EmailTemplateItem[] = filterMeusModelos ? meusModelos : OFFICIAL_EMAIL_TEMPLATES;

    // Busca textual por nome, categoria ou descrição
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.nome.toLowerCase().includes(q) ||
          t.categoria.toLowerCase().includes(q) ||
          t.categoriaLabel.toLowerCase().includes(q) ||
          t.descricao.toLowerCase().includes(q),
      );
    }

    // Filtro por categoria do dropdown
    if (selectedCategory !== "todos") {
      list = list.filter((t) => t.categoria === selectedCategory);
    }

    // Filtro rápido por botões
    if (activeQuickFilter === "corporativo") {
      list = list.filter((t) => t.categoria === "comercial" || t.categoria === "institucional");
    } else if (activeQuickFilter === "follow-up") {
      list = list.filter((t) => t.categoria === "follow_up" || t.categoria === "relacionamento");
    } else if (activeQuickFilter === "newsletter") {
      list = list.filter((t) => t.categoria === "newsletter" || t.categoria === "educativo");
    }

    // Filtro por favoritos
    if (filterFavoritos) {
      list = list.filter((t) => favoritosIds.includes(t.id));
    }

    return list;
  }, [
    filterMeusModelos,
    meusModelos,
    searchQuery,
    selectedCategory,
    activeQuickFilter,
    filterFavoritos,
    favoritosIds,
  ]);

  // Filtragem das assinaturas
  const filteredSignatures = useMemo(() => {
    let list = OFFICIAL_CORPORATE_SIGNATURES;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.nome.toLowerCase().includes(q) ||
          s.categoria.toLowerCase().includes(q) ||
          s.descricao.toLowerCase().includes(q),
      );
    }
    if (filterFavoritos) {
      list = list.filter((s) => favoritosIds.includes(s.id));
    }
    return list;
  }, [searchQuery, filterFavoritos, favoritosIds]);

  // Limpar todos os filtros
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("todos");
    setFilterFavoritos(false);
    setFilterMeusModelos(false);
    setActiveQuickFilter(activeTab === "email" ? "emails" : "assinaturas");
  };

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "todos" ||
    filterFavoritos ||
    filterMeusModelos ||
    (activeQuickFilter !== "emails" && activeQuickFilter !== "assinaturas");

  return (
    <div className="min-h-screen bg-[#07090e] text-white">
      {/* =========================================================================
          TOPBAR OFICIAL COM BREADCRUMB, BUSCA E PERFIL
          ========================================================================= */}
      <header className="flex h-16 items-center justify-between border-b border-zinc-800/80 bg-[#090c13] px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb e Botão Voltar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCampanhas}
            className="flex size-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            title="Voltar para Campanhas"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={onBackToCampanhas}
              className="text-zinc-400 transition-colors hover:text-white"
            >
              Campanhas
            </button>
            <span className="text-zinc-600">&gt;</span>
            <span className="font-semibold text-white">Biblioteca de Templates</span>
          </div>
        </div>

        {/* Campo Central de Busca Global com ⌘ K */}
        <div className="hidden md:flex relative w-80 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar templates, categorias, palavras-chave..."
            className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0f131d] pl-9 pr-14 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-400">
            <Command className="size-2.5" /> K
          </span>
        </div>

        {/* Notificações e Perfil do Usuário */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notificações"
            className="relative flex size-9 items-center justify-center rounded-xl border border-zinc-800 bg-[#0f131d] text-zinc-400 transition-colors hover:text-white"
          >
            <Bell className="size-4" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-bold text-white shadow-sm">
                {unreadNotifications}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-[#0f131d] px-3 py-1.5">
            <Avatar className="size-7 border border-[#ff6200]/40">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback className="bg-[#1e1509] text-[10px] font-bold text-[#ff6200]">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left leading-tight hidden sm:block">
              <div className="text-xs font-bold text-white">{user.name}</div>
              <div className="text-[10px] text-zinc-400">{user.plan || "Plano Pro"}</div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          CONTEÚDO PRINCIPAL
          ========================================================================= */}
      <main className="px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Título & Subtítulo */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Biblioteca de Templates
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-400">
            Escolha templates profissionais de e-mail e assinaturas para usar nas suas campanhas.
          </p>
        </div>

        {/* =====================================================================
            4 CARDS DE INDICADORES SUPERIORES
            ===================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Templates disponíveis */}
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 shadow-sm transition-all hover:border-zinc-700">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-cyan-800/40 bg-cyan-950/40 text-cyan-400">
              <FileText className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-400">Templates disponíveis</span>
              <div className="text-2xl font-black text-white">
                {OFFICIAL_EMAIL_TEMPLATES.length}
              </div>
              <span className="text-[11px] text-zinc-500">Templates prontos para uso</span>
            </div>
          </div>

          {/* Card 2: Meus templates */}
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 shadow-sm transition-all hover:border-zinc-700">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-purple-800/40 bg-purple-950/40 text-purple-400">
              <User className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-400">Meus templates</span>
              <div className="text-2xl font-black text-white">{meusModelos.length}</div>
              <span className="text-[11px] text-zinc-500">Modelos personalizados</span>
            </div>
          </div>

          {/* Card 3: Assinaturas disponíveis */}
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 shadow-sm transition-all hover:border-zinc-700">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-emerald-800/40 bg-emerald-950/40 text-emerald-400">
              <PenTool className="size-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-400">Assinaturas disponíveis</span>
              <div className="text-2xl font-black text-white">
                {OFFICIAL_CORPORATE_SIGNATURES.length}
              </div>
              <span className="text-[11px] text-zinc-500">Modelos profissionais</span>
            </div>
          </div>

          {/* Card 4: Assinatura padrão */}
          <div className="flex items-center gap-4 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 shadow-sm transition-all hover:border-zinc-700">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-amber-800/40 bg-amber-950/40 text-amber-400">
              <Star className="size-5 fill-amber-400/20" />
            </div>
            <div>
              <span className="text-xs font-medium text-zinc-400">Assinatura padrão</span>
              <div className="text-xl font-bold text-white">
                {assinaturaPadrao.definida ? "Definida" : "Não definida"}
              </div>
              <span className="text-[11px] text-zinc-500">Usada nas suas campanhas</span>
            </div>
          </div>
        </div>

        {/* =====================================================================
            ABAS PRINCIPAIS (Templates de E-mail vs Assinaturas Corporativas)
            ===================================================================== */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab("email");
              setActiveQuickFilter("emails");
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-sm",
              activeTab === "email"
                ? "bg-[#ff6200] text-white shadow-[#ff6200]/20"
                : "border border-zinc-800 bg-[#10131b] text-zinc-400 hover:bg-zinc-800 hover:text-white",
            )}
          >
            <LayoutTemplate className="size-4" />
            <span>Templates de E-mail</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("assinaturas");
              setActiveQuickFilter("assinaturas");
            }}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-sm",
              activeTab === "assinaturas"
                ? "bg-[#ff6200] text-white shadow-[#ff6200]/20"
                : "border border-zinc-800 bg-[#10131b] text-zinc-400 hover:bg-zinc-800 hover:text-white",
            )}
          >
            <PenTool className="size-4" />
            <span>Assinaturas Corporativas</span>
          </button>
        </div>

        {/* =====================================================================
            BARRA DE BUSCA E FILTROS RÁPIDOS
            ===================================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800/80 bg-[#10131b] p-3">
          {/* Busca por texto */}
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar templates por nome, categoria ou assunto..."
              className="h-9 w-full rounded-xl border border-zinc-800 bg-[#0d1017] pl-9 pr-3 text-xs text-white placeholder-zinc-500 focus:border-[#ff6200] focus:outline-none"
            />
          </div>

          {/* Select de Categoria */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 rounded-xl border border-zinc-800 bg-[#0d1017] px-3 pr-8 text-xs font-medium text-zinc-300 focus:border-[#ff6200] focus:outline-none cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="comercial">Comercial</option>
              <option value="proposta">Proposta</option>
              <option value="newsletter">Newsletter</option>
              <option value="eventos">Eventos</option>
              <option value="follow_up">Follow-up</option>
              <option value="relacionamento">Relacionamento</option>
              <option value="diagnostico">Diagnóstico</option>
              <option value="institucional">Institucional</option>
              <option value="reuniao">Reunião</option>
              <option value="lancamento">Lançamento</option>
              <option value="educativo">Educativo</option>
              <option value="reativacao">Reativação</option>
            </select>
          </div>

          {/* Botões / Badges de Filtros */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterFavoritos(!filterFavoritos)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                filterFavoritos
                  ? "border-amber-500/50 bg-amber-500/20 text-amber-300"
                  : "border-zinc-800 bg-[#0d1017] text-zinc-400 hover:text-white",
              )}
            >
              <Star className={cn("size-3.5", filterFavoritos ? "fill-amber-400" : "")} />
              <span>Favoritos</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterMeusModelos(!filterMeusModelos)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                filterMeusModelos
                  ? "border-purple-500/50 bg-purple-500/20 text-purple-300"
                  : "border-zinc-800 bg-[#0d1017] text-zinc-400 hover:text-white",
              )}
            >
              <User className="size-3.5" />
              <span>Meus modelos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("email");
                setActiveQuickFilter("emails");
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                activeTab === "email" && activeQuickFilter === "emails"
                  ? "bg-[#ff6200] text-white"
                  : "border border-zinc-800 bg-[#0d1017] text-zinc-400 hover:text-white",
              )}
            >
              E-mails
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("assinaturas");
                setActiveQuickFilter("assinaturas");
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                activeTab === "assinaturas" && activeQuickFilter === "assinaturas"
                  ? "bg-[#ff6200] text-white"
                  : "border border-zinc-800 bg-[#0d1017] text-zinc-400 hover:text-white",
              )}
            >
              Assinaturas
            </button>

            <button
              type="button"
              onClick={() => setActiveQuickFilter("corporativo")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeQuickFilter === "corporativo"
                  ? "bg-zinc-700 text-white font-bold"
                  : "border border-zinc-800 bg-[#0d1017] text-zinc-400 hover:text-white",
              )}
            >
              Corporativo
            </button>

            <button
              type="button"
              onClick={() => setActiveQuickFilter("follow-up")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeQuickFilter === "follow-up"
                  ? "bg-zinc-700 text-white font-bold"
                  : "border border-zinc-800 bg-[#0d1017] text-zinc-400 hover:text-white",
              )}
            >
              Follow-up
            </button>

            <button
              type="button"
              onClick={() => setActiveQuickFilter("newsletter")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                activeQuickFilter === "newsletter"
                  ? "bg-zinc-700 text-white font-bold"
                  : "border border-zinc-800 bg-[#0d1017] text-zinc-400 hover:text-white",
              )}
            >
              Newsletter
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white pl-2"
              >
                <X className="size-3" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>
        </div>

        {/* =====================================================================
            CORPO COM GRID DE TEMPLATES E PAINEL LATERAL DIREITO
            ===================================================================== */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* COLUNA ESQUERDA: GRID DE TEMPLATES (OU ASSINATURAS) */}
          <div className="flex-1 w-full min-w-0">
            {activeTab === "email" ? (
              filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isFavorito={favoritosIds.includes(template.id)}
                      onToggleFavorito={handleToggleFavorito}
                      onPreview={handleOpenPreview}
                      onUseTemplate={handleUseTemplate}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#10131b] p-12 text-center">
                  <FileCode className="size-10 text-zinc-600 mb-3" />
                  <h3 className="text-sm font-bold text-white">Nenhum template encontrado</h3>
                  <p className="mt-1 text-xs text-zinc-400 max-w-sm">
                    Não encontramos nenhum modelo com os filtros atuais. Tente buscar por outros
                    termos ou limpar a busca.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                  >
                    Limpar filtros
                  </button>
                </div>
              )
            ) : /* ABA ASSINATURAS CORPORATIVAS */
            filteredSignatures.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredSignatures.map((sig) => (
                  <SignatureCard
                    key={sig.id}
                    signature={sig}
                    signatureData={assinaturaPadrao.data}
                    isPadrao={assinaturaPadrao.id === sig.id}
                    isFavorito={favoritosIds.includes(sig.id)}
                    onToggleFavorito={handleToggleFavorito}
                    onPreview={(s) => {
                      setSignatureToEdit(s);
                      setIsSignatureEditorOpen(true);
                    }}
                    onSetDefault={handleSetDefaultSignature}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#10131b] p-12 text-center">
                <PenTool className="size-10 text-zinc-600 mb-3" />
                <h3 className="text-sm font-bold text-white">Nenhuma assinatura encontrada</h3>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>

          {/* =====================================================================
              COLUNA DIREITA: PAINEL LATERAL (Modelos personalizados, Assinatura padrão, Outras)
              ===================================================================== */}
          <aside className="w-full lg:w-80 shrink-0 space-y-6">
            {/* BLOCO 1: MODELOS PERSONALIZADOS */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Modelos personalizados</h3>
                <button
                  type="button"
                  onClick={() => handleOpenEditor(OFFICIAL_EMAIL_TEMPLATES[0])}
                  className="flex items-center gap-1 rounded-lg bg-[#ff6200] px-2.5 py-1 text-xs font-bold text-white transition-all hover:bg-[#e65800]"
                >
                  <Plus className="size-3.5 stroke-[3]" />
                  <span>Novo template</span>
                </button>
              </div>

              {meusModelos.length > 0 ? (
                <div className="space-y-3">
                  {meusModelos.slice(0, 1).map((custom) => (
                    <div
                      key={custom.id}
                      className="rounded-xl border border-zinc-800 bg-[#141824] p-3 text-white transition-all"
                    >
                      <TemplateMiniature templateId="meu-template-institucional" />
                      <div className="mt-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-white truncate max-w-[140px]">
                            {custom.nome}
                          </h4>
                          <span className="rounded-md border border-purple-800/50 bg-purple-950/60 px-1.5 py-0.5 text-[9px] font-semibold text-purple-400">
                            Personalizado
                          </span>
                        </div>
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                      </div>
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {custom.atualizadoEm || "Atualizado há 5 dias"}
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditor(custom)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          <Edit className="size-3.5" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUseTemplate(custom)}
                          className="flex flex-1 items-center justify-center rounded-lg bg-[#ff6200] py-1.5 text-xs font-bold text-white hover:bg-[#e65800]"
                        >
                          Usar template
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setFilterMeusModelos(true);
                      setActiveTab("email");
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-[#ff6200] hover:text-[#ff7d2b] transition-colors pt-1"
                  >
                    <span>Ver todos os meus templates</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-zinc-800 p-4 text-center">
                  <p className="text-xs text-zinc-400">Nenhum modelo personalizado ainda.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenEditor(OFFICIAL_EMAIL_TEMPLATES[0])}
                    className="mt-2 text-xs font-bold text-[#ff6200]"
                  >
                    + Criar primeiro template
                  </button>
                </div>
              )}
            </div>

            {/* BLOCO 2: ASSINATURA PADRÃO */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white">Assinatura padrão</h3>
                <span className="flex items-center gap-1 rounded-md border border-emerald-800/50 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                  <Check className="size-3 stroke-[3]" />
                  <span>Ativa</span>
                </span>
              </div>

              {/* Card visual da assinatura corporativa */}
              <div className="rounded-xl border border-zinc-200 bg-white p-3.5 text-zinc-900 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="size-11 shrink-0 overflow-hidden rounded-full border border-zinc-300 bg-zinc-800">
                    <img
                      src="/images/templates/avatar-marcos.png"
                      alt={assinaturaPadrao.data.nome}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <div className="text-xs font-bold text-zinc-900 truncate">
                      {assinaturaPadrao.data.nome}
                    </div>
                    <div className="text-[11px] text-zinc-500 truncate">
                      {assinaturaPadrao.data.cargo}
                    </div>
                    <div className="text-[11px] font-bold text-zinc-800 mt-0.5 flex items-center gap-1.5">
                      <span className="text-[#ff6200] font-black text-xs">⚡</span>
                      <span className="font-extrabold tracking-tight">Flow Business</span>
                    </div>
                  </div>
                </div>

                <div className="my-2.5 border-t border-zinc-200" />

                <div className="space-y-1 text-[10.5px] text-zinc-600">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>📞</span>
                    <span>{assinaturaPadrao.data.telefone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span>✉️</span>
                    <span>{assinaturaPadrao.data.email}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span>📍</span>
                    <span>{assinaturaPadrao.data.endereco}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <span>🌐</span>
                    <span className="text-blue-600 font-medium">{assinaturaPadrao.data.site}</span>
                  </div>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 pt-2 border-t border-zinc-100">
                  <span className="size-5 rounded-full bg-blue-600 text-[10px] text-white flex items-center justify-center font-bold">
                    in
                  </span>
                  <span className="size-5 rounded-full bg-gradient-to-tr from-amber-500 to-rose-600 text-[10px] text-white flex items-center justify-center font-bold">
                    ig
                  </span>
                  <span className="size-5 rounded-full bg-sky-500 text-[10px] text-white flex items-center justify-center">
                    ✉
                  </span>
                  <span className="size-5 rounded-full bg-emerald-500 text-[10px] text-white flex items-center justify-center font-bold">
                    wa
                  </span>
                </div>
              </div>

              {/* Botões de Ação da Assinatura */}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const currentSig =
                      OFFICIAL_CORPORATE_SIGNATURES.find((s) => s.id === assinaturaPadrao.id) ||
                      OFFICIAL_CORPORATE_SIGNATURES[0];
                    setSignatureToEdit(currentSig);
                    setIsSignatureEditorOpen(true);
                  }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <Edit className="size-3.5" />
                  <span>Editar assinatura</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    toast.success("Assinatura padrão já está ativa nas suas campanhas.")
                  }
                  className="flex flex-1 items-center justify-center rounded-lg bg-[#ff6200] py-1.5 text-xs font-bold text-white hover:bg-[#e65800]"
                >
                  Definir como padrão
                </button>
              </div>
            </div>

            {/* BLOCO 3: OUTRAS ASSINATURAS */}
            <div className="rounded-2xl border border-zinc-800/80 bg-[#10131b] p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-zinc-300">Outras assinaturas</h3>
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
                  {OFFICIAL_CORPORATE_SIGNATURES.length}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#141824] p-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-7 rounded-md overflow-hidden border border-zinc-700/60 bg-white shrink-0 shadow-sm">
                      <img
                        src="/images/templates/thumb-equipe-comercial.png"
                        alt="Equipe Comercial"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Equipe Comercial</div>
                      <div className="text-[10.5px] text-zinc-500 truncate">
                        Assinatura da equipe de vendas
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sig = OFFICIAL_CORPORATE_SIGNATURES[4]; // Consultor Comercial
                      setSignatureToEdit(sig);
                      setIsSignatureEditorOpen(true);
                    }}
                    className="p-1 text-zinc-500 hover:text-white"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#141824] p-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-11 h-7 rounded-md overflow-hidden border border-zinc-700/60 bg-white shrink-0 shadow-sm">
                      <img
                        src="/images/templates/thumb-suporte.png"
                        alt="Suporte"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">Suporte</div>
                      <div className="text-[10.5px] text-zinc-500 truncate">
                        Assinatura do time de suporte
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sig = OFFICIAL_CORPORATE_SIGNATURES[1]; // Minimalista
                      setSignatureToEdit(sig);
                      setIsSignatureEditorOpen(true);
                    }}
                    className="p-1 text-zinc-500 hover:text-white"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("assinaturas");
                    setActiveQuickFilter("assinaturas");
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-[#ff6200] hover:text-[#ff7d2b] transition-colors pt-2"
                >
                  <span>Ver todas as assinaturas</span>
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* =========================================================================
          MODAIS AUXILIARES
          ========================================================================= */}
      <TemplatePreviewModal
        isOpen={isPreviewOpen}
        template={previewTemplate}
        variables={variables}
        onClose={() => setIsPreviewOpen(false)}
        onPersonalizar={handleOpenEditor}
        onUseTemplate={handleUseTemplate}
      />

      <TemplateEditorModal
        isOpen={isEditorOpen}
        template={editorTemplate}
        initialVariables={variables}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveCustomTemplate}
      />

      <SignatureEditorModal
        isOpen={isSignatureEditorOpen}
        signature={signatureToEdit}
        currentData={assinaturaPadrao.data}
        onClose={() => setIsSignatureEditorOpen(false)}
        onSave={handleSaveSignature}
      />
    </div>
  );
}
