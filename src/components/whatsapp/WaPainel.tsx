// Aba PAINEL (dashboard) — cara do S-zap/Kaptar: banner de conexão + 4 números + campanhas
// recentes + bloco de privacidade ADAPTADO à realidade do Flow Leads (roda no servidor, dados no
// Supabase da org — nada de "só no seu PC", que seria mentira aqui).
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Send,
  MessageSquare,
  Database,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatData } from "@/lib/format";
import { estatisticasWa, enviadosPorCampanhaWa, type WaEstatisticas } from "@/services/whatsapp";
import { listarCampanhas } from "@/services/campanhas";
import type { Campanha } from "@/types";

export function WaPainel({
  onIrParaWhatsApp,
  onIrParaCampanhas,
}: {
  onIrParaWhatsApp: () => void;
  onIrParaCampanhas: () => void;
}) {
  const [stats, setStats] = useState<WaEstatisticas | null>(null);
  const [campanhas, setCampanhas] = useState<(Campanha & { enviados: number })[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    try {
      const [s, cs] = await Promise.all([estatisticasWa(), listarCampanhas("whatsapp")]);
      setStats(s);
      const env = await enviadosPorCampanhaWa(cs.map((c) => c.id)).catch(
        () => ({}) as Record<string, number>,
      );
      setCampanhas(
        cs
          .map((c) => ({ ...c, enviados: env[c.id] ?? 0 }))
          .filter((c) => c.enviados > 0)
          .slice(0, 6),
      );
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const conectado = stats?.conectado;

  return (
    <div className="space-y-5">
      {/* banner de conexão */}
      <button
        onClick={onIrParaWhatsApp}
        className={cn(
          "flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition hover:shadow-sm",
          conectado
            ? "border-emerald-500/30 bg-emerald-50/60"
            : "border-border bg-muted/40 hover:bg-muted/60",
        )}
      >
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            conectado ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground",
          )}
        >
          <MessageCircle className="h-6 w-6" />
        </span>
        <div className="flex-1">
          <div className="font-semibold">
            {carregando
              ? "Carregando…"
              : conectado
                ? "WhatsApp conectado"
                : "WhatsApp não conectado"}
          </div>
          <div className="text-sm text-muted-foreground">
            {conectado ? "Chips prontos para disparo e conversa" : "Clique para ativar o WhatsApp"}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground" />
      </button>

      {/* 4 números */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          tone="blue"
          valor={stats?.leadsComWhatsapp}
          rotulo="Leads com WhatsApp"
        />
        <StatCard
          icon={<Send className="h-5 w-5" />}
          tone="violet"
          valor={stats?.campanhasEnviadas}
          rotulo="Campanhas Enviadas"
        />
        <StatCard
          icon={<MessageSquare className="h-5 w-5" />}
          tone="amber"
          valor={stats?.conversas}
          rotulo="Conversas"
        />
        <StatCard
          icon={<Database className="h-5 w-5" />}
          tone="emerald"
          valor={stats?.totalLeads}
          rotulo="Total de Leads"
        />
      </div>

      {/* campanhas recentes / vazio */}
      <div className="rounded-2xl border bg-card p-6">
        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : campanhas.length === 0 ? (
          <div className="flex flex-col items-center gap-1 py-10 text-center">
            <Send className="h-8 w-8 text-muted-foreground/50" />
            <div className="mt-1 font-medium">Nenhuma campanha enviada ainda</div>
            <button onClick={onIrParaCampanhas} className="text-sm text-primary hover:underline">
              Conecte o WhatsApp e dispare sua primeira campanha
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">Campanhas enviadas</div>
            {campanhas.map((c) => (
              <button
                key={c.id}
                onClick={onIrParaCampanhas}
                className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm hover:bg-accent/40"
              >
                <span className="truncate font-medium">{c.nome}</span>
                <span className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span>{formatData(c.criada_em)}</span>
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-violet-800">
                    {c.enviados} enviados
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* privacidade — ADAPTADO à realidade (server-side), não copiado do Kaptar */}
      <div className="flex items-start gap-3 rounded-2xl border bg-card p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="text-sm">
          <div className="font-medium">Seus dados ficam na sua organização</div>
          <p className="text-muted-foreground">
            O WhatsApp do Flow Leads roda no servidor (Evolution) e os leads, conversas e histórico
            de campanhas ficam no banco da sua organização (Supabase), isolados por conta — nenhuma
            outra org acessa. Nada roda no seu PC.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  valor,
  rotulo,
  tone,
}: {
  icon: React.ReactNode;
  valor: number | undefined;
  rotulo: string;
  tone: "blue" | "violet" | "amber" | "emerald";
}) {
  const toneCls = {
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  }[tone];
  return (
    <div className="rounded-2xl border bg-card p-4">
      <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl", toneCls)}>
        {icon}
      </span>
      <div className="mt-3 text-2xl font-semibold tabular-nums">{valor ?? "—"}</div>
      <div className="text-xs text-muted-foreground">{rotulo}</div>
    </div>
  );
}
