// Tela PLANOS do painel admin (billing camada 1 — cadastro). Layout do LeadzenAI, cor Flow
// Leads, pt-BR. Lista os planos com limites e status; Adicionar/Editar/ativar-desativar gravam
// de verdade (Edge admin-acoes, guard super_admin). A COBRANÇA (gateway) é TODO.
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import { adminAcao, type Plano } from "@/services/admin";
import { cn } from "@/lib/utils";

const brl = (v: number) => v.toFixed(2).replace(".", ",");
const PERIODO_LABEL: Record<string, string> = { mensal: "Mensal", anual: "Anual" };

type Rascunho = Partial<Plano>;

function LimiteChip({ rotulo, valor }: { rotulo: string; valor: number | null }) {
  return (
    <span className="rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">
      {rotulo}: <b className="text-foreground">{valor ?? "∞"}</b>
    </span>
  );
}

export function AdminPlanos({ planos, onMudou }: { planos: Plano[]; onMudou: () => void }) {
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [salvando, setSalvando] = useState(false);

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
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-serif text-xl">Planos</h2>
          <p className="text-xs text-muted-foreground">
            Planos de assinatura e seus limites por período. A cobrança recorrente entra depois.
          </p>
        </div>
        <button
          onClick={abrirNovo}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </button>
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Plano</th>
              <th className="px-5 py-2.5 font-medium">Preço</th>
              <th className="px-5 py-2.5 font-medium">Limites</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
              <th className="px-5 py-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {planos.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="max-w-[280px] px-5 py-3">
                  <p className="inline-flex items-center gap-1.5 font-medium">
                    <Tag className="h-3.5 w-3.5 text-gold" />
                    {p.nome}
                  </p>
                  {p.descricao && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {p.descricao}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-5 py-3">
                  <span className="font-serif">R$ {brl(Number(p.preco))}</span>
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    / {PERIODO_LABEL[p.periodo]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    <LimiteChip rotulo="Leads" valor={p.limite_leads} />
                    <LimiteChip rotulo="Sites IA" valor={p.limite_sites} />
                    <LimiteChip rotulo="Campanhas" valor={p.limite_campanhas} />
                    <LimiteChip rotulo="Mensagens" valor={p.limite_mensagens} />
                    <LimiteChip rotulo="WhatsApp" valor={p.limite_whatsapp} />
                    <LimiteChip rotulo="Modelos" valor={p.limite_templates} />
                    <LimiteChip rotulo="Segmentos" valor={p.limite_segmentos} />
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      p.ativo
                        ? "bg-[#16A34A]/10 text-[#15803D]"
                        : "bg-secondary text-muted-foreground",
                    )}
                  >
                    {p.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => toggle(p)}
                      role="switch"
                      aria-checked={p.ativo}
                      title={p.ativo ? "Desativar" : "Ativar"}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                        p.ativo ? "bg-gold" : "bg-secondary",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          p.ativo ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </button>
                    <button
                      onClick={() => setEditando(p)}
                      title="Editar"
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => excluir(p)}
                      title="Excluir"
                      className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {planos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Nenhum plano cadastrado — clique em Adicionar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      <label className="mb-1 block text-[11px] uppercase text-muted-foreground">{rotulo}</label>
      <input
        type="number"
        min={0}
        value={valor ?? ""}
        placeholder="∞"
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
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
    <div className="border-b border-border bg-secondary/20 px-5 py-4">
      <h3 className="mb-3 font-serif text-base">{plano.id ? "Editar plano" : "Novo plano"}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] uppercase text-muted-foreground">Nome</label>
          <input
            value={plano.nome ?? ""}
            onChange={(e) => set({ nome: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] uppercase text-muted-foreground">
              Preço (R$)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={plano.preco ?? 0}
              onChange={(e) => set({ preco: Number(e.target.value) })}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase text-muted-foreground">
              Período
            </label>
            <select
              value={plano.periodo ?? "mensal"}
              onChange={(e) => set({ periodo: e.target.value as "mensal" | "anual" })}
              className="h-9 rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="mensal">Mensal</option>
              <option value="anual">Anual</option>
            </select>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <label className="mb-1 block text-[11px] uppercase text-muted-foreground">Descrição</label>
        <input
          value={plano.descricao ?? ""}
          onChange={(e) => set({ descricao: e.target.value })}
          className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
        />
      </div>
      <p className="mb-1 mt-4 text-[11px] uppercase tracking-wide text-muted-foreground">
        Limites por período (deixe vazio = ilimitado)
      </p>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
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
      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onSalvar}
          disabled={salvando}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-gold px-4 text-xs font-semibold text-gold-foreground disabled:opacity-60"
        >
          {salvando && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Salvar
        </button>
        <button
          onClick={onCancelar}
          className="h-9 rounded-md border border-border px-4 text-xs font-medium text-muted-foreground hover:bg-secondary"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
