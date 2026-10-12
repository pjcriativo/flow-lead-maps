import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Flame,
  Mail,
  MessageSquare,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { statusRampa, type RampaStatus } from "@/services/propostas";
import { cn } from "@/lib/utils";

interface GestaoConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  canal?: "email" | "whatsapp";
}

export function GestaoConfigDrawer({
  isOpen,
  onClose,
  canal = "email",
}: GestaoConfigDrawerProps) {
  const [rampa, setRampa] = useState<RampaStatus | null>(null);

  useEffect(() => {
    if (isOpen) {
      statusRampa().then(setRampa).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex h-full w-full max-w-md flex-col border-l border-home-border bg-home-surface p-6 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto text-home-foreground">
        {/* Cabeçalho do Drawer */}
        <div className="flex items-center justify-between border-b border-home-border/60 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-home-orange/15 text-home-orange">
              <Zap className="size-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Configurações & Políticas
              </h2>
              <p className="text-[11px] text-home-muted">
                Governança, rampa de aquecimento e limites
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-home-muted hover:bg-home-surface-strong hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-xs">
          {/* Seção 1: Canal Ativo */}
          <div className="rounded-xl border border-home-border bg-home-background/60 p-4 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
              Canal de Disparo
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {canal === "email" ? (
                  <Mail className="size-4 text-blue-400" />
                ) : (
                  <MessageSquare className="size-4 text-green-400" />
                )}
                <span className="font-semibold text-white">
                  {canal === "email" ? "E-mail (Resend API)" : "WhatsApp (Evolution API)"}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                Conectado
              </span>
            </div>
          </div>

          {/* Seção 2: Rampa de Aquecimento (E-mail) */}
          {canal === "email" && (
            <div className="rounded-xl border border-home-border bg-home-background/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <Flame className="size-4 text-amber-500" />
                  Rampa de Aquecimento Anti-Spam
                </div>
                <span className="text-[10px] font-bold text-amber-400">
                  Dia {rampa?.dia ?? 1}
                </span>
              </div>

              <p className="text-[11px] text-home-muted leading-relaxed">
                Para blindar a entregabilidade e reputação do seu domínio, os envios são liberados progressivamente.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="rounded-lg border border-home-border bg-home-surface p-2">
                  <div className="text-[10px] text-home-muted">Teto do Dia</div>
                  <div className="text-sm font-bold text-white tabular-nums">
                    {rampa?.teto ?? 10}
                  </div>
                </div>
                <div className="rounded-lg border border-home-border bg-home-surface p-2">
                  <div className="text-[10px] text-home-muted">Enviados</div>
                  <div className="text-sm font-bold text-white tabular-nums">
                    {rampa?.enviados_hoje ?? 0}
                  </div>
                </div>
                <div className="rounded-lg border border-home-border bg-home-surface p-2">
                  <div className="text-[10px] text-home-muted">Restante</div>
                  <div className="text-sm font-bold text-emerald-400 tabular-nums">
                    {rampa?.restante ?? 10}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seção 3: Identidade do Remetente */}
          <div className="rounded-xl border border-home-border bg-home-background/60 p-4 space-y-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-home-muted">
              Identidade e Respostas
            </span>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-home-muted">Remetente:</span>
                <span className="font-medium text-white">Seu Nome Cadastrado</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-home-muted">E-mail de Respostas (Reply-To):</span>
                <span className="font-medium text-emerald-400">Configurado</span>
              </div>
            </div>
          </div>

          {/* Seção 4: Governança & LGPD */}
          <div className="rounded-xl border border-home-border bg-home-background/60 p-4 space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <ShieldCheck className="size-4 text-emerald-400" />
              Políticas de Segurança e Compliance
            </div>
            <ul className="space-y-1.5 text-[11px] text-home-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                <span><b>Publish-on-Approve:</b> URLs públicas só nascem na aprovação.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                <span><b>Opt-Out LGPD:</b> Contatos descadastrados são barrados server-side.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-3 text-emerald-400 shrink-0" />
                <span><b>Idempotência:</b> Prevenção rigorosa contra envios duplicados.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Rodapé com botão de fechar */}
        <div className="mt-auto pt-4 border-t border-home-border/60">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-home-surface border border-home-border py-2 text-xs font-semibold text-white hover:bg-home-surface-strong transition-colors"
          >
            Fechar painel
          </button>
        </div>
      </div>
    </div>
  );
}
