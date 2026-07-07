import { useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Target, SlidersHorizontal, TrendingUp } from 'lucide-react'
import { Slider } from '@/components/ui/slider'

const scoreDistribution = [
  { name: 'Hot (80-100)', value: 178, color: '#10B981' },
  { name: 'Warm (50-79)', value: 345, color: '#F59E0B' },
  { name: 'Cold (0-49)', value: 134, color: '#EF4444' },
]

const criteria = [
  { name: 'Review Count', weight: 25, description: 'Fewer reviews = higher opportunity' },
  { name: 'Has Website', weight: 20, description: 'No website = easy win' },
  { name: 'Has Photos', weight: 15, description: 'No photos on GBP' },
  { name: 'Hours Posted', weight: 15, description: 'Missing business hours' },
  { name: 'Phone Listed', weight: 10, description: 'No phone on profile' },
  { name: 'Rating', weight: 10, description: 'Low rating = needs help' },
  { name: 'Category', weight: 5, description: 'High-value niches' },
]

const rankedLeads = [
  { name: "Mike's Plumbing", category: 'Plumber', city: 'Dallas, TX', score: 92 },
  { name: 'Rapid Auto Repair', category: 'Auto Repair', city: 'Houston, TX', score: 95 },
  { name: 'Bright Smiles Dental', category: 'Dentist', city: 'Fort Worth, TX', score: 88 },
  { name: 'Elite Roofing', category: 'Roofer', city: 'Houston, TX', score: 87 },
  { name: 'Metro Painting Co', category: 'Painter', city: 'Austin, TX', score: 82 },
  { name: 'Summit Roofing', category: 'Roofer', city: 'Houston, TX', score: 80 },
  { name: 'Fresh Cut Barbershop', category: 'Barbershop', city: 'Dallas, TX', score: 75 },
  { name: 'Reliable Movers', category: 'Moving', city: 'San Antonio, TX', score: 70 },
  { name: 'Sunset HVAC', category: 'HVAC', city: 'San Antonio, TX', score: 73 },
  { name: 'Apex Electric', category: 'Electrician', city: 'Austin, TX', score: 78 },
]

export default function Scoring() {
  const [weights, setWeights] = useState(criteria.map(c => c.weight))
  const [filter, setFilter] = useState('all')

  const sortedLeads = [...rankedLeads].sort((a, b) => b.score - a.score)
  const filtered = filter === 'all' ? sortedLeads : sortedLeads.filter(l => l.score >= (filter === 'hot' ? 80 : filter === 'warm' ? 50 : 0))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Lead Scoring</h1>
        <p className="text-sm text-text-secondary mt-1">Understand how leads are scored and adjust criteria weights.</p>
      </div>

      {/* Score Distribution + Criteria */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-display font-bold text-lg text-text-primary mb-6">Score Distribution</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={scoreDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {scoreDistribution.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#141821', border: '1px solid #1E2530', borderRadius: '8px', color: '#F4F6F8' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {scoreDistribution.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-sm text-text-secondary">{d.name}</span>
                  <span className="text-sm font-mono font-bold text-text-primary ml-2">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <SlidersHorizontal size={18} className="text-accent" />
            <h3 className="font-display font-bold text-lg text-text-primary">Scoring Criteria</h3>
          </div>
          <div className="space-y-5">
            {criteria.map((c, i) => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary font-medium">{c.name}</span>
                  <span className="text-xs font-mono text-accent">{weights[i]}%</span>
                </div>
                <Slider value={[weights[i]]} onValueChange={(v) => {
                  const newWeights = [...weights]; newWeights[i] = v[0]; setWeights(newWeights)
                }} max={50} step={1} className="w-full" />
                <p className="text-xs text-text-secondary mt-1">{c.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Priority Ranked Board */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg text-text-primary">Priority Ranked Leads</h3>
          <div className="flex gap-2">
            {['all', 'hot', 'warm', 'cold'].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? 'bg-accent text-dark' : 'bg-dark text-text-secondary hover:text-text-primary'}`}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-secondary uppercase tracking-wider bg-dark">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <tr key={i} className="border-t border-border hover:bg-accent-dim/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-mono text-text-secondary">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-text-primary">{lead.name}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{lead.category}</td>
                  <td className="px-4 py-3 text-sm text-text-secondary">{lead.city}</td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold text-sm ${lead.score >= 80 ? 'text-emerald-400' : lead.score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {lead.score}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
