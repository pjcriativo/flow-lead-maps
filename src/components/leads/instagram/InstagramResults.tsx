import { ExternalLink, Instagram, Mail, MapPin, MessageCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Lead } from "@/lib/leads-api";
import type { ColetaRedes } from "@/services/whatsapp";
import { cn } from "@/lib/utils";

const MOTIVOS: Record<string, string> = {
  perfil_invalido: "perfil inválido",
  fora_nicho: "fora do nicho",
  fora_localidade: "sem confirmação da cidade",
  nao_comercial: "conta pessoal",
  com_site_proprio: "já possui site",
  poucos_seguidores: "abaixo dos seguidores mínimos",
  sem_contato_externo: "sem contato externo",
};

export function InstagramRunSummary({ resumo }: { resumo: ColetaRedes["resumo"] }) {
  if (!resumo) return null;
  const rejeitados = Object.entries(resumo.rejeitados).filter(([, total]) => total > 0);
  return (
    <div className="grid gap-3 border-b border-border bg-secondary/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Perfis analisados" value={resumo.analisados} />
      <Metric label="Perfis relevantes" value={resumo.aprovados} />
      <Metric label="Novos leads" value={resumo.novos} accent />
      <Metric label="Já estavam na base" value={resumo.duplicados} />
      {rejeitados.length > 0 && (
        <div className="sm:col-span-2 lg:col-span-4">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Por que alguns perfis não entraram
          </p>
          <div className="flex flex-wrap gap-2">
            {rejeitados.map(([motivo, total]) => (
              <span
                key={motivo}
                className="rounded-full border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground"
              >
                {total} {MOTIVOS[motivo] ?? motivo}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <div className={cn("text-2xl font-semibold tabular-nums", accent && "text-primary")}>
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

export function InstagramResultsTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-sm">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Aderência</th>
            <th className="px-4 py-3 font-medium">Perfil</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 font-medium">Localidade</th>
            <th className="px-4 py-3 font-medium">Seguidores</th>
            <th className="px-4 py-3 font-medium">Canais</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id} className="border-t border-border hover:bg-secondary/30">
              <td className="px-4 py-3">
                <AdherenceBadge lead={lead} />
              </td>
              <td className="max-w-[280px] px-4 py-3">
                <div className="font-semibold text-foreground">{lead.business_name}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">
                  {instagramHandle(lead.instagram_url)}
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {lead.category || "Não informada"}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  {lead.city || "—"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  {lead.seguidores?.toLocaleString("pt-BR") ?? "—"}
                </span>
              </td>
              <td className="px-4 py-3">
                <Channels lead={lead} />
              </td>
              <td className="px-4 py-3 text-right">
                {lead.instagram_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4" /> Abrir perfil{" "}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function instagramHandle(url: string | null) {
  if (!url) return "Perfil do Instagram";
  const username = url.replace(/\/$/, "").split("/").pop();
  return username ? `@${username}` : "Perfil do Instagram";
}

function AdherenceBadge({ lead }: { lead: Lead }) {
  const alta = lead.score >= 80;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        alta
          ? "bg-primary/10 text-primary ring-primary/20"
          : "bg-secondary text-muted-foreground ring-border",
      )}
    >
      {lead.score}%
    </span>
  );
}

function Channels({ lead }: { lead: Lead }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
        <Instagram className="h-3 w-3" /> DM
      </span>
      {lead.whatsapp && (
        <span
          title={lead.whatsapp}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
        >
          <MessageCircle className="h-3 w-3" /> WhatsApp
        </span>
      )}
      {lead.email && (
        <span
          title={lead.email}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
        >
          <Mail className="h-3 w-3" /> E-mail
        </span>
      )}
    </div>
  );
}
