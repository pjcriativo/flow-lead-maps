// Template "profissional" — config do template PREMIUM (advocacia, contabilidade,
// consultoria). Copy sóbria de autoridade; SEM vocabulário de saúde. O design é o
// mesmo premium.ts; prova social 100% condicional (sem nota = sem estrela falsa).
import type { SiteData } from "../tipos.ts";
import { templatePremium, type NichoCfg } from "./premium.ts";

const CFG: NichoCfg = {
  brandIcon: "scale",
  navServicos: "Atuação",
  servKicker: "Áreas de atuação",
  servTitulo: "Como podemos ajudar",
  servSub: "Atuação com técnica, ética e compromisso com a sua causa.",
  difKicker: "Por que nos escolher",
  difTitulo: "Autoridade e compromisso",
  sobreIcon: "briefcase",
  sobreKicker: "O escritório",
  galKicker: "Estrutura",
  galTitulo: "Nosso escritório",
  depoKicker: "Depoimentos",
  depoTitulo: "O que dizem nossos clientes",
  depoSub: "A confiança de quem já contou com o nosso trabalho.",
  faqKicker: "Dúvidas",
  faqTitulo: "Perguntas frequentes",
  localKicker: "Contato",
  localTitulo: "Fale com o escritório",
  termoServicos: "áreas de atuação",
  ctaPar: (l) =>
    `Fale agora pelo WhatsApp e conte com um atendimento profissional e transparente${l}.`,
};

export function templateProfissional(d: SiteData): string {
  return templatePremium(d, CFG);
}
