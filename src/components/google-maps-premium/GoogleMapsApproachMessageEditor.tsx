import { useState, useRef } from "react";
import {
  FolderPlus,
  ChevronDown,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Smile,
  Sparkles,
  BookmarkCheck,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface GoogleMapsApproachMessageEditorProps {
  canalAtivo: "whatsapp" | "email" | "instagram";
  onChangeCanalAtivo: (canal: "whatsapp" | "email" | "instagram") => void;
  mensagens: {
    whatsapp: string;
    email: string;
    instagram: string;
  };
  onChangeMensagem: (canal: "whatsapp" | "email" | "instagram", texto: string) => void;
  onSalvarModelo?: () => void;
}

export function GoogleMapsApproachMessageEditor({
  canalAtivo,
  onChangeCanalAtivo,
  mensagens,
  onChangeMensagem,
  onSalvarModelo,
}: GoogleMapsApproachMessageEditorProps) {
  const [dropdownVariaveisAberto, setDropdownVariaveisAberto] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const variaveisDisponiveis = [
    { tag: "{nome_empresa}", desc: "Nome da empresa" },
    { tag: "{categoria}", desc: "Categoria do negócio" },
    { tag: "{cidade}", desc: "Cidade da busca" },
    { tag: "{uf}", desc: "Estado (UF)" },
    { tag: "{endereco}", desc: "Endereço comercial" },
    { tag: "{avaliacao}", desc: "Nota no Google Maps" },
    { tag: "{site}", desc: "Site da empresa" },
    { tag: "{instagram}", desc: "Instagram" },
    { tag: "{seu_nome}", desc: "Seu nome / Remetente" },
  ];

  const mensagemAtual = mensagens[canalAtivo];
  const charCount = mensagemAtual.length;
  const maxChars = 1000;

  // Inserir variável na posição do cursor no textarea
  const handleInserirVariavel = (tag: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const texto = textarea.value;
      const novoTexto = texto.substring(0, start) + tag + texto.substring(end);
      onChangeMensagem(canalAtivo, novoTexto);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tag.length, start + tag.length);
      }, 50);
    } else {
      onChangeMensagem(canalAtivo, mensagemAtual + " " + tag);
    }
    setDropdownVariaveisAberto(false);
    toast.success(`Variável ${tag} inserida!`);
  };

  return (
    <div className="rounded-2xl border border-home-border bg-[#101720]/90 p-4 shadow-sm flex flex-col justify-between space-y-3.5 h-full">
      {/* Topo da Coluna 3 */}
      <div className="space-y-1">
        <h3 className="text-sm font-extrabold text-white tracking-tight">
          3. Mensagens e Personalização
        </h3>
        <p className="text-[11px] text-home-muted leading-tight">
          Crie mensagens personalizadas e utilize variáveis para personalizar cada contato.
        </p>
      </div>

      {/* Abas de Canal: WhatsApp, E-mail, Instagram */}
      <div className="flex rounded-xl border border-home-border p-1 bg-home-surface/60">
        <button
          type="button"
          onClick={() => onChangeCanalAtivo("whatsapp")}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
            canalAtivo === "whatsapp"
              ? "bg-home-orange text-white shadow-sm font-bold"
              : "text-home-muted hover:text-white",
          )}
        >
          WhatsApp
        </button>
        <button
          type="button"
          onClick={() => onChangeCanalAtivo("email")}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
            canalAtivo === "email"
              ? "bg-home-orange text-white shadow-sm font-bold"
              : "text-home-muted hover:text-white",
          )}
        >
          E-mail
        </button>
        <button
          type="button"
          onClick={() => onChangeCanalAtivo("instagram")}
          className={cn(
            "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
            canalAtivo === "instagram"
              ? "bg-home-orange text-white shadow-sm font-bold"
              : "text-home-muted hover:text-white",
          )}
        >
          Instagram
        </button>
      </div>

      {/* Seletor Dropdown de Variáveis */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownVariaveisAberto((prev) => !prev)}
          className="w-full flex items-center justify-between rounded-xl border border-home-border bg-home-surface/70 px-3 py-1.5 text-xs text-white hover:border-home-border/80 transition-colors cursor-pointer"
        >
          <span className="font-semibold text-home-muted">Inserir variável &#123;x&#125;</span>
          <ChevronDown className="size-3.5 text-home-muted" />
        </button>

        {dropdownVariaveisAberto && (
          <div className="absolute top-full left-0 mt-1 w-full z-20 rounded-xl border border-home-border bg-[#101720] shadow-xl p-1.5 space-y-1">
            {variaveisDisponiveis.map((v) => (
              <button
                key={v.tag}
                type="button"
                onClick={() => handleInserirVariavel(v.tag)}
                className="w-full flex items-center justify-between rounded-lg px-2.5 py-1 text-xs hover:bg-home-surface text-left transition-colors cursor-pointer"
              >
                <span className="font-mono text-home-orange font-semibold">{v.tag}</span>
                <span className="text-[10px] text-home-muted">{v.desc}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Editor de Texto da Mensagem */}
      <div className="space-y-1.5">
        <textarea
          ref={textareaRef}
          value={mensagemAtual}
          onChange={(e) => onChangeMensagem(canalAtivo, e.target.value)}
          maxLength={maxChars}
          rows={9}
          placeholder="Digite a mensagem personalizada..."
          className="w-full rounded-xl border border-home-border bg-[#0a0f16] p-3 text-xs text-white placeholder:text-home-muted/50 focus:border-home-orange focus:outline-none focus:ring-1 focus:ring-home-orange font-sans leading-relaxed resize-none"
        />

        {/* Barra de Ferramentas e Contador de Caracteres */}
        <div className="flex items-center justify-between text-home-muted pt-0.5 px-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
              title="Negrito"
            >
              <Bold className="size-3.5" />
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
              title="Itálico"
            >
              <Italic className="size-3.5" />
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
              title="Lista de marcadores"
            >
              <List className="size-3.5" />
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
              title="Lista numerada"
            >
              <ListOrdered className="size-3.5" />
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
              title="Link"
            >
              <Link2 className="size-3.5" />
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors cursor-pointer"
              title="Emoji"
            >
              <Smile className="size-3.5" />
            </button>
          </div>

          <span className="text-[10px] font-mono">
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* Seção: Variáveis Disponíveis (Chips) */}
      <div className="space-y-1.5 pt-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-home-muted">
          Variáveis disponíveis
        </label>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {variaveisDisponiveis.map((v) => (
            <button
              key={v.tag}
              type="button"
              onClick={() => handleInserirVariavel(v.tag)}
              className="rounded-lg border border-home-orange/40 bg-home-orange/10 px-2 py-0.5 text-[10px] font-mono font-semibold text-home-orange hover:bg-home-orange/20 hover:border-home-orange transition-colors cursor-pointer"
              title={`Clique para inserir: ${v.desc}`}
            >
              {v.tag}
            </button>
          ))}
        </div>
      </div>

      {/* Rodapé da Coluna 3: Salvar como Modelo */}
      <div className="pt-2 border-t border-home-border/60">
        <button
          type="button"
          onClick={() => {
            if (onSalvarModelo) onSalvarModelo();
            else toast.success("Modelo salvo localmente na preparação!");
          }}
          className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-home-border bg-home-surface/80 px-3 text-xs font-semibold text-white hover:bg-home-surface hover:border-home-border/80 transition-colors cursor-pointer"
        >
          <BookmarkCheck className="size-3.5 text-home-orange" />
          <span>Salvar como modelo</span>
        </button>
      </div>
    </div>
  );
}
