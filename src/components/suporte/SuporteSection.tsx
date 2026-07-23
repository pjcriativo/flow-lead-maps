// Suporte (lado cliente): abrir chamado + ver os seus + conversar com o admin.
import { useEffect, useState } from "react";
import { LifeBuoy, Plus, Loader2, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  abrirTicket,
  listarMeusTickets,
  listarRespostas,
  responderTicket,
  PRIORIDADE_LABEL,
  STATUS_TICKET_LABEL,
  type Ticket,
  type RespostaTicket,
  type Prioridade,
} from "@/services/tickets";

const STATUS_CLS: Record<string, string> = {
  aberto: "bg-accent text-primary",
  em_andamento: "bg-gold/15 text-gold",
  resolvido: "bg-[#16A34A]/10 text-[#15803D]",
  fechado: "bg-secondary text-muted-foreground",
};

export function SuporteSection() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [aberto, setAberto] = useState<Ticket | null>(null);
  const [novoAberto, setNovoAberto] = useState(false);

  const carregar = () =>
    listarMeusTickets()
      .then(setTickets)
      .catch(() => setTickets([]));
  useEffect(() => {
    carregar();
  }, []);

  if (aberto) {
    return (
      <TicketThread
        ticket={aberto}
        onVoltar={() => {
          setAberto(null);
          carregar();
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <LifeBuoy className="h-5 w-5 text-primary" /> Suporte
          </h1>
          <p className="text-sm text-muted-foreground">
            Abra um chamado ou veja os que você já abriu.
          </p>
        </div>
        <Button onClick={() => setNovoAberto(true)}>
          <Plus className="h-4 w-4" /> Abrir chamado
        </Button>
      </div>

      {novoAberto && (
        <NovoTicketForm
          onCancelar={() => setNovoAberto(false)}
          onCriado={(t) => {
            setNovoAberto(false);
            carregar();
            setAberto(t);
          }}
        />
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {tickets === null && (
          <p className="p-6 text-center text-sm text-muted-foreground">Carregando…</p>
        )}
        {tickets?.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nenhum chamado ainda — clique em "Abrir chamado".
          </p>
        )}
        {tickets?.map((t) => (
          <button
            key={t.id}
            onClick={() => setAberto(t)}
            className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-secondary/40"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{t.assunto}</p>
              <p className="text-xs text-muted-foreground">
                {PRIORIDADE_LABEL[t.prioridade]} ·{" "}
                {new Date(t.criado_em).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                STATUS_CLS[t.status],
              )}
            >
              {STATUS_TICKET_LABEL[t.status]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NovoTicketForm({
  onCriado,
  onCancelar,
}: {
  onCriado: (t: Ticket) => void;
  onCancelar: () => void;
}) {
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("media");
  const [salvando, setSalvando] = useState(false);

  const enviar = async () => {
    if (!assunto.trim() || !mensagem.trim()) {
      toast.error("Preencha assunto e mensagem.");
      return;
    }
    setSalvando(true);
    try {
      const t = await abrirTicket(assunto, mensagem, prioridade);
      toast.success("Chamado aberto.");
      onCriado(t);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao abrir o chamado");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <input
        value={assunto}
        onChange={(e) => setAssunto(e.target.value)}
        placeholder="Assunto"
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      />
      <textarea
        value={mensagem}
        onChange={(e) => setMensagem(e.target.value)}
        placeholder="Descreva o problema…"
        rows={4}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-2">
        <select
          value={prioridade}
          onChange={(e) => setPrioridade(e.target.value as Prioridade)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          {(["baixa", "media", "alta"] as Prioridade[]).map((p) => (
            <option key={p} value={p}>
              {PRIORIDADE_LABEL[p]}
            </option>
          ))}
        </select>
        <Button onClick={enviar} disabled={salvando}>
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Enviar
        </Button>
        <Button variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function TicketThread({ ticket, onVoltar }: { ticket: Ticket; onVoltar: () => void }) {
  const [respostas, setRespostas] = useState<RespostaTicket[] | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = () =>
    listarRespostas(ticket.id)
      .then(setRespostas)
      .catch(() => setRespostas([]));
  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  const enviar = async () => {
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      await responderTicket(ticket.id, texto);
      setTexto("");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao responder");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <button
        onClick={onVoltar}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar aos chamados
      </button>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{ticket.assunto}</h2>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              STATUS_CLS[ticket.status],
            )}
          >
            {STATUS_TICKET_LABEL[ticket.status]}
          </span>
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
              r.eh_admin ? "bg-navy/5 text-foreground" : "ml-auto bg-accent text-foreground",
            )}
          >
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {r.eh_admin ? "Suporte Flow Leads" : "Você"}
            </p>
            <p className="whitespace-pre-wrap">{r.texto}</p>
          </div>
        ))}
      </div>

      {ticket.status !== "fechado" && (
        <div className="flex items-end gap-2">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva uma mensagem…"
            rows={2}
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button onClick={enviar} disabled={enviando}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
