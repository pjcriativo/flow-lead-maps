export const ANNUAL_DISCOUNT_PERCENT = 50;

export type PricingPlan = {
  name: string;
  monthly: number;
  blurb: string;
  cta: string;
  popular?: boolean;
  features: string[];
};

export const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  {
    name: "Básico",
    monthly: 147,
    blurb: "Para quem está começando a prospectar.",
    cta: "Começar",
    features: [
      "1.000 leads / mês",
      "Busca no Google Maps",
      "Minhas Listas e Contatos",
      "Pipeline de Vendas Kanban",
      "Suporte padrão",
    ],
  },
  {
    name: "Pro",
    monthly: 297,
    blurb: "O mais completo para escalar suas vendas.",
    cta: "Começar",
    popular: true,
    features: [
      "5.000 leads / mês",
      "Busca (Maps, Instagram, LinkedIn)",
      "CRM, Propostas e Contratos",
      "Controle Financeiro",
      "Campanhas e Automação de Whats",
      "Publicação e Redesign de Sites",
    ],
  },
  {
    name: "Agência",
    monthly: 897,
    blurb: "Para agências e times de alta demanda.",
    cta: "Começar",
    features: [
      "Leads ilimitados",
      "Busca (Maps, Instagram, LinkedIn)",
      "CRM, Propostas e Contratos",
      "Controle Financeiro",
      "Campanhas e Automação de Whats",
      "Publicação e Redesign de Sites",
    ],
  },
];

export function calcularPrecoAnual(precoMensal: number) {
  const centavosMensais = Math.round(precoMensal * 100);
  const centavosComDesconto = Math.round(centavosMensais * (1 - ANNUAL_DISCOUNT_PERCENT / 100));

  return {
    mensalEquivalente: centavosComDesconto / 100,
    totalAnual: (centavosComDesconto * 12) / 100,
  };
}

export function formatarPrecoPlano(valor: number) {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
