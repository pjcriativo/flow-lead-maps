import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, X, Download, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  { name: 'Starter', price: 29, leads: '100', integrations: '1', outreach: false, api: false, support: 'Email', current: false },
  { name: 'Growth', price: 79, leads: '500', integrations: '3', outreach: true, api: true, support: 'Priority', current: true },
  { name: 'Agency', price: 197, leads: 'Unlimited', integrations: 'Unlimited', outreach: true, api: true, support: 'Dedicated', team: true, current: false },
]

const features = [
  { name: 'Leads per month', key: 'leads' },
  { name: 'Integrations', key: 'integrations' },
  { name: 'Outreach sequences', key: 'outreach' },
  { name: 'API access', key: 'api' },
  { name: 'Team seats', key: 'team' },
  { name: 'Support level', key: 'support' },
]

const usage = [
  { label: 'Leads Used', used: 340, limit: 500, pct: 68 },
  { label: 'Emails Sent', used: 1240, limit: 5000, pct: 25 },
  { label: 'Integrations', used: 2, limit: 3, pct: 67 },
]

const invoices = [
  { date: 'Jul 1, 2026', amount: '$79.00', status: 'Paid', id: 'INV-2026-007' },
  { date: 'Jun 1, 2026', amount: '$79.00', status: 'Paid', id: 'INV-2026-006' },
  { date: 'May 1, 2026', amount: '$79.00', status: 'Paid', id: 'INV-2026-005' },
  { date: 'Apr 1, 2026', amount: '$79.00', status: 'Paid', id: 'INV-2026-004' },
]

export default function Billing() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Billing</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your subscription and usage.</p>
      </div>

      {/* Current Plan Banner */}
      <div className="bg-accent-dim border border-accent/20 rounded-xl p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-text-secondary">Current Plan</p>
          <p className="font-display font-bold text-xl text-accent">Growth Plan — $79/month</p>
          <p className="text-xs text-text-secondary mt-1">Next billing date: August 1, 2026</p>
        </div>
        <Button className="bg-accent text-dark hover:brightness-110">Upgrade Plan</Button>
      </div>

      {/* Plans */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <span className={`text-sm ${!annual ? 'text-text-primary' : 'text-text-secondary'}`}>Monthly</span>
        <button onClick={() => setAnnual(!annual)} className={`w-12 h-6 rounded-full transition-colors ${annual ? 'bg-accent' : 'bg-border'}`}>
          <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
        <span className={`text-sm ${annual ? 'text-text-primary' : 'text-text-secondary'}`}>Annual <span className="text-accent">Save 20%</span></span>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, i) => (
          <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`relative rounded-xl p-6 ${plan.current ? 'bg-card border-2 border-accent' : 'bg-card border border-border'}`}>
            {plan.current && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-dark text-xs font-semibold rounded-full">Current</span>}
            <h3 className="font-display font-bold text-xl text-text-primary mb-2">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-text-primary">${annual ? Math.floor(plan.price * 0.8) : plan.price}</span>
              <span className="text-sm text-text-secondary">/mo</span>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-accent" /><span className="text-text-primary">{plan.leads} leads/mo</span></li>
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-accent" /><span className="text-text-primary">{plan.integrations} integration{plan.integrations !== '1' ? 's' : ''}</span></li>
              <li className="flex items-center gap-2 text-sm">{plan.outreach ? <Check size={16} className="text-accent" /> : <X size={16} className="text-text-secondary" />}<span className={plan.outreach ? 'text-text-primary' : 'text-text-secondary'}>Outreach sequences</span></li>
              <li className="flex items-center gap-2 text-sm">{plan.api ? <Check size={16} className="text-accent" /> : <X size={16} className="text-text-secondary" />}<span className={plan.api ? 'text-text-primary' : 'text-text-secondary'}>API access</span></li>
              {plan.team && <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-accent" /><span className="text-text-primary">Team seats (3)</span></li>}
              <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-accent" /><span className="text-text-primary">{plan.support} support</span></li>
            </ul>
            <Button className={`w-full ${plan.current ? 'bg-border text-text-secondary cursor-default' : 'bg-accent text-dark hover:brightness-110'}`} disabled={plan.current}>
              {plan.current ? 'Current Plan' : 'Switch Plan'}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Usage */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display font-bold text-lg text-text-primary mb-4">Usage This Month</h3>
        <div className="space-y-4">
          {usage.map(u => (
            <div key={u.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-primary">{u.label}</span>
                <span className="text-xs text-text-secondary">{u.used.toLocaleString()} / {u.limit.toLocaleString()}</span>
              </div>
              <div className="w-full bg-dark rounded-full h-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${u.pct}%` }} transition={{ duration: 0.8 }}
                  className={`h-2 rounded-full ${u.pct > 90 ? 'bg-red-400' : u.pct > 70 ? 'bg-yellow-400' : 'bg-accent'}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display font-bold text-lg text-text-primary">Invoice History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-text-secondary uppercase tracking-wider bg-dark">
              <th className="px-6 py-3 font-medium">Invoice</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv.id} className="border-t border-border hover:bg-accent-dim/30 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-text-secondary">{inv.id}</td>
                <td className="px-6 py-4 text-sm text-text-primary">{inv.date}</td>
                <td className="px-6 py-4 text-sm font-medium text-text-primary">{inv.amount}</td>
                <td className="px-6 py-4"><span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{inv.status}</span></td>
                <td className="px-6 py-4"><Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary gap-1"><Download size={14} /> PDF</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
