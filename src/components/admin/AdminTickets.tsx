// Tela SUPORTE do painel admin: todos os tickets, de todas as orgs. Filtro por status/
// prioridade, abrir, responder, mudar status. Dado real (Edge admin-acoes: tickets_listar).
import { useEffect, useState } from "react";
import { LifeBuoy, Send, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { adminAcao } from "@/services/admin";
import {
  PRIORIDADE_LABEL,
  STATUS_TICKET_LABEL,
  type Prioridade,
  type StatusTicket,
} from "@/services/tickets";

type TicketAdmin = {
  id: string;
  org_id: string;
  autor_user_id: string;
  autor_email: string;
  assunto: string;
  mensagem: string;
  prioridade: Prioridade;
  status: StatusTicket;
  criado_em: string;
  atualizado_em: string;
};
type RespostaAdmin = { id: string; eh_admin: boolean; texto: string; criado_em: string };

const STATUS_CLS: Record<string, string> = {
  aberto: "bg-accent text-primary",
  em_andamento: "bg-gold/15 text-gold",
  resolvido: "bg-[#16A34A]/10 text-[#15803D]",
  fechado: "bg-secondary text-muted-foreground",
};
const STATUS_FILTROS: (StatusTicket | "todos")[] = [
  "todos",
  "aberto",
  "em_andamento",
  "resolvido",
  "fechado",
];

export function AdminTickets() {
  const [tickets, setTickets] = useState<TicketAdmin[] | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusTicket | "todos">("todos");
  const [aberto, setAberto] = useState<TicketAdmin | null>(null);

  const carregar = () =>
    adminAcao("tickets_listar")
      .then((r) => setTickets((r.tickets as TicketAdmin[]) ?? []))
      .catch(() => setTickets([]));
  useEffect(() => {
    carregar();
  }, []);

  if (aberto) {
    return (
      <TicketAdminThread
        ticket={aberto}
        onVoltar={() => {
          setAberto(null);
          carregar();
        }}
        onAtualizado={(patch) => setAberto((t) => (t ? { ...t, ...patch } : t))}
      />
    );
  }

  const filtrados = (tickets ?? []).filter(
    (t) => filtroStatus === "todos" || t.status === filtroStatus,
  );

  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-xl">
            <LifeBuoy className="h-5 w-5 text-gold" /> Suporte
          </h2>
          <p className="text-xs text-muted-foreground">Chamados de todas as organizações.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTROS.map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                filtroStatus === s
                  ? "bg-navy text-navy-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/70",
              )}
            >
              {s === "todos" ? "Todos" : STATUS_TICKET_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-5 py-2.5 font-medium">Assunto</th>
            <th className="px-5 py-2.5 font-medium">Organização</th>
            <th className="px-5 py-2.5 font-medium">Prioridade</th>
            <th className="px-5 py-2.5 font-medium">Status</th>
            <th className="px-5 py-2.5 font-medium">Aberto em</th>
          </tr>
        </thead>
        <tbody>
          {filtrados.map((t) => (
            <tr
              key={t.id}
              onClick={() => setAberto(t)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/30"
            >
              <td className="px-5 py-3 font-medium">{t.assunto}</td>
              <td className="px-5 py-3 text-muted-foreground">{t.autor_email}</td>
              <td className="px-5 py-3 text-muted-foreground">{PRIORIDADE_LABEL[t.prioridade]}</td>
              <td className="px-5 py-3">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    STATUS_CLS[t.status],
                  )}
                >
                  {STATUS_TICKET_LABEL[t.status]}
                </span>
              </td>
              <td className="px-5 py-3 text-xs text-muted-foreground">
                {new Date(t.criado_em).toLocaleString("pt-BR")}
              </td>
            </tr>
          ))}
          {tickets !== null && filtrados.length === 0 && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                Nenhum chamado{" "}
                {filtroStatus !== "todos"
                  ? `com status "${STATUS_TICKET_LABEL[filtroStatus]}"`
                  : ""}{" "}
                ainda.
              </td>
            </tr>
          )}
          {tickets === null && (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                Carregando…
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TicketAdminThread({
  ticket,
  onVoltar,
  onAtualizado,
}: {
  ticket: TicketAdmin;
  onVoltar: () => void;
  onAtualizado: (patch: Partial<TicketAdmin>) => void;
}) {
  const [respostas, setRespostas] = useState<RespostaAdmin[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mudandoStatus, setMudandoStatus] = useState(false);

  const carregarRespostas = async () => {
    const { data } = await supabase
      .from("ticket_respostas")
      .select("id, eh_admin, texto, criado_em")
      .eq("ticket_id", ticket.id)
      .order("criado_em", { ascending: true });
    setRespostas((data as RespostaAdmin[]) ?? []);
  };
  useEffect(() => {
    carregarRespostas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  const responder = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      const r = await adminAcao("ticket_responder", { ticket_id: ticket.id, texto });
      if (!r.ok) {
        toast.error(`Falha: ${r.reason}`);
        return;
      }
      setTexto("");
      carregarRespostas();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setEnviando(false);
    }
  };

  const mudarStatus = async (status: StatusTicket) => {
    setMudandoStatus(true);
    try {
      const r = await adminAcao("ticket_status", { ticket_id: ticket.id, status });
      if (!r.ok) toast.error(`Falha: ${r.reason}`);
      else {
        toast.success(`Status: ${STATUS_TICKET_LABEL[status]}`);
        onAtualizado({ status });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setMudandoStatus(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onVoltar}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos chamados
      </button>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-serif text-lg">{ticket.assunto}</h3>
            <p className="text-xs text-muted-foreground">{ticket.autor_email}</p>
          </div>
          <select
            value={ticket.status}
            disabled={mudandoStatus}
            onChange={(e) => mudarStatus(e.target.value as StatusTicket)}
            className="h-9 rounded-md border border-input bg-card px-2 text-sm"
          >
            {(["aberto", "em_andamento", "resolvido", "fechado"] as StatusTicket[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_TICKET_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{ticket.mensagem}</p>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        {respostas === null && <p className="text-sm text-muted-foreground">Carregando…</p>}
        {respostas?.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem respostas ainda.</p>
        )}
        {respostas?.map((r) => (
          <div
            key={r.id}
            className={cn(
              "max-w-[80%] rounded-lg p-3 text-sm",
              r.eh_admin ? "ml-auto bg-gold/10 text-foreground" : "bg-navy/5 text-foreground",
            )}
          >
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {r.eh_admin ? "Você (suporte)" : ticket.autor_email}
            </p>
            <p className="whitespace-pre-wrap">{r.texto}</p>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Responder ao cliente…"
          rows={2}
          className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
        <button
          onClick={responder}
          disabled={enviando}
          className="inline-flex h-10 items-center gap-1.5 rounded-md bg-gold px-4 text-xs font-semibold text-gold-foreground disabled:opacity-60"
        >
          {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
