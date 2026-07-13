// Conteúdo rule-based (SEM IA) — usado quando a IA falha ou não há chave.
// Continua ESPECÍFICO (usa nome, categoria, cidade, nota reais), nunca clichê
// genérico. Garante que o site sempre sai com copy coerente e sem placeholder.
import type { MateriaPrima, ConteudoIA, ServicoIA } from "../ai/types.ts";
import type { TemplateId } from "./tipos.ts";

const CTA: Record<TemplateId, string> = {
  saude: "Agendar avaliação",
  "servico-local": "Agendar horário",
  profissional: "Falar com especialista",
};

const SERVICOS_BASE: Record<TemplateId, ServicoIA[]> = {
  saude: [
    {
      titulo: "Atendimento humanizado",
      descricao: "Cuidado próximo, com escuta e um plano feito para você.",
      icone: "heart",
    },
    {
      titulo: "Profissionais qualificados",
      descricao: "Equipe experiente e atualizada com as melhores práticas.",
      icone: "award",
    },
    {
      titulo: "Estrutura moderna",
      descricao: "Ambiente confortável e equipamentos de qualidade.",
      icone: "sparkles",
    },
  ],
  "servico-local": [
    {
      titulo: "Qualidade garantida",
      descricao: "Serviço bem feito, do começo ao fim, com capricho.",
      icone: "check-circle",
    },
    {
      titulo: "Atendimento ágil",
      descricao: "Praticidade e rapidez sem abrir mão do cuidado.",
      icone: "clock",
    },
    { titulo: "Preço justo", descricao: "O melhor custo-benefício da região.", icone: "star" },
  ],
  profissional: [
    {
      titulo: "Experiência comprovada",
      descricao: "Anos de atuação e resultados que falam por si.",
      icone: "award",
    },
    {
      titulo: "Atendimento personalizado",
      descricao: "Cada cliente recebe uma solução sob medida.",
      icone: "briefcase",
    },
    {
      titulo: "Transparência total",
      descricao: "Clareza em cada etapa, do início ao fim.",
      icone: "shield",
    },
  ],
};

const DIFERENCIAIS_BASE: Record<TemplateId, ServicoIA[]> = {
  saude: [
    {
      titulo: "Nota alta no Google",
      descricao: "A confiança de quem já foi atendido.",
      icone: "star",
    },
    {
      titulo: "Atendimento humanizado",
      descricao: "Você acolhido do início ao fim.",
      icone: "heart",
    },
    {
      titulo: "Estrutura moderna",
      descricao: "Ambiente confortável e equipado.",
      icone: "sparkles",
    },
  ],
  "servico-local": [
    {
      titulo: "Bem avaliado",
      descricao: "Reputação construída com clientes reais.",
      icone: "star",
    },
    { titulo: "Rapidez", descricao: "Seu tempo respeitado, sem enrolação.", icone: "clock" },
    { titulo: "Capricho", descricao: "Atenção aos detalhes em cada serviço.", icone: "sparkles" },
  ],
  profissional: [
    { titulo: "Credibilidade", descricao: "Reputação sólida e bem avaliada.", icone: "shield" },
    {
      titulo: "Atendimento próximo",
      descricao: "Acompanhamento de perto em cada caso.",
      icone: "users",
    },
    { titulo: "Resultado", descricao: "Foco no que realmente importa para você.", icone: "award" },
  ],
};

// FAQ genérico SEGURO: perguntas respondíveis com dado real (agendar/onde/serviços).
// Nada de horário, convênio, pagamento ou emergência (não temos esses dados).
const FAQ_BASE: Record<TemplateId, { pergunta: string; resposta: string }[]> = {
  saude: [
    {
      pergunta: "Como faço para agendar?",
      resposta:
        "É só chamar no WhatsApp — respondemos rápido e encontramos o melhor horário para você.",
    },
    {
      pergunta: "Onde vocês ficam?",
      resposta:
        "Veja o endereço e o mapa na seção de localização, com link para chegar pelo Google Maps.",
    },
  ],
  "servico-local": [
    {
      pergunta: "Como faço para agendar?",
      resposta: "Fale com a gente pelo WhatsApp e garanta seu horário sem espera.",
    },
    {
      pergunta: "Onde vocês ficam?",
      resposta: "O endereço e o mapa estão na seção de localização, com link para chegar.",
    },
  ],
  profissional: [
    {
      pergunta: "Como falo com vocês?",
      resposta:
        "Entre em contato pelo WhatsApp; entendemos seu caso e explicamos os próximos passos.",
    },
    {
      pergunta: "Onde fica o escritório?",
      resposta: "O endereço e o mapa estão na seção de contato, com link para chegar.",
    },
  ],
};

export function conteudoFallback(mp: MateriaPrima, nicho: TemplateId): ConteudoIA {
  const cidade = mp.cidade ? mp.cidade.charAt(0) + mp.cidade.slice(1).toLowerCase() : null;
  const cat = (mp.categoria ?? "atendimento").toLowerCase();
  const notaTxt =
    mp.rating != null
      ? ` Nota ${mp.rating.toFixed(1).replace(".", ",")} no Google${mp.reviews ? ` com ${mp.reviews.toLocaleString("pt-BR")} avaliações` : ""}.`
      : "";

  const headline =
    nicho === "saude"
      ? `${mp.nome}: ${cat} de confiança${cidade ? ` em ${cidade}` : ""}`
      : nicho === "profissional"
        ? `${mp.nome} — ${cat} com autoridade${cidade ? ` em ${cidade}` : ""}`
        : `${mp.nome}: ${cat} que você pode confiar${cidade ? ` em ${cidade}` : ""}`;

  const subheadline =
    (nicho === "saude"
      ? "Cuidado completo e atendimento próximo para você e sua família."
      : nicho === "profissional"
        ? "Soluções sob medida, com técnica, ética e resultado."
        : "Atendimento de qualidade e aquele capricho que faz diferença.") + notaTxt;

  const sobre =
    `${mp.nome} é referência em ${cat}${cidade ? ` na região de ${cidade}` : ""}.` +
    (mp.rating != null
      ? ` A qualidade do atendimento se reflete na nota ${mp.rating
          .toFixed(1)
          .replace(
            ".",
            ",",
          )} no Google${mp.reviews ? `, fruto de ${mp.reviews.toLocaleString("pt-BR")} avaliações de clientes` : ""}.`
      : "") +
    " Fale conosco e descubra por que tantas pessoas confiam no nosso trabalho.";

  return {
    headline,
    subheadline,
    servicos: SERVICOS_BASE[nicho],
    diferenciais: DIFERENCIAIS_BASE[nicho],
    sobre,
    faq: FAQ_BASE[nicho],
    cta: CTA[nicho],
  };
}
