// Tela WhatsApp — Centro de Comunicação e Vendas Premium (Layout Oficial Aprovado)
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Loader2,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  MoreVertical,
  Phone,
  Send,
  Smartphone,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { DashboardSection } from "@/lib/dashboard-navigation";
import {
  enviarTesteWhatsapp,
  estatisticasWa,
  limparConversas,
  listarChips,
  type WaEstatisticas,
  type WaChip,
} from "@/services/whatsapp";
import { AutomacaoSection } from "@/components/automacao/AutomacaoSection";
import { ChipsManager } from "./ChipsManager";
import { WaCampanhas } from "./WaCampanhas";
import { WaPainel } from "./WaPainel";
import { WaConversas } from "./WaConversas";
import { WaScripts } from "./WaScripts";

export type AbaWhatsApp =
  "painel" | "conversas" | "campanhas" | "automacao" | "scripts" | "numeros";

export interface WhatsAppSectionProps {
  user?: {
    name: string;
    email: string;
    avatarUrl: string;
    initials: string;
  };
  unreadNotifications?: number;
  onNavigateSection?: (section: DashboardSection, label: string) => void;
  initialTab?: AbaWhatsApp;
}

const ABAS: { key: AbaWhatsApp; label: string; icon: ReactNode }[] = [
  { key: "painel", label: "Painel", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "conversas", label: "Conversas", icon: <MessagesSquare className="h-4 w-4" /> },
  { key: "campanhas", label: "Campanhas", icon: <Megaphone className="h-4 w-4" /> },
  { key: "automacao", label: "Automação", icon: <Workflow className="h-4 w-4" /> },
  { key: "scripts", label: "Scripts", icon: <Zap className="h-4 w-4" /> },
  { key: "numeros", label: "Números", icon: <Phone className="h-4 w-4" /> },
];

