import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type {
  CanalPlataforma,
  ConteudoItem,
  FormatoConteudo,
} from "./conteudos-data";
import { PlatformIcon } from "./PlatformIcon";

interface NovoConteudoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveContent: (content: Partial<ConteudoItem>) => void;
  initialFormat?: FormatoConteudo;
}

export function NovoConteudoModal({
  isOpen,
  onClose,
  onSaveContent,
  initialFormat = "post_simples",
}: NovoConteudoModalProps) {
  const [platform, setPlatform] = useState<CanalPlataforma>("instagram");
  const [format, setFormat] = useState<FormatoConteudo>(initialFormat);
  const [productName, setProductName] = useState("Curso de Marketing Digital");
  const [theme, setTheme] = useState("");
  const [objective, setObjective] = useState("Engajamento");
  const [tone, setTone] = useState("Inspirador");
  const [instructions, setInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState("");
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (!theme.trim()) {
      toast.error("Informe o tema ou assunto do conteúdo.");
      return;
    }

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const sampleCopy = `🚀 ${theme.trim()}\n\nDescubra os princípios que transformam o seu posicionamento no mercado e multiplicam o seu alcance.\n\nPrincipais pontos:\n• Clareza no público-alvo\n• Conteúdo focado em resolução de problemas\n• Consistência de publicação\n\n💬 Comente aqui o que achou e compartilhe com sua equipe!`;
      setGeneratedCopy(sampleCopy);
      setGeneratedHashtags([
        `#${theme.toLowerCase().replace(/\s+/g, "")}`,
        "#marketing",
        "#conteudo",
        "#inovacao",
      ]);
      toast.success("Conteúdo gerado com IA com sucesso!");
    }, 1200);
  };

  const handleSave = () => {
    if (!theme.trim()) {
      toast.error("Informe o tema antes de salvar.");
      return;
    }

    onSaveContent({
      title: theme,
      subtitle: productName,
      platform,
      format,
      formatLabel: format.replace("_", " ").toUpperCase(),
      time: "10:00",
      status: "agendado",
      imageUrl:
        "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format&fit=crop&q=80",
      dayIndex: 3, // Qua 14
      dateIso: "2024-08-14T10:00:00Z",
      copy: generatedCopy || `Publicação sobre ${theme}`,
      hashtags: generatedHashtags,
    });

    toast.success("Conteúdo adicionado ao planejamento!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-home-border/80 bg-[#0E131B] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-home-border/60">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-home-orange/15 border border-home-orange/30 text-home-orange flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Criar Novo Conteúdo com IA
              </h2>
              <p className="text-xs text-home-muted">
                Preencha as diretrizes e gere copies e imagens para múltiplos canais.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-home-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-4 text-xs">
          {/* Row 1: Produto & Canal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Produto ou Serviço
              </label>
              <select
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-home-orange"
              >
                <option value="Curso de Marketing Digital">Curso de Marketing Digital</option>
                <option value="Consultoria Empresarial">Consultoria Empresarial</option>
                <option value="Plano Fitness Premium">Plano Fitness Premium</option>
                <option value="Hospedagem Boutique">Hospedagem Boutique</option>
                <option value="Geral (Institucional)">Geral (Institucional)</option>
              </select>
            </div>

            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Canal de Publicação
              </label>
              <div className="flex items-center gap-1.5 bg-[#141A23] border border-home-border/60 rounded-lg p-1.5">
                {(
                  [
                    "instagram",
                    "youtube",
                    "tiktok",
                    "linkedin",
                    "facebook",
                  ] as CanalPlataforma[]
                ).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setPlatform(ch)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] capitalize cursor-pointer transition-colors ${
                      platform === ch
                        ? "bg-home-surface-strong text-white border border-white/20"
                        : "text-home-muted hover:text-white"
                    }`}
                  >
                    <PlatformIcon platform={ch} size="sm" />
                    <span>{ch}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Formato & Objetivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Formato do Conteúdo
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as FormatoConteudo)}
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-home-orange"
              >
                <option value="post_simples">Post simples</option>
                <option value="carrossel">Carrossel</option>
                <option value="reels_shorts">Reels / Shorts</option>
                <option value="video_completo">Vídeo completo</option>
                <option value="story">Story</option>
                <option value="artigo_blog">Artigo / Blog</option>
                <option value="email">E-mail</option>
                <option value="anuncio">Anúncio</option>
              </select>
            </div>

            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Objetivo do Conteúdo
              </label>
              <select
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-home-orange"
              >
                <option value="Engajamento">Engajamento & Interação</option>
                <option value="Vendas">Conversão & Vendas</option>
                <option value="Alcance">Alcance & Viralização</option>
                <option value="Autoridade">Autoridade & Educação</option>
                <option value="Leads">Captura de Leads</option>
              </select>
            </div>
          </div>

          {/* Row 3: Tema / Assunto */}
          <div>
            <label className="block text-home-muted font-medium mb-1.5">
              Tema ou Assunto Principal *
            </label>
            <input
              type="text"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex: Como dobrar as vendas com automações de marketing..."
              className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white placeholder:text-home-muted/50 focus:outline-none focus:border-home-orange"
            />
          </div>

          {/* Row 4: Tom de Comunicação & Instruções adicionais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Tom de Comunicação
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white focus:outline-none focus:border-home-orange"
              >
                <option value="Inspirador">Inspirador & Motivacional</option>
                <option value="Profissional">Profissional & Corporativo</option>
                <option value="Descontraído">Descontraído & Leve</option>
                <option value="Educativo">Educativo & Técnico</option>
                <option value="Urgente">Urgente & Promocional</option>
              </select>
            </div>

            <div>
              <label className="block text-home-muted font-medium mb-1.5">
                Instruções extras (opcional)
              </label>
              <input
                type="text"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex: Incluir chamada para o link na bio"
                className="w-full bg-[#141A23] border border-home-border/60 rounded-lg p-2.5 text-white placeholder:text-home-muted/50 focus:outline-none focus:border-home-orange"
              />
            </div>
          </div>

          {/* Button: Gerar com IA */}
          <div className="pt-1">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-home-orange to-orange-600 hover:from-orange-600 hover:to-home-orange text-white font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,98,0,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Gerando copy e sugestões com IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  <span>Gerar conteúdo com IA</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Preview */}
          {generatedCopy && (
            <div className="rounded-xl border border-home-orange/40 bg-[#141A23]/90 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-home-orange font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Copy Gerada com Sucesso
                </span>
                <span className="text-[10px] text-home-muted font-normal">
                  Pronto para agendamento
                </span>
              </div>
              <textarea
                rows={5}
                value={generatedCopy}
                onChange={(e) => setGeneratedCopy(e.target.value)}
                className="w-full bg-[#0E131B] border border-home-border/60 rounded-lg p-2.5 text-white text-xs leading-relaxed focus:outline-none focus:border-home-orange"
              />
              <div className="flex flex-wrap gap-1">
                {generatedHashtags.map((h, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-home-orange bg-home-orange/10 px-2 py-0.5 rounded-full"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-home-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-home-muted hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-home-orange hover:bg-home-orange-hover text-white shadow-[0_0_15px_rgba(255,98,0,0.3)] transition-all cursor-pointer"
          >
            Agendar Conteúdo
          </button>
        </div>
      </div>
    </div>
  );
}
