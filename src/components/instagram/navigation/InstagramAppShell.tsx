import type { ReactNode } from "react";
import { ArrowLeft, ChartNoAxesColumnIncreasing, ChevronRight, Crosshair, Instagram, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  instagramNavigation,
  instagramNavigationItems,
  isInstagramView,
  type InstagramView,
} from "@/components/instagram/navigation/instagram-navigation";

export function InstagramAppShell({
  activeView,
  onViewChange,
  onExit,
  children,
}: {
  activeView: InstagramView;
  onViewChange: (view: InstagramView) => void;
  onExit: () => void;
  children: ReactNode;
}) {
  const activeItem =
    instagramNavigationItems.find((item) => item.id === activeView) ?? instagramNavigationItems[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      {/* Sidebar Desktop Dark (#101829) */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-800/70 bg-[#101829] text-white lg:flex">
        {/* Topo: Voltar + Logo Instagram PRO */}
        <div className="border-b border-slate-800/70 px-5 py-5">
          <button
            type="button"
            onClick={onExit}
            className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="size-3.5" />
            Voltar ao Flow Business
          </button>

          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white shadow-lg shadow-[#E1306C]/25">
              <Instagram className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">Instagram</span>
                <span className="rounded bg-[#2563EB]/25 border border-[#2563EB]/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-400">
                  PRO
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                Prospecção inteligente
              </p>
            </div>
          </div>
        </div>

        {/* Navegação: 7 Áreas */}
        <nav
          className="flex-1 space-y-5 overflow-y-auto px-3.5 py-5 scrollbar-thin"
          aria-label="Módulos do Instagram"
        >
          {instagramNavigation.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    activeView === item.id ||
                    (item.id === "competitors" &&
                      ["radar", "comments", "overview"].includes(activeView)) ||
                    (item.id === "crm" && activeView === "leads") ||
                    (item.id === "hunter" && activeView === "discover") ||
                    (item.id === "cadences" && activeView === "campaigns");

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onViewChange(item.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                        isActive
                          ? "bg-[#1E293B] text-white shadow-sm ring-1 ring-white/10"
                          : "text-slate-300 hover:bg-white/[0.04] hover:text-white",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                          isActive
                            ? "border-[#E1306C]/40 bg-[#E1306C]/15 text-[#E1306C]"
                            : "border-white/10 bg-white/5 text-slate-400 group-hover:text-slate-200 group-hover:border-white/20",
                        )}
                      >
                        <item.Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{item.label}</span>
                        <span className="block truncate text-[10.5px] text-slate-400">
                          {item.description}
                        </span>
                      </span>
                      {isActive ? (
                        <ChevronRight className="size-3.5 text-[#E1306C]" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Rodapé: Card Base protegida */}
        <div className="border-t border-slate-800/70 p-4">
          <div className="rounded-2xl border border-white/10 bg-[#162032] p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldCheck className="size-4 text-[#10B981]" />
              Base protegida
            </div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-400">
              Leads já encontrados são reaproveitados para evitar duplicidade nas próximas buscas.
            </p>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="min-w-0 flex-1 flex flex-col">
        {/* Header Superior Branco com Backdrop */}
        <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              {/* Mobile top bar */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={onExit}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900"
                  aria-label="Voltar ao Flow Business"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-[#F77737] via-[#E1306C] to-[#833AB4] text-white">
                  <Instagram className="size-4" />
                </div>
              </div>

              {/* Breadcrumb Desktop */}
              <div className="hidden items-center gap-2 lg:flex">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E1306C]">
                  INSTAGRAM
                </span>
                <span className="text-[11px] font-semibold text-slate-300">•</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {activeView === "hunter"
                    ? "PROSPECÇÃO"
                    : activeView === "home"
                      ? "CENTRAL"
                      : activeView === "competitors"
                        ? "INTELIGÊNCIA"
                        : (
                            instagramNavigation.find((group) =>
                              group.items.some((item) => item.id === activeView),
                            )?.label.toUpperCase() ?? "CENTRAL"
                          )}
                </span>
              </div>

              {/* Título e Subtítulo */}
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-[#101828]">
                {activeView === "home"
                  ? "Hoje"
                  : activeView === "competitors"
                    ? "Inteligência"
                    : activeItem.label}
              </h1>
              <p className="hidden text-xs text-[#667085] sm:block">
                {activeView === "home"
                  ? "Prioridades e ações do dia"
                  : activeView === "hunter"
                    ? "Descubra e encontre oportunidades no Instagram"
                    : activeView === "competitors"
                      ? "Monitore, analise e encontre oportunidades estratégicas"
                      : activeItem.description}
              </p>
            </div>

            {/* Ações da Direita */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm sm:flex">
                <span className="size-2 rounded-full bg-[#10B981] shadow-[0_0_0_3px_rgba(16,185,129,0.18)]" />
                Operação ativa
              </div>

              {activeView === "competitors" ? (
                <Button
                  size="sm"
                  className="gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#1D4ED8]"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("instagram-open-add-competitor"));
                  }}
                >
                  <ChartNoAxesColumnIncreasing className="size-3.5" />
                  <span className="hidden sm:inline">Analisar concorrentes</span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-[#1D4ED8]"
                  onClick={() => onViewChange("hunter")}
                >
                  <Crosshair className="size-3.5" />
                  <span className="hidden sm:inline">Caçar clientes</span>
                </Button>
              )}
            </div>
          </div>

          {/* Seletor Mobile */}
          <div className="border-t border-slate-200/60 px-4 py-2 lg:hidden">
            <Select
              value={activeView}
              onValueChange={(value) => isInstagramView(value) && onViewChange(value)}
            >
              <SelectTrigger className="h-10 bg-white border-slate-200 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {instagramNavigation.map((group) =>
                  group.items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {group.label} · {item.label}
                    </SelectItem>
                  )),
                )}
              </SelectContent>
            </Select>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1560px] p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
