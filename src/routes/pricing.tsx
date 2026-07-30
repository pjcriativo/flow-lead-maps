import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check, Minus, ArrowRight, Sparkles } from "lucide-react";
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
          "Preços simples e transparentes do Flow Leads. Comece grátis e faça upgrade conforme sua geração de leads cresce.",
      },
      { property: "og:title", content: "Preços do Flow Leads — Planos para todo time" },
      {
        property: "og:description",
        content: "Teste grátis e planos Básico, Pro e Agência. Economize 20% na cobrança anual.",
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
  // ⚙️ CMS (admin → Conteúdos do site): planos_json substitui os 4 cards padrão abaixo
  // quando presente e com o formato certo — sem linha/campo válido, cai no PLANS fixo.
  const [planos, setPlanos] = useState<Plan[]>(PLANS);
  // ⚙️ Configurações (admin → Configurações básicas): símbolo da moeda exibido nos preços.
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
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <Link to="/" className="hover:text-foreground">
              Início
            </Link>
            <Link to="/pricing" className="text-foreground">
              Preços
            </Link>
          </nav>
          <Link to="/dashboard" preload="render">
            <Button>
              Abrir App <ArrowRight />
            </Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-20 pb-10 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Preços que escalam com o seu funil
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Escolha o plano ideal para você. Faça upgrade quando precisar de mais leads. Cancele quando quiser.
        </p>

        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-card p-1 text-sm shadow-sm">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-full px-4 py-1.5 transition-colors ${!yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Mensal
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`rounded-full px-4 py-1.5 transition-colors ${yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Anual <span className="ml-1 text-xs opacity-80">−50%</span>
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {planos.map((plan) => {
            const isFree = plan.monthly === 0;
            const price = isFree
              ? `${simbolo} 0`
              : yearly
                ? `${simbolo} ${plan.yearlyMonthly}`
                : `${simbolo} ${plan.monthly}`;
            const suffix = isFree ? "" : "/mês";
            const sub = isFree
              ? "7 dias grátis"
              : yearly
                ? `Cobrado ${simbolo} ${plan.yearly}/ano`
                : "Cobrança mensal";
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-6 shadow-[var(--shadow-card)] ${
                  plan.popular
                    ? "border-primary bg-card ring-2 ring-primary/40"
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow">
                    <Sparkles className="mr-1 inline h-3 w-3" /> Mais popular
                  </div>
                )}
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{price}</span>
                  <span className="text-sm text-muted-foreground">{suffix}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>

                <Link to="/auth" search={{ mode: "signup" }} preload="render" className="mt-6">
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {plan.cta}
                  </Button>
                </Link>

                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* A tabela comparativa é indexada por posição aos 4 planos PADRÃO (COMPARISON) — se o
          admin customizou planos_json em Conteúdos do site, essa tabela sairia de sincronia
          com os cards acima, então ela só aparece com os planos padrão do código. */}
      {planos === PLANS && (
        <section className="border-t border-border bg-card/40 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-semibold tracking-tight">Compare os planos</h2>
            <p className="mt-2 text-center text-muted-foreground">
              Todos os recursos, lado a lado.
            </p>

            <div className="mt-10 overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-secondary/40">
                  <tr>
                    <th className="p-4 font-medium">Recurso</th>
                    {PLANS.map((p) => (
                      <th key={p.name} className="p-4 font-medium">
                        {p.name}
                        {p.popular && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                            Popular
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.label} className="border-b border-border last:border-b-0">
                      <td className="p-4 font-medium">{row.label}</td>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-4 text-muted-foreground">
                          {typeof v === "boolean" ? (
                            v ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <Minus className="h-4 w-4 text-muted-foreground/50" />
                            )
                          ) : (
                            <span className="text-foreground">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
