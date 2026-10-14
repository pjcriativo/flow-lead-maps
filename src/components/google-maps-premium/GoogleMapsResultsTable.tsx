import { useState } from "react";
import {
  Star,
  Phone,
  Globe,
  Mail,
  Instagram,
  CheckSquare,
  Square,
  ExternalLink,
  Copy,
  Layers,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Lead } from "@/lib/leads-api";

export interface GoogleMapsResultsTableProps {
  leads: Lead[];
  selectedLeadIds: Set<string>;
  onToggleSelectLead: (id: string) => void;
  onToggleSelectAllPage: () => void;
  isAllPageSelected: boolean;
  focusedLeadId: string | null;
  onSelectRow: (lead: Lead) => void;
  duplicatasCount?: number;
  activeTab?: string;
}

export function GoogleMapsResultsTable({
  leads,
  selectedLeadIds,
  onToggleSelectLead,
  onToggleSelectAllPage,
  isAllPageSelected,
  focusedLeadId,
  onSelectRow,
  duplicatasCount = 0,
  activeTab = "todos",
}: GoogleMapsResultsTableProps) {
  const copiarEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    toast.success("E-mail copiado para a área de transferência!");
  };

  // Tratamento da aba Duplicatas quando há contagem mas não linhas brutas da RLS
  if (activeTab === "duplicatas" && leads.length === 0 && duplicatasCount > 0) {
    return (
      <div className="rounded-2xl border border-home-border bg-[#101720]/80 p-8 text-center space-y-3">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <Layers className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">
            {duplicatasCount} empresas já conhecidas descartadas
          </h3>
          <p className="text-xs text-home-muted max-w-md mx-auto leading-relaxed">
            Essas empresas já haviam sido entregues à sua organização em buscas anteriores. O motor
            de busca inteligente filtrou automaticamente essas duplicatas para não consumir cotas
            nem duplicar seus contatos.
          </p>
        </div>
      </div>
    );
  }

  // Estado Vazio quando nenhum registro corresponde aos filtros
  if (leads.length === 0) {
    return (
      <div className="rounded-2xl border border-home-border bg-[#101720]/80 p-8 text-center space-y-3">
        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-home-surface text-home-muted">
          <Inbox className="size-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">Nenhuma empresa encontrada</h3>
          <p className="text-xs text-home-muted max-w-md mx-auto">
            Nenhuma empresa corresponde aos critérios e filtros selecionados. Tente ajustar os
            termos de pesquisa ou limpar os filtros.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full overflow-x-auto rounded-2xl border border-home-border bg-[#101720]/90 shadow-sm">
      <table className="min-w-[1180px] w-full border-collapse text-left">
        {/* Cabeçalho da Tabela */}
        <thead>
          <tr className="border-b border-home-border/80 bg-home-surface/40 text-[11px] font-bold uppercase tracking-wider text-home-muted select-none">
            {/* Checkbox Geral */}
            <th className="py-3 px-3.5 w-10 text-center">
              <button
                type="button"
                onClick={onToggleSelectAllPage}
                className="flex items-center justify-center text-home-muted hover:text-home-orange cursor-pointer"
                title="Selecionar todos da página"
              >
                {isAllPageSelected ? (
                  <CheckSquare className="size-4 text-home-orange" />
                ) : (
                  <Square className="size-4" />
                )}
              </button>
            </th>

            {/* Empresa */}
            <th className="py-3 px-3 min-w-[220px]">Empresa</th>

            {/* Categoria */}
            <th className="py-3 px-3 min-w-[140px]">Categoria</th>

            {/* Avaliação */}
            <th className="py-3 px-3 min-w-[120px]">Avaliação</th>

            {/* Telefone */}
            <th className="py-3 px-3 min-w-[130px]">Telefone</th>

            {/* Site */}
            <th className="py-3 px-3 min-w-[140px]">Site</th>

            {/* E-mail */}
            <th className="py-3 px-3 min-w-[160px]">E-mail</th>

            {/* Instagram */}
            <th className="py-3 px-3 min-w-[130px]">Instagram</th>

            {/* Status */}
            <th className="py-3 px-3 min-w-[100px] text-right pr-4">Status</th>
          </tr>
        </thead>

        {/* Corpo da Tabela */}
        <tbody className="divide-y divide-home-border/40 text-xs">
          {leads.map((lead) => {
            const isSelected = selectedLeadIds.has(lead.id);
            const isFocused = focusedLeadId === lead.id;
            const ratingNum = lead.rating ? Number(lead.rating) : null;
            const reviewCount = lead.review_count ? Number(lead.review_count) : null;

            return (
              <tr
                key={lead.id}
                onClick={() => onSelectRow(lead)}
                className={cn(
                  "transition-colors cursor-pointer group",
                  isFocused
                    ? "bg-home-orange/10 border-l-2 border-l-home-orange"
                    : isSelected
                      ? "bg-home-surface/50"
                      : "hover:bg-home-surface/30",
                )}
              >
                {/* Checkbox Individual */}
                <td
                  className="py-3 px-3.5 text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelectLead(lead.id);
                  }}
                >
                  <button
                    type="button"
                    className="flex items-center justify-center text-home-muted hover:text-home-orange cursor-pointer"
                  >
                    {isSelected ? (
                      <CheckSquare className="size-4 text-home-orange" />
                    ) : (
                      <Square className="size-4" />
                    )}
                  </button>
                </td>

                {/* Empresa: Nome e Endereço */}
                <td className="py-3 px-3">
                  <div className="space-y-0.5">
                    <p className="font-bold text-white group-hover:text-home-orange transition-colors truncate max-w-[240px]">
                      {lead.business_name}
                    </p>
                    <p className="text-[11px] text-home-muted truncate max-w-[240px]">
                      {lead.address ||
                        `${lead.city || ""} - ${lead.state || ""}` ||
                        "Endereço não informado"}
                    </p>
                  </div>
                </td>

                {/* Categoria */}
                <td className="py-3 px-3 text-home-muted truncate max-w-[140px]">
                  {lead.category || "Empresa"}
                </td>

                {/* Avaliação */}
                <td className="py-3 px-3">
                  {ratingNum ? (
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-amber-400">{ratingNum.toFixed(1)}</span>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-2.5",
                              i < Math.floor(ratingNum)
                                ? "fill-amber-400 text-amber-400"
                                : "text-home-muted/30",
                            )}
                          />
                        ))}
                      </div>
                      {reviewCount && (
                        <span className="text-home-muted text-[10px]">({reviewCount})</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-home-muted text-[11px]">Sem avaliações</span>
                  )}
                </td>

                {/* Telefone */}
                <td className="py-3 px-3">
                  {lead.phone || lead.whatsapp ? (
                    <a
                      href={`tel:${(lead.phone || lead.whatsapp || "").replace(/\D/g, "")}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:underline"
                    >
                      <Phone className="size-3 text-emerald-400 shrink-0" />
                      <span>{lead.phone || lead.whatsapp}</span>
                    </a>
                  ) : (
                    <span className="text-home-muted">—</span>
                  )}
                </td>

                {/* Site */}
                <td className="py-3 px-3">
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-medium text-cyan-400 hover:underline truncate max-w-[130px]"
                      title={lead.website}
                    >
                      <Globe className="size-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{lead.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  ) : (
                    <span className="text-home-muted">—</span>
                  )}
                </td>

                {/* E-mail */}
                <td className="py-3 px-3">
                  {lead.email ? (
                    <button
                      type="button"
                      onClick={(e) => copiarEmail(lead.email!, e)}
                      className="inline-flex items-center gap-1.5 font-medium text-white hover:text-amber-400 truncate max-w-[150px] cursor-pointer"
                      title="Clique para copiar e-mail"
                    >
                      <Mail className="size-3 text-home-muted shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </button>
                  ) : (
                    <span className="text-home-muted">—</span>
                  )}
                </td>

                {/* Instagram */}
                <td className="py-3 px-3">
                  {lead.instagram_url ? (
                    <a
                      href={lead.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-medium text-purple-400 hover:underline truncate max-w-[120px]"
                      title={lead.instagram_url}
                    >
                      <Instagram className="size-3 text-purple-400 shrink-0" />
                      <span className="truncate">
                        {lead.instagram_url
                          .replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")
                          .replace(/\/$/, "")}
                      </span>
                    </a>
                  ) : (
                    <span className="text-home-muted">—</span>
                  )}
                </td>

                {/* Status */}
                <td className="py-3 px-3 text-right pr-4">
                  <span className="inline-block rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Novo lead
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
