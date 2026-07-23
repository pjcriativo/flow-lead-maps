// Tela RELATÓRIOS do painel admin. Só dado REAL (Edge admin-acoes: relatorios_ler, todas as
// orgs). Sem dado → "sem dados ainda", nunca inventado. Filtro de período + exportar CSV
// (client-side, sem custo). Cada bloco documenta a query de origem.
import { useEffect, useState } from "react";
import { Download, Loader2, BarChart3 } from "lucide-react";
import { adminAcao } from "@/services/admin";

type LeadsPorFonte = { fonte: string; total: number };
type LeadsPorEstrategia = { estrategia: string; total: number };
type Funil = {
  novos: number;
  contatados: number;
  propostaEnviada: number;
  respondeu: number;
  ganho: number;
  perdido: number;
};
type MotivoPerda = { motivo: string; total: number };
type ConsumoOrg = {
  org: string;
  plano: string;
  leads: { usado: number; limite: number | null };
  sites: { usado: number; limite: number | null };
  mensagens: { usado: number; limite: number | null };
  campanhas: { usado: number; limite: number | null };
};
type GastoMes = { mes_ref: string; total_usd: number };

type Relatorios = {
  leadsPorFonte: LeadsPorFonte[];
  leadsPorEstrategia: LeadsPorEstrategia[];
  funil: Funil;
  motivosPerda: MotivoPerda[];
  consumoPorOrg: ConsumoOrg[];
  gastoPorMes: GastoMes[];
};

