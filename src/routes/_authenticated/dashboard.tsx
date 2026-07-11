import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import {
  LayoutDashboard,
  Users,
  Sheet as SheetIcon,
  Settings as SettingsIcon,
  MapPin,
  Search,
  Mail,
  Download,
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Star,
  Globe,
  Phone,
  LogOut,
} from "lucide-react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { posthog } from "@/lib/posthog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Flow Leads" },
      { name: "description", content: "Manage your leads and export them to Excel or Google Sheets from your Flow Leads dashboard." },
      { property: "og:title", content: "Dashboard — Flow Leads" },
      { property: "og:description", content: "Manage your leads and export them to Excel or Google Sheets from your Flow Leads dashboard." },
      { property: "og:url", content: "https://flowleads.com.br/dashboard" },
    ],
    links: [
      { rel: "canonical", href: "https://flowleads.com.br/dashboard" },
    ],
  }),
  component: Dashboard,
});

// Backend da busca de leads. Definido em VITE_API_BASE (.env).
// Placeholder local ate plugarmos a busca via Google Places.
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

let currentUserId = "";
function getUserId(): string {
  return currentUserId;
}

type Lead = {
  id: number;
  name: string;
  category: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  rating: number | string;
  mapsUrl: string;
};

type Section = "dashboard" | "leads" | "sheets" | "settings";

function Dashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("dashboard");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [sheetVerified, setSheetVerified] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [userReady, setUserReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        currentUserId = data.user.id;
      }
      setUserReady(true);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("sheets_connected") === "true") {
      setSection("sheets");
    }
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!userReady) return null;

  return (
    <div className="flex min-h-screen w-full bg-white text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <Link to="/" className="flex items-center px-4 py-5">
          <FlowLeadsLogo variant="dark" className="h-12 w-auto" />
        </Link>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {[
            { id: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
            { id: "leads", label: "My Leads", Icon: Users },
            { id: "sheets", label: "Google Sheets", Icon: SheetIcon },
            { id: "settings", label: "Settings", Icon: SettingsIcon },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id as Section)}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                section === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <item.Icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-2">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">
          v1.0
        </div>
      </aside>

      {/* Mobile top tabs */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-border bg-sidebar px-2 py-2">
        {(["dashboard", "leads", "sheets", "settings"] as Section[]).map((id) => (
          <button
            key={id}
            onClick={() => setSection(id)}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-xs capitalize",
              section === id
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70",
            )}
          >
            {id}
          </button>
        ))}
      </div>

      <main className="flex-1 bg-white px-4 pb-10 pt-16 md:px-8 md:pt-8">
        {section === "dashboard" && (
          <DashboardSection
            leads={leads}
            setLeads={setLeads}
            googleConnected={googleConnected}
            sheetUrl={sheetUrl}
            sheetVerified={sheetVerified}
          />
        )}
        {section === "leads" && <LeadsSection leads={leads} />}
        {section === "sheets" && (
          <SheetsSection
            sheetUrl={sheetUrl}
            setSheetUrl={setSheetUrl}
            googleConnected={googleConnected}
            setGoogleConnected={setGoogleConnected}
            sheetVerified={sheetVerified}
            setSheetVerified={setSheetVerified}
          />
        )}
        {section === "settings" && <SettingsSection />}
      </main>
    </div>
  );
}

/* -------------------- Dashboard / Generate -------------------- */
const NICHE_TAGS: string[] = [
  "Marketing Agency", "Dental Clinic", "Real Estate Agent", "Law Firm",
  "Restaurant", "Gym & Fitness", "Plumber", "Electrician", "Accountant",
  "Hair Salon", "Auto Repair", "Mortgage Broker", "Insurance Agent",
  "Web Designer", "Photographer",
];

