import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/home-premium/DashboardHeader";
import { cn } from "@/lib/utils";
import { LeadsFiltersBar } from "./LeadsFiltersBar";
import { LeadsHeader } from "./LeadsHeader";
import { LeadsStatsCards } from "./LeadsStatsCards";
import { LeadsTable } from "./LeadsTable";
import { LeadDetailsPanel } from "./LeadDetailsPanel";
import {
  LEADS_METRICS,
  MOCK_LEADS,
  type LeadItem,
} from "./leads-premium-data";

interface LeadsPremiumViewProps {
  user?: {
    name: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  onOpenRedesign?: (leadId: string) => void;
}

export function LeadsPremiumView({
  user = {
    name: "Marcos Gonçalves",
    avatarUrl: "",
    initials: "MG",
  },
  unreadNotifications = 3,
}: LeadsPremiumViewProps) {
  const [leadsList] = useState<LeadItem[]>(MOCK_LEADS);
  // Por padrão, o primeiro lead (Clínica Odonto Prime) fica selecionado, exatamente como na tela aprovada
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(MOCK_LEADS[0] || null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTag, setSelectedTag] = useState("all");
  const [selectedScore, setSelectedScore] = useState("all");

  // Filtra os leads conforme os critérios
  const filteredLeads = useMemo(() => {
    return leadsList.filter((lead) => {
      // Busca textual
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          lead.company.toLowerCase().includes(q) ||
          lead.contactName.toLowerCase().includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.city.toLowerCase().includes(q) ||
          lead.tags.some((t) => t.toLowerCase().includes(q));

        if (!matchesQuery) return false;
      }

      // Canal
      if (selectedChannel !== "all" && lead.channel !== selectedChannel) {
        return false;
      }

      // Status
      if (selectedStatus !== "all" && lead.status !== selectedStatus) {
        return false;
      }

      // Tag
      if (selectedTag !== "all" && !lead.tags.includes(selectedTag)) {
        return false;
      }

      // Score
      if (selectedScore !== "all") {
        if (selectedScore === "90+" && lead.score < 90) return false;
        if (selectedScore === "80+" && lead.score < 80) return false;
        if (selectedScore === "70+" && (lead.score < 70 || lead.score >= 80)) return false;
        if (selectedScore === "60-" && lead.score >= 70) return false;
      }

      return true;
    });
  }, [leadsList, searchQuery, selectedChannel, selectedStatus, selectedTag, selectedScore]);

  const handleSelectLead = (lead: LeadItem) => {
    setSelectedLead(lead);
  };

  const handleClosePanel = () => {
    setSelectedLead(null);
  };

  const handleImport = () => {
    toast.info("Importação de Leads: Selecione uma planilha (.csv, .xlsx) ou integre com CRM.");
  };

  const handleExport = () => {
    toast.success(`Exportando ${filteredLeads.length} leads em formato CSV...`);
  };

  const handleNewLead = () => {
    toast.info("Adicionar novo lead: Formulário de cadastro rápido de lead.");
  };

  return (
    <div className="min-h-svh bg-home-background text-home-foreground">
      {/* Topbar com busca global e perfil */}
      <DashboardHeader user={user} unreadNotifications={unreadNotifications} />

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-[1720px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
        {/* Cabeçalho da página: Título + Ações */}
        <LeadsHeader
          onImport={handleImport}
          onExport={handleExport}
          onNewLead={handleNewLead}
        />

        {/* Linha de Indicadores / Métricas (5 Cards) */}
        <LeadsStatsCards metrics={LEADS_METRICS} />

        {/* Barra de Filtros */}
        <LeadsFiltersBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedChannel={selectedChannel}
          onChannelChange={setSelectedChannel}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedTag={selectedTag}
          onTagChange={setSelectedTag}
          selectedScore={selectedScore}
          onScoreChange={setSelectedScore}
          activeFilterCount={2}
          onOpenMoreFilters={() => toast.info("Painel de filtros avançados")}
        />

        {/* Composição: Tabela Principal (68%) + Painel Lateral (32%) */}
        <section
          className={cn(
            "grid gap-4 items-start",
            selectedLead
              ? "lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px] 2xl:grid-cols-[1fr_420px]"
              : "grid-cols-1",
          )}
        >
          {/* Tabela de Leads */}
          <div className="min-w-0">
            <LeadsTable
              leads={filteredLeads}
              selectedLeadId={selectedLead?.id || null}
              onSelectLead={handleSelectLead}
            />
          </div>

          {/* Painel Lateral Direito do Lead */}
          {selectedLead && (
            <div className="min-w-0 sticky top-5">
              <LeadDetailsPanel
                lead={selectedLead}
                onClose={handleClosePanel}
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