const FONTE_LABEL: Record<string, string> = {
  google_maps: "Google Maps",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

function baixarCsv(nome: string, linhas: (string | number)[][]) {
  const csv = linhas
    .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

function Bloco({
  titulo,
  fonte,
  children,
}: {
  titulo: string;
  fonte: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h3 className="font-serif text-lg">{titulo}</h3>
      <p className="mb-3 text-[11px] text-muted-foreground">{fonte}</p>
      {children}
    </div>
  );
}

function Barra({ rotulo, valor, maximo }: { rotulo: string; valor: number; maximo: number }) {
  const pct = maximo > 0 ? Math.round((valor / maximo) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-40 shrink-0 truncate" title={rotulo}>
        {rotulo}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{valor}</span>
    </div>
  );
}

export function AdminRelatorios() {
  const [dados, setDados] = useState<Relatorios | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [desde, setDesde] = useState("");
  const [ate, setAte] = useState("");

  const carregar = () => {
    setErro(null);
    adminAcao("relatorios_ler", {
      desde: desde ? new Date(desde).toISOString() : undefined,
      ate: ate ? new Date(ate + "T23:59:59").toISOString() : undefined,
    })
      .then((r) => {
        if (!r.ok) {
          setErro(String(r.reason ?? "falha ao carregar"));
          return;
        }
        setDados(r as unknown as Relatorios);
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "erro"));
  };

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const maiorFonte = Math.max(1, ...(dados?.leadsPorFonte.map((f) => f.total) ?? [1]));
  const maiorEstrategia = Math.max(1, ...(dados?.leadsPorEstrategia.map((f) => f.total) ?? [1]));
  const maiorMotivo = Math.max(1, ...(dados?.motivosPerda.map((f) => f.total) ?? [1]));
  const maiorFunil = Math.max(1, dados?.funil.novos ?? 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl">
            <BarChart3 className="h-5 w-5 text-gold" /> Relatórios
          </h2>
          <p className="text-xs text-muted-foreground">
            Dado real de todas as organizações — nada inventado.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-[11px] uppercase text-muted-foreground">De</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase text-muted-foreground">Até</label>
            <input
              type="date"
              value={ate}
              onChange={(e) => setAte(e.target.value)}
              className="h-9 rounded-md border border-input bg-card px-2 text-sm"
            />
          </div>
          <button
            onClick={carregar}
            className="h-9 rounded-md bg-navy px-3 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
          >
            Filtrar
          </button>
        </div>
      </div>

      {erro && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          Falha ao carregar: {erro}
        </p>
      )}
      {!dados && !erro && (
        <p className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </p>
      )}

      {dados && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Bloco titulo="Leads por fonte" fonte="leads.origem_fonte (null = Google Maps)">
            {dados.leadsPorFonte.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <div className="space-y-2">
                {dados.leadsPorFonte.map((f) => (
                  <Barra
                    key={f.fonte}
                    rotulo={FONTE_LABEL[f.fonte] ?? f.fonte}
                    valor={f.total}
                    maximo={maiorFonte}
                  />
                ))}
              </div>
            )}
          </Bloco>

          <Bloco
            titulo="Leads por estratégia"
            fonte="leads.origem_estrategia — qual estratégia converte mais"
          >
            {dados.leadsPorEstrategia.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sem dados ainda (nenhum lead de Instagram/LinkedIn com estratégia registrada).
              </p>
            ) : (
              <div className="space-y-2">
                {dados.leadsPorEstrategia.map((f) => (
                  <Barra
                    key={f.estrategia}
                    rotulo={f.estrategia}
                    valor={f.total}
                    maximo={maiorEstrategia}
                  />
                ))}
              </div>
            )}
          </Bloco>

          <Bloco
            titulo="Funil"
            fonte="leads.status (aproximação: status atual, sem histórico de estágios)"
          >
            <div className="space-y-2">
              <Barra rotulo="Novos" valor={dados.funil.novos} maximo={maiorFunil} />
              <Barra rotulo="Contatados" valor={dados.funil.contatados} maximo={maiorFunil} />
              <Barra
                rotulo="Proposta enviada"
                valor={dados.funil.propostaEnviada}
                maximo={maiorFunil}
              />
              <Barra rotulo="Respondeu" valor={dados.funil.respondeu} maximo={maiorFunil} />
              <Barra rotulo="Ganho" valor={dados.funil.ganho} maximo={maiorFunil} />
              <Barra rotulo="Perdido/nutrição" valor={dados.funil.perdido} maximo={maiorFunil} />
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Não há histórico de estágios — um lead que chegou a "proposta enviada" e depois foi
              marcado perdido conta em "perdido", não em "proposta enviada".
            </p>
          </Bloco>

          <Bloco
            titulo="Motivos de perda"
            fonte="leads.motivo_perda (status lost/nurture) — todas as orgs"
          >
            {dados.motivosPerda.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum lead perdido com motivo registrado ainda.
              </p>
            ) : (
              <div className="space-y-2">
                {dados.motivosPerda.map((m) => (
                  <Barra key={m.motivo} rotulo={m.motivo} valor={m.total} maximo={maiorMotivo} />
                ))}
              </div>
            )}
          </Bloco>

          <Bloco titulo="Consumo vs limite do plano" fonte="consumo_org (mês corrente) × planos">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-1 pr-2">Org</th>
                    <th className="py-1 pr-2">Plano</th>
                    <th className="py-1 pr-2">Leads</th>
                    <th className="py-1 pr-2">Sites</th>
                    <th className="py-1 pr-2">Mensagens</th>
                    <th className="py-1">Campanhas</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.consumoPorOrg.map((c) => (
                    <tr key={c.org} className="border-t border-border">
                      <td className="py-1.5 pr-2 font-medium">{c.org}</td>
                      <td className="py-1.5 pr-2 text-muted-foreground">{c.plano}</td>
                      <td className="py-1.5 pr-2 tabular-nums">
                        {c.leads.usado}/{c.leads.limite ?? "∞"}
                      </td>
                      <td className="py-1.5 pr-2 tabular-nums">
                        {c.sites.usado}/{c.sites.limite ?? "∞"}
                      </td>
                      <td className="py-1.5 pr-2 tabular-nums">
                        {c.mensagens.usado}/{c.mensagens.limite ?? "∞"}
                      </td>
                      <td className="py-1.5 tabular-nums">
                        {c.campanhas.usado}/{c.campanhas.limite ?? "∞"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Bloco>

          <Bloco
            titulo="Gasto de API por mês"
            fonte="redes_buscas.custo_usd (livro-caixa) — soma por mes_ref"
          >
            {dados.gastoPorMes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem gasto registrado ainda.</p>
            ) : (
              <div className="space-y-2">
                {dados.gastoPorMes.map((g) => (
                  <div key={g.mes_ref} className="flex items-center justify-between text-sm">
                    <span>{g.mes_ref}</span>
                    <span className="font-serif">US$ {g.total_usd.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </Bloco>

          <div className="flex justify-end lg:col-span-2">
            <button
              onClick={() =>
                baixarCsv("relatorio-leads-por-fonte.csv", [
                  ["fonte", "total"],
                  ...dados.leadsPorFonte.map((f) => [FONTE_LABEL[f.fonte] ?? f.fonte, f.total]),
                ])
              }
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" /> Exportar leads por fonte (CSV)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
