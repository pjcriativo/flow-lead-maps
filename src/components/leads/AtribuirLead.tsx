// UI mínima de HANDOFF: mostra o responsável atual do lead e permite reatribuir a um
// colaborador da org. A Edge lead-atribuir valida papel/organização e grava o histórico;
// a visibilidade (RLS) segue a atribuição. Só aparece quando a org tem mais de um membro.
import { useEffect, useState } from "react";
import { UserCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listarMembrosDaOrg, atribuirLead, type Membro } from "@/services/membros";
import type { Lead } from "@/lib/leads-api";

const PAPEL_LABEL: Record<string, string> = {
  admin: "Admin",
  gerente: "Gerente",
  vendedor: "Vendedor",
  sdr: "SDR",
  suporte: "Suporte",
  super_admin: "Super admin",
};

export function AtribuirLead({
  lead,
  onAtribuido,
}: {
  lead: Lead;
  onAtribuido?: (paraUserId: string) => void;
}) {
  const orgId = lead.org_id ?? null;
  const atual = lead.assigned_to ?? null;
  const [membros, setMembros] = useState<Membro[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    let vivo = true;
    listarMembrosDaOrg(orgId)
      .then((m) => vivo && setMembros(m))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [orgId]);

  // sem base para escolher (org de 1 pessoa) → não mostra o seletor
  if (!orgId || membros.length < 2) return null;

  const trocar = async (paraUserId: string) => {
    if (paraUserId === atual) return;
    setSalvando(true);
    try {
      const r = await atribuirLead(lead.id, paraUserId);
      if (!r.ok) {
        toast.error(`Não foi possível atribuir: ${r.reason ?? "erro"}`);
        return;
      }
      const m = membros.find((x) => x.user_id === paraUserId);
      toast.success(`Lead atribuído a ${m?.nome || m?.email || "colaborador"}.`);
      onAtribuido?.(paraUserId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atribuir");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/40 px-2 py-1">
      {salvando ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      ) : (
        <UserCheck className="h-3.5 w-3.5 text-primary" />
      )}
      <span className="text-xs text-muted-foreground">Responsável:</span>
      <Select value={atual ?? undefined} onValueChange={trocar} disabled={salvando}>
        <SelectTrigger className="h-7 min-w-[150px] border-0 bg-transparent px-1 text-xs shadow-none">
          <SelectValue placeholder="Ninguém" />
        </SelectTrigger>
        <SelectContent>
          {membros.map((m) => (
            <SelectItem key={m.user_id} value={m.user_id} className="text-xs">
              {(m.nome || m.email) + ` · ${PAPEL_LABEL[m.papel] ?? m.papel}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
