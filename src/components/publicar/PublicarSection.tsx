// Fase 4 — Tela "Publicar": lista de sites gerados, botão publicar e URL
// pública (só UI + mock por ora). Consome SOMENTE os tipos centrais (@/types)
// via a camada de serviço (@/services/publicacao) — nunca o mock direto.
import { useEffect, useState } from "react";
import {
  Loader2, RefreshCw, Globe, Rocket, Copy, ExternalLink, Check,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDataHora } from "@/lib/format";
import type { Publicacao, PublicacaoStatus } from "@/types";
import { listarPublicacoes, publicar } from "@/services/publicacao";

const STATUS_LABEL: Record<PublicacaoStatus, string> = {
  nao_publicado: "Não publicado",
  publicando: "Publicando…",
  publicado: "Publicado",
  erro: "Erro",
};

const STATUS_STYLE: Record<PublicacaoStatus, string> = {
  nao_publicado: "bg-secondary text-muted-foreground",
  publicando: "bg-amber-50 text-amber-700",
  publicado: "bg-green-100 text-green-800",
  erro: "bg-red-50 text-red-700",
};

function StatusPill({ status }: { status: PublicacaoStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[status])}>
      {status === "publicando" && <Loader2 className="h-3 w-3 animate-spin" />}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PublicarSection() {
  const [publicacoes, setPublicacoes] = useState<Publicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicandoId, setPublicandoId] = useState<string | null>(null);
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setPublicacoes(await listarPublicacoes());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar publicações");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { carregar(); }, []);

  const handlePublicar = async (p: Publicacao) => {
    setPublicandoId(p.id);
    setPublicacoes((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "publicando" } : x)));
    try {
      const atualizado = await publicar(p.id);
      setPublicacoes((prev) => prev.map((x) => (x.id === atualizado.id ? atualizado : x)));
      toast.success(`"${p.lead_nome}" publicado`);
    } catch (e) {
      setPublicacoes((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: "erro" } : x)));
      toast.error(e instanceof Error ? e.message : "Falha ao publicar");
    } finally {
      setPublicandoId(null);
    }
  };

  const copiar = async (p: Publicacao) => {
    if (!p.url_publica) return;
    try {
      await navigator.clipboard.writeText(p.url_publica);
      setCopiadoId(p.id);
      toast.success("URL copiada");
      setTimeout(() => setCopiadoId((c) => (c === p.id ? null : c)), 1500);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Publicar</h1>
          <p className="text-sm text-muted-foreground">Coloque o site gerado no ar e compartilhe a URL com o lead.</p>
        </div>
        <Button variant="outline" size="sm" onClick={carregar}><RefreshCw className="h-4 w-4" /> Atualizar</Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      ) : publicacoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <Rocket className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum site para publicar</h3>
          <p className="mt-1 text-sm text-muted-foreground">Gere um redesign na aba Redesign; os sites prontos aparecem aqui.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Lead", "URL pública", "Status", "Publicado em", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {publicacoes.map((p) => (
                  <tr key={p.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.lead_nome}</td>
                    <td className="px-4 py-3">
                      {p.url_publica ? (
                        <div className="flex items-center gap-2">
                          <a href={p.url_publica} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                            <Globe className="h-3.5 w-3.5" /> {p.url_publica.replace(/^https?:\/\//, "")}
                          </a>
                          <button onClick={() => copiar(p)} title="Copiar URL" className="text-muted-foreground hover:text-foreground">
                            {copiadoId === p.id ? <Check className="h-3.5 w-3.5 text-[#16A34A]" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusPill status={p.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDataHora(p.publicado_em)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant={p.status === "publicado" ? "outline" : "default"}
                          onClick={() => handlePublicar(p)}
                          disabled={publicandoId === p.id || p.status === "publicando"}
                        >
                          {publicandoId === p.id || p.status === "publicando" ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Publicando...</>
                          ) : p.status === "publicado" ? (
                            <><Rocket className="h-4 w-4" /> Republicar</>
                          ) : (
                            <><Rocket className="h-4 w-4" /> Publicar</>
                          )}
                        </Button>
                        {p.url_publica && (
                          <a href={p.url_publica} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" title="Abrir site"><ExternalLink className="h-4 w-4" /></Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
