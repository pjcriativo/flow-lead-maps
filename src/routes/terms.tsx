import { createFileRoute, Link } from "@tanstack/react-router";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Flow Leads" },
      { name: "description", content: "Terms of Service for Flow Leads, a lead generation tool for Google Maps." },
      { property: "og:title", content: "Terms of Service — Flow Leads" },
      { property: "og:description", content: "The rules for using Flow Leads's lead generation service." },
      { property: "og:url", content: "https://flowleads.com.br/terms" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
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
        <h1 className="text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 14, 2026</p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="mt-2">
              By accessing or using Flow Leads ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p className="mt-2">
              Flow Leads is a lead generation tool that helps users discover publicly available business information from Google Maps and export it to spreadsheets and Google Sheets.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">3. Accounts</h2>
            <p className="mt-2">
              You are responsible for safeguarding your account credentials and for all activity under your account. Notify us immediately of any unauthorized use.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">4. Acceptable Use</h2>
            <p className="mt-2">
              You agree not to use Flow Leads to: (a) violate any applicable law or third-party rights; (b) send unsolicited bulk communications in violation of anti-spam laws (CAN-SPAM, GDPR, CASL); (c) resell raw lead data without adding value; or (d) interfere with the Service's infrastructure.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">5. Subscriptions and Billing</h2>
            <p className="mt-2">
              Paid plans renew automatically until cancelled. You can cancel from your account at any time; cancellations take effect at the end of the current billing period. Fees are non-refundable except where required by law.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">6. Lead Data Accuracy</h2>
            <p className="mt-2">
              Lead data is sourced from third-party platforms and is provided "as is." We do not guarantee accuracy, completeness, or fitness for any particular purpose.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">7. Intellectual Property</h2>
            <p className="mt-2">
              Flow Leads and its branding are owned by us. You receive a limited, non-exclusive license to use the Service for its intended purpose during the term of your subscription.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">8. Termination</h2>
            <p className="mt-2">
              We may suspend or terminate your access if you breach these Terms or use the Service in a way that risks harm to us or other users.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="mt-2">
              To the maximum extent permitted by law, Flow Leads shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">10. Changes to These Terms</h2>
            <p className="mt-2">
              We may update these Terms from time to time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
            <p className="mt-2">
              Questions? Email <a className="text-primary" href="mailto:contato@flowleads.com.br">contato@flowleads.com.br</a>.
            </p>
          </div>
        </section>
      </article>

      <SiteFooter />
    </div>
  );
}