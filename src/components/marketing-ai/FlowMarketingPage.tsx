import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MarketingTopBar } from "./MarketingTopBar";
import { MarketingHeader } from "./MarketingHeader";
import { MarketingKpiCards } from "./MarketingKpiCards";
import { MarketingTabsBar, type MarketingTabId } from "./MarketingTabsBar";
import { MarketingFiltersBar, type ViewMode } from "./MarketingFiltersBar";
import { ProductCard } from "./ProductCard";
import { ProductListView } from "./ProductListView";
import { MarketingAssistantPanel } from "./MarketingAssistantPanel";
import { NovoProdutoModal } from "./NovoProdutoModal";
import { ComoFuncionaModal } from "./ComoFuncionaModal";
import { ProdutoDetalhesDrawer } from "./ProdutoDetalhesDrawer";
import {
  INITIAL_PRODUCTS,
  MARKETING_INSIGHTS,
  MARKETING_KPIS,
  type ProductItem,
} from "./marketing-data";

interface FlowMarketingPageProps {
  user: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  onNavigateToCampanhas?: () => void;
}

export function FlowMarketingPage({
  user,
  unreadNotifications = 1,
  onNavigateToCampanhas,
}: FlowMarketingPageProps) {
  // Dados de Produtos e Insights
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [kpis] = useState(MARKETING_KPIS);
  const [insights] = useState(MARKETING_INSIGHTS);

  // Estados de Navegação e Filtros
  const [activeTab, setActiveTab] = useState<MarketingTabId>("produtos");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Modais e Drawers
  const [isNovoProdutoOpen, setIsNovoProdutoOpen] = useState(false);
  const [isComoFuncionaOpen, setIsComoFuncionaOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Filtragem dos Produtos
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Filtro de busca por nome ou descrição
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCat = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // Filtro de Status
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Filtro de Categoria
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [products, searchTerm, statusFilter, categoryFilter]);

  // Ações nos Cards
  const handlePrimaryAction = (product: ProductItem) => {
    if (product.primaryActionLabel === "Criar campanha") {
      toast.info(
        `Iniciando preparação de campanha com IA para o produto "${product.name}".`,
        {
          action: onNavigateToCampanhas
            ? {
                label: "Ir para Campanhas",
                onClick: () => onNavigateToCampanhas(),
              }
            : undefined,
        },
      );
    } else if (product.primaryActionLabel === "Ver análise") {
      setSelectedProduct(product);
      toast.info(`Análise diagnóstica da IA para "${product.name}" em processamento.`);
    } else if (product.primaryActionLabel === "Continuar") {
      setSelectedProduct(product);
      toast.info(`Rascunho de "${product.name}" aberto para edição.`);
    } else if (product.primaryActionLabel === "Reativar") {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                status: "ativo",
                primaryActionLabel: "Criar campanha",
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      );
      toast.success(`Oferta "${product.name}" reativada com sucesso!`);
    } else {
      setSelectedProduct(product);
    }
  };

  const handleTogglePause = (product: ProductItem) => {
    const nextStatus = product.status === "pausado" ? "ativo" : "pausado";
    const nextLabel = nextStatus === "ativo" ? "Criar campanha" : "Reativar";

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              status: nextStatus,
              primaryActionLabel: nextLabel,
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );

    toast.success(
      nextStatus === "ativo"
        ? `Oferta "${product.name}" reativada!`
        : `Oferta "${product.name}" pausada.`,
    );
  };

  const handleArchive = (product: ProductItem) => {
    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              status: "arquivado",
              primaryActionLabel: "Ver detalhes",
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    toast.success(`Oferta "${product.name}" arquivada.`);
  };

  const handleAddProduct = (newProduct: ProductItem) => {
    setProducts((prev) => [newProduct, ...prev]);
  };

  const handleTabChange = (tabId: MarketingTabId) => {
    if (tabId !== "produtos") {
      toast.info(
        `A aba selecionada faz parte das próximas etapas do módulo Flow Marketing AI.`,
        { duration: 3500 },
      );
      setActiveTab(tabId);
    } else {
      setActiveTab("produtos");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d13] text-home-foreground">
      {/* Topbar Global Superior */}
      <MarketingTopBar
        user={user}
        unreadNotifications={unreadNotifications}
        onSearchChange={setSearchTerm}
      />

      {/* Conteúdo Principal da Página */}
      <div className="mx-auto max-w-[1720px] px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cabeçalho da Página com Badge, Título e Banner de Agentes */}
        <MarketingHeader onOpenComoFunciona={() => setIsComoFuncionaOpen(true)} />

        {/* 6 Indicadores Superiores (KPIs) */}
        <MarketingKpiCards kpis={kpis} />

        {/* Layout Dividido: Área Principal (72%) + Assistente Lateral (28%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Coluna Principal da Esquerda (8 colunas de 12) */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Abas Superiores + Botão Novo Produto */}
            <MarketingTabsBar
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onOpenNovoProduto={() => setIsNovoProdutoOpen(true)}
            />

            {/* Conteúdo da Aba Ativa */}
            {activeTab === "produtos" ? (
              <>
                {/* Barra de Filtros e Alternância de Visualização */}
                <MarketingFiltersBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  categoryFilter={categoryFilter}
                  onCategoryFilterChange={setCategoryFilter}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                />

                {/* Grid ou Lista de Produtos */}
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-1">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onViewDetails={(p) => setSelectedProduct(p)}
                        onPrimaryAction={handlePrimaryAction}
                        onEdit={(p) => setSelectedProduct(p)}
                        onTogglePause={handleTogglePause}
                        onArchive={handleArchive}
                      />
                    ))}

                    {filteredProducts.length === 0 && (
                      <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-home-border/80 bg-[#121620] py-16 text-center">
                        <p className="text-sm font-semibold text-white">
                          Nenhum produto corresponde aos filtros
                        </p>
                        <p className="mt-1 text-xs text-home-muted">
                          Tente redefinir a busca ou selecione "Todos os status".
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ProductListView
                    products={filteredProducts}
                    onViewDetails={(p) => setSelectedProduct(p)}
                    onPrimaryAction={handlePrimaryAction}
                  />
                )}
              </>
            ) : (
              /* Estado da Aba Quando em Outra Seção */
              <div className="flex flex-col items-center justify-center rounded-2xl border border-home-border/80 bg-[#121620]/90 py-20 px-4 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#ff6200]/15 border border-[#ff6200]/30 text-[#ff751a] mb-3">
                  <span className="text-xl font-bold">✨</span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Módulo em Preparação
                </h3>
                <p className="mt-1.5 text-xs text-home-muted max-w-md">
                  Esta funcionalidade será ativada na próxima etapa da integração do Flow Marketing
                  AI com o mecanismo de IA.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("produtos")}
                  className="mt-4 rounded-xl bg-home-surface hover:bg-home-surface-strong border border-home-border px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  Voltar para Produtos e Serviços
                </button>
              </div>
            )}
          </div>

          {/* Coluna Lateral da Direita (4 colunas de 12): Assistente, Insights e Banner */}
          <div className="lg:col-span-4 xl:col-span-3">
            <MarketingAssistantPanel
              userName={user.name ? user.name.split(" ")[0] : "Carlos"}
              insights={insights}
              onOpenNovoProduto={() => setIsNovoProdutoOpen(true)}
              onOpenComoFunciona={() => setIsComoFuncionaOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modal: Cadastro de Novo Produto */}
      <NovoProdutoModal
        isOpen={isNovoProdutoOpen}
        onClose={() => setIsNovoProdutoOpen(false)}
        onSave={handleAddProduct}
      />

      {/* Modal: Como Funciona */}
      <ComoFuncionaModal
        isOpen={isComoFuncionaOpen}
        onClose={() => setIsComoFuncionaOpen(false)}
      />

      {/* Drawer: Detalhes do Produto */}
      <ProdutoDetalhesDrawer
        product={selectedProduct}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onPrimaryAction={handlePrimaryAction}
      />
    </div>
  );
}
