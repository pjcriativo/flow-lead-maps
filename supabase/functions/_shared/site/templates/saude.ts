// Template "saude" — config do template PREMIUM (odontologia/estética/clínica).
// O design/estrutura vive em premium.ts; aqui só a copy/ícones do nicho.
import type { SiteData } from "../tipos.ts";
import { templatePremium, type NichoCfg } from "./premium.ts";

const CFG: NichoCfg = {
  brandIcon: "tooth",
  navServicos: "Serviços",
  servKicker: "Nossos serviços",
  servTitulo: "Tratamentos com excelência",
  servSub: "Cuidado completo e personalizado para você e sua família.",
  difKicker: "Por que escolher",
  difTitulo: "O cuidado que faz diferença",
  sobreIcon: "heart",
  sobreKicker: "Sobre nós",
  galKicker: "Ambiente",
  galTitulo: "Conheça nosso espaço",
  depoKicker: "Depoimentos reais",
  depoTitulo: "O que dizem no Google",
  depoSub: "Avaliações reais de quem já foi atendido.",
  faqKicker: "Dúvidas",
  faqTitulo: "Perguntas frequentes",
  localKicker: "Onde estamos",
  localTitulo: "Venha nos visitar",
  termoServicos: "serviços",
  ctaPar: (l) => `Agende agora pelo WhatsApp e cuide do seu sorriso com quem é referência${l}.`,
};

export function templateSaude(d: SiteData): string {
  return templatePremium(d, CFG);
}
