import { useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  FileText,
  GitBranch,
  GraduationCap,
  Headphones,
  Home,
  ListChecks,
  Menu,
  MessagesSquare,
  Megaphone,
  Network,
  Plug,
  ScrollText,
  Users,
  WalletCards,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  SiGooglemaps,
  SiInstagram,
  SiLinkedin,
  SiTiktok,
  SiWhatsapp,
  SiYoutube,
} from "react-icons/si";
import type { IconType } from "react-icons";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { cn } from "@/lib/utils";
import type { DashboardSection } from "@/lib/dashboard-navigation";

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  onNavigate: (section: DashboardSection, label: string) => void;
  unreadNotifications: number;
  user: {
    name: string;
    email: string;
    avatarUrl: string;
    initials: string;
  };
}

interface NavigationItem {
  label: string;
  section?: DashboardSection;
  icon?: LucideIcon | IconType;
  iconClassName?: string;
  badge?: string;
  homeActive?: boolean;
  brandMark?: string;
}

interface NavigationGroup {
  label?: string;
  items: NavigationItem[];
}

const NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    items: [
      { label: "Home", section: "home", icon: Home, homeActive: true },
      { label: "Leads", section: "leads", icon: Users },
      { label: "Pipeline", section: "pipeline", icon: GitBranch },
      { label: "Campanhas", section: "campanhas", icon: Megaphone },
      { label: "Conversas", section: "whatsapp", icon: MessagesSquare },
      { label: "Automações", section: "automacao", icon: Workflow },
    ],
  },
  {
    label: "CANAIS DE AQUISIÇÃO",
    items: [
      {
        label: "Google Maps",
        section: "buscar",
        icon: SiGooglemaps,
        iconClassName: "text-home-blue",
      },
      {
        label: "Instagram",
        section: "instagram",
        icon: SiInstagram,
        iconClassName: "text-home-pink",
      },
      { label: "LinkedIn", icon: SiLinkedin, iconClassName: "text-home-blue" },
      { label: "YouTube", icon: SiYoutube, iconClassName: "text-home-red" },
      { label: "TikTok", icon: SiTiktok, iconClassName: "text-home-foreground" },
      {
        label: "WhatsApp",
        section: "whatsapp",
        icon: SiWhatsapp,
        iconClassName: "text-home-green",
      },
      { label: "Business B&B", brandMark: "b&b", badge: "Novo" },
    ],
  },
  {
    label: "GESTÃO",
    items: [
      { label: "Minhas Listas", section: "listas", icon: ListChecks },
      { label: "Propostas", section: "propostas", icon: FileText },
      { label: "Contratos", section: "contratos", icon: ScrollText },
      { label: "Financeiro", section: "financeiro", icon: WalletCards },
    ],
  },
  {
    label: "SISTEMA",
    items: [
      { label: "Integrações", section: "settings", icon: Plug },
      { label: "Notificações", section: "notificacoes", icon: Bell },
      { label: "Suporte", section: "suporte", icon: Headphones },
      { label: "Business Academy", section: "academy", icon: GraduationCap, badge: "EM BREVE" },
      { label: "Business Network", section: "network", icon: Network, badge: "EM BREVE" },
    ],
  },
];

