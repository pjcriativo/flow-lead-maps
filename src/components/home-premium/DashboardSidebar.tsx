import { useEffect, useState, type ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  BrainCircuit,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  FileText,
  Filter,
  GitBranch,
  GraduationCap,
  Headphones,
  Home,
  Layers,
  ListChecks,
  Menu,
  MessagesSquare,
  Megaphone,
  Network,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  ScrollText,
  Share2,
  Sliders,
  Sparkles,
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

export type CampanhasSubView = "central" | "gestao" | "resultados";

export type MarketingSubView =
  | "produtos"
  | "agentes"
  | "campanhas_conteudo"
  | "calendario"
  | "resultados_roi";

interface DashboardSidebarProps {
  activeSection: DashboardSection;
  campanhasSubView?: CampanhasSubView;
  marketingSubView?: MarketingSubView;
  onNavigate: (section: DashboardSection, label: string) => void;
  onNavigateCampanhasSub?: (subView: CampanhasSubView) => void;
  onNavigateMarketingSub?: (subView: MarketingSubView) => void;
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
      { label: "Leads", section: "leads", icon: Share2 },
      { label: "Pipeline", section: "pipeline", icon: Filter },
      { label: "Campanhas", section: "campanhas", icon: Megaphone },
      { label: "Flow Marketing AI", section: "marketing", icon: Sparkles, badge: "Em breve" },
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

const CAMPANHAS_SUBITEMS = [
  { id: "central" as const, label: "Central de Campanhas", icon: Layers },
  { id: "gestao" as const, label: "Gestão e Produção", icon: Sliders },
  { id: "resultados" as const, label: "Resultados e Métricas", icon: BarChart3 },
];

export const MARKETING_SUBITEMS = [
  { id: "produtos" as const, label: "Produtos e Serviços", icon: Package, ready: true },
  { id: "agentes" as const, label: "Agentes e Estratégias", icon: BrainCircuit, ready: false },
  { id: "campanhas_conteudo" as const, label: "Campanhas e Conteúdos", icon: Megaphone, ready: false },
  { id: "calendario" as const, label: "Calendário e Publicações", icon: CalendarDays, ready: false },
  { id: "resultados_roi" as const, label: "Resultados e ROI", icon: ChartNoAxesCombined, ready: false },
];

function SidebarNavigation({
  activeSection,
  campanhasSubView = "central",
  marketingSubView = "produtos",
  onNavigate,
  onNavigateCampanhasSub,
  onNavigateMarketingSub,
  unreadNotifications,
  isCollapsed = false,
  onClose,
}: Pick<
  DashboardSidebarProps,
  | "activeSection"
  | "campanhasSubView"
  | "marketingSubView"
  | "onNavigate"
  | "onNavigateCampanhasSub"
  | "onNavigateMarketingSub"
  | "unreadNotifications"
> & {
  isCollapsed?: boolean;
  onClose?: () => void;
}) {
  const [isCampanhasExpanded, setIsCampanhasExpanded] = useState<boolean>(
    activeSection === "campanhas",
  );
  const [isMarketingExpanded, setIsMarketingExpanded] = useState<boolean>(
    activeSection === "marketing",
  );

  // Mantém o grupo Campanhas expandido enquanto ativo
  useEffect(() => {
    if (activeSection === "campanhas") {
      setIsCampanhasExpanded(true);
    }
  }, [activeSection]);

  // Mantém o grupo Flow Marketing AI expandido enquanto ativo (Regra Etapa 2)
  useEffect(() => {
    if (activeSection === "marketing") {
      setIsMarketingExpanded(true);
    }
  }, [activeSection]);

  const openItem = (item: NavigationItem) => {
    if (!item.section) {
      toast.info(`${item.label} estará disponível em breve.`);
      return;
    }
    onNavigate(item.section, item.label);
    if (item.section === "campanhas") {
      setIsCampanhasExpanded(true);
      onNavigateCampanhasSub?.("central");
    }
    if (item.section === "marketing") {
      setIsMarketingExpanded(true);
      onNavigateMarketingSub?.("produtos");
    }
    onClose?.();
  };

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "min-h-0 flex-1 overflow-y-auto scrollbar-none pb-4",
        isCollapsed ? "px-2" : "px-3",
      )}
    >
      {NAVIGATION_GROUPS.map((group, groupIndex) => (
        <div key={group.label ?? "principal"} className={cn(groupIndex > 0 && (isCollapsed ? "mt-3" : "mt-5"))}>
          {group.label ? (
            isCollapsed ? (
              <div className="my-2.5 mx-1 border-t border-home-border/40" />
            ) : (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-home-muted/80">
                {group.label}
              </p>
            )
          ) : null}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const isCampanhas = item.section === "campanhas";
              const isCampanhasGroupActive = activeSection === "campanhas";
              const isMarketing = item.section === "marketing";
              const isMarketingGroupActive = activeSection === "marketing";
              const active = item.homeActive
                ? activeSection === "home"
                : item.section !== "home" && activeSection === item.section;
              const notificationCount =
                item.section === "notificacoes" && unreadNotifications > 0
                  ? Math.min(unreadNotifications, 99)
                  : item.section === "notificacoes"
                    ? 3
                    : null;

              // Renderização Especial com Submenu Expansível para o Módulo Campanhas
              if (isCampanhas) {
                if (isCollapsed) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      aria-current={isCampanhasGroupActive ? "page" : undefined}
                      title="Campanhas"
                      onClick={() => {
                        onNavigate("campanhas", "Campanhas");
                        onNavigateCampanhasSub?.("central");
                        onClose?.();
                      }}
                      className={cn(
                        "group relative flex h-9 w-full items-center justify-center rounded-lg text-left transition-colors cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
                        isCampanhasGroupActive
                          ? "bg-home-orange text-white shadow-[0_0_20px_rgba(255,98,0,0.3)]"
                          : "text-home-foreground/80 hover:bg-home-surface-strong hover:text-home-foreground",
                      )}
                    >
                      <Megaphone
                        aria-hidden="true"
                        className={cn(
                          "size-4.5 shrink-0 transition-colors",
                          isCampanhasGroupActive ? "text-white" : item.iconClassName,
                        )}
                      />
                    </button>
                  );
                }

                return (
                  <div key={item.label} className="space-y-0.5">
                    <button
                      type="button"
                      aria-current={isCampanhasGroupActive ? "page" : undefined}
                      onClick={() => {
                        if (!isCampanhasGroupActive) {
                          onNavigate("campanhas", "Campanhas");
                          onNavigateCampanhasSub?.("central");
                          setIsCampanhasExpanded(true);
                        } else {
                          setIsCampanhasExpanded((prev) => !prev);
                        }
                      }}
                      className={cn(
                        "group flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition-colors cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
                        isCampanhasGroupActive
                          ? "bg-home-surface-strong/90 text-white font-semibold border border-home-border/80"
                          : "text-home-foreground/80 hover:bg-home-surface-strong hover:text-home-foreground",
                      )}
                    >
                      <Megaphone
                        aria-hidden="true"
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isCampanhasGroupActive ? "text-home-orange" : item.iconClassName,
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 text-home-muted transition-transform duration-200",
                          !isCampanhasExpanded && "-rotate-90",
                        )}
                      />
                    </button>

                    {/* Submenu de Campanhas (Central, Gestão e Produção, Resultados e Métricas) */}
                    {isCampanhasExpanded && (
                      <div className="ml-3.5 mt-0.5 space-y-0.5 border-l border-home-border/60 pl-2 py-0.5">
                        {CAMPANHAS_SUBITEMS.map((sub) => {
                          const isSubActive =
                            isCampanhasGroupActive && (campanhasSubView || "central") === sub.id;
                          const SubIcon = sub.icon;

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onNavigate("campanhas", sub.label);
                                onNavigateCampanhasSub?.(sub.id);
                                onClose?.();
                              }}
                              className={cn(
                                "group flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium transition-all duration-150 cursor-pointer",
                                isSubActive
                                  ? "bg-home-orange text-white font-bold shadow-[0_0_15px_rgba(255,98,0,0.35)]"
                                  : "text-home-muted hover:bg-home-surface-strong hover:text-white",
                              )}
                            >
                              <SubIcon
                                className={cn(
                                  "size-3.5 shrink-0 transition-colors",
                                  isSubActive ? "text-white" : "text-home-muted group-hover:text-white",
                                )}
                              />
                              <span className="truncate">{sub.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Renderização Especial com Submenu Expansível para o Módulo Flow Marketing AI
              if (isMarketing) {
                if (isCollapsed) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      aria-current={isMarketingGroupActive ? "page" : undefined}
                      title="Flow Marketing AI"
                      onClick={() => {
                        onNavigate("marketing", "Flow Marketing AI");
                        onNavigateMarketingSub?.("produtos");
                        onClose?.();
                      }}
                      className={cn(
                        "group relative flex h-9 w-full items-center justify-center rounded-lg text-left transition-colors cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
                        isMarketingGroupActive
                          ? "bg-home-orange text-white shadow-[0_0_20px_rgba(255,98,0,0.3)]"
                          : "text-home-foreground/80 hover:bg-home-surface-strong hover:text-home-foreground",
                      )}
                    >
                      <Sparkles
                        aria-hidden="true"
                        className={cn(
                          "size-4.5 shrink-0 transition-colors",
                          isMarketingGroupActive ? "text-white" : item.iconClassName,
                        )}
                      />
                    </button>
                  );
                }

                return (
                  <div key={item.label} className="space-y-0.5">
                    <button
                      type="button"
                      aria-current={isMarketingGroupActive ? "page" : undefined}
                      onClick={() => {
                        if (!isMarketingGroupActive) {
                          onNavigate("marketing", "Flow Marketing AI");
                          onNavigateMarketingSub?.("produtos");
                          setIsMarketingExpanded(true);
                        } else {
                          setIsMarketingExpanded((prev) => !prev);
                        }
                      }}
                      className={cn(
                        "group flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition-colors cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
                        isMarketingGroupActive
                          ? "bg-home-orange text-white font-semibold shadow-[0_0_20px_rgba(255,98,0,0.3)]"
                          : "text-home-foreground/80 hover:bg-home-surface-strong hover:text-home-foreground",
                      )}
                    >
                      <Sparkles
                        aria-hidden="true"
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isMarketingGroupActive ? "text-white" : item.iconClassName,
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                          isMarketingGroupActive
                            ? "bg-black/30 text-white/95 border border-white/20"
                            : "bg-home-orange/15 text-home-orange border border-home-orange/30",
                        )}
                      >
                        Em breve
                      </span>
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform duration-200 ml-0.5",
                          isMarketingGroupActive ? "text-white/80" : "text-home-muted",
                          !isMarketingExpanded && "-rotate-90",
                        )}
                      />
                    </button>

                    {/* Submenu de Flow Marketing AI (Produtos, Agentes, Campanhas, Calendário, Resultados) */}
                    {isMarketingExpanded && (
                      <div className="ml-3.5 mt-0.5 space-y-0.5 border-l border-home-border/60 pl-2 py-0.5">
                        {MARKETING_SUBITEMS.map((sub) => {
                          const isSubActive =
                            isMarketingGroupActive && (marketingSubView || "produtos") === sub.id;
                          const SubIcon = sub.icon;

                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (sub.ready) {
                                  onNavigate("marketing", sub.label);
                                  onNavigateMarketingSub?.(sub.id);
                                  onClose?.();
                                } else {
                                  toast.info(
                                    `${sub.label} estará disponível em breve nas próximas etapas do Flow Marketing AI.`,
                                  );
                                }
                              }}
                              className={cn(
                                "group flex h-8 w-full items-center gap-2 rounded-lg px-2.5 text-left text-xs font-medium transition-all duration-150 cursor-pointer",
                                isSubActive
                                  ? "bg-home-surface-strong text-white font-bold border border-home-border/80 shadow-sm"
                                  : "text-home-muted hover:bg-home-surface-strong hover:text-white",
                              )}
                            >
                              <SubIcon
                                className={cn(
                                  "size-3.5 shrink-0 transition-colors",
                                  isSubActive ? "text-home-orange" : "text-home-muted group-hover:text-white",
                                )}
                              />
                              <span className="truncate flex-1">{sub.label}</span>
                              {!sub.ready && (
                                <span className="text-[9px] font-medium text-home-muted/70 group-hover:text-home-muted">
                                  Em breve
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              if (isCollapsed) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                    onClick={() => openItem(item)}
                    className={cn(
                      "group relative flex h-9 w-full items-center justify-center rounded-lg text-left transition-colors cursor-pointer",
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
                        className={cn("size-4.5 shrink-0", active ? "text-white" : item.iconClassName)}
                      />
                    ) : null}
                    {notificationCount ? (
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-home-orange ring-2 ring-home-background" />
                    ) : item.badge ? (
                      <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-home-amber ring-2 ring-home-background" />
                    ) : null}
                  </button>
                );
              }

              return (
                <button
                  key={item.label}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => openItem(item)}
                  className={cn(
                    "group flex h-9 w-full items-center gap-3 rounded-lg px-3 text-left text-[13px] font-medium transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange",
                    active
                      ? "bg-home-orange text-white shadow-[0_0_20px_rgba(255,98,0,0.3)]"
                      : "text-home-foreground/80 hover:bg-home-surface-strong hover:text-home-foreground",
                  )}
                >
                  {item.brandMark ? (
                    <span className="flex size-4.5 items-center justify-center rounded-sm bg-home-orange/20 text-[9px] font-black text-home-orange shrink-0">
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
                    <span className="shrink-0 flex size-5 items-center justify-center rounded-full bg-home-orange text-[10px] font-bold text-white shadow-[0_0_10px_rgba(255,98,0,0.4)]">
                      {notificationCount}
                    </span>
                  ) : item.badge ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider",
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

function UserFooter({
  user,
  onNavigate,
  isCollapsed = false,
}: Pick<DashboardSidebarProps, "user" | "onNavigate"> & { isCollapsed?: boolean }) {
  const displayName = user.name && user.name !== "Meu Perfil" ? user.name : "Marcos Gonçalves";
  const displayEmail =
    user.email && user.email !== "Configurar perfil" ? user.email : "marcosgflow@gmail.com";
  const avatarSrc =
    user.avatarUrl ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80";

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => onNavigate("settings", "Meu perfil")}
        title={`${displayName} (${displayEmail})`}
        className={cn(
          "flex w-full items-center justify-center border-t border-home-border/60 py-3 text-center",
          "transition-colors hover:bg-home-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange cursor-pointer",
        )}
      >
        <Avatar className="size-8.5 border border-home-border shrink-0">
          <AvatarImage src={avatarSrc} alt={displayName} />
          <AvatarFallback className="bg-home-surface-strong text-xs font-semibold text-home-foreground">
            MG
          </AvatarFallback>
        </Avatar>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onNavigate("settings", "Meu perfil")}
      className={cn(
        "flex w-full items-center gap-3 border-t border-home-border/60 px-4 py-3.5 text-left",
        "transition-colors hover:bg-home-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-home-orange cursor-pointer",
      )}
    >
      <Avatar className="size-9 border border-home-border shrink-0">
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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("flow_sidebar_collapsed") === "true";
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("flow_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-home-border bg-home-background transition-[width] duration-200 ease-in-out lg:flex",
          isCollapsed ? "w-[72px]" : "w-[272px]",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center px-4",
            isCollapsed ? "justify-center px-2" : "justify-between",
          )}
        >
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="group flex size-9 items-center justify-center rounded-xl border border-home-border/60 bg-home-surface/60 text-home-foreground transition-all hover:border-home-orange/40 hover:bg-home-surface-strong hover:text-white cursor-pointer"
              title="Expandir menu lateral"
              aria-label="Expandir menu lateral"
            >
              <PanelLeftOpen className="size-5 text-home-muted group-hover:text-home-orange transition-colors" />
            </button>
          ) : (
            <>
              <Link to="/" className="flex items-center min-w-0" aria-label="Flow Business">
                <FlowLeadsLogo variant="dark" className="h-8 max-w-45" />
              </Link>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="flex size-8 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface-strong hover:text-white cursor-pointer"
                title="Recolher menu lateral"
                aria-label="Recolher menu lateral"
              >
                <PanelLeftClose className="size-4.5" />
              </button>
            </>
          )}
        </div>
        <SidebarNavigation
          activeSection={props.activeSection}
          campanhasSubView={props.campanhasSubView}
          marketingSubView={props.marketingSubView}
          onNavigate={props.onNavigate}
          onNavigateCampanhasSub={props.onNavigateCampanhasSub}
          onNavigateMarketingSub={props.onNavigateMarketingSub}
          unreadNotifications={props.unreadNotifications}
          isCollapsed={isCollapsed}
        />
        <UserFooter user={props.user} onNavigate={props.onNavigate} isCollapsed={isCollapsed} />
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
              campanhasSubView={props.campanhasSubView}
              marketingSubView={props.marketingSubView}
              onNavigate={props.onNavigate}
              onNavigateCampanhasSub={props.onNavigateCampanhasSub}
              onNavigateMarketingSub={props.onNavigateMarketingSub}
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
