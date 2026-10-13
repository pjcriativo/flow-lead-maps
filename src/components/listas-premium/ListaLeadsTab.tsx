// Aba Leads da Lista Selecionada
import { useMemo, useState } from "react";
import {
  Search,
  Download,
  Filter,
  Phone,
  Mail,
  Globe,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SiInstagram, SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/leads-api";
import { exportLeadsCsv, type LeadListWithFullStats } from "./listas-premium-data";

interface ListaLeadsTabProps {
  lista: LeadListWithFullStats;
  leads: Lead[];
  loading: boolean;
  onOpenLeadsCentral: () => void;
}

const PAGE_SIZE = 10;

export function ListaLeadsTab({
  lista,
  leads,
  loading,
  onOpenLeadsCentral,
}: ListaLeadsTabProps) {
  const [search, setSearch] = useState("");
  const [filterContato, setFilterContato] = useState<"todos" | "telefone" | "email" | "whatsapp">("todos");
  const [page, setPage] = useState(1);

  const filtrados = useMemo(() => {
    return leads.filter((lead) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const nomeMatch = (lead.business_name || "").toLowerCase().includes(q);
        const cityMatch = (lead.city || "").toLowerCase().includes(q);
        const emailMatch = (lead.email || "").toLowerCase().includes(q);
        const phoneMatch = (lead.phone || "").toLowerCase().includes(q);
        if (!nomeMatch && !cityMatch && !emailMatch && !phoneMatch) return false;
      }

      if (filterContato === "telefone" && !lead.phone) return false;
      if (filterContato === "email" && !lead.email) return false;
      if (filterContato === "whatsapp" && !lead.whatsapp) return false;

      return true;
    });
  }, [leads, search, filterContato]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginados = filtrados.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Barra de Ações: Busca + Filtro de Contato + Exportar CSV */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-home-border bg-home-surface/90 p-3.5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-home-muted" />
            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por empresa, telefone, e-mail ou cidade..."
              className="h-9 w-full rounded-xl border border-home-border bg-home-surface-strong pl-9 pr-3 text-xs text-white placeholder:text-home-muted outline-none focus:border-amber-500/80"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-home-border bg-home-surface-strong p-1">
            <button
              type="button"
              onClick={() => {
                setFilterContato("todos");
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                filterContato === "todos"
                  ? "bg-home-orange text-white"
                  : "text-home-muted hover:text-white",
              )}
            >
              Todos ({leads.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterContato("whatsapp");
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                filterContato === "whatsapp"
                  ? "bg-home-orange text-white"
                  : "text-home-muted hover:text-white",
              )}
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterContato("email");
                setPage(1);
              }}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors",
                filterContato === "email"
                  ? "bg-home-orange text-white"
                  : "text-home-muted hover:text-white",
              )}
            >
              E-mail
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportLeadsCsv(filtrados, lista.name)}
            className="h-9 gap-1.5 border-home-border bg-home-surface-strong text-xs font-semibold text-white hover:bg-home-surface"
          >
            <Download className="size-3.5" />
            Exportar CSV ({filtrados.length})
          </Button>

          <Button
            size="sm"
            onClick={onOpenLeadsCentral}
            className="h-9 gap-1.5 bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90 shadow-[0_0_15px_rgba(255,98,0,0.3)]"
          >
            <ExternalLink className="size-3.5" />
            Abrir na Central de Leads
          </Button>
        </div>
      </div>

      {/* Tabela de Leads */}
      <div className="overflow-hidden rounded-2xl border border-home-border bg-home-surface/90 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-home-border bg-home-surface-strong/60 text-[11px] font-semibold text-home-muted uppercase tracking-wider">
                <th className="px-4 py-3">Empresa</th>
                <th className="px-3 py-3">Localização</th>
                <th className="px-3 py-3">Canais de Contato</th>
                <th className="px-3 py-3 text-center">Score</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Avaliações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-home-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-home-muted">
                    Carregando leads da lista...
                  </td>
                </tr>
              ) : paginados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-home-muted">
                    Nenhum lead encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginados.map((lead) => (
                  <tr key={lead.id} className="hover:bg-home-surface-strong/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-white">
                      <div className="flex flex-col">
                        <span>{lead.business_name || "Empresa sem nome"}</span>
                        {lead.category && (
                          <span className="text-[11px] text-home-muted font-normal">
                            {lead.category}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-home-muted">
                      {[lead.city, lead.state].filter(Boolean).join(" - ") || "—"}
                    </td>

                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {lead.whatsapp && (
                          <span
                            title={`WhatsApp: ${lead.whatsapp}`}
                            className="flex size-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-400"
                          >
                            <SiWhatsapp className="size-3.5" />
                          </span>
                        )}
                        {lead.phone && (
                          <span
                            title={`Telefone: ${lead.phone}`}
                            className="flex size-6 items-center justify-center rounded bg-blue-500/10 text-blue-400"
                          >
                            <Phone className="size-3.5" />
                          </span>
                        )}
                        {lead.email && (
                          <span
                            title={`E-mail: ${lead.email}`}
                            className="flex size-6 items-center justify-center rounded bg-amber-500/10 text-amber-400"
                          >
                            <Mail className="size-3.5" />
                          </span>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Site: ${lead.website}`}
                            className="flex size-6 items-center justify-center rounded bg-slate-500/10 text-slate-400 hover:text-white"
                          >
                            <Globe className="size-3.5" />
                          </a>
                        )}
                        {lead.instagram_url && (
                          <span
                            title="Instagram"
                            className="flex size-6 items-center justify-center rounded bg-pink-500/10 text-pink-400"
                          >
                            <SiInstagram className="size-3.5" />
                          </span>
                        )}
                        {!lead.phone && !lead.email && !lead.whatsapp && !lead.website && (
                          <span className="text-[11px] text-home-muted/60">—</span>
                        )}
                      </div>
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-400 tabular-nums border border-amber-500/25">
                        {lead.score ?? 70}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                        {lead.status === "new" ? "Novo" : lead.status}
                      </span>
                    </td>

                    <td className="px-3 py-3 text-home-muted">
                      {lead.rating ? (
                        <div className="flex items-center gap-1 font-semibold text-white">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          <span>{lead.rating}</span>
                          {lead.review_count && (
                            <span className="text-[10px] text-home-muted font-normal">
                              ({lead.review_count})
                            </span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-home-border px-4 py-3 text-xs text-home-muted">
            <span>
              Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a{" "}
              {Math.min(currentPage * PAGE_SIZE, filtrados.length)} de {filtrados.length} leads
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface disabled:opacity-40 hover:text-white"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 font-semibold text-white">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface disabled:opacity-40 hover:text-white"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
