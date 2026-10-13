import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LeadItem } from "./leads-premium-data";
import { validateLeadForm } from "./leads-premium-data";

export type LeadFormValues = {
  businessName: string;
  contactName: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  category: string;
  city: string;
  state: string;
  address: string;
  notes: string;
  listId: string;
  status: string;
};

const EMPTY_VALUES: LeadFormValues = {
  businessName: "",
  contactName: "",
  phone: "",
  whatsapp: "",
  email: "",
  website: "",
  category: "",
  city: "",
  state: "",
  address: "",
  notes: "",
  listId: "",
  status: "new",
};

const STATUSES = [
  ["new", "Novo"],
  ["enriched", "Enriquecido"],
  ["contacted", "Contatado"],
  ["proposta_enviada", "Proposta enviada"],
  ["responded", "Respondeu"],
  ["meeting", "Reunião"],
  ["won", "Ganho"],
  ["lost", "Perdido"],
  ["nurture", "Nutrição"],
] as const;

interface LeadFormDialogProps {
  open: boolean;
  lead: LeadItem | null;
  lists: Array<{ id: string; name: string }>;
  saving: boolean;
  serverError?: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: LeadFormValues) => Promise<void>;
}

export function LeadFormDialog({
  open,
  lead,
  lists,
  saving,
  serverError,
  onOpenChange,
  onSubmit,
}: LeadFormDialogProps) {
  const [values, setValues] = useState<LeadFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      lead
        ? {
            businessName: lead.company,
            contactName: lead.contactName,
            phone: lead.phone,
            whatsapp: lead.whatsapp,
            email: lead.email,
            website: lead.website,
            category: lead.category,
            city: lead.city,
            state: lead.state,
            address: lead.record.address ?? "",
            notes: lead.record.notes ?? "",
            listId: lead.listId ?? "",
            status: lead.statusValue,
          }
        : EMPTY_VALUES,
    );
  }, [lead, open]);

  const update = (field: keyof LeadFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateLeadForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await onSubmit(values);
  };

  const inputClass =
    "h-9.5 w-full rounded-xl border border-home-border bg-home-surface px-3 text-xs text-white outline-none transition-colors placeholder:text-home-muted focus:border-home-orange focus:ring-1 focus:ring-home-orange";
  const labelClass = "space-y-1.5 text-[11px] font-semibold text-home-muted";

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-home-border bg-home-background text-white sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Empresa *
              <input
                value={values.businessName}
                onChange={(event) => update("businessName", event.target.value)}
                className={inputClass}
                autoFocus
              />
              {errors.businessName ? (
                <span className="block text-[10px] text-red-400">{errors.businessName}</span>
              ) : null}
            </label>
            <label className={labelClass}>
              Contato
              <input
                value={values.contactName}
                onChange={(event) => update("contactName", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Telefone
              <input
                value={values.phone}
                onChange={(event) => update("phone", event.target.value)}
                className={inputClass}
                inputMode="tel"
              />
              {errors.phone ? (
                <span className="block text-[10px] text-red-400">{errors.phone}</span>
              ) : null}
            </label>
            <label className={labelClass}>
              WhatsApp
              <input
                value={values.whatsapp}
                onChange={(event) => update("whatsapp", event.target.value)}
                className={inputClass}
                inputMode="tel"
              />
              {errors.whatsapp ? (
                <span className="block text-[10px] text-red-400">{errors.whatsapp}</span>
              ) : null}
            </label>
            <label className={labelClass}>
              E-mail
              <input
                value={values.email}
                onChange={(event) => update("email", event.target.value)}
                className={inputClass}
                type="email"
              />
              {errors.email ? (
                <span className="block text-[10px] text-red-400">{errors.email}</span>
              ) : null}
            </label>
            <label className={labelClass}>
              Site
              <input
                value={values.website}
                onChange={(event) => update("website", event.target.value)}
                className={inputClass}
                inputMode="url"
              />
            </label>
            <label className={labelClass}>
              Categoria
              <input
                value={values.category}
                onChange={(event) => update("category", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Cidade
              <input
                value={values.city}
                onChange={(event) => update("city", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              UF
              <input
                value={values.state}
                onChange={(event) => update("state", event.target.value.toUpperCase())}
                className={inputClass}
                maxLength={2}
              />
              {errors.state ? (
                <span className="block text-[10px] text-red-400">{errors.state}</span>
              ) : null}
            </label>
            <label className={labelClass}>
              Lista
              <select
                value={values.listId}
                onChange={(event) => update("listId", event.target.value)}
                className={inputClass}
              >
                <option value="">Sem lista</option>
                {lists.map((list) => (
                  <option key={list.id} value={list.id}>
                    {list.name}
                  </option>
                ))}
              </select>
            </label>
            {lead ? (
              <label className={labelClass}>
                Status
                <select
                  value={values.status}
                  onChange={(event) => update("status", event.target.value)}
                  className={inputClass}
                >
                  {STATUSES.map(([value, label]) => (
                    <option
                      key={value}
                      value={value}
                      disabled={value === "lost" || value === "nurture"}
                    >
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          <label className={labelClass}>
            Endereço
            <input
              value={values.address}
              onChange={(event) => update("address", event.target.value)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Observações
            <textarea
              value={values.notes}
              onChange={(event) => update("notes", event.target.value)}
              className={`${inputClass} min-h-24 resize-y py-2`}
            />
          </label>
          {serverError ? (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
            >
              {serverError}
            </p>
          ) : null}
          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="h-9.5 rounded-xl border border-home-border bg-home-surface px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9.5 items-center justify-center gap-2 rounded-xl bg-home-orange px-4 text-xs font-bold text-white shadow-[0_0_24px_rgba(255,98,0,0.36)] disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              {saving ? "Salvando..." : "Salvar lead"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
