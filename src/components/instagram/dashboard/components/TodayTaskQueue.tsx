import { useMemo, useState } from "react";
import { ChevronDown, ListTodo, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TodayTaskRow, getTaskPriority } from "./TodayTaskRow";
import type { FlowBusinessCard, FlowBusinessTask } from "@/services/flow-business";
import type { InstagramView } from "@/components/instagram/navigation/instagram-navigation";

interface TodayTaskQueueProps {
  tasks: FlowBusinessTask[];
  cards: FlowBusinessCard[];
  onComplete: (task: FlowBusinessTask) => Promise<void>;
  onNavigate: (view: InstagramView) => void;
}

export function TodayTaskQueue({
  tasks,
  cards,
  onComplete,
  onNavigate,
}: TodayTaskQueueProps) {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("urgent");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Mapa rápido de Card por ID para cruzar dados
  const cardMap = useMemo(() => {
    const map = new Map<string, FlowBusinessCard>();
    for (const card of cards) {
      map.set(card.id, card);
    }
    return map;
  }, [cards]);

  // Filtragem de tarefas
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (actionFilter !== "all") {
      result = result.filter((task) => task.actionType === actionFilter);
    }

    if (sortOrder === "urgent") {
      // Ordena por prioridade Alta > Média > Baixa, depois por horário
      const priorityWeight: Record<string, number> = { Alta: 3, Média: 2, Baixa: 1 };
      result.sort((a, b) => {
        const cardA = cardMap.get(a.cardId);
        const cardB = cardMap.get(b.cardId);
        const weightA = priorityWeight[getTaskPriority(a, cardA)] || 0;
        const weightB = priorityWeight[getTaskPriority(b, cardB)] || 0;
        if (weightA !== weightB) return weightB - weightA;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });
    } else if (sortOrder === "time") {
      result.sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
    } else if (sortOrder === "alpha") {
      result.sort((a, b) => (a.businessName || "").localeCompare(b.businessName || ""));
    }

    return result;
  }, [tasks, actionFilter, sortOrder, cardMap]);

  const allSelected =
    filteredTasks.length > 0 && filteredTasks.every((t) => selectedIds.has(t.id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredTasks.map((t) => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (taskId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(taskId);
      else next.delete(taskId);
      return next;
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
      {/* Header da Fila de Hoje */}
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#E1306C]/10 text-[#E1306C]">
            <ListTodo className="size-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Fila de hoje
            </h3>
            <p className="text-xs text-slate-500">
              Execute no Instagram e confirme aqui para avançar o CRM.
            </p>
          </div>
        </div>

        {/* Dropdowns de filtro e ordenação */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-9 w-auto min-w-[150px] rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-none">
              <SelectValue placeholder="Todas as ações" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">Todas as ações ({tasks.length})</SelectItem>
              <SelectItem value="analyze">Analisar oportunidade</SelectItem>
              <SelectItem value="visit_profile">Visitar o perfil</SelectItem>
              <SelectItem value="follow">Seguir o perfil</SelectItem>
              <SelectItem value="like">Interagir com conteúdo</SelectItem>
              <SelectItem value="comment">Comentar com contexto</SelectItem>
              <SelectItem value="send_dm">Enviar abordagem</SelectItem>
              <SelectItem value="follow_up">Acompanhar resposta</SelectItem>
              <SelectItem value="review">Revisar oportunidade</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="h-9 w-auto min-w-[130px] rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-none">
              <SelectValue placeholder="Mais urgentes" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="urgent">Mais urgentes</SelectItem>
              <SelectItem value="time">Ordem cronológica</SelectItem>
              <SelectItem value="alpha">Por nome comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista de tarefas */}
      {filteredTasks.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {filteredTasks.map((task) => (
            <TodayTaskRow
              key={task.id}
              task={task}
              card={cardMap.get(task.cardId)}
              selected={selectedIds.has(task.id)}
              onSelect={(checked) => toggleSelectOne(task.id, checked)}
              onComplete={onComplete}
              onOpenCrm={() => onNavigate("crm")}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-3 border border-slate-100">
            <Sparkles className="size-6 text-[#2563EB]" />
          </div>
          <h4 className="text-base font-bold text-slate-800">
            {tasks.length === 0 ? "Fila de hoje concluída!" : "Nenhuma ação com esse filtro"}
          </h4>
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            {tasks.length === 0
              ? "Você completou todas as tarefas previstas para hoje. Encontre novas oportunidades ou inicie uma cadência no CRM."
              : "Tente mudar os filtros de ação acima para visualizar outras tarefas da sua agenda."}
          </p>
          {tasks.length === 0 && (
            <div className="mt-5 flex gap-2.5">
              <Button
                size="sm"
                className="rounded-xl bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-semibold px-4"
                onClick={() => onNavigate("hunter")}
              >
                Caçar clientes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-slate-200 text-xs font-semibold px-4"
                onClick={() => onNavigate("crm")}
              >
                Ver CRM
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
