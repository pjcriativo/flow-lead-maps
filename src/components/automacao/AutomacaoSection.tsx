// Aba AUTOMAÇÃO — o dono cria uma RECEITA (1x) e o robô prepara sob demanda; o dono revisa e
// aprova. O robô NUNCA envia (para no portão). TETO DE GASTO em destaque — o robô gasta dinheiro.
// A revisão em lote da rodada acontece na aba Campanhas (fluxo que já existe).
import { useCallback, useEffect, useState } from "react";
import {
  Bot,
  Plus,
  Play,
  Loader2,
  Trash2,
  Pencil,
  RefreshCw,
  ShieldAlert,
  DollarSign,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { formatData } from "@/lib/format";
import {
  listarReceitas,
  criarReceita,
  atualizarReceita,
  excluirReceita,
  rodarAgora,
  listarRodadas,
  type Receita,
  type Rodada,
  type NovaReceita,
} from "@/services/automacao";

const PADRAO: NovaReceita = {
  nome: "",
  nicho: "",
  cidade: "",
  uf: "",
  fonte: "apify",
  score_minimo: 70,
  exigir_contato: true,
  canal: "email",
  leads_por_rodada: 20,
  frequencia: "manual",
  max_leads_rodada: 20,
  max_leads_mes: 200,
  max_usd_rodada: 5,
  max_usd_mes: 50,
};

export function AutomacaoSection({ onRevisar }: { onRevisar?: () => void }) {
  const [receitas, setReceitas] = useState<Receita[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [editando, setEditando] = useState<Receita | null>(null);
  const [rodandoId, setRodandoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setReceitas(await listarReceitas());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao listar");
    } finally {
      setCarregando(false);
    }
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const rodar = async (r: Receita) => {
    setRodandoId(r.id);
    try {
      const res = await rodarAgora(r.id);
      if (res.status === "parada_teto") {
        toast.warning(`Pausada pelo teto: ${res.detalhe}`);
      } else if ((res.leads_preparados ?? 0) > 0) {
        toast.success(
          `${res.leads_preparados} leads prontos pra revisão (custo US$ ${(res.custo_usd ?? 0).toFixed(2)}). Revise na aba Campanhas.`,
        );
      } else {
        toast.info(
          `Rodada concluída: ${res.leads_buscados ?? 0} buscados, nenhum qualificado (US$ ${(res.custo_usd ?? 0).toFixed(2)}).`,
        );
      }
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao rodar");
    } finally {
      setRodandoId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600">
            <Bot className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Automação de prospecção</h1>
            <p className="text-sm text-muted-foreground">
              O robô busca, qualifica e prepara. Você revisa e aprova — ele nunca envia sozinho.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditando(null);
              setDialog(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nova receita
          </Button>
        </div>
      </div>

      {/* aviso de custo */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-900">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          O robô gasta dinheiro sozinho (Apify + IA por site). Cada receita tem{" "}
          <b>teto por rodada e por mês</b> (leads e US$) — ao bater, ele para e avisa, nunca estoura
          calado. O agendamento automático fica <b>desligado</b> até você ligar; por ora é{" "}
          <b>Rodar agora</b>.
        </span>
      </div>

      {carregando ? (
        <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
        </div>
      ) : receitas.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Nenhuma receita ainda. Crie uma para o robô prospectar por você.
        </div>
      ) : (
        <div className="space-y-3">
          {receitas.map((r) => (
            <ReceitaCard
              key={r.id}
              r={r}
              rodando={rodandoId === r.id}
              onRodar={() => rodar(r)}
              onEditar={() => {
                setEditando(r);
                setDialog(true);
              }}
              onExcluir={async () => {
                await excluirReceita(r.id);
                carregar();
              }}
              onToggleAtiva={async (v) => {
                await atualizarReceita(r.id, { ativa: v });
                carregar();
              }}
              onRevisar={onRevisar}
            />
          ))}
        </div>
      )}

      <ReceitaDialog
        open={dialog}
        receita={editando}
        onClose={() => setDialog(false)}
        onSalvo={() => {
          setDialog(false);
          carregar();
        }}
      />
    </div>
  );
}

function ReceitaCard({
  r,
  rodando,
  onRodar,
  onEditar,
  onExcluir,
  onToggleAtiva,
  onRevisar,
}: {
  r: Receita;
  rodando: boolean;
  onRodar: () => void;
  onEditar: () => void;
  onExcluir: () => void;
  onToggleAtiva: (v: boolean) => void;
  onRevisar?: () => void;
}) {
  const [rodadas, setRodadas] = useState<Rodada[]>([]);
  const [verHist, setVerHist] = useState(false);
  const pctLeads = Math.min(100, Math.round((r.leads_mes / Math.max(1, r.max_leads_mes)) * 100));
  const pctUsd = Math.min(100, Math.round((r.gasto_mes_usd / Math.max(0.01, r.max_usd_mes)) * 100));

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium">{r.nome}</div>
          <div className="text-sm text-muted-foreground">
            {r.nicho} · {r.cidade}
            {r.uf ? `/${r.uf}` : ""} · fonte {r.fonte} · score ≥ {r.score_minimo} ·{" "}
            {r.exigir_contato ? "só com contato" : "todos"} · canal {r.canal}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onRodar} disabled={rodando}>
            {rodando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Rodar agora
          </Button>
          {onRevisar && (
            <Button size="sm" variant="outline" onClick={onRevisar}>
              Revisar na Campanhas
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onEditar}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" className="text-rose-600" onClick={onExcluir}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* uso do teto no mês */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <TetoBarra
          rotulo="Leads no mês"
          atual={r.leads_mes}
          max={r.max_leads_mes}
          pct={pctLeads}
          sufixo={`de ${r.max_leads_mes}`}
        />
        <TetoBarra
          rotulo="Gasto no mês"
          atual={r.gasto_mes_usd}
          max={r.max_usd_mes}
          pct={pctUsd}
          sufixo={`de US$ ${r.max_usd_mes}`}
          usd
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <label className="flex items-center gap-1.5">
          <Switch checked={r.ativa} onCheckedChange={onToggleAtiva} />
          Agendamento {r.ativa ? `ligado (${r.frequencia})` : "desligado"}
        </label>
        <span>
          Teto/rodada: {r.leads_por_rodada} leads · US$ {r.max_usd_rodada}
        </span>
        {r.ultima_rodada_em && <span>Última: {formatData(r.ultima_rodada_em)}</span>}
        <button
          className="ml-auto flex items-center gap-1 text-primary hover:underline"
          onClick={async () => {
            if (!verHist) setRodadas(await listarRodadas(r.id));
            setVerHist((v) => !v);
          }}
        >
          <History className="h-3.5 w-3.5" /> {verHist ? "Ocultar" : "Histórico"}
        </button>
      </div>

      {verHist && (
        <div className="mt-2 space-y-1 rounded-lg border bg-muted/20 p-2 text-xs">
          {rodadas.length === 0 ? (
            <div className="text-muted-foreground">Nenhuma rodada ainda.</div>
          ) : (
            rodadas.map((rd) => (
              <div key={rd.id} className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground">{formatData(rd.iniciada_em)}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5",
                    rd.status === "concluida"
                      ? "bg-emerald-50 text-emerald-700"
                      : rd.status === "parada_teto"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700",
                  )}
                >
                  {rd.status}
                </span>
                <span>
                  {rd.leads_preparados} prontos / {rd.leads_buscados} buscados ·{" "}
                  {rd.leads_descartados} descartados · US$ {Number(rd.custo_usd).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TetoBarra({
  rotulo,
  atual,
  pct,
  sufixo,
  usd,
}: {
  rotulo: string;
  atual: number;
  max: number;
  pct: number;
  sufixo: string;
  usd?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{rotulo}</span>
        <span className="tabular-nums">
          {usd ? `US$ ${Number(atual).toFixed(2)}` : atual} {sufixo}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full",
            pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ReceitaDialog({
  open,
  receita,
  onClose,
  onSalvo,
}: {
  open: boolean;
  receita: Receita | null;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const [f, setF] = useState<NovaReceita>(PADRAO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF(
      receita
        ? {
            nome: receita.nome,
            nicho: receita.nicho,
            cidade: receita.cidade,
            uf: receita.uf ?? "",
            fonte: receita.fonte,
            score_minimo: receita.score_minimo,
            exigir_contato: receita.exigir_contato,
            canal: receita.canal,
            leads_por_rodada: receita.leads_por_rodada,
            frequencia: receita.frequencia,
            max_leads_rodada: receita.max_leads_rodada,
            max_leads_mes: receita.max_leads_mes,
            max_usd_rodada: receita.max_usd_rodada,
            max_usd_mes: receita.max_usd_mes,
          }
        : PADRAO,
    );
  }, [open, receita]);

  const set = (patch: Partial<NovaReceita>) => setF((x) => ({ ...x, ...patch }));
  const num = (v: string) => Math.max(0, parseFloat(v) || 0);

  const salvar = async () => {
    if (!f.nome.trim() || !f.nicho.trim() || !f.cidade.trim()) {
      toast.error("Preencha nome, nicho e cidade.");
      return;
    }
    setSalvando(true);
    try {
      if (receita) await atualizarReceita(receita.id, f);
      else await criarReceita(f);
      toast.success("Receita salva.");
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{receita ? "Editar receita" : "Nova receita"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Campo label="Nome">
            <Input
              value={f.nome}
              onChange={(e) => set({ nome: e.target.value })}
              placeholder="ex: Dentistas SP semanal"
            />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Nicho">
              <Input
                value={f.nicho}
                onChange={(e) => set({ nicho: e.target.value })}
                placeholder="Dentista"
              />
            </Campo>
            <Campo label="Cidade">
              <Input
                value={f.cidade}
                onChange={(e) => set({ cidade: e.target.value })}
                placeholder="São Paulo"
              />
            </Campo>
            <Campo label="UF">
              <Input
                value={f.uf ?? ""}
                onChange={(e) => set({ uf: e.target.value })}
                placeholder="SP"
              />
            </Campo>
            <Campo label="Score mínimo">
              <Input
                type="number"
                value={f.score_minimo}
                onChange={(e) => set({ score_minimo: num(e.target.value) })}
              />
            </Campo>
            <Campo label="Canal">
              <Select value={f.canal} onValueChange={(v) => set({ canal: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">E-mail (revisão completa)</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Exigir contato">
              <Select
                value={f.exigir_contato ? "sim" : "nao"}
                onValueChange={(v) => set({ exigir_contato: v === "sim" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim (descarta sem contato)</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </Campo>
          </div>

          {/* TETOS em destaque */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-50/40 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-amber-900">
              <DollarSign className="h-4 w-4" /> Teto de gasto (obrigatório)
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Leads por rodada">
                <Input
                  type="number"
                  value={f.leads_por_rodada}
                  onChange={(e) => set({ leads_por_rodada: num(e.target.value) })}
                />
              </Campo>
              <Campo label="Máx. leads/rodada">
                <Input
                  type="number"
                  value={f.max_leads_rodada}
                  onChange={(e) => set({ max_leads_rodada: num(e.target.value) })}
                />
              </Campo>
              <Campo label="Máx. leads/mês">
                <Input
                  type="number"
                  value={f.max_leads_mes}
                  onChange={(e) => set({ max_leads_mes: num(e.target.value) })}
                />
              </Campo>
              <Campo label="Máx. US$/rodada">
                <Input
                  type="number"
                  step="0.5"
                  value={f.max_usd_rodada}
                  onChange={(e) => set({ max_usd_rodada: num(e.target.value) })}
                />
              </Campo>
              <Campo label="Máx. US$/mês">
                <Input
                  type="number"
                  step="1"
                  value={f.max_usd_mes}
                  onChange={(e) => set({ max_usd_mes: num(e.target.value) })}
                />
              </Campo>
              <Campo label="Frequência (quando ligar o agendamento)">
                <Select value={f.frequencia} onValueChange={(v) => set({ frequencia: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="diaria">Diária</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </Campo>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={salvando}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
