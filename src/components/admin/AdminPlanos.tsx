// Tela PLANOS do painel admin (billing camada 1 — cadastro). Padrão visual da referência
// (LeadzenAI) com a identidade Flow Leads: breadcrumb, toolbar de busca/filtros, linhas com
// descrição + limites empilhados + chips de acesso + pill de status + toggle/editar/excluir.
// Preços SEMPRE em R$ (real brasileiro). Tudo grava de verdade (Edge admin-acoes, guard
// super_admin); a COBRANÇA (gateway) segue TODO em docs/DIVIDAS.md.
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Search, ChevronRight, Tag } from "lucide-react";
import { toast } from "sonner";
import { adminAcao, type Plano } from "@/services/admin";
import { cn } from "@/lib/utils";

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const PERIODO_LABEL: Record<string, string> = { mensal: "mês", anual: "ano" };

type Rascunho = Partial<Plano>;

/** Chip de acesso (padrão do print): verde = incluso; dourado = limite numérico. */
function ChipAcesso({
  rotulo,
  valor,
  tom = "ouro",
}: {
  rotulo: string;
  valor?: number | null;
  tom?: "verde" | "ouro";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        tom === "verde"
          ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#15803D]"
          : "border-gold/40 bg-gold/10 text-gold",
      )}
    >
      {rotulo}
      {valor !== undefined && <b className="font-bold">{valor ?? "∞"}</b>}
    </span>
  );
}

function LinhaLimite({ rotulo, valor }: { rotulo: string; valor: number | null }) {
  return (
    <p className="whitespace-nowrap text-[12px] leading-5">
      <span className="text-muted-foreground">{rotulo}: </span>
      <b className="font-semibold text-foreground">{valor ?? "∞"}</b>
    </p>
  );
}

