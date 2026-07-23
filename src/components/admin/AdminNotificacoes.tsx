// Tela NOTIFICAÇÕES do painel admin — envia um aviso in-app a TODOS os usuários da
// plataforma (profiles) e mostra o histórico com quantos leram. NÃO consome cota nem
// rampa de prospecção — é só um mural de avisos (notificacao_enviar em admin-acoes).
import { useEffect, useState } from "react";
import { Bell, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { adminAcao } from "@/services/admin";

type NotificacaoHistorico = {
  id: string;
  titulo: string;
  mensagem: string;
  criado_em: string;
  total: number;
  lidas: number;
};

export function AdminNotificacoes() {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [historico, setHistorico] = useState<NotificacaoHistorico[] | null>(null);

  const carregar = () =>
    adminAcao("notificacoes_listar")
      .then((r) => setHistorico(r.ok ? ((r.notificacoes as NotificacaoHistorico[]) ?? []) : []))
      .catch(() => setHistorico([]));
  useEffect(() => {
    carregar();
  }, []);

  const enviar = async () => {
    if (!titulo.trim() || !mensagem.trim()) {
      toast.error("Preencha título e mensagem.");
      return;
    }
    setEnviando(true);
    try {
      const r = await adminAcao("notificacao_enviar", {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
      });
      if (!r.ok) {
        toast.error(`Não enviou: ${r.reason ?? "erro"}`);
        return;
      }
      toast.success(`Enviado a ${r.destinatarios} usuário(s).`);
      setTitulo("");
      setMensagem("");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <h2 className="flex items-center gap-2 font-serif text-xl">
          <Bell className="h-5 w-5 text-gold" /> Notificações
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Envia um aviso in-app a todos os usuários da plataforma. Não consome cota nem rampa de
          prospecção.
        </p>
        <div className="space-y-2">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Título do aviso"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          />
          <textarea
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Mensagem…"
            rows={3}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={enviar}
            disabled={enviando}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-navy px-3 text-xs font-semibold text-navy-foreground hover:bg-navy/90 disabled:opacity-60"
          >
            {enviando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Enviar a todos
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <h3 className="border-b border-border px-5 py-3 font-serif text-lg">Histórico</h3>
        <div className="divide-y divide-border">
          {historico === null && (
            <p className="p-5 text-center text-sm text-muted-foreground">Carregando…</p>
          )}
          {historico?.length === 0 && (
            <p className="p-5 text-center text-sm text-muted-foreground">
              Nenhum aviso enviado ainda.
            </p>
          )}
          {historico?.map((n) => (
            <div key={n.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{n.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{n.mensagem}</p>
                <p className="text-[11px] text-muted-foreground">
                  {new Date(n.criado_em).toLocaleString("pt-BR")}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-gold/40 px-2 py-0.5 text-xs font-medium text-gold">
                {n.lidas}/{n.total} leram
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
