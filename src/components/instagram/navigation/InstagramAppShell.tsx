import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight, Instagram, ShieldCheck, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-muted/35 lg:flex">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <div className="border-b border-sidebar-border px-5 py-5">
          <button
            type="button"
            onClick={onExit}
            className="mb-5 inline-flex items-center gap-2 text-xs font-medium text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Voltar ao Flow Leads
          </button>
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(145deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))] text-white shadow-lg shadow-instagram-pink/15">
              <Instagram className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight">Flow Instagram</span>
                <span className="rounded-full border border-sidebar-border bg-sidebar-accent px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sidebar-foreground/70">
                  Pro
                </span>
              </div>
              <p className="mt-0.5 text-xs text-sidebar-foreground/50">Client acquisition OS</p>
            </div>
          </div>
        </div>

        <nav
          className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
          aria-label="Módulos do Flow Instagram"
        >
          {instagramNavigation.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/35">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onViewChange(item.id)}
                    aria-current={activeView === item.id ? "page" : undefined}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      activeView === item.id
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                        activeView === item.id
                          ? "border-instagram-pink/25 bg-instagram-pink/10 text-instagram-pink"
                          : "border-sidebar-border bg-sidebar-accent/50 text-sidebar-foreground/55 group-hover:text-sidebar-foreground",
                      )}
                    >
                      <item.Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="block truncate text-[10px] text-sidebar-foreground/40">
                        {item.description}
                      </span>
                    </span>
                    {activeView === item.id ? (
                      <ChevronRight className="size-3.5 text-instagram-pink" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-3.5">
            <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground">
              <ShieldCheck className="size-4 text-success" />
              Base protegida
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-sidebar-foreground/45">
              Leads já encontrados são reaproveitados para reduzir custo e evitar duplicidade.
            </p>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl">
          <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="min-w-0">
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  type="button"
                  onClick={onExit}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground"
                  aria-label="Voltar ao Flow Leads"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[linear-gradient(145deg,var(--instagram-orange),var(--instagram-pink),var(--instagram-purple))] text-white">
                  <Instagram className="size-4" />
                </div>
              </div>
              <div className="hidden items-center gap-2 lg:flex">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-instagram-pink">
                  Flow Instagram
                </span>
                <span className="size-1 rounded-full bg-muted-foreground/30" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {
                    instagramNavigation.find((group) =>
                      group.items.some((item) => item.id === activeView),
                    )?.label
                  }
                </span>
              </div>
              <h1 className="mt-1 truncate text-lg font-semibold tracking-tight sm:text-xl">
                {activeItem.label}
              </h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                {activeItem.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
                <span className="size-2 rounded-full bg-success shadow-[0_0_0_4px_color-mix(in_oklab,var(--success)_12%,transparent)]" />
                Operação ativa
              </div>
              {activeView !== "hunter" ? (
                <Button size="sm" onClick={() => onViewChange("hunter")}>
                  <Sparkles className="size-4" />
                  <span className="hidden sm:inline">Caçar clientes</span>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="border-t border-border/60 px-4 py-2 lg:hidden">
            <Select
              value={activeView}
              onValueChange={(value) => isInstagramView(value) && onViewChange(value)}
            >
              <SelectTrigger className="h-10 bg-card">
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

        <main className="mx-auto w-full max-w-[1560px] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
