import { Bell, ChevronDown, Command, Moon, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileAccessMenu } from "@/components/perfil/ProfileAccessMenu";

interface GoogleMapsTopbarProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    initials?: string;
    role?: string;
  };
  unreadNotifications?: number;
  isSuperAdmin?: boolean;
  onOpenProfile?: () => void;
}

export function GoogleMapsTopbar({
  user = {},
  unreadNotifications = 3,
  isSuperAdmin = false,
  onOpenProfile,
}: GoogleMapsTopbarProps) {
  const name = user.name || "Marcos Gonçalves";
  const avatarUrl = user.avatarUrl || "";
  const initials = user.initials || "MG";
  const role = user.role || "Administrador";
  return (
    <header className="flex min-h-15 items-center justify-between gap-4 border-b border-home-border bg-home-background px-4 sm:px-6 lg:px-8 select-none">
      {/* Busca Global */}
      <label className="relative hidden w-full max-w-xl sm:block">
        <span className="sr-only">Buscar no sistema</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
        <input
          type="search"
          placeholder="Buscar no sistema..."
          className="h-9.5 w-full rounded-xl border border-home-border bg-home-surface pl-10 pr-18 text-xs text-home-foreground outline-none placeholder:text-home-muted focus:border-home-orange focus:ring-1 focus:ring-home-orange/30 transition-colors"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-home-border bg-home-surface-strong px-2 py-0.5 text-[10px] text-home-muted font-mono">
          <Command className="size-3" /> K
        </span>
      </label>

      {/* Lado Direito: Notificações + Dark Mode + Perfil */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notificações */}
        <button
          type="button"
          aria-label="Notificações"
          className="relative flex size-9 items-center justify-center rounded-xl border border-home-border bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
        >
          <Bell className="size-4.5" />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-home-orange text-[10px] font-bold text-white shadow-sm">
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </button>

        {/* Modo Noturno / Alternador de Tema */}
        <button
          type="button"
          aria-label="Alternar tema"
          className="flex size-9 items-center justify-center rounded-xl border border-home-border bg-home-surface text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white"
        >
          <Moon className="size-4.5" />
        </button>

        {/* Perfil do Usuário */}
        <ProfileAccessMenu
          isSuperAdmin={isSuperAdmin}
          onOpenClientAccount={() => onOpenProfile?.()}
        >
          <button
            type="button"
            aria-label="Abrir opções da conta"
            className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-home-border/80 bg-home-surface/90 px-2.5 py-1.5 transition-colors hover:bg-home-surface-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange"
          >
            <Avatar className="size-8.5 border border-home-orange/40 bg-home-orange/10">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="bg-home-orange/10 text-[11px] font-bold text-home-orange">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="hidden flex-col text-left leading-tight sm:flex">
              <span className="line-clamp-1 text-xs font-bold text-home-foreground">{name}</span>
              <span className="text-[10px] font-medium text-home-muted">{role}</span>
            </div>
            <ChevronDown className="hidden size-3.5 text-home-muted sm:block" aria-hidden="true" />
          </button>
        </ProfileAccessMenu>
      </div>
    </header>
  );
}
