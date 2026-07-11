import { createFileRoute, Link } from "@tanstack/react-router";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Refund Policy — Flow Leads" },
      { name: "description", content: "Refund policy for Flow Leads subscription plans." },
      { property: "og:title", content: "Refund Policy — Flow Leads" },
      { property: "og:description", content: "Learn about Flow Leads's refund terms for monthly, yearly, and trial plans." },
      { property: "og:url", content: "https://flowleads.com.br/refund" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/refund" }],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex h-full items-center">
            <FlowLeadsLogo className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/dashboard" className="hover:text-foreground">Dashboard</Link>
          </nav>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-16 prose prose-neutral dark:prose-invert">
        <h1 className="text-4xl font-semibold tracking-tight">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 14, 2026</p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Free Trial</h2>
            <p className="mt-2">No charge, no refund needed.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Monthly Plans</h2>
            <p className="mt-2">Refunds are available within 7 days of the first payment only.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Yearly Plans</h2>
            <p className="mt-2">Refunds are available within 14 days of payment.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">After the Refund Period</h2>
            <p className="mt-2">No refunds are issued after the refund period has passed. However, you will keep access to the Service until the end of your current billing period.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">How to Request a Refund</h2>
            <p className="mt-2">
              To request a refund, please contact us at{" "}
              <a className="text-primary" href="mailto:contato@flowleads.com.br">contato@flowleads.com.br</a>.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">Processing Time</h2>
            <p className="mt-2">Refunds are processed within 5-10 business days after approval.</p>
          </div>
        </section>
      </article>

      <SiteFooter />
    </div>
  );
}
