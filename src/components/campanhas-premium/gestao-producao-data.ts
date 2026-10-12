export type GestaoLeadStatus =
  | "aprovado"
  | "rascunho"
  | "em_geracao"
  | "pendente"
  | "sem_motivo"
  | "enviado"
  | "descartado"
  | "erro";

export interface GestaoLeadItem {
  id: string;
  leadId: string;
  name: string;
  niche: string;
  city: string;
  uf: string;
  status: GestaoLeadStatus;
  hasWebsite: boolean;
  siteUrl?: string;
  redesignId?: string;
  propostaId?: string;
  propostaAssunto?: string;
  propostaCorpo?: string;
  hasSite: boolean;
  hasProposal: boolean;
  htmlGerado?: string;
}

export const MOCK_GESTAO_LEADS: GestaoLeadItem[] = [
  {
    id: "cl-1",
    leadId: "lead-1",
    name: "Bistrô da Vila",
    niche: "Restaurante",
    city: "São Paulo",
    uf: "SP",
    status: "aprovado",
    hasWebsite: true,
    siteUrl: "https://bistrodavila.flowgenius.com.br",
    hasSite: true,
    hasProposal: true,
    propostaAssunto: "Idéia para destacar o Bistrô da Vila no Google e atrair mais clientes",
    propostaCorpo: `Olá,\n\nTudo bem?\n\nAnalisei o site do Bistrô da Vila e identifiquei algumas oportunidades para atrair mais clientes através do Google. Preparei uma proposta personalizada com um novo site e uma estratégia completa de presença online.\n\nVale a pena conferir!\n\nAbraços,`,
  },
  {
    id: "cl-2",
    leadId: "lead-2",
    name: "Trattoria Bella Vista",
    niche: "Restaurante",
    city: "São Paulo",
    uf: "SP",
    status: "rascunho",
    hasWebsite: true,
    hasSite: true,
    hasProposal: true,
    propostaAssunto: "Nova proposta comercial para Trattoria Bella Vista",
    propostaCorpo: `Olá equipe da Trattoria Bella Vista,\n\nPreparamos uma demonstração exclusiva de redesign do seu site para melhorar as reservas online no Google Maps.\n\nConfira a prévia e nos diga o que achou!`,
  },
  {
    id: "cl-3",
    leadId: "lead-3",
    name: "Sabor & Arte",
    niche: "Restaurante",
    city: "São Paulo",
    uf: "SP",
    status: "em_geracao",
    hasWebsite: true,
    hasSite: false,
    hasProposal: false,
  },
  {
    id: "cl-4",
    leadId: "lead-4",
    name: "Cozinha do Chef",
    niche: "Restaurante",
    city: "Santo André",
    uf: "SP",
    status: "pendente",
    hasWebsite: false,
    hasSite: false,
    hasProposal: false,
  },
  {
    id: "cl-5",
    leadId: "lead-5",
    name: "Grill Master",
    niche: "Churrascaria",
    city: "São Paulo",
    uf: "SP",
    status: "sem_motivo",
    hasWebsite: true,
    hasSite: false,
    hasProposal: false,
  },
  {
    id: "cl-6",
    leadId: "lead-6",
    name: "Sabores Paulistanos",
    niche: "Restaurante",
    city: "São Paulo",
    uf: "SP",
    status: "aprovado",
    hasWebsite: true,
    siteUrl: "https://saborespaulistanos.flowgenius.com.br",
    hasSite: true,
    hasProposal: true,
    propostaAssunto: "Oportunidade para Sabores Paulistanos",
    propostaCorpo: `Olá,\n\nIdentificamos pontos de melhoria importantes no posicionamento online do Sabores Paulistanos. Veja o novo site preparado para vocês!`,
  },
  {
    id: "cl-7",
    leadId: "lead-7",
    name: "Cantina Italiana",
    niche: "Restaurante",
    city: "Guarulhos",
    uf: "SP",
    status: "rascunho",
    hasWebsite: true,
    hasSite: true,
    hasProposal: true,
    propostaAssunto: "Modernização da presença digital da Cantina Italiana",
    propostaCorpo: `Olá,\n\nCriamos um redesign focado em alta conversão para atrair novos clientes na região de Guarulhos.`,
  },
  {
    id: "cl-8",
    leadId: "lead-8",
    name: "Sushi Prime",
    niche: "Restaurante Japonês",
    city: "São Paulo",
    uf: "SP",
    status: "em_geracao",
    hasWebsite: true,
    hasSite: false,
    hasProposal: false,
  },
  {
    id: "cl-9",
    leadId: "lead-9",
    name: "Burger House",
    niche: "Hamburgueria",
    city: "São Paulo",
    uf: "SP",
    status: "pendente",
    hasWebsite: false,
    hasSite: false,
    hasProposal: false,
  },
  {
    id: "cl-10",
    leadId: "lead-10",
    name: "Pizzaria Napoli",
    niche: "Pizzaria",
    city: "São Bernardo",
    uf: "SP",
    status: "rascunho",
    hasWebsite: true,
    hasSite: true,
    hasProposal: true,
    propostaAssunto: "Aumento de pedidos e reservas para Pizzaria Napoli",
    propostaCorpo: `Olá Pizzaria Napoli,\n\nConstruímos uma prévia personalizada com cardápio digital rápido e design moderno.`,
  },
];
