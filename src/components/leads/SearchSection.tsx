// Fase 1 — Tela de busca: dispara a Edge Function search-leads (streaming),
// mostra progresso ao vivo e a tabela de leads ordenada por score.
import { useEffect, useRef, useState } from "react";
import {
  Search, Loader2, CheckCircle2, Sparkles, ChevronDown, ChevronUp, Phone, Mail,
  MapPin, X, Globe, Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { posthog } from "@/lib/posthog";
import {
  streamSearchLeads, FONTE_LABELS, FONTES_DESATIVADAS,
  type Lead, type SearchEvent, type FonteBusca,
} from "@/lib/leads-api";
import { MapaBusca } from "./MapaBusca";
import {
  ScoreBadge, StatusBadge, RatingCell, SiteCell, EmailCell, WhatsCell, MapsButton,
  UF_LIST, NICHE_TAGS,
} from "./leads-shared";

export function SearchSection({ onFinished }: { onFinished?: () => void }) {
  const [nicho, setNicho] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [limite, setLimite] = useState(50);
  const [buscarEmails, setBuscarEmails] = useState(true);
  const [fonte, setFonte] = useState<FonteBusca>("osm");
  const [mapaAberto, setMapaAberto] = useState(false);
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [raioKm, setRaioKm] = useState(10);
  const [filtros, setFiltros] = useState<string[]>([]);

  const [running, setRunning] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState("Pronto");
  const [progress, setProgress] = useState({ found: 0, target: 0 });
  const abortRef = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const pushLog = (line: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);

  // Filtro de captura (client-side): se algum marcado, mantém só quem tem ao menos um.
  const capturaOk = (l: Lead) => {
    if (filtros.length === 0) return true;
    return filtros.some((f) =>
      f === "telefone" ? !!l.phone : f === "site" ? !!l.website : f === "instagram" ? !!l.instagram_url : false,
    );
  };
  const sorted = [...leads].filter(capturaOk).sort((a, b) => b.score - a.score);
  const goldCount = sorted.filter((l) => (l.score_breakdown as any)?.is_gold).length;
  const emailCount = sorted.filter((l) => l.email).length;
  const porMapa = !!pin;

  const handleBuscar = async () => {
    if (!nicho.trim() || (!cidade.trim() && !porMapa)) {
      pushLog("ERRO: informe nicho e cidade (ou marque um ponto no mapa).");
      return;
    }
    setRunning(true);
    setLeads([]);
    setLogs([]);
    setProgress({ found: 0, target: limite });
    setStatus(porMapa ? `Buscando: ${nicho} num raio de ${raioKm}km...` : `Buscando: ${nicho} em ${cidade}${uf ? "/" + uf : ""}...`);
    posthog.capture("search_leads_started", { nicho, cidade, uf, limite, fonte, porMapa });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamSearchLeads(
        {
          nicho, cidade, uf, limite, buscarEmails, fonte,
          ...(porMapa ? { lat: pin!.lat, lng: pin!.lng, raioKm } : {}),
        },
        (ev: SearchEvent) => {
          switch (ev.type) {
            case "log":
              pushLog(ev.message);
              break;
            case "lead":
              setLeads((prev) => [...prev, ev.lead]);
              break;
            case "progress":
              setProgress({ found: ev.found, target: ev.target });
              setStatus(`Qualificando... ${ev.found}/${ev.target} leads gravados`);
              break;
            case "done":
              setStatus(`Concluído — ${ev.inserted} leads gravados`);
              pushLog(`✔ Concluído. ${ev.inserted} leads gravados no banco.`);
              posthog.capture("search_leads_done", { inserted: ev.inserted });
              onFinished?.();
              break;
            case "error":
              setStatus(`Erro: ${ev.message}`);
              pushLog(`✖ ${ev.message}`);
              break;
          }
        },
        controller.signal,
      );
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setStatus(`Erro: ${e.message}`);
        pushLog(`ERRO: ${e.message}`);
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  };

  const handleCancelar = () => {
    abortRef.current?.abort();
    setRunning(false);
    setStatus("Cancelado");
    pushLog("Busca cancelada.");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Formulário de busca */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="grid gap-3 md:grid-cols-[1.6fr_1fr_100px_auto]">
          <div>
            <Label htmlFor="nicho" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Nicho</Label>
            <Input id="nicho" placeholder="ex.: clínicas odontológicas"
              value={nicho} onChange={(e) => setNicho(e.target.value)} disabled={running} />
          </div>
          <div>
            <Label htmlFor="cidade" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Cidade</Label>
            <Input id="cidade" placeholder="ex.: Curitiba"
              value={cidade} onChange={(e) => setCidade(e.target.value)} disabled={running} />
          </div>
          <div>
            <Label htmlFor="uf" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">UF</Label>
            <Select value={uf} onValueChange={setUf} disabled={running}>
              <SelectTrigger id="uf" aria-label="UF"><SelectValue placeholder="UF" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {UF_LIST.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end">
            {running ? (
              <Button onClick={handleCancelar} variant="outline" className="h-10 min-w-[150px]">
                <Loader2 className="animate-spin" /> Cancelar
              </Button>
            ) : (
              <Button onClick={handleBuscar} className="h-10 min-w-[150px] bg-primary font-semibold hover:bg-primary/90">
                <Search /> Buscar leads
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="fonte" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fonte</Label>
            <Select value={fonte} onValueChange={(v) => setFonte(v as FonteBusca)} disabled={running}>
              <SelectTrigger id="fonte" aria-label="Fonte da busca" className="h-9 w-[240px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(FONTE_LABELS) as FonteBusca[]).map((f) => (
                  <SelectItem key={f} value={f} disabled={FONTES_DESATIVADAS.includes(f)}>
                    {FONTE_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 px-3 py-1.5">
            <Mail className="h-4 w-4 text-primary" />
            <Label htmlFor="emails" className="cursor-pointer text-xs font-medium text-muted-foreground">Buscar e-mails (visita o site)</Label>
            <Switch id="emails" checked={buscarEmails} onCheckedChange={setBuscarEmails} disabled={running} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {NICHE_TAGS.map((tag) => (
              <button key={tag} type="button" disabled={running}
                onClick={() => setNicho(tag)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  nicho.trim().toLowerCase() === tag.toLowerCase()
                    ? "bg-primary text-primary-foreground"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100",
                )}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Quantidade (slider) + filtro de captura + mapa */}
        <div className="mt-4 flex flex-wrap items-end gap-6 border-t border-border pt-4">
          <div className="min-w-[220px] flex-1">
            <div className="mb-1.5 flex items-center justify-between">
              <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Quantidade</Label>
              <span className="text-sm font-semibold tabular-nums">{limite}</span>
            </div>
            <Slider value={[limite]} min={10} max={200} step={5} disabled={running} onValueChange={(v) => setLimite(v[0])} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Filtrar por captura</Label>
            <ToggleGroup type="multiple" value={filtros} onValueChange={setFiltros} variant="outline" className="justify-start">
              <ToggleGroupItem value="telefone" aria-label="Só com telefone" className="gap-1 px-3"><Phone className="h-3.5 w-3.5" /> Telefone</ToggleGroupItem>
              <ToggleGroupItem value="site" aria-label="Só com site" className="gap-1 px-3"><Globe className="h-3.5 w-3.5" /> Site</ToggleGroupItem>
              <ToggleGroupItem value="instagram" aria-label="Só com Instagram" className="gap-1 px-3"><Instagram className="h-3.5 w-3.5" /> Instagram</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div>
            <Label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Área</Label>
            <Button type="button" variant={mapaAberto || pin ? "default" : "outline"} onClick={() => setMapaAberto((o) => !o)} className="gap-1">
              <MapPin className="h-4 w-4" /> {pin ? `Ponto no mapa (${raioKm}km)` : "Buscar por área no mapa"}
            </Button>
          </div>
        </div>

        {mapaAberto && (
          <div className="mt-4 space-y-3 rounded-lg border border-border bg-secondary/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                {pin ? <>Buscando ao redor do pin — raio <b className="text-foreground">{raioKm} km</b> (cidade/UF ignoradas enquanto houver pin)</> : "Clique no mapa para marcar o centro da busca."}
              </span>
              {pin && (
                <Button size="sm" variant="ghost" onClick={() => setPin(null)}><X className="h-4 w-4" /> Limpar pin</Button>
              )}
            </div>
            <MapaBusca pin={pin} raioKm={raioKm} onPick={(p) => setPin(p)} />
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Raio da busca</Label>
                <span className="text-sm font-semibold tabular-nums">{raioKm} km</span>
              </div>
              <Slider value={[raioKm]} min={1} max={200} step={1} onValueChange={(v) => setRaioKm(v[0])} />
            </div>
          </div>
        )}
      </div>

      {/* Resultados ao vivo */}
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/30 px-5 py-3">
          <div className="flex items-center gap-3">
            {running ? (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
            ) : leads.length ? (
              <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
            ) : (
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            )}
            <span className="text-sm font-semibold">{running ? "Ao vivo" : leads.length ? "Concluído" : "Pronto"}</span>
            <span className="hidden max-w-[380px] truncate text-sm text-muted-foreground sm:block">{status}</span>
          </div>
          <div className="flex items-center gap-4">
            <Stat n={leads.length} label="leads" />
            <Stat n={goldCount} label="cliente-ouro" color="text-amber-600" divider />
            <Stat n={emailCount} label="e-mails" color="text-[#16A34A]" divider />
          </div>
        </div>

        {running && (
          <div className="h-1 w-full overflow-hidden bg-secondary">
            <div className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (progress.found / Math.max(1, progress.target)) * 100)}%` }} />
          </div>
        )}

        {sorted.length > 0 ? (
          <LiveTable leads={sorted} />
        ) : (
          <EmptyState running={running} />
        )}
      </div>

      {(running || logs.length > 0) && <LogDrawer logs={logs} logRef={logRef} />}

      {/* Atribuição exigida pela licença ODbL do OpenStreetMap */}
      <p className="px-1 text-center text-xs text-muted-foreground">
        Dados de lugares ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
          OpenStreetMap contributors
        </a>{" "}
        · Geoapify
      </p>
    </div>
  );
}

function Stat({ n, label, color, divider }: { n: number; label: string; color?: string; divider?: boolean }) {
  return (
    <div className={cn("flex items-baseline gap-1.5", divider && "border-l border-border pl-4")}>
      <span className={cn("text-2xl font-semibold tabular-nums leading-none", color)}>{n}</span>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
}

function LiveTable({ leads }: { leads: Lead[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[15px]">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {["Score", "Empresa", "Nota", "Telefone", "WhatsApp", "E-mail", "Site", "Status", ""].map((h) => (
              <th key={h} className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-border hover:bg-secondary/30">
              <td className="px-4 py-3"><ScoreBadge lead={l} /></td>
              <td className="px-4 py-3 font-semibold text-foreground">{l.business_name}</td>
              <td className="px-4 py-3"><RatingCell lead={l} /></td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />{l.phone || "—"}
                </span>
              </td>
              <td className="px-4 py-3"><WhatsCell lead={l} /></td>
              <td className="px-4 py-3"><EmailCell lead={l} /></td>
              <td className="px-4 py-3"><SiteCell lead={l} /></td>
              <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
              <td className="px-4 py-3"><MapsButton lead={l} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ running }: { running: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-8 py-16 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-primary">
        {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
      </div>
      <div>
        <div className="text-base font-semibold">
          {running ? "Buscando no Google Places…" : "Pronto para prospectar"}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          {running
            ? "Os leads aparecem aqui, já com score, conforme são qualificados."
            : "Informe nicho, cidade e UF, e clique em Buscar leads."}
        </div>
      </div>
    </div>
  );
}

function LogDrawer({ logs, logRef }: { logs: string[]; logRef: React.RefObject<HTMLDivElement | null> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
          Registro de atividade <span className="text-xs text-muted-foreground">({logs.length})</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div ref={logRef} className="h-56 overflow-auto border-t border-border bg-[oklch(0.14_0.03_260)] p-3 font-mono text-xs leading-relaxed text-[oklch(0.78_0.18_150)]">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
          {!logs.length && <div className="text-[oklch(0.5_0.05_150)]">Aguardando atividade…</div>}
        </div>
      )}
    </div>
  );
}
