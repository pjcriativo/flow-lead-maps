// Fase 2 — CAMPANHAS. Agrupa a abordagem de uma LISTA num lote revisável. Tela 1:
// lista de campanhas (com progresso). Tela 2 (revisão em lote): as propostas da
// campanha, com aprovar/enviar EM LOTE e revisar por linha — tudo passando pelo
// PORTÃO DE REVISÃO (nada sai sem aprovar) e pela RAMPA POR ORG (teto do dia).
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Plus,
  Megaphone,
  ArrowLeft,
  Pencil,
  Trash2,
  Send,
  ShieldCheck,
  Search,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatData } from "@/lib/format";
import type { Campanha, Proposta } from "@/types";
import { StatusPill, RevisarPropostaDialog } from "@/components/propostas/PropostasSection";
import { listarPropostasPorCampanha, enviarProposta, statusRampa } from "@/services/propostas";
import type { RampaStatus } from "@/services/propostas";
import {
  listarCampanhas,
  criarCampanhaDaLista,
  renomearCampanha,
  excluirCampanha,
  aprovarTodasDaCampanha,
  enviarAprovadasDaCampanha,
} from "@/services/campanhas";
import { listarListas, type LeadListComStats } from "@/lib/lists-api";

export function CampanhasSection() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [abrindoCriar, setAbrindoCriar] = useState(false);
  const [aberta, setAberta] = useState<Campanha | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setCampanhas(await listarCampanhas());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar campanhas");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    carregar();
  }, []);

  const handleRenomear = async (c: Campanha) => {
    const novo = prompt("Novo nome da campanha:", c.nome);
    if (novo == null || !novo.trim() || novo.trim() === c.nome) return;
    const prev = campanhas;
    setCampanhas((p) => p.map((x) => (x.id === c.id ? { ...x, nome: novo.trim() } : x)));
    try {
      await renomearCampanha(c.id, novo.trim());
      toast.success("Campanha renomeada.");
    } catch (e) {
      setCampanhas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao renomear");
    }
  };

  const handleExcluir = async (c: Campanha) => {
    if (
      !confirm(
        `Excluir a campanha "${c.nome}"? As ${c.total} propostas continuam existindo (apenas desvinculadas). Esta ação não pode ser desfeita.`,
      )
    )
      return;
    const prev = campanhas;
    setCampanhas((p) => p.filter((x) => x.id !== c.id));
    try {
      await excluirCampanha(c.id);
      toast.success("Campanha excluída.");
    } catch (e) {
      setCampanhas(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao excluir");
    }
  };

  // Abre a revisão em lote de uma campanha recém-criada (recarrega e acha por id).
  const abrirRecemCriada = async (campanhaId: string) => {
    const lista = await listarCampanhas();
    setCampanhas(lista);
    const nova = lista.find((c) => c.id === campanhaId);
    if (nova) setAberta(nova);
  };

  if (aberta) {
    return (
      <RevisaoEmLote
        campanha={aberta}
        onVoltar={() => {
          setAberta(null);
          carregar();
        }}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campanhas</h1>
          <p className="text-sm text-muted-foreground">
            Agrupe a abordagem de uma lista num lote e revise tudo de uma vez. {campanhas.length}{" "}
            campanhas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setAbrindoCriar(true)}
            className="bg-primary font-semibold hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Criar campanha
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando campanhas...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : campanhas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma campanha ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Criar campanha" e escolha uma lista — as propostas dos leads com site
            publicado entram no lote para você revisar.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campanhas.map((c) => (
            <CampanhaCard
              key={c.id}
              campanha={c}
              onAbrir={() => setAberta(c)}
              onRenomear={() => handleRenomear(c)}
              onExcluir={() => handleExcluir(c)}
            />
          ))}
        </div>
      )}

      {abrindoCriar && (
        <CriarCampanhaDialog
          onClose={() => setAbrindoCriar(false)}
          onCriada={async (campanhaId) => {
            setAbrindoCriar(false);
            await abrirRecemCriada(campanhaId);
          }}
        />
      )}
    </div>
  );
}