export function AdminPlanos({ planos, onMudou }: { planos: Plano[]; onMudou: () => void }) {
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [busca, setBusca] = useState("");
  const [fPeriodo, setFPeriodo] = useState("todos");
  const [fStatus, setFStatus] = useState("todos");

  const filtrados = useMemo(
    () =>
      planos.filter((p) => {
        if (busca.trim() && !p.nome.toLowerCase().includes(busca.trim().toLowerCase()))
          return false;
        if (fPeriodo !== "todos" && p.periodo !== fPeriodo) return false;
        if (fStatus === "ativos" && !p.ativo) return false;
        if (fStatus === "inativos" && p.ativo) return false;
        return true;
      }),
    [planos, busca, fPeriodo, fStatus],
  );

  const abrirNovo = () => setEditando({ nome: "", preco: 0, periodo: "mensal", ativo: true });

  const salvar = async () => {
    if (!editando?.nome?.trim()) {
      toast.error("Informe o nome do plano.");
      return;
    }
    setSalvando(true);
    try {
      const r = await adminAcao("plano_upsert", { plano: editando });
      if (!r.ok) {
        toast.error(`Não salvou: ${r.reason ?? "erro"}`);
        return;
      }
      toast.success(editando.id ? "Plano atualizado." : "Plano criado.");
      setEditando(null);
      onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSalvando(false);
    }
  };

  const toggle = async (p: Plano) => {
    try {
      const r = await adminAcao("plano_toggle", { id: p.id, ativo: !p.ativo });
      if (!r.ok) toast.error(`Falha: ${r.reason}`);
      else onMudou();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  const excluir = async (p: Plano) => {
    if (!confirm(`Excluir o plano "${p.nome}"?`)) return;
    try {
      const r = await adminAcao("plano_delete", { id: p.id });
      if (!r.ok)
        toast.error(
          r.reason === "plano_em_uso"
            ? "Não dá para excluir: há organizações neste plano."
            : `Falha: ${r.reason}`,
        );
      else {
        toast.success("Plano excluído.");
        onMudou();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  };

  return (
    <div className="space-y-4">
      {/* breadcrumb + ação principal */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Painel</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-foreground">Planos</span>
        </nav>
        <button
          onClick={abrirNovo}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gold px-4 text-sm font-semibold text-navy shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          <Plus className="h-4 w-4" /> Adicionar plano
        </button>
      </div>

      {/* toolbar: busca + filtros (funcionais, client-side) */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar pelo nome do plano…"
            className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 text-sm shadow-sm transition-all placeholder:text-muted-foreground/60 hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
        </div>
        <select
          value={fPeriodo}
          onChange={(e) => setFPeriodo(e.target.value)}
          className="h-11 cursor-pointer rounded-xl border border-border bg-card px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        >
          <option value="todos">Todos os períodos</option>
          <option value="mensal">Mensal</option>
          <option value="anual">Anual</option>
        </select>
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="h-11 cursor-pointer rounded-xl border border-border bg-card px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        >
          <option value="todos">Todos os status</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
      </div>

      {editando && (
        <PlanoForm
          plano={editando}
          onChange={setEditando}
          onSalvar={salvar}
          onCancelar={() => setEditando(null)}
          salvando={salvando}
        />
      )}

      {/* tabela premium */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/70 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Plano</th>
                <th className="px-6 py-3.5 font-semibold">Preço</th>
                <th className="px-6 py-3.5 font-semibold">Limites</th>
                <th className="px-6 py-3.5 font-semibold">Acesso</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 text-right font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtrados.map((p) => (
                <tr key={p.id} className="group transition-colors hover:bg-gold/[0.045]">
                  <td className="max-w-[300px] px-6 py-5 align-top">
                    <p className="font-serif text-[15px] font-semibold leading-tight text-foreground">
                      {p.nome}
                    </p>
                    {p.descricao && (
                      <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
                        {p.descricao}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-5 align-top">
                    <span className="font-serif text-[15px] font-semibold">
                      R$ {brl(Number(p.preco))}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {" "}
                      / {PERIODO_LABEL[p.periodo]}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <LinhaLimite rotulo="Leads" valor={p.limite_leads} />
                    <LinhaLimite rotulo="Sites IA" valor={p.limite_sites} />
                    <LinhaLimite rotulo="Campanhas" valor={p.limite_campanhas} />
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex max-w-[340px] flex-wrap gap-1.5">
                      {/* CRM (pipeline/kanban) é incluso em TODOS os planos — chip verdadeiro */}
                      <ChipAcesso rotulo="CRM" tom="verde" />
                      <ChipAcesso rotulo="Mensagens: " valor={p.limite_mensagens} />
                      <ChipAcesso rotulo="WhatsApp: " valor={p.limite_whatsapp} />
                      <ChipAcesso rotulo="Modelos: " valor={p.limite_templates} />
                      <ChipAcesso rotulo="Segmentos: " valor={p.limite_segmentos} />
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        p.ativo
                          ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#15803D]"
                          : "border-border bg-secondary text-muted-foreground",
                      )}
                    >
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggle(p)}
                        role="switch"
                        aria-checked={p.ativo}
                        title={p.ativo ? "Desativar" : "Ativar"}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
                          p.ativo ? "bg-gold" : "bg-input",
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200",
                            p.ativo ? "translate-x-[22px]" : "translate-x-0.5",
                          )}
                        />
                      </button>
                      <button
                        onClick={() => setEditando(p)}
                        title="Editar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => excluir(p)}
                        title="Excluir"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center">
                    <Tag className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">
                      {planos.length === 0
                        ? "Nenhum plano cadastrado — clique em Adicionar plano."
                        : "Nenhum plano bate com a busca/filtros."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LimiteInput({
  rotulo,
  valor,
  onChange,
}: {
  rotulo: string;
  valor: number | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-medium text-foreground">{rotulo}</label>
      <input
        type="number"
        min={0}
        value={valor ?? ""}
        placeholder="∞"
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
      />
    </div>
  );
}

function PlanoForm({
  plano,
  onChange,
  onSalvar,
  onCancelar,
  salvando,
}: {
  plano: Rascunho;
  onChange: (p: Rascunho) => void;
  onSalvar: () => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const set = (patch: Rascunho) => onChange({ ...plano, ...patch });
  const numOrNull = (v: string) => (v === "" ? null : Number(v));
  return (
    <div className="rounded-2xl border border-gold/30 bg-card p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 font-serif text-lg">{plano.id ? "Editar plano" : "Novo plano"}</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-[13px] font-medium text-foreground">
            Nome<span className="ml-0.5 text-gold">*</span>
          </label>
          <input
            value={plano.nome ?? ""}
            onChange={(e) => set({ nome: e.target.value })}
            placeholder="ex.: Plano Pro"
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-[13px] font-medium text-foreground">
              Preço (R$)<span className="ml-0.5 text-gold">*</span>
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={plano.preco ?? 0}
              onChange={(e) => set({ preco: Number(e.target.value) })}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-foreground">Período</label>
            <select
              value={plano.periodo ?? "mensal"}
              onChange={(e) => set({ periodo: e.target.value as "mensal" | "anual" })}
              className="h-10 cursor-pointer rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
            >
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <label className="mb-1.5 block text-[13px] font-medium text-foreground">Descrição</label>
        <input
          value={plano.descricao ?? ""}
          onChange={(e) => set({ descricao: e.target.value })}
          placeholder="Uma frase curta sobre para quem é o plano"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition-all hover:border-gold/40 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25"
        />
      </div>
      <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Limites por período (vazio = ilimitado)
      </p>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <LimiteInput
          rotulo="Leads"
          valor={plano.limite_leads}
          onChange={(v) => set({ limite_leads: numOrNull(v) })}
        />
        <LimiteInput
          rotulo="Sites IA"
          valor={plano.limite_sites}
          onChange={(v) => set({ limite_sites: numOrNull(v) })}
        />
        <LimiteInput
          rotulo="Campanhas"
          valor={plano.limite_campanhas}
          onChange={(v) => set({ limite_campanhas: numOrNull(v) })}
        />
        <LimiteInput
          rotulo="Mensagens"
          valor={plano.limite_mensagens}
          onChange={(v) => set({ limite_mensagens: numOrNull(v) })}
        />
        <LimiteInput
          rotulo="WhatsApp"
          valor={plano.limite_whatsapp}
          onChange={(v) => set({ limite_whatsapp: numOrNull(v) })}
        />
        <LimiteInput
          rotulo="Modelos"
          valor={plano.limite_templates}
          onChange={(v) => set({ limite_templates: numOrNull(v) })}
        />
        <LimiteInput
          rotulo="Segmentos"
          valor={plano.limite_segmentos}
          onChange={(v) => set({ limite_segmentos: numOrNull(v) })}
        />
      </div>
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={onSalvar}
          disabled={salvando}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gold px-5 text-sm font-semibold text-navy shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:translate-y-0 disabled:opacity-60"
        >
          {salvando && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
        </button>
        <button
          onClick={onCancelar}
          className="h-10 rounded-lg border border-border px-5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
