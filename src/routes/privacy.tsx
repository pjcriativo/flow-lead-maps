import { createFileRoute, Link } from "@tanstack/react-router";
import { FlowLeadsLogo } from "@/components/FlowLeadsLogo";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Flow Leads" },
      { name: "description", content: "How Flow Leads collects, uses, and protects your data, including Google OAuth and lead data storage." },
      { property: "og:title", content: "Privacy Policy — Flow Leads" },
      { property: "og:description", content: "How we handle your data, Google OAuth tokens, and the leads you generate." },
      { property: "og:url", content: "https://flowleads.com.br/privacy" },
    ],
    links: [{ rel: "canonical", href: "https://flowleads.com.br/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
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

      <article className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 14, 2026</p>

        <section className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <div>
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p className="mt-2">
              We collect information you provide directly (account email, billing details), information generated as you use Flow Leads (search queries, scrape jobs, exported leads), and minimal technical data (IP address, browser type) needed to operate the Service.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">2. Google OAuth and Google Sheets</h2>
            <p className="mt-2">
              When you connect Google Sheets, we use Google OAuth 2.0 to obtain a scoped access token. We request only the permissions needed to read and write the Google Sheet you specify. We do not access any other files in your Google Drive.
            </p>
            <p className="mt-2">
              OAuth refresh tokens are stored encrypted at rest and are used solely to keep your Google Sheets sync working. You can revoke access at any time from the Google Sheets page in the dashboard or from your{" "}
              <a className="text-primary" href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">Google Account permissions</a>.
            </p>
            <p className="mt-2">
              Flow Leads's use and transfer of information received from Google APIs adheres to the{" "}
              <a className="text-primary" href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">3. Lead Data Storage</h2>
            <p className="mt-2">
              Lead records you generate (business name, address, phone, website, email, ratings) are stored in our database so you can re-export them and review job history. You may delete your leads at any time. Deleted leads are removed from our active database within 30 days.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">4. How We Use Information</h2>
            <p className="mt-2">
              We use the information we collect to operate, maintain, and improve the Service; process payments; provide customer support; and send service-related communications. We do not sell your personal data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">5. Sharing</h2>
            <p className="mt-2">
              We share data only with: (a) infrastructure providers (hosting, database, email); (b) payment processors; and (c) authorities when required by law. Each provider is bound by confidentiality and data-protection obligations.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">6. Security</h2>
            <p className="mt-2">
              We use industry-standard safeguards including TLS in transit, encryption at rest for sensitive credentials, and least-privilege access controls. No system is 100% secure, but we work hard to protect your data.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">7. Your Rights</h2>
            <p className="mt-2">
              Depending on your jurisdiction, you may have rights to access, correct, export, or delete your personal data. Contact us to exercise these rights.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">8. Data Retention</h2>
            <p className="mt-2">
              We retain account data while your account is active. After deletion, residual backups are purged within 90 days.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">9. Children</h2>
            <p className="mt-2">Flow Leads is not directed to children under 16 and we do not knowingly collect their personal data.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">10. Changes</h2>
            <p className="mt-2">We may update this policy. Material changes will be communicated via email or in-app notice.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
            <p className="mt-2">
              Privacy questions? Email <a className="text-primary" href="mailto:privacidade@flowleads.com.br">privacidade@flowleads.com.br</a>.
            </p>
          </div>
        </section>
      </article>

      <SiteFooter />
    </div>
  );
}