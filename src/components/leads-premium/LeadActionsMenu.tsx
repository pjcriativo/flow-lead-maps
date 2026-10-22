import {
  Columns3,
  Copy,
  Download,
  Eye,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
  UserPlus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LeadItem } from "./leads-premium-data";

export type LeadMenuAction =
  | "details"
  | "edit"
  | "pipeline"
  | "assign"
  | "list"
  | "export"
  | "copy-phone"
  | "copy-email"
  | "delete";

const itemClass =
  "cursor-pointer gap-2 rounded-lg px-2.5 py-2 text-xs text-white focus:bg-home-surface-strong focus:text-white data-[disabled]:opacity-40";

/** Menu "⋮" da linha do lead: cada item executa uma ação real sobre ESTE lead. */
export function LeadActionsMenu({
  lead,
  canDelete,
  onAction,
}: {
  lead: LeadItem;
  canDelete: boolean;
  onAction: (action: LeadMenuAction, lead: LeadItem) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Mais opções"
          aria-label={`Mais opções de ${lead.company}`}
          className="flex size-7 items-center justify-center rounded-lg text-home-muted transition-colors hover:bg-home-surface hover:text-white data-[state=open]:bg-home-surface data-[state=open]:text-white"
        >
          <MoreVertical className="size-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl border-home-border bg-home-surface p-1.5 text-white shadow-xl"
      >
        <DropdownMenuItem className={itemClass} onSelect={() => onAction("details", lead)}>
          <Eye className="size-3.5 text-cyan-400" /> Ver detalhes
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onSelect={() => onAction("pipeline", lead)}>
          <Columns3 className="size-3.5 text-purple-400" /> Abrir no pipeline
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onSelect={() => onAction("edit", lead)}>
          <Pencil className="size-3.5 text-amber-400" /> Editar dados
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-home-border/70" />
        <DropdownMenuItem className={itemClass} onSelect={() => onAction("assign", lead)}>
          <UserPlus className="size-3.5 text-emerald-400" /> Atribuir responsável
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onSelect={() => onAction("list", lead)}>
          <FolderPlus className="size-3.5 text-sky-400" /> Adicionar a uma lista
        </DropdownMenuItem>
        <DropdownMenuItem className={itemClass} onSelect={() => onAction("export", lead)}>
          <Download className="size-3.5 text-home-muted" /> Exportar este lead
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-home-border/70" />
        <DropdownMenuItem
          className={itemClass}
          disabled={!lead.phone && !lead.whatsapp}
          onSelect={() => onAction("copy-phone", lead)}
        >
          <Copy className="size-3.5 text-home-muted" /> Copiar telefone
        </DropdownMenuItem>
        <DropdownMenuItem
          className={itemClass}
          disabled={!lead.email}
          onSelect={() => onAction("copy-email", lead)}
        >
          <Copy className="size-3.5 text-home-muted" /> Copiar e-mail
        </DropdownMenuItem>
        {canDelete ? (
          <>
            <DropdownMenuSeparator className="bg-home-border/70" />
            <DropdownMenuItem
              className={`${itemClass} text-rose-300 focus:text-rose-300`}
              onSelect={() => onAction("delete", lead)}
            >
              <Trash2 className="size-3.5" /> Excluir lead
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
