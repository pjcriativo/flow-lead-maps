import { Database, PiggyBank, Repeat2, ShieldCheck } from "lucide-react";
import type { ApiUsageResumo } from "@/services/api-consumption";

interface LeadEconomyOverviewProps {
  economy: ApiUsageResumo["lead_economy"] | null;
  loading: boolean;
}

function metric(value: number, loading: boolean): string {
  return loading ? "..." : value.toLocaleString("pt-BR");
}

function usd(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export function LeadEconomyOverview({ economy, loading }: LeadEconomyOverviewProps) {
  const reusePercentage = Math.round((economy?.reuse_rate ?? 0) * 100);

  return (
    <section aria-labelledby="lead-economy-title" className="space-y-4">
      <div>
        <h3 id="lead-economy-title" className="text-lg font-bold text-foreground">
          Economia da base própria
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Leads inéditos reaproveitados antes da Apify e cobranças evitadas no período.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-primary/10 p-2 text-primary">
              <Database className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Base disponível
              </p>
              <p className="mt-1 text-2xl font-black text-foreground">
                {metric(economy?.catalog_total ?? 0, loading)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Empresas públicas catalogadas</p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-secondary p-2 text-secondary-foreground">
              <Repeat2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Leads reaproveitados
              </p>
              <p className="mt-1 text-2xl font-black text-foreground">
                {metric(economy?.reused_leads ?? 0, loading)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {loading ? "Calculando..." : `${reusePercentage}% dos candidatos entregues`}
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-accent p-2 text-accent-foreground">
              <PiggyBank className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Runs evitados
              </p>
              <p className="mt-1 text-2xl font-black text-foreground">
                {metric(economy?.paid_runs_avoided ?? 0, loading)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Buscas sem cobrança · custo/lead novo: {usd(economy?.cost_per_new_lead_usd ?? 0)}
          </p>
        </article>

        <article className="rounded-2xl border border-border bg-card p-5 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-muted p-2 text-muted-foreground">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Repetidos bloqueados
              </p>
              <p className="mt-1 text-2xl font-black text-foreground">
                {metric(economy?.duplicates_avoided ?? 0, loading)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Não voltaram para os clientes</p>
        </article>
      </div>

      {(economy?.top_queries.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
          <div className="border-b border-border bg-muted/30 px-5 py-4">
            <h4 className="font-semibold text-foreground">Buscas com maior reaproveitamento</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/20 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">
                    Nicho e área
                  </th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold">
                    Buscas
                  </th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold">
                    Da base
                  </th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold">
                    Runs pagos
                  </th>
                  <th scope="col" className="px-5 py-3 text-center font-semibold">
                    Repetidos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {economy?.top_queries.map((query) => (
                  <tr key={query.query_key}>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-foreground">{query.niche}</p>
                      <p className="text-xs text-muted-foreground">{query.city}</p>
                    </td>
                    <td className="px-5 py-3 text-center text-foreground">{query.searches}</td>
                    <td className="px-5 py-3 text-center font-semibold text-foreground">
                      {query.reused_leads}
                    </td>
                    <td className="px-5 py-3 text-center text-foreground">{query.paid_runs}</td>
                    <td className="px-5 py-3 text-center text-foreground">
                      {query.duplicates_avoided}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
