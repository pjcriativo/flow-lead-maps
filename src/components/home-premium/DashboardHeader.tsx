import { Bell, CalendarDays, ChevronDown, Command, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardHeaderProps {
  user: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications: number;
}

export function DashboardHeader({ user, unreadNotifications }: DashboardHeaderProps) {
  return (
    <header className="flex min-h-15 items-center justify-between gap-4 border-b border-home-border bg-home-background px-4 sm:px-6 lg:px-7">
      <label className="relative hidden w-full max-w-117 sm:block">
        <span className="sr-only">Buscar leads, empresas e contatos</span>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
        <input
          type="search"
          placeholder="Buscar leads, empresas, contatos..."
          className="h-9 w-full rounded-xl border border-home-border bg-home-surface pl-10 pr-18 text-xs text-home-foreground outline-none placeholder:text-home-muted focus:border-home-blue focus:ring-2 focus:ring-home-blue/20"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-home-border bg-home-surface-strong px-2 py-0.5 text-[10px] text-home-muted">
          <Command className="size-3" /> K
        </span>
      </label>

      <div className="ml-auto flex items-center gap-2.5">
        <button
          type="button"
          className="hidden h-9 items-center gap-2 rounded-xl border border-home-border bg-home-surface px-3.5 text-xs font-semibold text-home-foreground transition-colors hover:bg-home-surface-strong sm:flex"
        >
          <CalendarDays className="size-4 text-home-muted" />
          Últimos 30 dias
          <ChevronDown className="size-3.5 text-home-muted" />
        </button>
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex size-9 items-center justify-center rounded-xl border border-home-border bg-home-surface text-home-muted transition-colors hover:text-home-foreground"
        >
          <Bell className="size-4.5" />
          {unreadNotifications > 0 ? (
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full border border-home-background bg-home-red" />
          ) : null}
        </button>
        <Avatar className="size-9 border border-home-amber/40 bg-[#1e1509]">
          <AvatarImage src={user.avatarUrl} alt={user.name} />
          <AvatarFallback className="bg-[#1e1509] text-[11px] font-bold text-home-amber">
            {user.initials || "MG"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
