import { Bell, Calendar, Command, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MarketingTopBarProps {
  user: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  onSearchChange?: (term: string) => void;
}

export function MarketingTopBar({
  user,
  unreadNotifications = 1,
  onSearchChange,
}: MarketingTopBarProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-home-border/60 bg-[#0c0f14]/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
      {/* Barra de Busca Global */}
      <div className="relative w-full max-w-xl">
        <label className="relative flex items-center w-full">
          <span className="sr-only">Buscar produtos, campanhas, leads, conteúdos</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
          <input
            type="search"
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Buscar produtos, campanhas, leads, conteúdos..."
            className="h-9.5 w-full rounded-xl border border-home-border/80 bg-[#12161f] pl-10 pr-20 text-xs text-home-foreground placeholder:text-home-muted/80 outline-none transition-colors focus:border-home-orange focus:ring-1 focus:ring-home-orange/30"
          />
          <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-home-border/60 bg-home-surface px-1.5 py-0.5 text-[10px] font-medium text-home-muted">
            <Command className="size-2.5" /> K
          </span>
        </label>
      </div>

      {/* Ações da Topbar Direita */}
      <div className="flex items-center gap-3">
        {/* Date Range Picker */}
        <div className="hidden md:flex h-9.5 items-center gap-2 rounded-xl border border-home-border/80 bg-[#12161f] px-3.5 text-xs text-home-foreground/90 font-medium">
          <Calendar className="size-3.5 text-home-muted" />
          <span>01 de Ago, 2024 - 31 de Ago, 2024</span>
        </div>

        {/* Notificações */}
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex size-9.5 items-center justify-center rounded-xl border border-home-border/80 bg-[#12161f] text-home-muted transition-colors hover:text-white hover:border-home-border cursor-pointer"
        >
          <Bell className="size-4" />
          {unreadNotifications > 0 ? (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#ff6200] text-[10px] font-bold text-white shadow-[0_0_8px_rgba(255,98,0,0.6)]">
              {unreadNotifications}
            </span>
          ) : null}
        </button>

        {/* Perfil do Usuário */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="relative">
            <Avatar className="size-9 border border-home-border/80 bg-[#1b202c]">
              <AvatarImage
                src={
                  user.avatarUrl ||
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                }
                alt={user.name}
              />
              <AvatarFallback className="bg-[#1b202c] text-xs font-semibold text-white">
                {user.initials || "CM"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[#0c0f14] bg-emerald-500" />
          </div>

          <div className="hidden sm:flex flex-col text-left leading-tight">
            <span className="text-xs font-semibold text-white truncate max-w-[140px]">
              {user.name || "Carlos Mendes"}
            </span>
            <span className="text-[10px] text-home-muted truncate max-w-[140px]">
              Minha Organização
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
