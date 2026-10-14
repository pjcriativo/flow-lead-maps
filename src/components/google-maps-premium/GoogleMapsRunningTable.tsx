import { useState, useMemo } from "react";
import { Download, ExternalLink, Globe, Instagram, Mail, Phone, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/leads-api";

interface GoogleMapsRunningTableProps {
  leads: Lead[];
  running: boolean;
  duplicatasCount: number;
  paginaAtual?: number;
  itensPorPagina?: number;
  totalLeads?: number;
}

export function GoogleMapsRunningTable({
  leads,
  running,
  duplicatasCount,
  paginaAtual = 1,
  itensPorPagina = 10,
  totalLeads = 0,
}: GoogleMapsRunningTableProps) {
  const [tabFiltro, setTabFiltro] = useState<"todos" | "ineditos" | "duplicatas">("todos");
  const [buscaNome, setBuscaNome] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);

  // Filtra por tab e busca por texto
  const leadsFiltrados = useMemo(() => {
    let res = leads;
    if (buscaNome.trim()) {
      const q = buscaNome.toLowerCase().trim();
      res = res.filter(
        (l) =>
          l.business_name.toLowerCase().includes(q) ||
          (l.address && l.address.toLowerCase().includes(q)) ||
          (l.category && l.category.toLowerCase().includes(q)),
      );
    }
    return res;
  }, [leads, buscaNome]);

  const totalIneditos = leadsFiltrados.length;
  const totalGeral = leadsFiltrados.length + duplicatasCount;

  // Paginação dos resultados filtrados
  const leadsPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return leadsFiltrados.slice(inicio, inicio + itensPorPagina);
  }, [leadsFiltrados, paginaAtual, itensPorPagina]);

  const totalPaginas = Math.max(1, Math.ceil(totalGeral / itensPorPagina));

  // Exportar dados em CSV
  const handleExportarCSV = () => {
    if (leadsFiltrados.length === 0) return;
    const header = [
      "Nome",
      "Categoria",
      "Telefone",
      "WhatsApp",
      "E-mail",
      "Site",
      "Instagram",
      "Endereço",
      "Cidade",
      "Estado",
      "Avaliação",
      "Score",
    ];
    const rows = leadsFiltrados.map((l) => [
      `"${l.business_name.replace(/"/g, '""')}"`,
      `"${(l.category || "").replace(/"/g, '""')}"`,
      `"${l.phone || ""}"`,
      `"${l.whatsapp || ""}"`,
      `"${l.email || ""}"`,
      `"${l.website || ""}"`,
      `"${l.instagram_url || ""}"`,
      `"${(l.address || "").replace(/"/g, '""')}"`,
      `"${l.city || ""}"`,
      `"${l.state || ""}"`,
      `"${l.rating || ""}"`,
      `"${l.score || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [header.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `google_maps_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleSelectAll = () => {
    if (selecionados.length === leadsFiltrados.length) {
      setSelecionados([]);
    } else {
      setSelecionados(leadsFiltrados.map((l) => l.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  return (
    <div className="rounded-2xl border border-home-border bg-home-surface/90 shadow-sm overflow-hidden backdrop-blur-md space-y-0">
      {/* Cabeçalho da Tabela */}
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-home-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white">Empresas encontradas ({totalGeral})</h3>
            {running && <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />}
          </div>
          <p className="text-[11px] text-home-muted">Resultados sendo atualizados em tempo real</p>
        </div>

        {/* Controles de Filtro, Busca e Exportação */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tabs de Filtro */}
          <div className="flex rounded-xl border border-home-border bg-[#101720] p-1 text-xs">
            <button
              type="button"
              onClick={() => setTabFiltro("todos")}
              className={cn(
                "rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer",
                tabFiltro === "todos"
                  ? "bg-home-orange text-white shadow-sm"
                  : "text-home-muted hover:text-white",
              )}
            >
              Todos ({totalGeral})
            </button>
            <button
              type="button"
              onClick={() => setTabFiltro("ineditos")}
              className={cn(
                "rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer",
                tabFiltro === "ineditos"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-home-muted hover:text-white",
              )}
            >
              Inéditos ({totalIneditos})
            </button>
            <button
              type="button"
              onClick={() => setTabFiltro("duplicatas")}
              className={cn(
                "rounded-lg px-2.5 py-1 font-semibold transition-colors cursor-pointer",
                tabFiltro === "duplicatas"
                  ? "bg-amber-500 text-white shadow-sm"
                  : "text-home-muted hover:text-white",
              )}
            >
              Duplicatas ({duplicatasCount})
            </button>
          </div>

          {/* Campo de Busca por Nome */}
          <div className="relative min-w-[200px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-home-muted" />
            <input
              type="text"
              value={buscaNome}
              onChange={(e) => setBuscaNome(e.target.value)}
              placeholder="Buscar empresa por nome..."
              className="h-8.5 w-full rounded-xl border border-home-border bg-[#101720] pl-8.5 pr-3 text-xs text-white placeholder:text-home-muted outline-none focus:border-home-orange transition-colors"
            />
          </div>

          {/* Botão Exportar CSV */}
          <button
            type="button"
            onClick={handleExportarCSV}
            disabled={leadsFiltrados.length === 0}
            className="flex h-8.5 items-center gap-1.5 rounded-xl border border-home-border bg-[#101720] px-3 text-xs font-semibold text-white hover:border-home-orange hover:text-home-orange transition-colors disabled:opacity-40 cursor-pointer"
          >
            <Download className="size-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Tabela de Empresas */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-home-border">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-home-border/60 bg-[#0e141d]/70 text-[10px] font-bold uppercase tracking-wider text-home-muted select-none">
              <th className="w-10 px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={
                    leadsFiltrados.length > 0 && selecionados.length === leadsFiltrados.length
                  }
                  onChange={handleToggleSelectAll}
                  className="rounded border-home-border bg-home-surface text-home-orange focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="px-3 py-3">Empresa</th>
              <th className="px-3 py-3">Categoria</th>
              <th className="px-3 py-3">Avaliação</th>
              <th className="px-3 py-3">Telefone</th>
              <th className="px-3 py-3">Site</th>
              <th className="px-3 py-3">E-mail</th>
              <th className="px-3 py-3">Instagram</th>
              <th className="px-3 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-home-border/40 text-home-foreground/90">
            {tabFiltro === "duplicatas" ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-home-muted">
                  {duplicatasCount > 0 ? (
                    <div>
                      <p className="font-semibold text-amber-400">
                        {duplicatasCount} empresas já pertenciam à sua organização
                      </p>
                      <p className="text-[11px] text-home-muted mt-0.5">
                        Registros previamente entregues são desconsiderados automaticamente para não
                        consumir cotas.
                      </p>
                    </div>
                  ) : (
                    "Nenhuma duplicata descartada nesta execução."
                  )}
                </td>
              </tr>
            ) : leadsFiltrados.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-xs text-home-muted">
                  {running
                    ? "Buscando e qualificando empresas na região..."
                    : "Nenhum lead encontrado."}
                </td>
              </tr>
            ) : (
              leadsPaginados.map((lead) => {
                const isSelected = selecionados.includes(lead.id);

                return (
                  <tr
                    key={lead.id}
                    className={cn(
                      "hover:bg-[#121a24] transition-colors",
                      isSelected && "bg-home-orange/5",
                    )}
                  >
                    {/* Checkbox */}
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectOne(lead.id)}
                        className="rounded border-home-border bg-home-surface text-home-orange focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Empresa */}
                    <td className="px-3 py-3">
                      <div className="font-bold text-white text-xs">{lead.business_name}</div>
                      <div className="text-[11px] text-home-muted truncate max-w-xs">
                        {lead.address || "Sem endereço completo"}
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="px-3 py-3 text-[11px] text-home-muted">
                      {lead.category || "Empresa local"}
                    </td>

                    {/* Avaliação */}
                    <td className="px-3 py-3">
                      {lead.rating ? (
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-white text-xs">{lead.rating}</span>
                          <div className="flex text-amber-400">
                            <Star className="size-3 fill-amber-400" />
                          </div>
                          {lead.review_count ? (
                            <span className="text-[10px] text-home-muted">
                              ({lead.review_count})
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-home-muted/60">—</span>
                      )}
                    </td>

                    {/* Telefone */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-medium text-xs"
                        >
                          <Phone className="size-3" />
                          <span>{lead.phone}</span>
                        </a>
                      ) : (
                        <span className="text-home-muted/60">—</span>
                      )}
                    </td>

                    {/* Site */}
                    <td className="px-3 py-3">
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors text-xs truncate max-w-[150px]"
                        >
                          <Globe className="size-3 shrink-0" />
                          <span className="truncate">
                            {lead.website.replace(/^https?:\/\/(www\.)?/, "")}
                          </span>
                          <ExternalLink className="size-2.5 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-home-muted/60">—</span>
                      )}
                    </td>

                    {/* E-mail */}
                    <td className="px-3 py-3">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1 text-home-foreground/90 hover:text-white transition-colors text-xs truncate max-w-[160px]"
                        >
                          <Mail className="size-3 text-home-orange shrink-0" />
                          <span className="truncate">{lead.email}</span>
                        </a>
                      ) : (
                        <span className="text-home-muted/60">—</span>
                      )}
                    </td>

                    {/* Instagram */}
                    <td className="px-3 py-3">
                      {lead.instagram_url ? (
                        <a
                          href={lead.instagram_url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors text-xs truncate max-w-[130px]"
                        >
                          <Instagram className="size-3 shrink-0" />
                          <span className="truncate">
                            @{lead.instagram_url.split("/").filter(Boolean).pop()}
                          </span>
                        </a>
                      ) : (
                        <span className="text-home-muted/60">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                        Novo lead
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