function DashboardSection({
  leads,
  setLeads,
  googleConnected,
  sheetUrl,
  sheetVerified,
}: {
  leads: Lead[];
  setLeads: (l: Lead[] | ((prev: Lead[]) => Lead[])) => void;
  googleConnected: boolean;
  sheetUrl: string;
  sheetVerified: boolean;
}) {
  const [businessType, setBusinessType] = useState("");
  const [city, setCity] = useState("");
  const [count, setCount] = useState("50");
  const [findEmails, setFindEmails] = useState(true);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [jobStatus, setJobStatus] = useState<string>("");
  const [currentSource, setCurrentSource] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [lastJobId, setLastJobId] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid) currentUserId = uid;
      setSessionReady(true);
    });
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  const pushLog = (line: string) =>
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${line}`]);

  const handleGenerate = async () => {
    if (!businessType || !city) {
      pushLog("ERROR: Business type and city are required.");
      return;
    }
    setRunning(true);
    setLogs([]);
    setLeads([]);
    setLastJobId("");
    setSyncMsg(null);
    setJobStatus("");
    setCurrentSource("");
    const maxResults = Number(count);
    setStatus(`Starting search: ${businessType} in ${city}...`);
    pushLog(`POST /scrape`);
    posthog.capture("scrape_started", { query: businessType, city, limit: maxResults });
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    pushLog(`Body: { query: "${businessType}", city: "${city}", limit: ${maxResults}, find_emails: true, user_id, sheet_url }`);

    try {
      const res = await fetch(`${API_BASE}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: businessType,
          city,
          limit: maxResults,
          find_emails: true,
          user_id: userId,
          sheet_url: sheetUrl || "",
        }),
      });
      if (!res.ok) throw new Error(`POST /scrape failed: ${res.status} ${res.statusText}`);
      const submitJson = await res.json();
      const jobId = submitJson.job_id ?? submitJson.id ?? submitJson.jobId;
      if (!jobId) {
        console.error("No job_id in scrape response", submitJson);
        throw new Error("Unexpected response from server. Please try again.");
      }
      setLastJobId(String(jobId));
      pushLog(`✔ Job created: ${jobId}`);
      setStatus(`Job ${jobId} queued. Polling...`);

      let seenLeadCount = 0;
      let lastStatus = "";
      // Poll loop
      while (true) {
        await new Promise((r) => setTimeout(r, 3000));
        let pollRes: Response;
        try {
          pollRes = await fetch(`${API_BASE}/job/${jobId}`);
        } catch (e: any) {
          pushLog(`Poll error: ${e.message}. Retrying...`);
          continue;
        }
        if (!pollRes.ok) {
          pushLog(`GET /job/${jobId} → ${pollRes.status}. Retrying...`);
          continue;
        }
        const job = await pollRes.json();
        const jobStatus: string = job.status ?? "unknown";
        const results: any[] = job.results ?? job.leads ?? job.data ?? [];
        const src: string = job.current_source ?? job.currentSource ?? job.stage ?? "";
        setJobStatus(jobStatus);
        setCurrentSource(src);

        if (jobStatus !== lastStatus) {
          pushLog(`Status: ${jobStatus}`);
          lastStatus = jobStatus;
        }

        if (results.length > seenLeadCount) {
          const fresh = results.slice(seenLeadCount);
          setLeads((prev) => {
            const startId = prev.length;
            const mapped = fresh.map((r, i) => normalizeLead(r, startId + i + 1, businessType, city));
            return [...prev, ...mapped];
          });
          for (const r of fresh) {
            const name = r.name ?? r.business_name ?? r.title ?? "(no name)";
            pushLog(`✔ Found: ${name}`);
          }
          seenLeadCount = results.length;
        }

        setStatus(`${jobStatus} — ${results.length}/${maxResults} leads`);

        if (["completed", "complete", "done", "finished", "success"].includes(jobStatus.toLowerCase())) {
          // Replace leads with the final completed data (emails may have been added)
          const finalLeads = results.map((r, i) => normalizeLead(r, i + 1, businessType, city));
          setLeads(finalLeads);
          pushLog(`✔ Completed. Total: ${results.length} leads.`);
          setStatus(`Done — ${results.length} leads`);
          posthog.capture("leads_generated", {
            leads_count: finalLeads.length,
            emails_found: finalLeads.filter((l) => l.email && l.email !== "-").length,
            query: businessType,
            city,
          });
          // Auto-sync to Google Sheets if connected
          if (googleConnected && sheetVerified && sheetUrl && results.length) {
            try {
              pushLog(`Syncing ${results.length} leads to Google Sheets...`);
              const syncRes = await fetch(`${API_BASE}/sheets/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: getUserId(),
                  sheet_url: sheetUrl,
                  job_id: jobId,
                  sheet_name: "Leads",
                }),
              });
              if (!syncRes.ok) throw new Error(`${syncRes.status} ${syncRes.statusText}`);
              const sjson = await syncRes.json().catch(() => ({}));
              const synced = sjson.synced ?? sjson.count ?? results.length;
              pushLog(`✔ ${synced} leads synced to Google Sheets`);
            } catch (e: any) {
              pushLog(`✖ Sheet sync failed: ${e.message}`);
            }
          }
          break;
        }
        if (["failed", "error", "cancelled", "canceled"].includes(jobStatus.toLowerCase())) {
          pushLog(`✖ Job ended with status: ${jobStatus}`);
          setStatus(`Failed — ${jobStatus}`);
          break;
        }
      }
    } catch (err: any) {
      pushLog(`ERROR: ${err.message}`);
      setStatus(`Error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleManualSync = async () => {
    if (!lastJobId) return;
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`${API_BASE}/sheets/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: lastJobId,
          user_id: getUserId(),
          sheet_url: sheetUrl,
          sheet_name: "Leads",
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json().catch(() => ({} as any));
      const synced = json.synced ?? json.count ?? leads.length;
      setSyncMsg({ type: "ok", text: `✔ ${synced} leads synced to Google Sheets` });
    } catch (e: any) {
      setSyncMsg({ type: "err", text: `✖ Sync failed: ${e.message}` });
    } finally {
      setSyncing(false);
    }
  };

  const exportExcel = () => {
    if (!leads.length) return;
    posthog.capture("leads_exported", { leads_count: leads.length });
    const headers = ["#", "Name", "Category", "City", "Phone", "Email", "Website", "Rating", "Maps"];
    const rows = leads.map((l) => [
      l.id, l.name, l.category, l.city, l.phone, l.email, l.website, l.rating, l.mapsUrl,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leadhunter-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Slim search toolbar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_140px_auto_auto]">
          <div>
            <Label htmlFor="bt" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Business type</Label>
            <Input id="bt" placeholder="e.g. dental clinic"
              value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="city" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">City</Label>
            <Input id="city" placeholder="e.g. New York, NY"
              value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="count" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Leads</Label>
            <Select value={count} onValueChange={setCount}>
              <SelectTrigger id="count" aria-label="Number of Leads"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["20", "30", "50", "70", "100", "200", "300", "400", "500"].map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col justify-end">
            <Label htmlFor="emails" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted-foreground">Emails</Label>
            <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-secondary/40 px-3">
              <Mail className="h-4 w-4 text-primary" />
              <Switch id="emails" checked={findEmails} onCheckedChange={setFindEmails} />
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <Button
              onClick={handleGenerate}
              disabled={running || !sessionReady}
              className="h-10 min-w-[170px] bg-primary text-primary-foreground font-semibold hover:bg-primary/90"
            >
              {running ? <><Loader2 className="animate-spin" /> Hunting...</> : !sessionReady ? <><Loader2 className="animate-spin" /> Loading...</> : <><Search /> Generate Leads</>}
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {NICHE_TAGS.map((tag) => {
            const selected = businessType.trim().toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setBusinessType(tag)}
                className={
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors " +
                  (selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100")
                }
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* THE HERO: Live leads table */}
      <div className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-baseline justify-between border-b border-border px-5 pt-5 pb-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Live results</h2>
            <p className="text-xs text-muted-foreground">Rows appear the moment we verify each business.</p>
          </div>
          <span className="hidden text-xs uppercase tracking-wide text-muted-foreground sm:inline">Flow Leads feed</span>
        </div>
        {/* Live status strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/30 px-5 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {running ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
                </span>
              ) : leads.length > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
              ) : (
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"></span>
              )}
              <span className="text-sm font-semibold tracking-tight">
                {running ? "Live" : leads.length ? "Complete" : "Ready"}
              </span>
            </div>
            <div className="hidden text-sm text-muted-foreground sm:block truncate max-w-[420px]">{status}</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold tabular-nums leading-none">{leads.length}</span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">leads</span>
            </div>
            <div className="flex items-baseline gap-1.5 border-l border-border pl-4">
              <span className="text-3xl font-semibold tabular-nums leading-none text-[#16A34A]">
                {leads.filter(l => l.email && l.email.trim()).length}
              </span>
              <span className="text-xs uppercase tracking-wide text-muted-foreground">emails</span>
            </div>
            <Button onClick={exportExcel} variant="outline" size="sm" disabled={!leads.length}>
              <Download /> Export to Excel
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {running && (
          <div className="h-1 w-full overflow-hidden bg-secondary">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${Math.min(100, (leads.length / Number(count || 1)) * 100)}%` }}
            />
          </div>
        )}

        {leads.length > 0 ? (
          <LeadsTable
            leads={leads}
            emailsSearching={running && (findEmails || /finding emails/i.test(currentSource))}
          />
        ) : (
          <TableEmptyState running={running} />
        )}
      </div>

      {/* Footer actions */}
      {leads.length > 0 && (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-muted-foreground">
            {sheetUrl
              ? <>Target sheet: <span className="text-foreground">{sheetUrl}</span></>
              : <>No Google Sheet linked. Connect one in the Google Sheets tab.</>}
          </div>
          <div className="flex items-center gap-3">
            {syncMsg && (
              <span className={cn("text-xs", syncMsg.type === "ok" ? "text-[#16A34A]" : "text-destructive")}>{syncMsg.text}</span>
            )}
            <Button onClick={handleManualSync} disabled={syncing || !lastJobId || !sheetUrl} size="sm">
              {syncing ? <><Loader2 className="animate-spin" /> Syncing...</> : <><SheetIcon /> Sync to Google Sheets</>}
            </Button>
          </div>
        </div>
      )}

      {/* Collapsible activity log */}
      {(running || logs.length > 0) && (
        <LogDrawer logs={logs} logRef={logRef} />
      )}
    </div>
  );
}