function CampanhaCard({
  campanha: c,
  onAbrir,
  onRenomear,
  onExcluir,
}: {
  campanha: Campanha;
  onAbrir: () => void;
  onRenomear: () => void;
  onExcluir: () => void;
}) {
  const pct = c.total > 0 ? Math.round((c.enviada / c.total) * 100) : 0;
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <button className="flex-1 text-left" onClick={onAbrir}>
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold leading-tight text-foreground">{c.nome}</span>
          <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">{formatData(c.criada_em)}</div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="font-medium">
            <b className="text-base tabular-nums">{c.total}</b> propostas
          </span>
          <span className="text-muted-foreground">{c.rascunho} rascunho</span>
          <span className="text-amber-700">{c.aprovada} aprovadas</span>
          <span className="text-blue-700">{c.enviada} enviadas</span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </button>
      <div className="flex items-center gap-1.5 border-t border-border pt-2">
        <Button size="sm" variant="ghost" className="flex-1" onClick={onAbrir}>
          <ShieldCheck className="h-4 w-4" /> Revisar em lote
        </Button>
        <Button size="sm" variant="ghost" title="Renomear" onClick={onRenomear}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" title="Excluir" onClick={onExcluir}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

/* -------------------- Criar campanha a partir de uma lista -------------------- */
function CriarCampanhaDialog({
  onClose,
  onCriada,
}: {
  onClose: () => void;
  onCriada: (campanhaId: string) => void;
}) {
  const [listas, setListas] = useState<LeadListComStats[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [criandoId, setCriandoId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setListas(await listarListas());
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Falha ao carregar listas");
      }
    })();
  }, []);

  const filtradas = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return (listas ?? []).filter((l) => l.name.toLowerCase().includes(termo));
  }, [listas, q]);

  const criar = async (l: LeadListComStats) => {
    setCriandoId(l.id);
    try {
      const r = await criarCampanhaDaLista(l.id, l.name);
      if (r.geradas === 0) {
        toast.warning(
          `Campanha criada, mas nenhuma proposta foi gerada: ${r.sem_site} lead(s) sem site publicado` +
            (r.ja_com_proposta ? `, ${r.ja_com_proposta} já com proposta` : "") +
            ". Publique prévias na aba Publicar primeiro.",
        );
      } else {
        toast.success(
          `Campanha criada com ${r.geradas} proposta(s) em rascunho.` +
            (r.sem_site ? ` (${r.sem_site} sem site ficaram de fora.)` : ""),
        );
      }
      onCriada(r.campanha_id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao criar a campanha");
      setCriandoId(null);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary" /> Escolha a lista da campanha
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            A campanha gera uma proposta (rascunho) para cada lead da lista que já tem um site
            publicado. Você revisa e aprova em lote antes de enviar.
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar lista..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {erro ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {erro}
            </div>
          ) : listas === null ? (
            <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando listas...
            </div>
          ) : filtradas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhuma lista encontrada. Faça uma busca na aba Buscar — ela vira uma lista.
            </div>
          ) : (
            <div className="max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
              {filtradas.map((l) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {l.leads_atuais} leads · {l.niche}
                      {l.city ? ` · ${l.city}` : ""}
                      {l.uf ? `/${l.uf}` : ""}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => criar(l)} disabled={criandoId !== null}>
                    {criandoId === l.id ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Criando...
                      </>
                    ) : (
                      "Criar"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Revisão em lote -------------------- */
function RevisaoEmLote({ campanha, onVoltar }: { campanha: Campanha; onVoltar: () => void }) {
  const [propostas, setPropostas] = useState<Proposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Proposta | null>(null);
  const [enviandoId, setEnviandoId] = useState<string | null>(null);
  const [aprovandoTodas, setAprovandoTodas] = useState(false);
  const [enviandoLote, setEnviandoLote] = useState(false);
  const [rampa, setRampa] = useState<RampaStatus | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ps, r] = await Promise.all([listarPropostasPorCampanha(campanha.id), statusRampa()]);
      setPropostas(ps);
      setRampa(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar propostas da campanha");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campanha.id]);

  const totais = useMemo(
    () => ({
      total: propostas.length,
      rascunho: propostas.filter((p) => p.status === "rascunho").length,
      aprovada: propostas.filter((p) => p.status === "aprovada").length,
      enviada: propostas.filter((p) => p.status === "enviada").length,
    }),
    [propostas],
  );

  const handleEnviar = async (p: Proposta): Promise<boolean> => {
    setEnviandoId(p.id);
    try {
      const r = await enviarProposta(p.id);
      if (!r.ok) {
        const msg: Record<string, string> = {
          nao_aprovada: `"${p.lead_nome}" ainda não foi aprovada.`,
          opt_out: `"${p.lead_nome}" pediu descadastro (LGPD).`,
          teto_dia: "Limite diário do aquecimento atingido — o resto sai amanhã.",
          sem_email: `"${p.lead_nome}" não tem e-mail cadastrado.`,
        };
        toast.warning(msg[r.reason] ?? "Não foi possível enviar.");
        if (r.reason === "teto_dia") setRampa(await statusRampa());
        return false;
      }
      setPropostas((prev) => prev.map((x) => (x.id === r.proposta.id ? r.proposta : x)));
      toast.success(`E-mail enviado para "${p.lead_nome}".`);
      setRampa(await statusRampa());
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar");
      return false;
    } finally {
      setEnviandoId(null);
    }
  };

  const aprovarTodas = async () => {
    if (totais.rascunho === 0) return;
    if (
      !confirm(
        `Aprovar as ${totais.rascunho} propostas em rascunho? Elas ficam prontas para envio (o texto atual de cada uma é o que será enviado).`,
      )
    )
      return;
    setAprovandoTodas(true);
    try {
      const n = await aprovarTodasDaCampanha(campanha.id);
      toast.success(`${n} proposta(s) aprovada(s).`);
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao aprovar em lote");
    } finally {
      setAprovandoTodas(false);
    }
  };

  const enviarAprovadas = async () => {
    if (totais.aprovada === 0) return;
    if (!confirm(`Enviar as ${totais.aprovada} propostas aprovadas agora?`)) return;
    setEnviandoLote(true);
    try {
      const r = await enviarAprovadasDaCampanha(campanha.id);
      const partes = [
        `${r.enviadas} enviada(s)`,
        r.teto_dia ? `${r.teto_dia} barrada(s) pelo teto do dia (saem amanhã)` : "",
        r.sem_email ? `${r.sem_email} sem e-mail` : "",
        r.opt_out ? `${r.opt_out} em opt-out` : "",
        r.erro ? `${r.erro} com erro` : "",
      ].filter(Boolean);
      if (r.enviadas > 0) toast.success(partes.join(" · "));
      else toast.warning(partes.join(" · ") || "Nada enviado.");
      await carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar em lote");
    } finally {
      setEnviandoLote(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onVoltar}>
            <ArrowLeft className="h-4 w-4" /> Campanhas
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{campanha.nome}</h1>
            <p className="text-sm text-muted-foreground">
              {totais.total} propostas · {totais.rascunho} rascunho · {totais.aprovada} aprovadas ·{" "}
              {totais.enviada} enviadas
            </p>
            {rampa && (
              <p className="mt-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Aquecimento{rampa.ativa ? ` · dia ${rampa.dia}` : " (não iniciado)"} · teto{" "}
                  {rampa.teto}/dia · {rampa.enviados_hoje} enviados hoje · {rampa.restante} restante
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={aprovarTodas}
            disabled={aprovandoTodas || totais.rascunho === 0}
          >
            {aprovandoTodas ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Aprovar todas ({totais.rascunho})
          </Button>
          <Button
            size="sm"
            onClick={enviarAprovadas}
            disabled={enviandoLote || totais.aprovada === 0}
            className="bg-primary font-semibold hover:bg-primary/90"
          >
            {enviandoLote ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar aprovadas ({totais.aprovada})
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando propostas...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : propostas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Megaphone className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhuma proposta nesta campanha</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Os leads desta lista ainda não têm site publicado. Publique prévias na aba Publicar e
            crie a campanha de novo.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Lead", "Destinatário", "Status", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propostas.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.lead_nome}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {p.lead_email ?? "— sem e-mail —"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Revisar / editar"
                          onClick={() => setEditando(p)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={
                            p.status === "aprovada"
                              ? "Enviar por e-mail"
                              : p.status === "rascunho"
                                ? "Aprove antes de enviar"
                                : "Já enviada"
                          }
                          onClick={() => handleEnviar(p)}
                          disabled={p.status !== "aprovada" || enviandoId === p.id}
                        >
                          {enviandoId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editando && (
        <RevisarPropostaDialog
          proposta={editando}
          onClose={() => setEditando(null)}
          onChange={(atualizada) =>
            setPropostas((prev) => prev.map((p) => (p.id === atualizada.id ? atualizada : p)))
          }
          onEnviar={handleEnviar}
        />
      )}
    </div>
  );
}
