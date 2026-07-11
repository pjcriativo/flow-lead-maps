import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check, Minus, ArrowRight, Sparkles } from "lucide-react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Flow Leads" },
      { name: "description", content: "Simple, transparent pricing for Flow Leads. Start free, upgrade as you scale your lead generation." },
      { property: "og:title", content: "Flow Leads Pricing — Plans for every team" },
      { property: "og:description", content: "Free trial, Basic, Pro, and Agency plans. Save 20% with yearly billing." },
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
    name: "Free Trial",
    monthly: 0,
    yearly: 0,
    yearlyMonthly: "0",
    blurb: "7 days free, no credit card required.",
    cta: "Start Free Trial",
    features: ["50 leads total", "Google Sheets export", "Email finder"],
  },
  {
    name: "Basic",
    monthly: 19,
    yearly: 182,
    yearlyMonthly: "15.16",
    blurb: "For solo founders just getting started.",
    cta: "Get Started",
    features: ["300 leads / month", "Google Sheets export", "Email finder", "Standard support"],
  },
  {
    name: "Pro",
    monthly: 49,
    yearly: 470,
    yearlyMonthly: "39.16",
    blurb: "For growing sales teams that need volume.",
    cta: "Get Started",
    popular: true,
    features: [
      "1,000 leads / month",
      "Google Sheets export",
      "Email finder",
      "Priority scraping",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    monthly: 99,
    yearly: 950,
    yearlyMonthly: "79.16",
    blurb: "Built for agencies running campaigns at scale.",
    cta: "Get Started",
    features: [
      "5,000 leads / month",
      "Google Sheets export",
      "Email finder",
      "Priority scraping",
      "5 team members",
      "Dedicated support",
    ],
  },
];

const COMPARISON: { label: string; values: (string | boolean)[] }[] = [
  { label: "Monthly leads", values: ["50 total", "300", "1,000", "5,000"] },
  { label: "Google Sheets export", values: [true, true, true, true] },
  { label: "Email finder", values: [true, true, true, true] },
  { label: "Priority scraping", values: [false, false, true, true] },
  { label: "Standard support", values: [false, true, false, false] },
  { label: "Priority support", values: [false, false, true, false] },
  { label: "Dedicated support", values: [false, false, false, true] },
  { label: "Team members", values: ["1", "1", "1", "5"] },
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
            <Link to="/" className="hover:text-foreground">Home</Link>
            <Link to="/pricing" className="text-foreground">Preços</Link>
          </nav>
          <Link to="/dashboard" preload="render">
            <Button>Open App <ArrowRight /></Button>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 pt-20 pb-10 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Pricing that scales with your pipeline
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Start free. Upgrade when you need more leads. Cancel anytime.
        </p>

        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-border bg-card p-1 text-sm shadow-sm">
          <button
            onClick={() => setYearly(false)}
            className={`rounded-full px-4 py-1.5 transition-colors ${!yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setYearly(true)}
            className={`rounded-full px-4 py-1.5 transition-colors ${yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Yearly <span className="ml-1 text-xs opacity-80">−20%</span>
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const isFree = plan.monthly === 0;
            const price = isFree ? "$0" : yearly ? `$${plan.yearlyMonthly}` : `$${plan.monthly}`;
            const suffix = isFree ? "" : "/mo";
            const sub = isFree
              ? "7 days free"
              : yearly
              ? `Billed $${plan.yearly}/year`
              : "Billed monthly";
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
                    <Sparkles className="mr-1 inline h-3 w-3" /> Most Popular
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
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
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
          <h2 className="text-center text-3xl font-semibold tracking-tight">Compare plans</h2>
          <p className="mt-2 text-center text-muted-foreground">Every feature, side by side.</p>

          <div className="mt-10 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/40">
                <tr>
                  <th className="p-4 font-medium">Feature</th>
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