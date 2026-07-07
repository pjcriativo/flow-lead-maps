export default function Footer() {
  return (
    <footer className="bg-dark border-t border-border py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <span className="font-display font-bold text-xl text-text-primary">LeadSift</span>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">AI-powered lead generation for local businesses. Turn Google Maps into your client pipeline.</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">{['Features', 'Pricing', 'Integrations', 'API'].map((item) => (<li key={item}><button className="text-sm text-text-primary hover:text-accent transition-colors">{item}</button></li>))}</ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-3">{['Blog', 'Help Center', 'Community', 'Status'].map((item) => (<li key={item}><button className="text-sm text-text-primary hover:text-accent transition-colors">{item}</button></li>))}</ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">{['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item) => (<li key={item}><button className="text-sm text-text-primary hover:text-accent transition-colors">{item}</button></li>))}</ul>
          </div>
        </div>
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-secondary">&copy; 2026 LeadSift. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-secondary">Made with care for local marketers</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
