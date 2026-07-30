import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { 
  Check, 
  Minus, 
  ArrowRight, 
  Sparkles, 
  MapPin, 
  Search, 
  LineChart, 
  FileText, 
  Bot, 
  Zap, 
  ChevronDown 
} from "lucide-react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { EstiloSitePublico } from "@/components/EstiloSitePublico";
import { supabase } from "@/integrations/supabase/client";
import { lerConfigPublica } from "@/services/config-publica";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Preços — Flow Leads" },
      {
        name: "description",
        content:
          "Preços simples e transparentes do Flow Leads. Escolha o plano ideal e escale suas vendas hoje.",
      },
      { property: "og:title", content: "Preços do Flow Leads — Planos para todo time" },
      {
        property: "og:description",
        content: "Planos Básico, Pro e Agência. Economize 50% na cobrança anual.",
      },
      { property: "og:url", content: "https://flowleads.com.br/pricing" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/pricing" }],
  }),
  component: PricingPage,
});

type Plan = {
  name: string;
  monthly: number;
  yearly: number;
  yearlyMonthly: string;
  blurb: string;
  cta: string;
  popular?: boolean;
  features: string[];
};

const PLANS: Plan[] = [
  {
    name: "Básico",
    monthly: 49,
    yearly: 294,
    yearlyMonthly: "24,50",
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
    monthly: 99,
    yearly: 594,
    yearlyMonthly: "49,50",
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
    monthly: 597,
    yearly: 3582,
    yearlyMonthly: "298,50",
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

const COMPARISON: { label: string; values: (string | boolean)[] }[] = [
  { label: "Leads por mês", values: ["1.000", "5.000", "Ilimitados"] },
  { label: "Busca no Google Maps", values: [true, true, true] },
  { label: "Modo Prospecção Instagram", values: [false, true, true] },
  { label: "Modo Prospecção LinkedIn", values: [false, true, true] },
  { label: "CRM (Minhas Listas, Leads, Kanban)", values: [true, true, true] },
  { label: "Geração de Propostas PDF", values: [false, true, true] },
  { label: "Emissão de Contratos", values: [false, true, true] },
  { label: "Controle Financeiro", values: [false, true, true] },
  { label: "Campanhas de WhatsApp", values: [false, true, true] },
  { label: "Automações de WhatsApp", values: [false, true, true] },
  { label: "Ferramenta de Redesign de Sites", values: [false, true, true] },
  { label: "Ferramenta de Publicação", values: [false, true, true] },
  { label: "Suporte Técnico", values: ["Padrão", "Prioritário", "Dedicado"] },
];

const FEATURES = [
  {
    icon: MapPin,
    title: "Extrator Google Maps",
    description: "Encontre leads qualificados em qualquer região ou nicho em segundos.",
  },
  {
    icon: Search,
    title: "Prospecção Avançada",
    description: "Localize decisores e contatos chave via Instagram e LinkedIn.",
  },
  {
    icon: LineChart,
    title: "CRM Integrado",
    description: "Gerencie listas, contatos e o pipeline de vendas em um só lugar.",
  },
  {
    icon: Bot,
    title: "Campanhas de WhatsApp",
    description: "Automatize disparos e respostas inteligentes via WhatsApp.",
  },
  {
    icon: FileText,
    title: "Propostas e Contratos",
    description: "Gere documentos em PDF e gerencie recebimentos com facilidade.",
  },
  {
    icon: Zap,
    title: "Redesign de Sites",
    description: "Crie ou publique páginas incríveis para alavancar suas conversões.",
  },
];

const FAQS = [
  {
    question: "O que acontece se eu atingir meu limite de leads mensais?",
    answer: "Você pode continuar usando todas as outras funcionalidades do sistema (CRM, Campanhas, Contratos). Para buscar mais leads, basta fazer o upgrade do seu plano a qualquer momento.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim, sem burocracia ou taxas de cancelamento. Você manterá o acesso até o fim do ciclo que já foi pago.",
  },
  {
    question: "Como funciona o desconto do plano anual?",
    answer: "No plano anual, você paga os 12 meses de uma vez, mas com 50% de desconto sobre o valor mensal. É a opção ideal para times que desejam escalar com previsibilidade e economia.",
  },
  {
    question: "Preciso de um cartão de crédito para testar?",
    answer: "Você pode criar sua conta gratuitamente e explorar o painel antes de decidir assinar qualquer plano.",
  },
];

function ehListaDePlanosValida(v: unknown): v is Plan[] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (p) =>
        p &&
        typeof p === "object" &&
        typeof (p as Plan).name === "string" &&
        typeof (p as Plan).monthly === "number" &&
        Array.isArray((p as Plan).features),
    )
  );
}

