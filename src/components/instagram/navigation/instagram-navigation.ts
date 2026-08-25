import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BriefcaseBusiness,
  Crosshair,
  Eye,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  MessageCircleMore,
  PlugZap,
  Radar,
  Route,
  Search,
  Users,
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

type NavigationItem = {
  id: InstagramView;
  label: string;
  description: string;
  Icon: LucideIcon;
};

type NavigationGroup = {
  label: string;
  items: NavigationItem[];
};

export const instagramNavigation: NavigationGroup[] = [
  {
    label: "Central",
    items: [
      {
        id: "home",
        label: "Hoje",
        description: "Prioridades e ações do dia",
        Icon: LayoutDashboard,
      },
      {
        id: "crm",
        label: "CRM de oportunidades",
        description: "Do perfil encontrado ao cliente",
        Icon: BriefcaseBusiness,
      },
      {
        id: "cadences",
        label: "Cadências",
        description: "Aquecimento e follow-up assistido",
        Icon: Route,
      },
      {
        id: "hunter",
        label: "Caça-clientes",
        description: "Encontre a próxima oportunidade",
        Icon: Crosshair,
      },
    ],
  },
  {
    label: "Descoberta",
    items: [
      {
        id: "discover",
        label: "Busca por nicho",
        description: "Perfis alinhados ao seu ICP",
        Icon: Search,
      },
      {
        id: "comments",
        label: "Comentários",
        description: "Intenção em conversas públicas",
        Icon: MessageCircleMore,
      },
      {
        id: "radar",
        label: "Radar de conteúdo",
        description: "Posts que concentram demanda",
        Icon: Radar,
      },
      {
        id: "competitors",
        label: "Concorrentes",
        description: "Monitore perfis estratégicos",
        Icon: Eye,
      },
    ],
  },
  {
    label: "Operação",
    items: [
      {
        id: "leads",
        label: "Meus perfis",
        description: "Base qualificada e sem repetição",
        Icon: Users,
      },
      {
        id: "campaigns",
        label: "Campanhas",
        description: "Fila de abordagem assistida",
        Icon: Megaphone,
      },
      {
        id: "accounts",
        label: "Contas conectadas",
        description: "Instagram profissional e permissões",
        Icon: PlugZap,
      },
      {
        id: "inbox",
        label: "Conversas",
        description: "Acompanhe respostas e avanços",
        Icon: MessageCircle,
      },
    ],
  },
  {
    label: "Inteligência",
    items: [
      {
        id: "overview",
        label: "Desempenho",
        description: "Conversão, qualidade e tendências",
        Icon: BarChart3,
      },
    ],
  },
];

export const instagramNavigationItems = instagramNavigation.flatMap((group) => group.items);

export function isInstagramView(value: string): value is InstagramView {
  return instagramNavigationItems.some((item) => item.id === value);
}