export function WhatsAppSection({ initialTab = "painel" }: WhatsAppSectionProps) {
  const [aba, setAba] = useState<AbaWhatsApp>(initialTab);
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [parcial, setParcial] = useState<boolean>(false);
  const [temDisparo, setTemDisparo] = useState(false);
  const [carregandoStatus, setCarregandoStatus] = useState(true);

  const checarConexao = useCallback(async () => {
    try {
      const [s, chips] = await Promise.all([
        estatisticasWa(),
        listarChips().catch(() => [] as WaChip[]),
      ]);
      const ativos = chips.filter((c) => c.status === "conectado").length;
      const desconectados = chips.filter(
        (c) => c.status === "desconectado" || c.status === "queimada" || c.status === "erro",
      ).length;

      setConectado(ativos > 0);
      setParcial(ativos > 0 && desconectados > 0);
      setTemDisparo(s.temDisparo);
    } catch {
      setConectado(false);
      setParcial(false);
      setTemDisparo(false);
    } finally {
      setCarregandoStatus(false);
    }
  }, []);

  useEffect(() => {
    checarConexao();
  }, [checarConexao]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-3 sm:px-6 lg:px-8 pt-4 pb-12">
      {/* CABEÇALHO / HERO BANNER (ETAPA 3) */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0d121c] p-6 shadow-2xl transition-all">
        {/* Glow verde sutil no canto superior direito */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-32 top-8 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          {/* Identificação Principal: Ícone + Título + Subtítulo */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#22c55e] text-white shadow-[0_0_30px_rgba(34,197,94,0.45)] ring-1 ring-white/20">
              <SiWhatsapp className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                WhatsApp
              </h1>
              <p className="text-xs font-medium text-home-muted sm:text-sm">
                Seu centro de comunicação e vendas em um só lugar
              </p>
            </div>
          </div>

          {/* Lado Direito: Elemento Visual 3D + Indicador Real de Conexão */}
          <div className="flex items-center justify-between gap-4 md:justify-end">
            {/* Imagem 3D WhatsApp Oficial da Imagem */}
            <div className="hidden sm:block shrink-0 relative">
              <img
                src="/images/whatsapp-hero-3d.jpg"
                alt="WhatsApp 3D"
                className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover opacity-90 drop-shadow-[0_10px_25px_rgba(34,197,94,0.35)] select-none pointer-events-none ring-1 ring-emerald-500/20"
              />
            </div>

            {/* Pill de Conexão com Dados Reais */}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all backdrop-blur-md shadow-sm",
                  carregandoStatus
                    ? "border-white/10 bg-white/5 text-home-muted"
                    : conectado
                      ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : parcial
                        ? "border-amber-500/30 bg-amber-500/15 text-amber-400"
                        : "border-slate-500/30 bg-slate-500/10 text-slate-400",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    carregandoStatus
                      ? "bg-slate-500 animate-pulse"
                      : conectado
                        ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        : parcial
                          ? "bg-amber-400"
                          : "bg-slate-400",
                  )}
                />
                <div className="text-left leading-tight">
                  <div className="text-white text-xs font-bold">
                    {carregandoStatus
                      ? "Verificando..."
                      : conectado
                        ? "Conectado"
                        : parcial
                          ? "Parcialmente conectado"
                          : "Desconectado"}
                  </div>
                  <div className="text-[10px] text-home-muted font-normal">
                    {conectado
                      ? "Todos os sistemas operacionais"
                      : parcial
                        ? "Atenção em instâncias"
                        : "Nenhum número ativo"}
                  </div>
                </div>
              </div>

              {/* Botão de Menu 3 Pontos */}
              <button
                type="button"
                onClick={() => setAba("numeros")}
                title="Configurações do WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-[#161c28] text-home-muted hover:text-white hover:border-white/20 transition-all cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO INTERNA HORIZONTAL COM ABAS (ETAPA 4) */}
        <div className="mt-6 flex items-center gap-1 border-b border-white/10 overflow-x-auto scrollbar-none pt-1">
          {ABAS.map((a) => {
            const ativa = aba === a.key;
            return (
              <button
                key={a.key}
                type="button"
                data-aba={a.key}
                onClick={() => setAba(a.key)}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-all whitespace-nowrap",
                  ativa
                    ? "border-home-orange font-bold text-white"
                    : "border-transparent text-home-muted hover:border-white/20 hover:text-white",
                )}
              >
                <span
                  className={cn(
                    "transition-colors",
                    ativa ? "text-home-orange" : "text-home-muted group-hover:text-white",
                  )}
                >
                  {a.icon}
                </span>
                <span>{a.label}</span>
                {ativa && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-home-orange shadow-[0_0_12px_rgba(255,98,0,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTEÚDO DAS ABAS (PRESERVANDO MÓDULOS EXISTENTES) */}
      <div className="mt-4">
        {aba === "painel" && (
          <WaPainel
            onIrParaNumeros={() => setAba("numeros")}
            onIrParaCampanhas={() => setAba("campanhas")}
            onIrParaConversas={() => setAba("conversas")}
            onIrParaScripts={() => setAba("scripts")}
            onIrParaAutomacao={() => setAba("automacao")}
          />
        )}
        {aba === "conversas" && <WaConversas />}
        {aba === "campanhas" && <WaCampanhas onConectar={() => setAba("numeros")} />}
        {aba === "automacao" && <AutomacaoSection onRevisar={() => setAba("campanhas")} />}
        {aba === "scripts" && <WaScripts />}
        {aba === "numeros" && <AbaWhatsApp onMudou={checarConexao} />}
      </div>
    </div>
  );
}

// Aba de Gestão de Números / Conexão (Preservada com compatibilidade total)
function AbaWhatsApp({ onMudou }: { onMudou: () => void }) {
  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-2xl border border-white/5 bg-[#101520]/95 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Smartphone className="h-4 w-4 text-emerald-500" />
          <span>Conexão dos chips e instâncias WhatsApp</span>
        </div>
        <ChipsManager onMudou={onMudou} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <EnviarTeste />
        <LimparHistorico />
      </div>
    </div>
  );
}

function EnviarTeste() {
  const [numero, setNumero] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    setEnviando(true);
    try {
      const r = await enviarTesteWhatsapp(numero);
      if (r.ok) toast.success(`Mensagem enviada para ${r.para}. Confira o WhatsApp!`);
      else toast.error(r.error ?? "Falha no envio");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-[#101520]/95 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Send className="h-4 w-4 text-emerald-500" />
        <span>Enviar mensagem de teste</span>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wa-num" className="text-xs text-home-muted">
          Número de teste (com DDI + DDD)
        </Label>
        <Input
          id="wa-num"
          placeholder="5511987654321"
          value={numero}
          onChange={(e) => setNumero(e.target.value.replace(/\D/g, ""))}
          inputMode="numeric"
          className="border-white/10 bg-[#161c28] text-white"
        />
      </div>
      <Button
        onClick={enviar}
        disabled={enviando || numero.length < 12}
        className="cursor-pointer bg-home-orange font-semibold text-white hover:bg-home-orange/90"
      >
        {enviando ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
          </>
        ) : (
          <>
            <MessageCircle className="mr-2 h-4 w-4" /> Enviar teste
          </>
        )}
      </Button>
      <p className="text-[11px] text-home-muted">
        Usa o chip principal da organização. Se falhar, exibe o diagnóstico retornado pela
        Evolution.
      </p>
    </div>
  );
}

function LimparHistorico() {
  const [limpando, setLimpando] = useState(false);

  const limpar = async () => {
    if (!confirm("Tem certeza que deseja apagar o histórico de mensagens desta organização?"))
      return;
    setLimpando(true);
    try {
      const removidas = await limparConversas();
      toast.success(`${removidas} mensagens apagadas.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao limpar histórico");
    } finally {
      setLimpando(false);
    }
  };

  return (
    <div className="space-y-3 rounded-2xl border border-white/5 bg-[#101520]/95 p-6 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Trash2 className="h-4 w-4 text-rose-500" />
        <span>Limpeza de mensagens da organização</span>
      </div>
      <p className="text-xs text-home-muted">
        Remove do banco de dados as mensagens salvas nesta organização. Não despareia os números.
      </p>
      <Button
        variant="destructive"
        onClick={limpar}
        disabled={limpando}
        className="cursor-pointer bg-rose-600 font-semibold text-white hover:bg-rose-700"
      >
        {limpando ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Limpando...
          </>
        ) : (
          <>
            <Trash2 className="mr-2 h-4 w-4" /> Limpar mensagens
          </>
        )}
      </Button>
    </div>
  );
}
