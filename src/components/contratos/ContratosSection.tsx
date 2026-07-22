// Fase 2 — Tela "Contratos": listar e gerar contratos, com preview do documento
// (só UI + mock por ora). Consome SOMENTE os tipos centrais (@/types) via a
// camada de serviço (@/services/contratos) — nunca o mock direto.
import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  RefreshCw,
  Plus,
  Eye,
  FileSignature,
  Download,
  ScrollText,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatBRL, formatData } from "@/lib/format";
import type { Contrato, ContratoStatus } from "@/types";
import { listarContratos, gerarContrato, marcarComoAssinado } from "@/services/contratos";

const STATUS_LABEL: Record<ContratoStatus, string> = {
  rascunho: "Rascunho",
  gerado: "Gerado",
  assinado: "Assinado",
  cancelado: "Cancelado",
};

const STATUS_STYLE: Record<ContratoStatus, string> = {
  rascunho: "bg-secondary text-muted-foreground",
  gerado: "bg-blue-50 text-blue-700",
  assinado: "bg-green-100 text-green-800",
  cancelado: "bg-secondary text-muted-foreground line-through",
};

function StatusPill({ status }: { status: ContratoStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function ContratosSection() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gerando, setGerando] = useState(false);
  const [q, setQ] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("all");
  const [preview, setPreview] = useState<Contrato | null>(null);

  const carregar = async () => {
    setLoading(true);
    setError(null);
    try {
      setContratos(await listarContratos());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar contratos");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    carregar();
  }, []);

  const filtrados = useMemo(() => {
    const termo = q.trim().toLowerCase();
    return contratos.filter((c) => {
      if (statusFiltro !== "all" && c.status !== statusFiltro) return false;
      if (!termo) return true;
      return c.lead_nome.toLowerCase().includes(termo) || c.titulo.toLowerCase().includes(termo);
    });
  }, [contratos, q, statusFiltro]);

  const handleGerar = async () => {
    setGerando(true);
    try {
      // TODO: LIGAR API — abrir seleção de proposta/lead real; hoje usa modelo mock.
      const novo = await gerarContrato();
      setContratos((prev) => [novo, ...prev]);
      toast.success(`Contrato gerado para "${novo.lead_nome}"`);
      setPreview(novo);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar o contrato");
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contratos</h1>
          <p className="text-sm text-muted-foreground">Gere e acompanhe os contratos de serviço.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={carregar}>
            <RefreshCw className="h-4 w-4" /> Atualizar
          </Button>
          <Button
            size="sm"
            onClick={handleGerar}
            disabled={gerando}
            className="bg-primary font-semibold hover:bg-primary/90"
          >
            {gerando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Gerar contrato
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filtrar por lead ou título..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-[180px]" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="gerado">Gerado</SelectItem>
            <SelectItem value="assinado">Assinado</SelectItem>
            <SelectItem value="cancelado">Cancelado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
          <ScrollText className="mx-auto h-8 w-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Nenhum contrato ainda</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em "Gerar contrato" para criar o primeiro.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {["Lead", "Título", "Valor", "Status", "Criado em", "Ações"].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/30">
                    <td className="px-4 py-3 font-semibold text-foreground">{c.lead_nome}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.titulo}</td>
                    <td className="px-4 py-3 tabular-nums font-medium">{formatBRL(c.valor)}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatData(c.criado_em)}</td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Ver contrato"
                        onClick={() => setPreview(c)}
                      >
                        <Eye className="h-4 w-4" /> Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {preview && (
        <PreviewContratoDialog
          contrato={preview}
          onClose={() => setPreview(null)}
          onAssinado={(atualizado) => {
            setContratos((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)));
            setPreview(atualizado);
          }}
        />
      )}
    </div>
  );
}

function PreviewContratoDialog({
  contrato,
  onClose,
  onAssinado,
}: {
  contrato: Contrato;
  onClose: () => void;
  onAssinado: (c: Contrato) => void;
}) {
  const [assinando, setAssinando] = useState(false);

  const assinar = async () => {
    setAssinando(true);
    try {
      const atualizado = await marcarComoAssinado(contrato.id);
      toast.success("Contrato marcado como assinado.");
      onAssinado(atualizado);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao assinar");
    } finally {
      setAssinando(false);
    }
  };

  const baixar = () => {
    // TODO: LIGAR API — gerar/baixar o PDF/DOCX real do contrato.
    toast.info("Geração de PDF/DOCX entra quando a API for ligada.");
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-primary" /> {contrato.titulo}
          </DialogTitle>
        </DialogHeader>
        {/* Preview do documento */}
        <div
          className="prose-contrato max-h-[55vh] overflow-y-auto rounded-lg border border-border bg-white p-6 text-sm leading-relaxed text-slate-800 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:font-semibold [&_p]:mb-2"
          dangerouslySetInnerHTML={{ __html: contrato.conteudo_html }}
        />
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={baixar}>
            <Download className="h-4 w-4" /> Baixar (PDF/DOCX)
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={assinar} disabled={assinando || contrato.status === "assinado"}>
              {assinando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Assinando...
                </>
              ) : contrato.status === "assinado" ? (
                <>
                  <FileSignature className="h-4 w-4" /> Assinado
                </>
              ) : (
                <>
                  <FileSignature className="h-4 w-4" /> Marcar como assinado
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
