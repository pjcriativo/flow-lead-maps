import { useState } from "react";
import { CheckCircle2, Clock3, EllipsisVertical, ExternalLink, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FlowBusinessCard, FlowBusinessTask } from "@/services/flow-business";

export type TaskPriority = "Alta" | "Média" | "Baixa";

export function getTaskPriority(task: FlowBusinessTask, card?: FlowBusinessCard): TaskPriority {
  if (card?.temperature === "quente") return "Alta";
  if (card?.temperature === "morno") return "Média";
  if (card?.temperature === "frio") return "Baixa";

  if (task.actionType === "send_dm" || task.actionType === "analyze") return "Alta";
  if (task.actionType === "comment" || task.actionType === "like" || task.actionType === "follow")
    return "Média";
  return "Baixa";
}

export function formatTaskTime(dueAt: string): string {
  try {
    const date = new Date(dueAt);
    if (isNaN(date.getTime())) return "09:00";
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "09:00";
  }
}

interface TodayTaskRowProps {
  task: FlowBusinessTask;
  card?: FlowBusinessCard;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onComplete: (task: FlowBusinessTask) => Promise<void>;
  onOpenCrm?: (cardId: string) => void;
}

export function TodayTaskRow({
  task,
  card,
  selected,
  onSelect,
  onComplete,
  onOpenCrm,
}: TodayTaskRowProps) {
  const [completing, setCompleting] = useState(false);
  const priority = getTaskPriority(task, card);
  const timeFormatted = formatTaskTime(task.dueAt);

  const cleanUsername = task.username?.replace(/^@/, "") || "";
  const instagramUrl =
    task.instagramUrl ||
    (cleanUsername ? `https://www.instagram.com/${cleanUsername}` : null);

  const avatarUrl = card?.profilePictureUrl || undefined;
  const initials = (task.businessName || cleanUsername || "IG").slice(0, 2).toUpperCase();

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(task);
    } finally {
      setCompleting(false);
    }
  };

  const copyLink = () => {
    if (instagramUrl) {
      void navigator.clipboard.writeText(instagramUrl);
      toast.success("Link do perfil copiado.");
    }
  };

  return (
    <div
      className={cn(
        "group flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 px-4 py-3 sm:px-6 transition-colors",
        selected ? "bg-blue-50/40" : "hover:bg-slate-50/70",
      )}
    >
      {/* Coluna 1: Checkbox + Título da Ação */}
      <div className="flex min-w-[210px] items-center gap-3.5 shrink-0">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelect(checked === true)}
          aria-label={`Selecionar ação ${task.title}`}
          className="border-slate-300 data-[state=checked]:bg-[#2563EB] data-[state=checked]:border-[#2563EB]"
        />

        <div className="min-w-0">
          <p className="font-semibold text-xs sm:text-sm text-slate-900 leading-snug">
            {task.title}
          </p>
        </div>
      </div>

      {/* Coluna 2: Informações do Lead (Avatar + Nome + @username) */}
      <div className="flex min-w-[190px] flex-1 items-center gap-2.5">
        <Avatar className="size-8 sm:size-9 rounded-lg border border-slate-200 shrink-0">
          <AvatarImage src={avatarUrl} alt={task.businessName} />
          <AvatarFallback className="rounded-lg bg-gradient-to-tr from-[#F77737]/15 to-[#833AB4]/15 text-[11px] font-bold text-slate-700">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-slate-900 leading-tight">
            {task.businessName || "Lead do Instagram"}
          </p>
          <p className="truncate text-[11px] text-slate-400">
            {cleanUsername ? `@${cleanUsername}` : "Sem usuário"}
          </p>
        </div>
      </div>

      {/* Coluna 3: Prioridade Badge */}
      <div className="w-16 shrink-0 flex items-center justify-start">
        {priority === "Alta" && (
          <Badge
            variant="outline"
            className="border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600"
          >
            Alta
          </Badge>
        )}
        {priority === "Média" && (
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600"
          >
            Média
          </Badge>
        )}
        {priority === "Baixa" && (
          <Badge
            variant="outline"
            className="border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600"
          >
            Baixa
          </Badge>
        )}
      </div>

      {/* Coluna 4: Horário previsto */}
      <div className="w-20 shrink-0 flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
        <Clock3 className="size-3.5 text-slate-400" />
        <span>{timeFormatted}</span>
      </div>

      {/* Coluna 5: Ações: Abrir Perfil + Concluir + Menu */}
      <div className="shrink-0 flex items-center gap-2">
        {instagramUrl ? (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="h-8 rounded-xl border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <a href={instagramUrl} target="_blank" rel="noreferrer">
              <span>Abrir perfil</span>
              <ExternalLink className="size-3 text-slate-400 ml-1" />
            </a>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-8 rounded-xl border-slate-200 bg-white px-3 text-xs font-medium text-slate-400"
          >
            Abrir perfil
          </Button>
        )}

        <Button
          size="sm"
          disabled={completing}
          onClick={handleComplete}
          className="h-8 rounded-xl bg-[#2563EB] px-3.5 text-xs font-semibold text-white shadow-sm shadow-blue-500/10 hover:bg-[#1d4ed8]"
        >
          {completing ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="size-3.5" />
          )}
          <span>Concluir</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <EllipsisVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onOpenCrm && task.cardId && (
              <DropdownMenuItem onClick={() => onOpenCrm(task.cardId)}>
                Ver no CRM
              </DropdownMenuItem>
            )}
            {instagramUrl && (
              <DropdownMenuItem onClick={copyLink}>Copiar link do perfil</DropdownMenuItem>
            )}
            {task.instructions && (
              <DropdownMenuItem onClick={() => toast.info(task.instructions)}>
                Ver instruções da ação
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
