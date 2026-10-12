import { useState } from "react";
import {
  Globe,
  Image as ImageIcon,
  Loader2,
  Package,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ProductCategory, ProductItem, ProductStatus } from "./marketing-data";

interface NovoProdutoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: ProductItem) => void;
}

export function NovoProdutoModal({ isOpen, onClose, onSave }: NovoProdutoModalProps) {
  const [tab, setTab] = useState<"manual" | "url">("manual");
  const [name, setName] = useState("");
  const [type, setType] = useState<"digital" | "fisico" | "servico">("servico");
  const [category, setCategory] = useState<ProductCategory>("Consultoria");
  const [description, setDescription] = useState("");
  const [salesPageUrl, setSalesPageUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [targetAudience, setTargetAudience] = useState("");
  const [mainBenefits, setMainBenefits] = useState("");
  const [commercialGoal, setCommercialGoal] = useState("");
  const [status, setStatus] = useState<ProductStatus>("ativo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setType("servico");
    setCategory("Consultoria");
    setDescription("");
    setSalesPageUrl("");
    setImageUrl("");
    setPrice("");
    setTargetAudience("");
    setMainBenefits("");
    setCommercialGoal("");
    setStatus("ativo");
    setTab("manual");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Por favor, informe o nome do produto ou serviço.");
      return;
    }

    if (salesPageUrl.trim()) {
      try {
        const parsed = new URL(salesPageUrl.trim());
        if (
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1" ||
          parsed.protocol !== "http:" && parsed.protocol !== "https:"
        ) {
          toast.error("Por favor, informe uma URL pública segura (http/https).");
          return;
        }
      } catch {
        toast.error("URL da página de vendas inválida.");
        return;
      }
    }

    setIsSubmitting(true);

    const newProduct: ProductItem = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || "Produto cadastrado no Flow Marketing AI.",
      category,
      type,
      status,
      imageUrl:
        imageUrl.trim() ||
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
      salesPageUrl: salesPageUrl.trim(),
      price: typeof price === "number" ? price : undefined,
      currency: "BRL",
      targetAudience: targetAudience.trim(),
      mainBenefits: mainBenefits.trim(),
      commercialGoal: commercialGoal.trim(),
      metrics: {
        leads: 0,
        proposals: 0,
        sales: 0,
      },
      primaryActionLabel: status === "ativo" ? "Criar campanha" : "Ver detalhes",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTimeout(() => {
      onSave(newProduct);
      setIsSubmitting(false);
      resetForm();
      onClose();
      toast.success("Produto cadastrado com sucesso!");
    }, 400);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none rounded-2xl border-home-border/80 bg-[#121620] p-6 text-white shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Package className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-white">
                Cadastrar Novo Produto ou Serviço
              </DialogTitle>
              <DialogDescription className="text-xs text-home-muted mt-0.5">
                Adicione uma nova oferta ao seu portfólio para criação de campanhas com IA.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Abas: Manual vs URL */}
        <div className="mt-3 flex rounded-xl border border-home-border/80 bg-home-surface/60 p-1">
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              tab === "manual"
                ? "bg-home-surface-strong text-white shadow-sm"
                : "text-home-muted hover:text-white"
            }`}
          >
            Cadastro Manual
          </button>
          <button
            type="button"
            onClick={() => setTab("url")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              tab === "url"
                ? "bg-home-surface-strong text-white shadow-sm"
                : "text-home-muted hover:text-white"
            }`}
          >
            Importar via URL da Oferta
          </button>
        </div>

        {tab === "url" && (
          <div className="mt-3 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-300 flex items-start gap-2.5">
            <Sparkles className="size-4 shrink-0 text-blue-400 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Extração Inteligente:</span>
              <p className="mt-0.5 text-[11px] text-blue-200/90 leading-relaxed">
                Informe a URL da sua landing page ou página de vendas. A IA analisará a proposta de
                valor e preencherá os diferenciais automaticamente nas próximas etapas.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Nome e Categoria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-home-muted mb-1">
                Nome da oferta / produto *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Consultoria de Vendas B2B"
                className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-home-muted mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white outline-none focus:border-home-orange cursor-pointer"
              >
                <option value="Restaurante">Restaurante</option>
                <option value="Hotelaria">Hotelaria</option>
                <option value="Saúde e Bem-estar">Saúde e Bem-estar</option>
                <option value="Imóveis">Imóveis</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Beleza e Estética">Beleza e Estética</option>
                <option value="Infoproduto">Infoproduto</option>
                <option value="Software">Software</option>
                <option value="Serviços Gerais">Serviços Gerais</option>
              </select>
            </div>
          </div>

          {/* Tipo e Preço */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-home-muted mb-1">
                Tipo de Oferta
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "digital" | "fisico" | "servico")}
                className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white outline-none focus:border-home-orange cursor-pointer"
              >
                <option value="servico">Prestação de Serviço</option>
                <option value="digital">Produto Digital</option>
                <option value="fisico">Produto Físico</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-home-muted mb-1">
                Preço Estimado (R$)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value ? parseFloat(e.target.value) : "")}
                placeholder="Ex: 1500"
                className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-home-muted mb-1">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ProductStatus)}
                className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white outline-none focus:border-home-orange cursor-pointer"
              >
                <option value="ativo">Ativo</option>
                <option value="rascunho">Rascunho</option>
                <option value="pausado">Pausado</option>
              </select>
            </div>
          </div>

          {/* URL da Página de Vendas */}
          <div>
            <label className="block text-[11px] font-semibold text-home-muted mb-1">
              URL da Página de Vendas / Landing Page
            </label>
            <div className="relative">
              <Globe className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
              <input
                type="url"
                value={salesPageUrl}
                onChange={(e) => setSalesPageUrl(e.target.value)}
                placeholder="https://suaempresa.com.br/oferta"
                className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] pl-9 pr-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange"
              />
            </div>
          </div>

          {/* URL da Imagem de Capa */}
          <div>
            <label className="block text-[11px] font-semibold text-home-muted mb-1">
              URL da Imagem de Capa (opcional)
            </label>
            <div className="relative">
              <ImageIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#161b26] pl-9 pr-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[11px] font-semibold text-home-muted mb-1">
              Descrição resumida
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os principais pontos da oferta para guiar as campanhas de marketing..."
              className="w-full rounded-xl border border-home-border/80 bg-[#161b26] p-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange resize-none"
            />
          </div>

          {/* Público-Alvo e Benefícios */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-home-muted mb-1">
                Público-alvo
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Ex: Médicos e gestores de clínicas"
                className="h-9 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-home-muted mb-1">
                Benefício principal
              </label>
              <input
                type="text"
                value={mainBenefits}
                onChange={(e) => setMainBenefits(e.target.value)}
                placeholder="Ex: Aumento de 30% na captação"
                className="h-9 w-full rounded-xl border border-home-border/80 bg-[#161b26] px-3 text-xs text-white placeholder:text-home-muted/70 outline-none focus:border-home-orange"
              />
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="mt-5 flex items-center justify-end gap-2.5 pt-3 border-t border-home-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 rounded-xl border border-home-border/80 bg-home-surface px-4 text-xs font-semibold text-white/90 hover:bg-home-surface-strong transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#ff6200] hover:bg-[#ff751a] px-5 text-xs font-semibold text-white shadow-[0_0_15px_rgba(255,98,0,0.35)] transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus className="size-3.5" />
                  Salvar Oferta
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