function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const [planos, setPlanos] = useState<Plan[]>(PLANS);
  const [simbolo, setSimbolo] = useState("R$");
  
  useEffect(() => {
    supabase
      .from("site_conteudo")
      .select("planos_json")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        if (ehListaDePlanosValida(data?.planos_json)) setPlanos(data.planos_json);
      });
    lerConfigPublica().then((c) => {
      if (c.simbolo_moeda?.trim()) setSimbolo(c.simbolo_moeda.trim());
    });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <EstiloSitePublico />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground transition-colors">
              Início
            </Link>
            <Link to="/pricing" className="text-foreground transition-colors">
              Preços
            </Link>
          </nav>
          <Link to="/dashboard" preload="render">
            <Button className="rounded-full px-6">
              Abrir App <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-16 text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 opacity-50 blur-[100px]" />
        
        <div className="mx-auto max-w-7xl px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm mb-6">
            <Sparkles className="h-4 w-4" /> 
            Máquina de Prospecção B2B Definitiva
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Preços que escalam com o <br className="hidden md:block"/> seu funil de vendas.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Pare de perder tempo com prospecção manual. Escolha o plano ideal e automatize 
            sua captação de clientes a partir de hoje.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <div className="inline-flex items-center rounded-full border border-border bg-card p-1 text-sm shadow-sm">
              <button
                onClick={() => setYearly(false)}
                className={`rounded-full px-6 py-2 transition-all font-medium ${!yearly ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                Mensal
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`relative rounded-full px-6 py-2 transition-all font-medium ${yearly ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"}`}
              >
                Anual
                <span className="absolute -top-3 -right-2 flex items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2 py-0.5 text-[10px] font-bold text-white shadow ring-2 ring-background animate-pulse">
                  -50%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="mx-auto max-w-7xl px-6 pb-20 z-10 relative">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3 items-end">
          {planos.map((plan) => {
            const price = yearly
                ? `${simbolo} ${plan.yearlyMonthly}`
                : `${simbolo} ${plan.monthly}`;
            const sub = yearly
                ? `Cobrado ${simbolo} ${plan.yearly} / ano`
                : "Cobrado mensalmente";
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl border p-8 transition-all hover:shadow-2xl ${
                  plan.popular
                    ? "border-primary/50 bg-slate-900 text-white shadow-xl ring-2 ring-primary xl:-mt-8 xl:mb-8"
                    : "border-border bg-card shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-primary to-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                    <Sparkles className="mr-1.5 inline h-4 w-4" /> Mais Recomendado
                  </div>
                )}
                
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className={`mt-2 text-sm ${plan.popular ? "text-slate-300" : "text-muted-foreground"}`}>{plan.blurb}</p>
                
                <div className="mt-8 flex items-end gap-2">
                  <span className="text-5xl font-bold tracking-tight">{price}</span>
                  <span className={`text-base font-medium mb-1 ${plan.popular ? "text-slate-400" : "text-muted-foreground"}`}>/mês</span>
                </div>
                <p className={`mt-2 text-xs font-medium ${plan.popular ? "text-slate-400" : "text-muted-foreground"}`}>{sub}</p>

                <Link to="/auth" search={{ mode: "signup" }} preload="render" className="mt-8">
                  <Button 
                    className={`w-full h-12 rounded-xl font-semibold text-base transition-transform active:scale-95 ${plan.popular ? "bg-white text-slate-900 hover:bg-slate-100" : ""}`} 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>

                <div className={`mt-8 pt-8 border-t ${plan.popular ? "border-slate-800" : "border-border"}`}>
                  <ul className="space-y-4 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check className={`mt-0.5 h-5 w-5 shrink-0 ${plan.popular ? "text-primary" : "text-primary"}`} />
                        <span className={plan.popular ? "text-slate-200" : "text-foreground"}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Highlight */}
      <section className="bg-secondary/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold md:text-4xl">Tudo que você precisa para dominar o B2B</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">Recursos projetados para colocar sua operação de vendas no piloto automático.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feat) => (
              <div key={feat.title} className="flex flex-col gap-4 rounded-2xl bg-card p-6 shadow-sm border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feat.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      {planos === PLANS && (
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold md:text-4xl">Compare os planos em detalhes</h2>
              <p className="mt-4 text-muted-foreground">Todos os recursos, lado a lado, sem pegadinhas.</p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-secondary/40 border-b border-border">
                    <tr>
                      <th className="p-6 font-semibold sticky left-0 z-10 bg-secondary/40 backdrop-blur min-w-[250px]">Recurso</th>
                      {PLANS.map((p) => (
                        <th key={p.name} className="p-6 font-semibold min-w-[180px]">
                          <div className="flex flex-col gap-1">
                            <span className="text-lg">{p.name}</span>
                            <span className="text-muted-foreground text-xs font-normal">
                              {yearly ? `${simbolo} ${p.yearlyMonthly}/mês` : `${simbolo} ${p.monthly}/mês`}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {COMPARISON.map((row) => (
                      <tr key={row.label} className="transition-colors hover:bg-muted/30">
                        <td className="p-6 font-medium sticky left-0 bg-card z-10 group-hover:bg-muted/30">{row.label}</td>
                        {row.values.map((v, i) => (
                          <td key={i} className="p-6 text-muted-foreground">
                            {typeof v === "boolean" ? (
                              v ? (
                                <Check className="h-5 w-5 text-primary" />
                              ) : (
                                <Minus className="h-5 w-5 text-muted-foreground/30" />
                              )
                            ) : (
                              <span className="font-medium text-foreground">{v}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-secondary/20 py-24 border-t border-border">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold md:text-4xl">Perguntas Frequentes</h2>
            <p className="mt-4 text-muted-foreground">Tire suas dúvidas antes de assinar.</p>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <details key={i} className="group rounded-2xl border border-border bg-card p-6 shadow-sm open:bg-secondary/10 transition-colors cursor-pointer">
                <summary className="flex items-center justify-between font-semibold list-none outline-none">
                  <span className="text-base">{faq.question}</span>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-muted-foreground leading-relaxed pr-6">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 relative overflow-hidden border-t border-border/50">
        <div className="absolute inset-0 bg-primary/5 -z-10" />
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Pronto para transformar sua captação?</h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Junte-se a centenas de agências e SDRs que usam o Flow Leads para encher a agenda todos os dias.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth" search={{ mode: "signup" }} preload="render">
              <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg">
                Começar agora <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
