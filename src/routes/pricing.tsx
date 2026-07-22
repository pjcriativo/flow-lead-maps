import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check, Minus, ArrowRight, Sparkles } from "lucide-react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

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
    name: "Teste Grátis",
    monthly: 0,
    yearly: 0,
    yearlyMonthly: "0",
    blurb: "7 dias grátis, sem cartão de crédito.",
    cta: "Começar teste grátis",
    features: ["50 leads no total", "Exportar para Google Sheets", "Localizador de e-mail"],
  },
  {
    name: "Básico",
    monthly: 19,
    yearly: 182,
    yearlyMonthly: "15,16",
    blurb: "Para quem está começando sozinho.",
    cta: "Começar",
    features: [
      "300 leads / mês",
      "Exportar para Google Sheets",
      "Localizador de e-mail",
      "Suporte padrão",
    ],
  },
  {
    name: "Pro",
    monthly: 49,
    yearly: 470,
    yearlyMonthly: "39,16",
    blurb: "Para times de vendas que precisam de volume.",
    cta: "Começar",
    popular: true,
    features: [
      "1.000 leads / mês",
      "Exportar para Google Sheets",
      "Localizador de e-mail",
      "Coleta prioritária",
      "Suporte prioritário",
    ],
  },
  {
    name: "Agência",
    monthly: 99,
    yearly: 950,
    yearlyMonthly: "79,16",
    blurb: "Feito para agências rodando campanhas em escala.",
    cta: "Começar",
    features: [
      "5.000 leads / mês",
      "Exportar para Google Sheets",
      "Localizador de e-mail",
      "Coleta prioritária",
      "5 membros da equipe",
      "Suporte dedicado",
    ],
  },
];

const COMPARISON: { label: string; values: (string | boolean)[] }[] = [
  { label: "Leads por mês", values: ["50 no total", "300", "1.000", "5.000"] },
  { label: "Exportar para Google Sheets", values: [true, true, true, true] },
  { label: "Localizador de e-mail", values: [true, true, true, true] },
  { label: "Coleta prioritária", values: [false, false, true, true] },
  { label: "Suporte padrão", values: [false, true, false, false] },
  { label: "Suporte prioritário", values: [false, false, true, false] },
  { label: "Suporte dedicado", values: [false, false, false, true] },
  { label: "Membros da equipe", values: ["1", "1", "1", "5"] },
];

function PricingPage() {
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
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
          Comece grátis. Faça upgrade quando precisar de mais leads. Cancele quando quiser.
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
            Anual <span className="ml-1 text-xs opacity-80">−20%</span>
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isFree = plan.monthly === 0;
            const price = isFree
              ? "R$ 0"
              : yearly
                ? `R$ ${plan.yearlyMonthly}`
                : `R$ ${plan.monthly}`;
            const suffix = isFree ? "" : "/mês";
            const sub = isFree
              ? "7 dias grátis"
              : yearly
                ? `Cobrado R$ ${plan.yearly}/ano`
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

                <Link to="/dashboard" preload="render" className="mt-6">
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

      <section className="border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight">Compare os planos</h2>
          <p className="mt-2 text-center text-muted-foreground">Todos os recursos, lado a lado.</p>

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

      <SiteFooter />
    </div>
  );
}
