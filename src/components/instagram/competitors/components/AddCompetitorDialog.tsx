import { useState } from "react";
import { AtSign, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitySelector } from "@/components/leads/instagram/CitySelector";
import { NichoSelector } from "@/components/leads/NichoSelector";
import {
  INSTAGRAM_UFS,
  InstagramField,
} from "@/components/instagram/shared/InstagramDiscoveryFields";
import {
  saveInstagramCompetitor,
  type InstagramCompetitor,
} from "@/services/instagram-competitors";

interface AddCompetitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (competitor: InstagramCompetitor) => void;
}

const EMPTY_FORM = {
  username: "",
  label: "",
  niche: "",
  city: "",
  state: "",
  monitoringIntervalHours: 168,
};

export function AddCompetitorDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddCompetitorDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.username.trim()) {
      toast.error("Informe o @ do concorrente.");
      return;
    }
    if (!form.niche) {
      toast.error("Selecione o nicho do concorrente.");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveInstagramCompetitor({
        ...form,
        username: form.username.replace(/^@/, "").trim(),
      });
      toast.success(`Concorrente @${saved.username} adicionado com sucesso!`);
      setForm(EMPTY_FORM);
      onOpenChange(false);
      onSuccess?.(saved);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível adicionar o concorrente.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar Concorrente</DialogTitle>
          <DialogDescription>
            Monitore o crescimento, engajamento e conteúdos recentes do perfil concorrente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 sm:grid-cols-2">
          <InstagramField label="@ do concorrente">
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.username}
                onChange={(e) => setForm((curr) => ({ ...curr, username: e.target.value }))}
                placeholder="concorrente"
                className="pl-9"
              />
            </div>
          </InstagramField>

          <InstagramField label="Nome interno (opcional)">
            <Input
              value={form.label}
              onChange={(e) => setForm((curr) => ({ ...curr, label: e.target.value }))}
              placeholder="Ex: Principal Pizzaria SP"
            />
          </InstagramField>

          <div className="sm:col-span-2">
            <InstagramField label="Nicho">
              <NichoSelector
                value={form.niche}
                onSelect={(niche) => setForm((curr) => ({ ...curr, niche }))}
                disabled={saving}
              />
            </InstagramField>
          </div>

          <InstagramField label="Estado">
            <Select
              value={form.state}
              onValueChange={(state) => setForm((curr) => ({ ...curr, state, city: "" }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                {INSTAGRAM_UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InstagramField>

          <InstagramField label="Cidade">
            <CitySelector
              uf={form.state}
              value={form.city}
              onChange={(city) => setForm((curr) => ({ ...curr, city }))}
              disabled={saving}
            />
          </InstagramField>

          <div className="sm:col-span-2">
            <InstagramField label="Frequência de monitoramento">
              <Select
                value={String(form.monitoringIntervalHours)}
                onValueChange={(val) =>
                  setForm((curr) => ({ ...curr, monitoringIntervalHours: Number(val) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">Diária (a cada 24 horas)</SelectItem>
                  <SelectItem value="72">A cada 3 dias</SelectItem>
                  <SelectItem value="168">Semanal (recomendado)</SelectItem>
                  <SelectItem value="720">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </InstagramField>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#2563EB] hover:bg-[#1D4ED8]">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Adicionar e monitorar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
