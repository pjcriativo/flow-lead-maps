// Fase 4 — Tela "Publicar": sites TEMPORÁRIOS gerados, servidos em
// flowleads.flowgenius.com.br/site/<slug>. Ciclo publicado → aprovado/
// reprovado/expirado (expira em 15 dias). Só UI + serviço mock por ora.
// Consome SOMENTE os tipos centrais (@/types) via @/services/publicacao.
import { useEffect, useState } from "react";
import {
  Loader2, RefreshCw, Globe, Rocket, Copy, ExternalLink, Check, Trash2,
  ThumbsUp, ThumbsDown, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SitePublicado, SitePublicadoStatus, LeadPublicavel } from "@/types";
import {
  listarSites, listarLeadsPublicaveis, publicarSite, despublicarSite, marcarStatus,
} from "@/services/publicacao";

const STATUS_LABEL: Record<SitePublicadoStatus, string> = {
  publicado: "Publicado",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  expirado: "Expirado",
};

const STATUS_STYLE: Record<SitePublicadoStatus, string> = {
  publicado: "bg-blue-50 text-blue-700",
  aprovado: "bg-green-100 text-green-800",
  reprovado: "bg-red-50 text-red-700",
  expirado: "bg-secondary text-muted-foreground",
};

function StatusPill({ status }: { status: SitePublicadoStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// Nome legível a partir do slug (a interface SitePublicado não guarda o nome).
function nomeDoSlug(slug: string): string {
  return slug.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function diasParaExpirar(expira_em: string): number {
  return Math.ceil((new Date(expira_em).getTime() - Date.now()) / 86_400_000);
}

function ExpiraCell({ site }: { site: SitePublicado }) {
  if (site.status === "expirado") {
    return <span className="text-muted-foreground">Expirado</span>;
  }
  const dias = diasParaExpirar(site.expira_em);
  if (dias <= 0) return <span className="text-red-600">Expira hoje</span>;
  return (
    <span className={cn("inline-flex items-center gap-1", dias <= 3 ? "text-red-600" : "text-muted-foreground")}>
      <Clock className="h-3.5 w-3.5" /> {dias} {dias === 1 ? "dia" : "dias"}
    </span>
  );
}

export function PublicarSection() {
  const [sites, setSites] = useState<SitePublicado[]>([]);
  const [publicaveis, setPublicaveis] = useState<LeadPublicavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicandoId, setPublicandoId] = useState<string | null>(null);
  const [acaoId, setAcaoId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p] = await Promise.all([listarSites(), listarLeadsPublicaveis()]);
      setSites(s);
      setPublicaveis(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar publicações");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { carregar(); }, []);

  const handlePublicar = async (lead: LeadPublicavel) => {
    setPublicandoId(lead.lead_id);
    try {
      const novo = await publicarSite(lead.lead_id);
      setSites((prev) => [novo, ...prev]);
      setPublicaveis((prev) => prev.filter((l) => l.lead_id !== lead.lead_id));
      toast.success(`"${lead.lead_nome}" publicado`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao publicar");
    } finally {
      setPublicandoId(null);
    }
  };

  const handleStatus = async (site: SitePublicado, status: SitePublicadoStatus) => {
    setAcaoId(site.id);
    try {
      const atualizado = await marcarStatus(site.id, status);
      setSites((prev) => prev.map((s) => (s.id === atualizado.id ? atualizado : s)));
      toast.success(`Marcado como ${STATUS_LABEL[status].toLowerCase()}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar");
    } finally {
      setAcaoId(null);
    }
  };

  const handleExcluir = async (site: SitePublicado) => {
    if (!confirm(`Despublicar "${nomeDoSlug(site.slug)}"? Os arquivos são apagados (o registro é mantido).`)) return;
    setAcaoId(site.id);
    const prev = sites;
    setSites((p) => p.filter((s) => s.id !== site.id)); // some da lista ativa
    try {
      await despublicarSite(site.id);
      toast.success("Site despublicado (arquivos removidos).");
    } catch (e) {
      setSites(prev);
      toast.error(e instanceof Error ? e.message : "Falha ao despublicar");
    } finally {
      setAcaoId(null);
    }
  };

  const copiar = async (site: SitePublicado) => {
    try {
      await navigator.clipboard.writeText(site.url_publica);
      setCopiadoId(site.id);
      toast.success("URL copiada");
      setTimeout(() => setCopiadoId((c) => (c === site.id ? null : c)), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Publicar</h1>
          <p className="text-sm text-muted-foreground">
            Sites temporários em <span className="font-medium text-foreground">flowleads.flowgenius.com.br/site/…</span> — expiram em 15 dias se não resolvidos.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
      </div>

      {/* Prontos para publicar */}
      {publicaveis.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Prontos para publicar</h2>
          <div className="flex flex-wrap gap-2">
            {publicaveis.map((lead) => (
              <div key={lead.lead_id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2">
                <span className="text-sm font-medium">{lead.lead_nome}</span>
                <Button size="sm" onClick={() => handlePublicar(lead)} disabled={publicandoId === lead.lead_id} className="bg-primary font-semibold hover:bg-primary/90">
                  {publicandoId === lead.lead_id ? <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</> : <><Rocket className="h-4 w-4" /> Publicar</>}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : sites.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Rocket className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum site publicado</h3>
          <p className="mt-1 text-sm text-muted-foreground">Publique um site pronto acima; ele aparece aqui com a URL temporária.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Lead", "URL pública", "Status", "Expira em", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => {
                  const removido = s.arquivos_removidos;
                  return (
                    <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                      <td className="px-4 py-3 font-semibold text-foreground">{nomeDoSlug(s.slug)}</td>
                      <td className="px-4 py-3">
                        {removido ? (
                          <span className="text-xs text-muted-foreground">arquivos removidos</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <a href={s.url_publica} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                              <Globe className="h-3.5 w-3.5" /> {s.url_publica.replace(/^https?:\/\//, "")}
                            </a>
                            <button onClick={() => copiar(s)} title="Copiar URL" className="text-muted-foreground hover:text-foreground">
                              {copiadoId === s.id ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusPill status={s.status} /></td>
                      <td className="px-4 py-3"><ExpiraCell site={s} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {s.status !== "expirado" && (
                            <>
                              {s.status !== "aprovado" && (
                                <Button size="sm" variant="ghost" title="Marcar aprovado" onClick={() => handleStatus(s, "aprovado")} disabled={acaoId === s.id}>
                                  <ThumbsUp className="h-4 w-4 text-[#16A34A]" />
                                </Button>
                              )}
                              {s.status !== "reprovado" && (
                                <Button size="sm" variant="ghost" title="Marcar reprovado" onClick={() => handleStatus(s, "reprovado")} disabled={acaoId === s.id}>
                                  <ThumbsDown className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                              {!removido && (
                                <a href={s.url_publica} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="ghost" title="Abrir site"><ExternalLink className="h-4 w-4" /></Button>
                                </a>
                              )}
                              <Button size="sm" variant="ghost" title="Despublicar/Excluir" onClick={() => handleExcluir(s)} disabled={acaoId === s.id}>
                                {acaoId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
                              </Button>
                            </>
                          )}
                          {s.status === "expirado" && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
