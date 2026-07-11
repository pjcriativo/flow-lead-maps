import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 text-sm text-muted-foreground sm:flex-row">
        <p>© {new Date().getFullYear()} Flow Leads</p>
        <nav className="flex items-center gap-6">
          <Link to="/pricing" className="hover:text-foreground">Preços</Link>
          <Link to="/refund" className="hover:text-foreground">Reembolso</Link>
          <Link to="/terms" className="hover:text-foreground">Termos</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacidade</Link>
        </nav>
      </div>
    </footer>
  );
}