// Modal de Sincronização de Calendários Externos
// Apresenta opções de conexão visual com Google Calendar, Microsoft Outlook e Apple Cal.
import React, { useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  ExternalLink,
  Layers,
  Link2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SincronizarCalendariosModalProps {
  aberto: boolean;
  onFechar: () => void;
  onSincronizar: (provedor: string) => void;
}

export function SincronizarCalendariosModal({
  aberto,
  onFechar,
  onSincronizar,
}: SincronizarCalendariosModalProps) {
  const [sincronizando, setSincronizando] = useState<string | null>(null);

  if (!aberto) return null;

  const handleConectar = (provedor: string) => {
    setSincronizando(provedor);
    setTimeout(() => {
      setSincronizando(null);
      onSincronizar(provedor);
      onFechar();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0e121b] p-6 shadow-2xl text-neutral-100 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onFechar}
          className="absolute right-4 top-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
            <Calendar className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sincronizar Calendários Externos</h3>
            <p className="text-xs text-neutral-400">
              Conecte suas contas de calendário para sincronização bidirecional de reuniões.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3 text-xs">
          {[
            {
              id: "google",
              nome: "Google Calendar",
              descricao: "Sincronização em tempo real de reuniões e disponibilidade via Google Workspace.",
              conectado: true,
              email: "comercial@flowgenius.com.br",
              cor: "text-blue-400 border-blue-500/30 bg-blue-500/10",
            },
            {
              id: "outlook",
              nome: "Microsoft Outlook",
              descricao: "Integração direta com Exchange e contas corporativas Microsoft 365.",
              conectado: true,
              email: "agenda@flowgenius.com.br",
              cor: "text-sky-400 border-sky-500/30 bg-sky-500/10",
            },
            {
              id: "apple",
              nome: "Apple Calendar (iCal)",
              descricao: "Link CalDAV para sincronização em dispositivos iOS e macOS.",
              conectado: false,
              cor: "text-purple-400 border-purple-500/30 bg-purple-500/10",
            },
            {
              id: "calendly",
              nome: "Calendly / Cal.com",
              descricao: "Importação automática de reservas feitas por páginas de agendamento público.",
              conectado: false,
              cor: "text-amber-400 border-amber-500/30 bg-amber-500/10",
            },
          ].map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-[#141824] p-3.5 transition-colors hover:border-white/10"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border", item.cor)}>
                  <Calendar className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{item.nome}</span>
                    {item.conectado && (
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.2 text-[9px] font-bold text-emerald-400">
                        Conectado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{item.descricao}</p>
                  {item.email && (
                    <span className="text-[10px] text-neutral-300 font-medium block mt-1">
                      {item.email}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleConectar(item.nome)}
                disabled={sincronizando === item.nome}
                className={cn(
                  "shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                  item.conectado
                    ? "border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
                    : "border border-blue-500/50 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25"
                )}
              >
                {sincronizando === item.nome ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : item.conectado ? (
                  "Sincronizar"
                ) : (
                  "Conectar"
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-neutral-400">
          <span>Sincronização bidirecional em modo demonstração</span>
          <button
            type="button"
            onClick={onFechar}
            className="rounded-xl border border-white/10 px-4 py-2 font-semibold text-neutral-300 hover:bg-white/5 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
