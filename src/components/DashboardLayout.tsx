import { useState } from 'react'
import { Outlet, useLocation, Link } from 'react-router'
import { LayoutDashboard, Search, Target, Sparkles, Plug, Send, Kanban, CreditCard, Settings, Bell, Menu, X } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Lead Finder', icon: Search, path: '/finder' },
  { label: 'Scoring', icon: Target, path: '/scoring' },
  { label: 'Enrichment', icon: Sparkles, path: '/enrichment' },
  { label: 'Integrations', icon: Plug, path: '/integrations' },
  { label: 'Outreach', icon: Send, path: '/outreach' },
  { label: 'Pipeline', icon: Kanban, path: '/pipeline' },
  { label: 'Billing', icon: CreditCard, path: '/billing' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

export default function DashboardLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-xl text-text-primary">LeadSift</Link>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-text-secondary hover:text-text-primary">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? 'bg-accent-dim text-text-primary border-l-[3px] border-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5 border-l-[3px] border-transparent'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <div className="bg-card rounded-lg p-3">
          <p className="text-xs font-medium text-text-secondary mb-2">Growth Plan</p>
          <div className="w-full bg-dark rounded-full h-1.5 mb-2">
            <div className="bg-accent h-1.5 rounded-full" style={{ width: '68%' }} />
          </div>
          <p className="text-[10px] text-text-secondary">340 / 500 leads</p>
          <Link to="/billing" className="text-[10px] text-accent hover:underline mt-1 block">Upgrade</Link>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-dark">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-dark border-r border-border flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Drawer */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-60 bg-dark border-r border-border z-50 lg:hidden">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-8 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-text-secondary hover:text-text-primary">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-dark rounded-full px-4 py-2 border border-border">
              <Search size={14} className="text-text-secondary" />
              <input type="text" placeholder="Search leads..." className="bg-transparent text-sm text-text-primary placeholder:text-text-secondary outline-none w-48" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative text-text-secondary hover:text-text-primary transition-colors">
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-semibold">
              JD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
