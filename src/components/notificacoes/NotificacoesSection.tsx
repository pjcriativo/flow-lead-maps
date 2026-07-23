// Notificações (lado cliente): avisos in-app enviados pelo admin da plataforma. Ler aqui
// NÃO consome cota nem rampa — é só um mural de avisos.
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  listarMinhasNotificacoes,
  marcarNotificacaoLida,
  type MinhaNotificacao,
} from "@/services/notificacoes";

export function NotificacoesSection({ onMudou }: { onMudou?: () => void } = {}) {
  const [itens, setItens] = useState<MinhaNotificacao[] | null>(null);

  useEffect(() => {
    listarMinhasNotificacoes()
      .then(setItens)
      .catch(() => setItens([]));
  }, []);

  const marcar = async (id: string) => {
    setItens((atual) =>
      (atual ?? []).map((n) =>
        n.destinatario_id === id ? { ...n, lida_em: new Date().toISOString() } : n,
      ),
    );
    await marcarNotificacaoLida(id).catch(() => {});
    onMudou?.();
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Bell className="h-5 w-5 text-primary" /> Notificações
        </h1>
        <p className="text-sm text-muted-foreground">Avisos enviados pela Flow Leads.</p>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {itens === null && (
          <p className="p-6 text-center text-sm text-muted-foreground">Carregando…</p>
        )}
        {itens?.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">Nenhum aviso ainda.</p>
        )}
        {itens?.map((n) => (
          <button
            key={n.destinatario_id}
            onClick={() => !n.lida_em && marcar(n.destinatario_id)}
            className={cn(
              "flex w-full flex-col gap-1 p-4 text-left hover:bg-secondary/40",
              !n.lida_em && "bg-accent/40",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className={cn("font-medium", !n.lida_em && "font-semibold")}>{n.titulo}</p>
              {!n.lida_em && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
            </div>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{n.mensagem}</p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(n.enviado_em).toLocaleString("pt-BR")}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
