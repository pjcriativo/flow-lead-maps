import {
  Megaphone,
  Handshake,
  Calendar,
  Tag,
  CheckCircle2,
  Clock,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ObjetivoComercial = "atrair_clientes" | "parcerias" | "agendamento" | "promocoes";

export interface GoogleMapsApproachStrategyProps {
  objetivo: ObjetivoComercial;
  onChangeObjetivo: (obj: ObjetivoComercial) => void;
  canaisSelecionados: string[];
  onToggleCanal: (canal: string) => void;
  momentoEnvio: "agora" | "agendar";
  onChangeMomentoEnvio: (m: "agora" | "agendar") => void;
}

export function GoogleMapsApproachStrategy({
  objetivo,
  onChangeObjetivo,
  canaisSelecionados,
  onToggleCanal,
  momentoEnvio,
  onChangeMomentoEnvio,
}: GoogleMapsApproachStrategyProps) {
  const objetivos = [
    {
      id: "atrair_clientes" as ObjetivoComercial,
      title: "Atrair novos clientes",
      sub: "Apresentar seus serviços e gerar novas oportunidades",
      icon: Megaphone,
    },
    {
      id: "parcerias" as ObjetivoComercial,
      title: "Parcerias comerciais",
      sub: "Propor parcerias e colaborações",
      icon: Handshake,
    },
    {
      id: "agendamento" as ObjetivoComercial,
      title: "Agendamento de reunião",
      sub: "Convidar para uma conversa detalhada",
      icon: Calendar,
    },
    {
      id: "promocoes" as ObjetivoComercial,
      title: "Divulgação de promoções",
      sub: "Apresentar ofertas e condições especiais",
      icon: Tag,
    },
  ];

  const canais = [
    { id: "whatsapp", label: "WhatsApp", recomendado: true },
    { id: "email", label: "E-mail", recomendado: false },
    { id: "instagram", label: "Instagram", recomendado: false },
    { id: "telefone", label: "Telefone", recomendado: false },
  ];

  return (
    <div className="rounded-2xl border border-home-border bg-[#101720]/90 p-4 shadow-sm flex flex-col justify-between space-y-4 h-full">
      {/* Topo da Coluna 2 */}
      <div className="space-y-1">
        <h3 className="text-sm font-extrabold text-white tracking-tight">
          2. Estratégia e Objetivo
        </h3>
        <p className="text-[11px] text-home-muted leading-tight">
          Defina o objetivo da sua campanha e configure a estratégia de abordagem.
        </p>
      </div>

      {/* Seção 1: Objetivo da Campanha */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-white tracking-tight">Objetivo da campanha</label>
        <div className="grid grid-cols-2 gap-2">
          {objetivos.map((item) => {
            const isAtivo = objetivo === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onChangeObjetivo(item.id)}
                className={cn(
                  "relative rounded-xl border p-2.5 text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[95px]",
                  isAtivo
                    ? "border-home-orange bg-home-orange/15 shadow-md shadow-home-orange/10"
                    : "border-home-border/80 bg-home-surface/50 hover:bg-home-surface hover:border-home-border",
                )}
              >
                {/* Badge de Selecionado */}
                {isAtivo && (
                  <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-home-orange text-white">
                    <CheckCircle2 className="size-3" />
                  </span>
                )}

                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-lg mt-0.5",
                    isAtivo
                      ? "bg-home-orange text-white"
                      : "bg-home-surface text-home-muted border border-home-border",
                  )}
                >
                  <Icon className="size-3.5" />
                </div>

                <div className="space-y-0.5 mt-1">
                  <p className="text-[11px] font-bold text-white leading-tight">{item.title}</p>
                  <p className="text-[9px] text-home-muted leading-tight line-clamp-2">
                    {item.sub}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Seção 2: Canal de Comunicação */}
      <div className="space-y-2 pt-1">
        <div>
          <label className="text-xs font-bold text-white tracking-tight">
            Canal de comunicação
          </label>
          <p className="text-[10px] text-home-muted leading-tight mt-0.5">
            Escolha um ou mais canais para sua abordagem. Use pelo menos 2 canais para aumentar suas
            chances de retorno.
          </p>
        </div>

        <div className="space-y-1.5">
          {canais.map((c) => {
            const isChecked = canaisSelecionados.includes(c.id);

            return (
              <label
                key={c.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer select-none",
                  isChecked
                    ? "border-home-border bg-home-surface/80 text-white"
                    : "border-home-border/50 bg-[#0d131c]/50 text-home-muted hover:bg-home-surface/40",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleCanal(c.id)}
                    className="size-3.5 rounded border-home-border text-home-orange focus:ring-home-orange accent-home-orange cursor-pointer"
                  />
                  <span className="font-semibold text-xs">{c.label}</span>
                </div>

                {c.recomendado && (
                  <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                    Recomendado
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* Seção 3: Quando Enviar? */}
      <div className="space-y-2 pt-1 border-t border-home-border/60">
        <div>
          <label className="text-xs font-bold text-white tracking-tight">Quando enviar?</label>
          <p className="text-[10px] text-home-muted leading-tight mt-0.5">
            Defina o melhor momento para o início da sua campanha.
          </p>
        </div>

        <div className="space-y-1.5">
          {/* Iniciar Agora */}
          <button
            type="button"
            onClick={() => onChangeMomentoEnvio("agora")}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all cursor-pointer",
              momentoEnvio === "agora"
                ? "border-home-orange bg-home-orange/15 shadow-sm shadow-home-orange/10"
                : "border-home-border/70 bg-home-surface/50 hover:bg-home-surface",
            )}
          >
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-lg",
                momentoEnvio === "agora"
                  ? "bg-home-orange text-white"
                  : "bg-home-surface text-home-muted",
              )}
            >
              <Clock className="size-3" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white leading-tight">Iniciar agora</p>
              <p className="text-[9px] text-home-muted leading-tight">
                Enviar imediatamente após a confirmação
              </p>
            </div>
          </button>

          {/* Agendar Envio */}
          <button
            type="button"
            onClick={() => onChangeMomentoEnvio("agendar")}
            className={cn(
              "w-full flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all cursor-pointer",
              momentoEnvio === "agendar"
                ? "border-home-orange bg-home-orange/15 shadow-sm shadow-home-orange/10"
                : "border-home-border/70 bg-home-surface/50 hover:bg-home-surface",
            )}
          >
            <div
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-lg",
                momentoEnvio === "agendar"
                  ? "bg-home-orange text-white"
                  : "bg-home-surface text-home-muted",
              )}
            >
              <CalendarCheck className="size-3" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white leading-tight">Agendar envio</p>
              <p className="text-[9px] text-home-muted leading-tight">
                Programar para data e horário específico
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
