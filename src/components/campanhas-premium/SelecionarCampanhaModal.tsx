import { useState } from "react";
import {
  ChevronRight,
  FolderOpen,
  Loader2,
  Mail,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campanha } from "@/types";

interface SelecionarCampanhaModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetView: "gestao" | "resultados";
  campanhas: Campanha[];
  isLoading?: boolean;
  onSelect: (campanha: Campanha) => void;
  onCreateNew?: () => void;
}

export function SelecionarCampanhaModal({
  isOpen,
  onClose,
  targetView,
  campanhas,
  isLoading = false,
  onSelect,
  onCreateNew,
}: SelecionarCampanhaModalProps) {
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const targetTitle =
    targetView === "gestao" ? "Gestão e Produção" : "Resultados e Métricas";

  const filtered = campanhas.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase().trim()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex w-full max-w-lg flex-col rounded-2xl border border-home-border bg-home-surface p-5 shadow-2xl animate-in zoom-in-95 duration-200 text-home-foreground sm:p-6 max-h-[90vh]">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between border-b border-home-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-home-orange/30 bg-home-orange/15 text-home-orange shadow-sm">
              <Megaphone className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Selecionar Campanha
              </h2>
              <p className="text-xs text-home-muted mt-0.5">
                Escolha uma campanha do workspace para abrir em{" "}
                <strong className="text-white">{targetTitle}</strong>.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="my-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar campanha por nome..."
              className="h-9 w-full rounded-xl border border-home-border bg-home-background pl-9 pr-3 text-xs text-home-foreground outline-none placeholder:text-home-muted transition-colors focus:border-home-blue focus:ring-1 focus:ring-home-blue"
            />
          </div>
        </div>

        {/* Lista de Campanhas com Estados: Loading, Empty, Lista */}
        <div className="min-h-0 flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="size-6 animate-spin text-home-orange" />
              <p className="mt-2 text-xs text-home-muted">
                Carregando campanhas do seu workspace...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center rounded-xl border border-dashed border-home-border bg-home-background/40 p-6">
              <FolderOpen className="size-8 text-home-muted/60 mb-2" />
              <p className="text-xs font-semibold text-white">
                Nenhuma campanha encontrada
              </p>
              <p className="text-[11px] text-home-muted mt-0.5">
                {search.trim()
                  ? `Nenhum resultado corresponde a "${search}".`
                  : "Você ainda não possui campanhas criadas neste workspace."}
              </p>
              {onCreateNew && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCreateNew();
                  }}
                  className="mt-3.5 flex items-center gap-1.5 rounded-xl bg-home-orange px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-home-orange/90 transition-colors"
                >
                  <Plus className="size-3.5" />
                  Criar nova campanha
                </button>
              )}
            </div>
          ) : (
            filtered.map((camp) => {
              const isConcluida = camp.status === "concluida";
              const isWa = (camp as any).canal === "whatsapp";

              return (
                <button
                  key={camp.id}
                  type="button"
                  onClick={() => {
                    onSelect(camp);
                    onClose();
                  }}
                  className="group flex w-full items-center justify-between rounded-xl border border-home-border bg-home-background/60 p-3 text-left transition-all duration-200 hover:border-home-orange/40 hover:bg-home-surface-strong"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-home-border bg-home-surface text-amber-500 shadow-sm">
                      <Utensils className="size-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-xs truncate group-hover:text-home-orange transition-colors">
                          {camp.nome}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.2 text-[9px] font-medium border",
                            isConcluida
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-400",
                          )}
                        >
                          {isConcluida ? "Concluída" : "Em produção"}
                        </span>
                      </div>

                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-home-muted">
                        <span>{camp.total || 0} leads vinculados</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {isWa ? (
                            <>
                              <MessageSquare className="size-3 text-emerald-400" />
                              WhatsApp
                            </>
                          ) : (
                            <>
                              <Mail className="size-3 text-amber-400" />
                              E-mail
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="size-4 text-home-muted transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
                </button>
              );
            })
          )}
        </div>

        {/* Rodapé */}
        <div className="mt-4 flex items-center justify-between border-t border-home-border/60 pt-3 text-xs">
          <span className="text-[11px] text-home-muted">
            {campanhas.length} campanha(s) disponíveis
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-home-border bg-home-surface px-3 py-1.5 font-semibold text-home-foreground hover:bg-home-surface-strong hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