function SidebarNavigation({
  activeSection,
  onNavigate,
  unreadNotifications,
  onClose,
}: Pick<DashboardSidebarProps, "activeSection" | "onNavigate" | "unreadNotifications"> & {
  onClose?: () => void;
}) {
  const openItem = (item: NavigationItem) => {
    if (!item.section) {
      toast.info(`${item.label} estará disponível em breve.`);
      return;
    }
    onNavigate(item.section, item.label);
    onClose?.();
  };

  return (
    <nav aria-label="Navegação principal" className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      {NAVIGATION_GROUPS.map((group, groupIndex) => (
        <div key={group.label ?? "principal"} className={cn(groupIndex > 0 && "mt-5")}>
          {group.label ? (
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-home-muted/80">
              {group.label}
            </p>
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.homeActive
                ? activeSection === "home"
                : item.section !== "home" && activeSection === item.section;
              const notificationCount =
                item.section === "notificacoes" && unreadNotifications > 0
                  ? Math.min(unreadNotifications, 99)
                  : item.section === "notificacoes"
                    ? 3
                    : null;

              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => openItem(item)}
                  className={cn(
                    "group flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
                    active
                      ? "bg-home-orange text-white shadow-[0_0_20px_rgba(255,98,0,0.3)]"
                      : "text-home-foreground/80 hover:bg-home-surface-strong hover:text-home-foreground",
                  )}
                >
                  {item.brandMark ? (
                    <span className="flex size-4.5 items-center justify-center rounded-sm bg-home-orange/20 text-[9px] font-black text-home-orange">
                      {item.brandMark}
                    </span>
                  ) : Icon ? (
                    <Icon
                      aria-hidden="true"
                      className={cn("size-4 shrink-0", active ? "text-white" : item.iconClassName)}
                    />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {notificationCount ? (
                    <span className="flex size-5 items-center justify-center rounded-full bg-home-orange text-[10px] font-bold text-white shadow-[0_0_10px_rgba(255,98,0,0.4)]">
                      {notificationCount}
                    </span>
                  ) : item.badge ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider",
                        item.badge === "Novo"
                          ? "bg-home-orange text-white"
                          : "border border-home-amber/40 bg-home-amber/10 text-home-amber",
                      )}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UserFooter({ user, onNavigate }: Pick<DashboardSidebarProps, "user" | "onNavigate">) {
  const displayName = user.name && user.name !== "Meu Perfil" ? user.name : "Marcos Gonçalves";
  const displayEmail =
    user.email && user.email !== "Configurar perfil" ? user.email : "marcosgflow@gmail.com";
  const avatarSrc =
    user.avatarUrl ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80";

  return (
    <button
      type="button"
      onClick={() => onNavigate("settings", "Meu perfil")}
      className={cn(
        "flex w-full items-center gap-3 border-t border-home-border px-4 py-4 text-left",
        "transition-colors hover:bg-home-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
      )}
    >
      <Avatar className="size-9 border border-home-border">
        <AvatarImage src={avatarSrc} alt={displayName} />
        <AvatarFallback className="bg-home-surface-strong text-xs font-semibold text-home-foreground">
          MG
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-home-foreground">{displayName}</p>
        <p className="truncate text-[10px] text-home-muted">{displayEmail}</p>
      </div>
    </button>
  );
}

export function DashboardSidebar(props: DashboardSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r border-home-border bg-home-background lg:flex">
        <Link to="/" className="flex h-18 shrink-0 items-center px-5" aria-label="Flow Business">
          <FlowLeadsLogo variant="dark" className="h-9 max-w-47" />
        </Link>
        <SidebarNavigation
          activeSection={props.activeSection}
          onNavigate={props.onNavigate}
          unreadNotifications={props.unreadNotifications}
        />
        <UserFooter user={props.user} onNavigate={props.onNavigate} />
      </aside>

      <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-home-border bg-home-background px-4 lg:hidden">
        <FlowLeadsLogo variant="dark" className="h-8 max-w-45" />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-home-border p-2 text-home-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-60 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-home-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(20rem,88vw)] flex-col border-r border-home-border bg-home-background shadow-2xl">
            <div className="flex h-16 items-center justify-between px-5">
              <FlowLeadsLogo variant="dark" className="h-8 max-w-45" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-home-muted hover:bg-home-surface hover:text-home-foreground"
                aria-label="Fechar menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNavigation
              activeSection={props.activeSection}
              onNavigate={props.onNavigate}
              unreadNotifications={props.unreadNotifications}
              onClose={() => setMobileOpen(false)}
            />
            <UserFooter user={props.user} onNavigate={props.onNavigate} />
          </aside>
        </div>
      ) : null}
    </>
  );
}
