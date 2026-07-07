import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Users, Mail, Target, Sparkles, ArrowRight, Zap, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

const scoreData = [
  { range: '0-20', count: 45 },
  { range: '21-40', count: 89 },
  { range: '41-60', count: 156 },
  { range: '61-80', count: 234 },
  { range: '81-100', count: 178 },
]

const recentLeads = [
  { name: "Mike's Plumbing", category: 'Plumber', location: 'Dallas, TX', score: 92, status: 'enriched', email: 'mike@mikesplumbing.com' },
  { name: 'Elite Roofing', category: 'Roofer', location: 'Houston, TX', score: 87, status: 'new', email: null },
  { name: 'Park Cities Dental', category: 'Dentist', location: 'Dallas, TX', score: 85, status: 'contacted', email: 'info@parkcitiesdental.com' },
  { name: 'Apex Electric', category: 'Electrician', location: 'Austin, TX', score: 78, status: 'enriched', email: 'contact@apexelectric.com' },
  { name: 'Sunset HVAC', category: 'HVAC', location: 'San Antonio, TX', score: 73, status: 'new', email: null },
  { name: 'Premier Law Group', category: 'Lawyer', location: 'Dallas, TX', score: 71, status: 'enriched', email: ' intake@premierlaw.com' },
  { name: 'Green Leaf Landscaping', category: 'Landscaper', location: 'Fort Worth, TX', score: 68, status: 'new', email: null },
  { name: 'Golden Touch Cleaners', category: 'Cleaning', location: 'Houston, TX', score: 64, status: 'contacted', email: 'hello@goldentouch.com' },
  { name: 'FixIt Handyman', category: 'Handyman', location: 'Austin, TX', score: 61, status: 'enriched', email: 'fixit@local.net' },
  { name: 'Texas Pool Pros', category: 'Pool Service', location: 'Dallas, TX', score: 58, status: 'new', email: null },
]

const kpis = [
  { label: 'Total Leads', value: '1,247', change: '+12%', up: true, icon: Target },
  { label: 'Enriched', value: '892', change: '+8%', up: true, icon: Sparkles },
  { label: 'Contacted', value: '234', change: '+24%', up: true, icon: Send },
  { label: 'Response Rate', value: '18.6%', change: '+3.2%', up: true, icon: MessageSquare },
]

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
  return <span className={`font-mono font-bold text-sm ${color}`}>{score}</span>
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-gray-500/10 text-gray-400',
    enriched: 'bg-emerald-500/10 text-emerald-400',
    contacted: 'bg-blue-500/10 text-blue-400',
    responded: 'bg-purple-500/10 text-purple-400',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.new}`}>{status}</span>
}

export default function Dashboard() {
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMessage, setAiMessage] = useState('')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-secondary mt-1">Welcome back! Here's what's happening with your leads.</p>
        </div>
        <Button className="bg-accent text-dark hover:brightness-110 gap-2">
          <Zap size={16} /> Quick Search
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl p-6 hover:shadow-card-hover transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
                <kpi.icon size={18} className="text-accent" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {kpi.change}
              </span>
            </div>
            <p className="font-display font-bold text-2xl text-text-primary">{kpi.value}</p>
            <p className="text-xs text-text-secondary mt-1">{kpi.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Score Distribution + Recent Leads */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-bold text-lg text-text-primary mb-6">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={scoreData}>
              <XAxis dataKey="range" tick={{ fill: '#8B95A5', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B95A5', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#141821', border: '1px solid #1E2530', borderRadius: '8px', color: '#F4F6F8' }} />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Leads */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-text-primary">Recent Leads</h3>
            <Button variant="ghost" size="sm" className="text-accent gap-1">View All <ArrowRight size={14} /></Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-text-secondary uppercase tracking-wider">
                  <th className="pb-3 font-medium">Business</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Score</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead, i) => (
                  <tr key={i} className="border-t border-border hover:bg-accent-dim/50 transition-colors">
                    <td className="py-3 text-sm text-text-primary font-medium">{lead.name}</td>
                    <td className="py-3 text-sm text-text-secondary">{lead.category}</td>
                    <td className="py-3 text-sm text-text-secondary">{lead.location}</td>
                    <td className="py-3"><ScoreBadge score={lead.score} /></td>
                    <td className="py-3"><StatusBadge status={lead.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* AI Co-Pilot */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent-dim flex items-center justify-center">
            <Sparkles size={18} className="text-accent" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-text-primary">AI Co-Pilot</h3>
            <p className="text-xs text-text-secondary">Your intelligent lead assistant</p>
          </div>
        </div>
        <div className="bg-dark rounded-lg p-4 mb-4">
          <p className="text-sm text-text-primary">Hi! I found <span className="text-accent font-semibold">23 new high-score leads</span> in your area. Would you like me to enrich their contact data or add them to an outreach sequence?</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {['Enrich All', 'Add to Sequence', 'View Leads', 'Dismiss'].map((action) => (
            <Button key={action} variant="outline" size="sm" className="border-border text-text-primary hover:bg-accent-dim hover:text-accent">
              {action}
            </Button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
