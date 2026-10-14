import { useState } from "react";
import {
  ArrowUpDown,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  MapPin,
  MoreVertical,
  RotateCw,
} from "lucide-react";
import type { SearchHistoryItem } from "./google-maps-history-types";
import { GoogleMapsCategoryIcon } from "./GoogleMapsCategoryIcon";

interface GoogleMapsHistoryTableProps {
  items: SearchHistoryItem[];
  selectedItemId: string | null;
  onSelectItem: (item: SearchHistoryItem) => void;
  selectedRowIds: Set<string>;
  onToggleSelectRow: (id: string) => void;
  onToggleSelectPage: () => void;
  allPageSelected: boolean;
  onVerResultados: (item: SearchHistoryItem) => void;
  onNovaBuscaComCriterios: (item: SearchHistoryItem) => void;
  onOpenLista?: (listId: string) => void;
  sortField: "dataHora" | "solicitado" | "encontrados";
  sortDirection: "asc" | "desc";
  onToggleSort: (field: "dataHora" | "solicitado" | "encontrados") => void;
}

export function GoogleMapsHistoryTable({
  items,
  selectedItemId,
  onSelectItem,
  selectedRowIds,
  onToggleSelectRow,
  onToggleSelectPage,
  allPageSelected,
  onVerResultados,
  onNovaBuscaComCriterios,
  onOpenLista,
  sortField,
  sortDirection,
  onToggleSort,
}: GoogleMapsHistoryTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const formatDataHora = (iso: string) => {
    const d = new Date(iso);
    const dataStr = d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const horaStr = d.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { dataStr, horaStr };
  };

  const renderStatusBadge = (item: SearchHistoryItem) => {
    if (item.status === "concluida") {
      return (
        <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
          Concluída
        </span>
      );
    }
    if (item.status === "parcial") {
      return (
        <span className="inline-flex items-center rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
          Parcial
        </span>
      );
    }
    if (item.status === "erro") {
      return (
        <span className="inline-flex items-center rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-400">
          Erro
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
        {item.statusLabel}
      </span>
    );
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-home-border bg-home-surface/90 p-12 text-center space-y-3">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-home-surface-strong text-home-muted border border-home-border">
          <FileSpreadsheet className="size-6 text-home-muted" />
        </div>
        <h3 className="text-sm font-bold text-white">Nenhuma busca encontrada</h3>
        <p className="text-xs text-home-muted max-w-sm mx-auto">
          Não foram encontradas prospecções com os filtros selecionados ou nenhuma busca foi realizada ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-home-border bg-home-surface/90 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-home-border/80 bg-home-surface-strong/40 text-[11px] font-semibold text-home-muted select-none">
              <th className="py-3 pl-4 pr-2 w-10">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={onToggleSelectPage}
                  aria-label="Selecionar todos da página"
                  className="size-4 rounded border-home-border bg-home-surface text-home-orange focus:ring-home-orange/40 cursor-pointer accent-home-orange"
                />
              </th>
              <th
                onClick={() => onToggleSort("dataHora")}
                className="py-3 px-3 hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1">
                  <span>Data e hora</span>
                  <ArrowUpDown className="size-3 text-home-muted" />
                </div>
              </th>
              <th className="py-3 px-3">Nicho / Categoria</th>
              <th className="py-3 px-3">Localização</th>
              <th
                onClick={() => onToggleSort("solicitado")}
                className="py-3 px-3 text-right hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Solicitado</span>
                  <ArrowUpDown className="size-3 text-home-muted" />
                </div>
              </th>
              <th
                onClick={() => onToggleSort("encontrados")}
                className="py-3 px-3 text-right hover:text-white transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Encontrados</span>
                  <ArrowUpDown className="size-3 text-home-muted" />
                </div>
              </th>
              <th className="py-3 px-3 text-right">Inéditos</th>
              <th className="py-3 px-3 text-right">Duplicatas</th>
              <th className="py-3 px-3 text-center">Status</th>
              <th className="py-3 pl-3 pr-4 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-home-border/60">
            {items.map((item) => {
              const { dataStr, horaStr } = formatDataHora(item.dataHora);
              const isSelected = item.id === selectedItemId;
              const isRowChecked = selectedRowIds.has(item.id);

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`group transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-home-surface-strong/70 border-l-2 border-l-home-orange"
                      : "hover:bg-home-surface-strong/40"
                  }`}
                >
                  {/* Checkbox de Seleção */}
                  <td
                    className="py-3.5 pl-4 pr-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectRow(item.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isRowChecked}
                      onChange={() => onToggleSelectRow(item.id)}
                      aria-label={`Selecionar ${item.nicho}`}
                      className="size-4 rounded border-home-border bg-home-surface text-home-orange focus:ring-home-orange/40 cursor-pointer accent-home-orange"
                    />
                  </td>

                  {/* Data e hora */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="block font-semibold text-white">{dataStr}</span>
                    <span className="block text-[11px] text-home-muted">{horaStr}</span>
                  </td>

                  {/* Nicho / Categoria */}
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <GoogleMapsCategoryIcon
                        nicho={item.nicho}
                        categoria={item.categoria}
                        className="size-8"
                      />
                      <div className="min-w-0">
                        <span className="block font-bold text-white line-clamp-1 group-hover:text-home-orange transition-colors">
                          {item.nicho}
                        </span>
                        <span className="block text-[11px] text-home-muted line-clamp-1">
                          {item.categoria}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Localização */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="block font-semibold text-white">
                      {item.cidade} - {item.uf}
                    </span>
                    <span className="block text-[11px] text-home-muted">
                      Raio de {item.raioKm} km
                    </span>
                  </td>

                  {/* Solicitado */}
                  <td className="py-3.5 px-3 text-right font-medium text-white/90">
                    {item.solicitado}
                  </td>

                  {/* Encontrados */}
                  <td className="py-3.5 px-3 text-right font-extrabold text-white">
                    {item.encontrados}
                  </td>

                  {/* Inéditos */}
                  <td className="py-3.5 px-3 text-right font-extrabold text-emerald-400">
                    {item.ineditos}
                  </td>

                  {/* Duplicatas */}
                  <td className="py-3.5 px-3 text-right font-semibold text-amber-400">
                    {item.duplicatas}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {renderStatusBadge(item)}
                  </td>

                  {/* Ações */}
                  <td
                    className="py-3.5 pl-3 pr-4 text-center whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {/* Abrir detalhes / lista */}
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        title="Ver detalhes"
                        className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted hover:text-white hover:bg-home-surface-strong transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="size-3.5" />
                      </button>

                      {/* Abrir localização */}
                      <button
                        type="button"
                        onClick={() => onSelectItem(item)}
                        title="Ver no mapa"
                        className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted hover:text-white hover:bg-home-surface-strong transition-colors cursor-pointer"
                      >
                        <MapPin className="size-3.5" />
                      </button>

                      {/* Menu de Mais Opções */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                          title="Mais opções"
                          className="flex size-7 items-center justify-center rounded-lg border border-home-border bg-home-surface text-home-muted hover:text-white hover:bg-home-surface-strong transition-colors cursor-pointer"
                        >
                          <MoreVertical className="size-3.5" />
                        </button>

                        {openMenuId === item.id && (
                          <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-home-border bg-[#18181b] p-1.5 shadow-2xl text-left space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onVerResultados(item);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white hover:bg-home-surface transition-colors cursor-pointer"
                            >
                              <Eye className="size-3.5 text-home-orange" />
                              <span>Ver resultados</span>
                            </button>

                            {item.listId && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  onOpenLista?.(item.listId!);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white hover:bg-home-surface transition-colors cursor-pointer"
                              >
                                <ExternalLink className="size-3.5 text-blue-400" />
                                <span>Abrir lista</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);
                                onNovaBuscaComCriterios(item);
                              }}
                              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-white hover:bg-home-surface transition-colors cursor-pointer"
                            >
                              <RotateCw className="size-3.5 text-amber-400" />
                              <span>Reutilizar critérios</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