/* -------------------- Empty state + Log drawer -------------------- */
function TableEmptyState({ running }: { running: boolean }) {
  return (
    <div className="relative">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {["#", "Business", "Category", "City", "Phone", "Email", "Website", "Rating", ""].map((h) => (
              <th key={h} className="px-4 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i} className="border-t border-border">
              {Array.from({ length: 9 }).map((__, j) => (
                <td key={j} className="px-4 py-4">
                  <div className="h-3 rounded bg-secondary/60" style={{ width: `${40 + ((i * 7 + j * 11) % 50)}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-card/90">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-6 shadow-[var(--shadow-card)]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-primary">
            {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          </div>
          <div className="text-center">
            <div className="text-base font-semibold">{running ? "Searching Google Maps…" : "Ready to find your first leads"}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {running
                ? "New businesses will appear here as we verify them."
                : "Enter a business type and city above, then click Generate Leads to start."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LogDrawer({ logs, logRef }: { logs: string[]; logRef: React.RefObject<HTMLDivElement | null> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-sm"
      >
        <span className="flex items-center gap-2 font-medium">
          <span className="h-2 w-2 rounded-full bg-[#16A34A]"></span>
          Activity log
          <span className="text-xs text-muted-foreground">({logs.length})</span>
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        <div
          ref={logRef}
          className="h-56 overflow-auto border-t border-border bg-[oklch(0.14_0.03_260)] p-3 font-mono text-xs leading-relaxed text-[oklch(0.78_0.18_150)]"
        >
          {logs.map((l, i) => <div key={i}>{l}</div>)}
          {!logs.length && <div className="text-[oklch(0.5_0.05_150)]">Waiting for activity…</div>}
        </div>
      )}
    </div>
  );
}

/* -------------------- Leads Table -------------------- */
const getWebsiteUrl = (website?: string | null) => {
  if (!website) return "#";
  return website.startsWith("http://") || website.startsWith("https://")
    ? website
    : `https://${website}`;
};

function LeadsTable({
  leads,
  emailsSearching = false,
}: {
  leads: Lead[];
  emailsSearching?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[15px]">
        <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {["#", "Name", "Category", "City", "Phone", "Email", "Website", "Rating", "Actions"].map((h) => (
              <th key={h} className="px-5 py-3.5 font-medium">
                {h === "Email" ? (
                  <span className="inline-flex items-center gap-1">
                    Email ✉
                    {emailsSearching && (
                      <span className="inline-flex items-center gap-1 normal-case tracking-normal text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        (searching...)
                      </span>
                    )}
                  </span>
                ) : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => (
            <tr key={l.id} className="border-t border-border animate-row-in hover:bg-secondary/30">
              <td className="px-5 py-4 text-muted-foreground tabular-nums">{l.id}</td>
              <td className="px-5 py-4 font-semibold text-foreground">{l.name}</td>
              <td className="px-5 py-4 text-muted-foreground">{l.category}</td>
              <td className="px-5 py-4 text-muted-foreground">{l.city}</td>
              <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{l.phone || "—"}</span></td>
              <td className="px-5 py-4">
                {l.email && l.email.trim() ? (
                  <a
                    href={`mailto:${l.email}`}
                    title="Verified email found"
                    className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-[#16A34A] ring-1 ring-inset ring-[#16A34A]/20 hover:underline animate-scale-in"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 fill-[#16A34A] text-white" />
                    {l.email}
                  </a>
                ) : emailsSearching ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" /> finding…
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-5 py-4">
                {l.website ? (
                  <a href={getWebsiteUrl(l.website)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <Globe className="h-3.5 w-3.5" /> Visit
                  </a>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-5 py-4">
                {l.rating ? (
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />{l.rating}</span>
                ) : <span className="text-muted-foreground">—</span>}
              </td>
              <td className="px-5 py-4">
                <a href={l.mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(l.name + " " + l.city)}`} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline"><ExternalLink /> Maps</Button>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* -------------------- My Leads -------------------- */
function LeadsSection(_: { leads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          if (!cancelled) {
            setError("You must be signed in to view your leads.");
            setLoading(false);
          }
          return;
        }
        const res = await fetch(`${API_BASE}/user/${encodeURIComponent(userId)}/leads`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        const json = await res.json();
        const raw: any[] = Array.isArray(json)
          ? json
          : json.leads ?? json.data ?? json.results ?? [];
        const mapped = raw.map((r, i) =>
          normalizeLead(r, i + 1, r.category ?? r.type ?? "", r.city ?? r.location ?? "")
        );
        if (!cancelled) setLeads(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load leads");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">My Leads</h1>
        <p className="text-sm text-muted-foreground">All leads saved to your account.</p>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your leads...
        </div>
      ) : error ? (
        <EmptyState title="We couldn't load your saved leads" desc={`${error}. Refresh the page or try again in a moment.`} />
      ) : leads.length === 0 ? (
        <EmptyState title="No saved leads yet" desc="Head to the Dashboard tab, run a search, and your results will be saved here automatically." />
      ) : (
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          <LeadsTable leads={leads} />
        </div>
      )}
    </div>
  );
}

/* -------------------- Google Sheets -------------------- */
function SheetsSection({
  sheetUrl, setSheetUrl, googleConnected, setGoogleConnected, sheetVerified, setSheetVerified,
}: {
  sheetUrl: string; setSheetUrl: (s: string) => void;
  googleConnected: boolean; setGoogleConnected: (b: boolean) => void;
  sheetVerified: boolean; setSheetVerified: (b: boolean) => void;
}) {
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sheetTitle, setSheetTitle] = useState<string>("");
  const [sheetError, setSheetError] = useState<string>("");
  const [sheetsList, setSheetsList] = useState<Array<{ name: string; url: string }>>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);

  // Check existing auth status on mount
  useEffect(() => {
    // Handle OAuth redirect: ?sheets_connected=true&user_id=...
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sheets_connected") === "true") {
        const returnedUserId = params.get("user_id");
        if (returnedUserId) {
          currentUserId = returnedUserId;
        }
        setGoogleConnected(true);
        posthog.capture("google_sheets_connected");
        // Clean the URL
        window.history.replaceState({}, "", "/dashboard");
        return;
      }
    }
    const userId = getUserId();
    fetch(`${API_BASE}/auth/status/${userId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (j?.authenticated) setGoogleConnected(true); })
      .catch(() => {});
  }, [setGoogleConnected]);

  const connectGoogle = async () => {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) return;
    window.location.href = `${API_BASE}/auth/login?user_id=${encodeURIComponent(userId)}`;
  };

  const loadSheets = async () => {
    setLoadingSheets(true);
    setSheetsError(null);
    setSheetsList([]);
    try {
      const userId = getUserId();
      const res = await fetch(`${API_BASE}/sheets/list?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`Failed to load sheets: ${res.status}`);
      const json = await res.json();
      const list = Array.isArray(json.sheets)
        ? json.sheets
        : Array.isArray(json)
          ? json
          : [];
      const normalized = list
        .filter((s: any) => s && (s.url || s.id))
        .map((s: any) => ({
          name: s.name ?? s.title ?? s.sheet_name ?? "Untitled Sheet",
          url: s.url ?? `https://docs.google.com/spreadsheets/d/${s.id}/edit`,
        }));
      if (normalized.length === 0) {
        setSheetsError("No sheets found. Please paste a URL manually.");
      } else {
        setSheetsList(normalized);
      }
    } catch (e: any) {
      setSheetsError("Could not load sheets. Please paste URL manually.");
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSelectSheet = (url: string) => {
    setSheetUrl(url);
    setSheetVerified(false);
    setSheetTitle("");
    setSheetError("");
  };

  const verifySheet = async () => {
    setTesting(true);
    setSheetError("");
    setSheetVerified(false);
    setSheetTitle("");
    try {
      const res = await fetch(`${API_BASE}/sheets/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: getUserId(), sheet_url: sheetUrl, sheet_name: "Leads" }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && (j.success ?? j.ok)) {
        setSheetVerified(true);
        setSheetTitle(j.sheet_title ?? j.title ?? j.spreadsheet_title ?? "Spreadsheet");
      } else {
        setSheetError(j.error ?? j.message ?? "Could not access sheet");
      }
    } catch (e: any) {
      setSheetError(e.message ?? "Network error");
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    const userId = getUserId();
    try { await fetch(`${API_BASE}/auth/revoke/${userId}`, { method: "POST" }); } catch {}
    setGoogleConnected(false);
    setSheetVerified(false);
    setSheetUrl("");
    setSheetTitle("");
    setSheetError("");
    setSheetsList([]);
    setSheetsError(null);
    setManualMode(false);
    setAuthError(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Google Sheets</h1>
        <p className="text-sm text-muted-foreground">Sync leads directly into a spreadsheet.</p>
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        {!googleConnected ? (
          <>
            <p className="text-sm text-muted-foreground">
              Connect your Google account to sync leads into your spreadsheets.
            </p>
            <button
              onClick={connectGoogle}
              disabled={connecting}
              className="inline-flex items-center gap-3 rounded-md border border-[#dadce0] bg-white px-5 h-11 text-sm font-medium text-[#3c4043] shadow-sm transition hover:bg-[#f8f9fa] disabled:opacity-60"
            >
              {connecting ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#4285F4]" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.17-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.92c1.71-1.57 2.68-3.88 2.68-6.61z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.97 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0 9 9 0 0 0 .96 4.96l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"/>
                </svg>
              )}
              {connecting ? "Waiting for Google..." : "Connect Google Account"}
            </button>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-md border border-[oklch(0.7_0.18_150)]/40 bg-[oklch(0.7_0.18_150)]/10 p-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.18_150)]" />
                <span className="font-medium text-[oklch(0.45_0.18_150)]">✅ Google Account Connected</span>
              </div>
              <button onClick={disconnect} className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2">
                Disconnect
              </button>
            </div>

            {/* Sheet selection UI */}
            {!manualMode && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={loadSheets}
                  disabled={loadingSheets}
                  className="w-full justify-start gap-2"
                >
                  {loadingSheets ? <Loader2 className="h-4 w-4 animate-spin" /> : <SheetIcon className="h-4 w-4" />}
                  {loadingSheets ? "Loading your sheets..." : "Load My Sheets"}
                </Button>

                {sheetsError && (
                  <p className="text-sm text-destructive">{sheetsError}</p>
                )}

                {sheetsList.length > 0 && (
                  <div className="space-y-1">
                    <Label htmlFor="sheet-select">Select a spreadsheet</Label>
                    <Select
                      value={sheetUrl}
                      onValueChange={handleSelectSheet}
                    >
                      <SelectTrigger id="sheet-select" aria-label="Select a spreadsheet">
                        <SelectValue placeholder="Choose a sheet..." />
                      </SelectTrigger>
                      <SelectContent>
                        {sheetsList.map((s) => (
                          <SelectItem key={s.url} value={s.url}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => { setManualMode(true); setSheetsError(null); }}
                  className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                >
                  Or paste URL manually
                </button>
              </div>
            )}

            {manualMode && (
              <div className="space-y-2">
                <Label htmlFor="url">Google Sheet URL</Label>
                <Input id="url" placeholder="Paste your Google Sheet URL here"
                  value={sheetUrl}
                  onChange={(e) => { setSheetUrl(e.target.value); setSheetVerified(false); setSheetTitle(""); setSheetError(""); }} />
                <button
                  type="button"
                  onClick={() => { setManualMode(false); setSheetsError(null); }}
                  className="text-xs text-muted-foreground hover:text-primary underline underline-offset-2"
                >
                  Back to Load My Sheets
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={verifySheet} disabled={testing || !sheetUrl}>
                {testing ? <><Loader2 className="animate-spin" /> Checking sheet access…</> : <>Test &amp; save sheet</>}
              </Button>
            </div>
            {sheetVerified && (
              <div className="flex items-center gap-2 rounded-md border border-[oklch(0.7_0.18_150)]/40 bg-[oklch(0.7_0.18_150)]/10 p-3 text-sm text-[oklch(0.45_0.18_150)]">
                <CheckCircle2 className="h-4 w-4 text-[oklch(0.55_0.18_150)]" />
                <span className="font-medium">✅ Sheet Connected: {sheetTitle}</span>
              </div>
            )}
            {sheetError && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <XCircle className="h-4 w-4" />
                <span className="font-medium">{sheetError}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* -------------------- Settings -------------------- */
function SettingsSection() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">App preferences and backend configuration.</p>
      </div>
      <div className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="space-y-2">
          <Label htmlFor="backend-url">Backend API URL</Label>
          <Input id="backend-url" type="password" defaultValue={API_BASE} />
          <p className="text-xs text-muted-foreground">Hidden by default to avoid leaking infrastructure details.</p>
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label htmlFor="auto-export" className="text-sm font-medium cursor-pointer">Auto-export to Excel</Label>
            <div className="text-xs text-muted-foreground">Download a CSV automatically when a run completes.</div>
          </div>
          <Switch id="auto-export" />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <Label htmlFor="email-enrich" className="text-sm font-medium cursor-pointer">Email enrichment by default</Label>
            <div className="text-xs text-muted-foreground">Toggle "Find Emails" on for every new search.</div>
          </div>
          <Switch id="email-enrich" defaultChecked />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-16 text-center">
      <Users className="mx-auto h-8 w-8 text-muted-foreground" />
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

/* -------------------- Normalize API result to Lead -------------------- */
function normalizeLead(r: any, id: number, businessType: string, city: string): Lead {
  return {
    id,
    name: r.name ?? r.business_name ?? r.title ?? "",
    category: r.category ?? r.type ?? businessType,
    city: r.city ?? r.location ?? city,
    phone: r.phone ?? r.phone_number ?? r.tel ?? "",
    email: r.email ?? "",
    website: r.website ?? r.url ?? r.site ?? "",
    rating: r.rating ?? r.stars ?? "",
    mapsUrl: r.maps_url ?? r.mapsUrl ?? r.google_maps_url ?? r.link ?? "",
  };
}
