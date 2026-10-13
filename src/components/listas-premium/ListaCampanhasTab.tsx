// Aba Campanhas da Lista Selecionada
import { Megaphone, Plus, Mail, MessageCircle, Calendar, Users, ExternalLink } from "lucide-react";
import { SiInstagram, SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { formatData } from "@/lib/format";
import type { CampanhaComCanal, LeadListWithFullStats } from "./listas-premium-data";

interface ListaCampanhasTabProps {
  lista: LeadListWithFullStats;
  campaigns: CampanhaComCanal[];
  onCreateCampaign: () => void;
  onOpenCampaignsCentral: () => void;
}

export function ListaCampanhasTab({
  lista,
  campaigns,
  onCreateCampaign,
  onOpenCampaignsCentral,
}: ListaCampanhasTabProps) {
  const getChannelIcon = (canal?: string) => {
    switch (canal) {
      case "whatsapp":
        return <SiWhatsapp className="size-4 text-emerald-400" />;
      case "instagram":
        return <SiInstagram className="size-4 text-pink-400" />;
      case "email":
      default:
        return <Mail className="size-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md">
        <div>
          <h3 className="text-sm font-bold text-white">Campanhas Conectadas a esta Lista</h3>
          <p className="text-xs text-home-muted">
            {campaigns.length}{" "}
            {campaigns.length === 1 ? "campanha associada" : "campanhas associadas"} a {lista.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenCampaignsCentral}
            className="h-9 gap-1.5 border-home-border bg-home-surface-strong text-xs font-semibold text-white hover:bg-home-surface"
          >
            <ExternalLink className="size-3.5" />
            Central de Campanhas
          </Button>

          <Button
            size="sm"
            onClick={onCreateCampaign}
            className="h-9 gap-1.5 bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90 shadow-[0_0_15px_rgba(255,98,0,0.3)]"
          >
            <Plus className="size-4 stroke-[2.5]" />
            Nova campanha para esta lista
          </Button>
        </div>
      </div>

      {/* Lista de Campanhas */}
      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-home-border bg-home-surface/60 p-12 text-center">
          <Megaphone className="size-8 text-home-muted" />
          <h4 className="mt-3 text-sm font-semibold text-white">Nenhuma campanha criada ainda</h4>
          <p className="mt-1 text-xs text-home-muted max-w-sm">
            Esta lista ainda não foi conectada a uma campanha de prospecção por e-mail ou WhatsApp.
          </p>
          <Button
            size="sm"
            onClick={onCreateCampaign}
            className="mt-4 h-9 gap-1.5 bg-home-orange text-xs font-bold text-white hover:bg-home-orange/90"
          >
            <Plus className="size-3.5" />
            Criar primeira campanha
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="flex flex-col justify-between rounded-2xl border border-home-border bg-home-surface/90 p-4 backdrop-blur-md transition-all hover:border-home-border/90 hover:bg-home-surface-strong/90"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-home-surface-strong border border-home-border">
                    {getChannelIcon(camp.canal)}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-1">
                      {camp.nome}
                    </h4>
                    <span className="text-[11px] text-home-muted capitalize">
                      Canal: {camp.canal || "não informado"}
                    </span>
                  </div>
                </div>

                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
                  {camp.status}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-home-border/60 pt-3 text-[11px] text-home-muted">
                <span className="flex items-center gap-1 font-semibold text-white">
                  <Users className="size-3.5 text-home-muted" />
                  {camp.total} destinatários
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="size-3 text-home-muted" />
                  {formatData(camp.criada_em)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
