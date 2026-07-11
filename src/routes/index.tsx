import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Download, Zap, Search, Database, ArrowRight, CheckCircle2 } from "lucide-react";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flow Leads — Discover Local Businesses Instantly" },
      { name: "description", content: "Research and discover local businesses from Google Maps in seconds. Names, phones, emails, websites — exported straight to Excel or Google Sheets." },
      { property: "og:title", content: "Flow Leads — Discover Local Businesses Instantly" },
      { property: "og:description", content: "Research and discover local businesses from Google Maps in one click." },
      { property: "og:url", content: "https://flowleads.com.br/" },
      { name: "twitter:title", content: "Flow Leads — Discover Local Businesses on Google Maps in Seconds" },
      { name: "twitter:description", content: "Research verified local business profiles on Google Maps in seconds. Export to Excel or Google Sheets instantly." },
    ],
    links: [
      { rel: "canonical", href: "https://flowleads.com.br/" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-9 w-auto" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Recursos</a>
            <a href="#how" className="hover:text-foreground">Como funciona</a>
            <Link to="/pricing" className="hover:text-foreground">Preços</Link>
          </nav>
          <Link to="/dashboard" preload="render">
            <Button>Get Started <ArrowRight /></Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Business intelligence for modern agencies and professionals
            </div>
            <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl">
              Discover and research local businesses on{" "}
              <span className="text-primary">Google Maps</span>{" "}
              in seconds.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Search any business type in any city. Get names, phones, emails, websites, and ratings — exported to Excel or Google Sheets in one click.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/dashboard" preload="render">
                <Button size="lg" className="h-12 px-8 text-base shadow-[var(--shadow-elegant)]">
                  Get Started Free <ArrowRight />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">See how it works</Button>
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required · Research 50 businesses on us</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-card/40 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Everything you need to research local markets</h2>
            <p className="mt-3 text-muted-foreground">Built for agencies, founders, and consultants who need business intelligence fast.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { icon: Search, title: "Hyper-targeted search", desc: "Filter by business type and city. Discover 10 to 500 verified business profiles per search." },
              { icon: Mail, title: "Contact information finder", desc: "Toggle contact finder to surface publicly listed business emails and phone numbers automatically." },
              { icon: Database, title: "Live progress tracking", desc: "Watch business profiles load in real time with a live activity feed and running counter." },
              { icon: Download, title: "Export to Excel", desc: "One-click .xlsx export with every field cleaned and formatted for immediate use." },
              { icon: Zap, title: "Google Sheets sync", desc: "Pipe results directly into a Google Sheet your team already uses — automatically organized and sorted." },
              { icon: CheckCircle2, title: "Clean and accurate data", desc: "Smart deduplication and validation so your research stays accurate and organized." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elegant)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-10 md:grid-cols-3">
            {[
              { n: "01", t: "Define your search", d: "Pick a business type and city — e.g. dental clinics in New York or marketing agencies in Chicago." },
              { n: "02", t: "Hit Generate", d: "Watch verified business profiles load in real time with contact details, ratings, and websites." },
              { n: "03", t: "Export anywhere", d: "Download as .xlsx or sync directly to your connected Google Sheet in one click." },
            ].map((s) => (
              <div key={s.n}>
                <div className="text-sm font-mono text-primary">{s.n}</div>
                <h3 className="mt-2 text-xl font-semibold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl rounded-2xl bg-[var(--navy)] p-12 text-center text-[var(--navy-foreground)] shadow-[var(--shadow-card)]">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Start discovering businesses today</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/70">Join thousands of agencies and professionals researching local markets with Flow Leads.</p>
          <div className="mt-8">
            <Link to="/dashboard" preload="render">
              <Button size="lg" className="h-12 bg-white px-8 text-base text-[var(--navy)] hover:bg-white/90">
                Open Dashboard <ArrowRight />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
