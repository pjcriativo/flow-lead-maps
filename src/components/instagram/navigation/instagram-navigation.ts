import type { LucideIcon } from "lucide-react";
import {
  Crosshair,
  Eye,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Users,
  Workflow,
} from "lucide-react";

export type InstagramView =
  | "home"
  | "crm"
  | "cadences"
  | "hunter"
  | "discover"
  | "comments"
  | "radar"
  | "competitors"
  | "leads"
  | "campaigns"
  | "accounts"
  | "inbox"
  | "overview";

export type NavigationItem = {
  id: InstagramView;
  label: string;
  description: string;
  Icon: LucideIcon;
};

export type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const instagramNavigation: NavigationGroup[] = [
  {
    label: "Central",
    items: [
      {
        id: "home",
        label: "Visão Geral",
        description: "Prioridades e ações do dia",
        Icon: LayoutDashboard,
      },
      {
        id: "hunter",
        label: "Prospecção",
        description: "Descubra e encontre clientes",
        Icon: Crosshair,
      },
      {
        id: "competitors",
        label: "Inteligência",
        description: "Análise e insights",
        Icon: Eye,
      },
      {
        id: "crm",
        label: "Leads & CRM",
        description: "Gerencie seus contatos",
        Icon: Users,
      },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        id: "cadences",
        label: "Automações",
        description: "Cadências e follow-up",
        Icon: Workflow,
      },
      {
        id: "inbox",
        label: "Conversas",
        description: "Mensagens e interações",
        Icon: MessagesSquare,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        id: "accounts",
        label: "Configurações",
        description: "Contas, limites e preferências",
        Icon: Settings,
      },
    ],
  },
];

export const instagramNavigationItems = instagramNavigation.flatMap((group) => group.items);

export const allInstagramViews: readonly InstagramView[] = [
  "home",
  "crm",
  "cadences",
  "hunter",
  "discover",
  "comments",
  "radar",
  "competitors",
  "leads",
  "campaigns",
  "accounts",
  "inbox",
  "overview",
] as const;

export function isInstagramView(value: string): value is InstagramView {
  return (allInstagramViews as readonly string[]).includes(value);
}
