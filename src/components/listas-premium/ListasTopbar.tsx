// Topbar Exclusiva da Central de Listas Premium
import { ArrowLeft, Bell, Command, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ListasTopbarProps {
  user: {
    name: string;
    avatarUrl: string;
    initials: string;
    plan?: string;
  };
  unreadNotifications: number;
  onBack?: () => void;
  onSearchGlobal?: (query: string) => void;
}

export function ListasTopbar({
  user,
  unreadNotifications = 0,
  onBack,
  onSearchGlobal,
}: ListasTopbarProps) {
  return (
    <header className="flex min-h-15 items-center justify-between gap-4 border-b border-home-border bg-home-background px-4 sm:px-6 lg:px-7 select-none">
      {/* Lado Esquerdo: Botão Voltar + Breadcrumb */}
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            title="Voltar"
            className="flex size-8 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted hover:bg-home-surface-strong hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-home-muted font-medium">Gestão</span>
          <span className="text-home-muted/60">/</span>
          <span className="text-white font-semibold">Minhas Listas</span>
        </div>
      </div>

      {/* Centro: Campo Global de Busca com Atalho ⌘ K */}
      <label className="relative hidden w-full max-w-xl sm:block">
        <span className="sr-only">Buscar listas, leads, campanhas, empresas</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
        <input
          type="search"
          placeholder="Buscar listas, leads, campanhas, empresas..."
          onChange={(e) => onSearchGlobal?.(e.target.value)}
          className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface pl-10 pr-16 text-xs text-white outline-none placeholder:text-home-muted focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-colors"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-home-border bg-home-surface-strong px-2 py-0.5 text-[10px] text-home-muted font-mono">
          <Command className="size-3" /> K
        </span>
      </label>

      {/* Lado Direito: Notificações + Perfil do Usuário com Plano */}
      <div className="flex items-center gap-3">
        {/* Botão de Notificações */}
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex size-9 items-center justify-center rounded-xl border border-home-border bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
        >
          <Bell className="size-4.5" />
          {unreadNotifications > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          ) : null}
        </button>

        {/* Card do Usuário */}
        <div className="flex items-center gap-2.5 rounded-xl border border-home-border/80 bg-home-surface/90 px-2.5 py-1.5 transition-colors">
          <Avatar className="size-8 border border-amber-500/40 bg-[#1e1509]">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="bg-[#1e1509] text-[11px] font-bold text-amber-500">
              {user.initials || "US"}
            </AvatarFallback>
          </Avatar>

          <div className="hidden flex-col text-left sm:flex leading-tight">
            <span className="text-xs font-bold text-white line-clamp-1">
              {user.name || "João Silva"}
            </span>
            <span className="text-[10px] font-medium text-amber-400">
              {user.plan || "Plano Pro"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
