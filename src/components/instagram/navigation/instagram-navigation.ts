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
        description: "Encontre a próxima oportunidade",
        Icon: Crosshair,
      },
      {
        id: "competitors",
        label: "Inteligência",
        description: "Monitore perfis estratégicos",
        Icon: Eye,
      },
      {
        id: "crm",
        label: "Leads & CRM",
        description: "Do perfil encontrado ao cliente",
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
        description: "Aquecimento e follow-up assistido",
        Icon: Workflow,
      },
      {
        id: "inbox",
        label: "Conversas",
        description: "Acompanhe respostas e avanços",
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
        description: "Instagram profissional e permissões",
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
