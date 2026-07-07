import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, MoreHorizontal, X, Phone, Mail, Calendar, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Lead {
  id: number
  name: string
  value: string
  category: string
  score: number
  lastActivity: string
  assignee: string
}

const initialColumns = {
  new: { title: 'New', leads: [
    { id: 1, name: 'Rapid Auto Repair', value: '$500/mo', category: 'Auto Repair', score: 95, lastActivity: '2h ago', assignee: 'JD' },
    { id: 2, name: 'Green Leaf Landscaping', value: '$300/mo', category: 'Landscaper', score: 68, lastActivity: '5h ago', assignee: 'JD' },
    { id: 3, name: 'Texas Pool Pros', value: '$400/mo', category: 'Pool Service', score: 58, lastActivity: '1d ago', assignee: 'AM' },
    { id: 4, name: 'Coastal Cafe', value: '$600/mo', category: 'Restaurant', score: 35, lastActivity: '2d ago', assignee: 'JD' },
  ]},
  contacted: { title: 'Contacted', leads: [
    { id: 5, name: 'Golden Touch Cleaners', value: '$350/mo', category: 'Cleaning', score: 64, lastActivity: '3h ago', assignee: 'JD' },
    { id: 6, name: 'FixIt Handyman', value: '$250/mo', category: 'Handyman', score: 61, lastActivity: '8h ago', assignee: 'AM' },
    { id: 7, name: 'Atlas Fitness Gym', value: '$800/mo', category: 'Gym', score: 52, lastActivity: '1d ago', assignee: 'JD' },
  ]},
  qualified: { title: 'Qualified', leads: [
    { id: 8, name: 'Elite Roofing', value: '$700/mo', category: 'Roofer', score: 87, lastActivity: '1h ago', assignee: 'JD' },
    { id: 9, name: 'Sunset HVAC', value: '$550/mo', category: 'HVAC', score: 73, lastActivity: '4h ago', assignee: 'AM' },
  ]},
  proposal: { title: 'Proposal', leads: [
    { id: 10, name: "Mike's Plumbing", value: '$450/mo', category: 'Plumber', score: 92, lastActivity: '30m ago', assignee: 'JD' },
    { id: 11, name: 'Park Cities Dental', value: '$900/mo', category: 'Dentist', score: 85, lastActivity: '2h ago', assignee: 'JD' },
  ]},
  won: { title: 'Closed Won', leads: [
    { id: 12, name: 'Apex Electric', value: '$500/mo', category: 'Electrician', score: 78, lastActivity: '1d ago', assignee: 'JD' },
    { id: 13, name: 'Premier Law Group', value: '$1,200/mo', category: 'Lawyer', score: 71, lastActivity: '2d ago', assignee: 'AM' },
    { id: 14, name: 'Fresh Cut Barbershop', value: '$350/mo', category: 'Barber', score: 75, lastActivity: '3d ago', assignee: 'JD' },
  ]},
}

export default function Pipeline() {
  const [columns, setColumns] = useState(initialColumns)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [selectedStage, setSelectedStage] = useState<string | null>(null)

  const moveLead = (leadId: number, toStage: string) => {
    setColumns(prev => {
      const newCols = { ...prev }
      for (const [stage, col] of Object.entries(newCols)) {
        const idx = col.leads.findIndex(l => l.id === leadId)
        if (idx !== -1) {
          const lead = col.leads[idx]
          newCols[stage] = { ...col, leads: col.leads.filter(l => l.id !== leadId) }
          newCols[toStage] = { ...newCols[toStage], leads: [...newCols[toStage].leads, lead] }
          break
        }
      }
      return newCols
    })
    setSelectedLead(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Pipeline</h1>
          <p className="text-sm text-text-secondary mt-1">Track leads through your sales process.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-card border border-border rounded-lg p-1">
            {(['kanban', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded text-xs font-medium capitalize transition-colors ${view === v ? 'bg-accent text-dark' : 'text-text-secondary hover:text-text-primary'}`}>{v}</button>
            ))}
          </div>
          <Button className="bg-accent text-dark hover:brightness-110 gap-2"><Plus size={16} /> Add Lead</Button>
        </div>
      </div>

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(columns).map(([key, col]) => (
            <div key={key} className="flex-shrink-0 w-72">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-display font-bold text-sm text-text-primary">{col.title}</h3>
                <span className="text-xs font-mono text-text-secondary bg-card px-2 py-0.5 rounded-full">{col.leads.length}</span>
              </div>
              <div className="space-y-3">
                {col.leads.map((lead) => (
                  <motion.div key={lead.id} layout whileHover={{ scale: 1.02 }} onClick={() => { setSelectedLead(lead); setSelectedStage(key) }}
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-accent/30 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-medium text-text-primary">{lead.name}</h4>
                      <button className="text-text-secondary hover:text-text-primary"><MoreHorizontal size={14} /></button>
                    </div>
                    <p className="text-xs text-accent font-medium mb-2">{lead.value}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] bg-dark px-2 py-0.5 rounded text-text-secondary">{lead.category}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${lead.score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : lead.score >= 60 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>{lead.score}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span>{lead.lastActivity}</span>
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-bold text-accent">{lead.assignee}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-secondary uppercase tracking-wider bg-dark">
                <th className="px-6 py-3 font-medium">Business</th>
                <th className="px-6 py-3 font-medium">Value</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Score</th>
                <th className="px-6 py-3 font-medium">Stage</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(columns).flatMap(([key, col]) => col.leads.map(lead => ({ ...lead, stage: col.title }))).map(lead => (
                <tr key={lead.id} className="border-t border-border hover:bg-accent-dim/30 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-text-primary">{lead.name}</td>
                  <td className="px-6 py-3 text-sm text-accent">{lead.value}</td>
                  <td className="px-6 py-3 text-xs text-text-secondary">{lead.category}</td>
                  <td className="px-6 py-3 font-mono text-sm text-text-primary">{lead.score}</td>
                  <td className="px-6 py-3 text-xs text-text-secondary">{lead.stage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lead Detail Drawer */}
      <AnimatePresence>
        {selectedLead && selectedStage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setSelectedLead(null)}>
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-card border-l border-border h-full overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-text-primary">{selectedLead.name}</h3>
                <button onClick={() => setSelectedLead(null)} className="text-text-secondary hover:text-text-primary"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-accent">{selectedLead.value}</span>
                  <span className="text-xs text-text-secondary">monthly</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark rounded-lg p-3"><p className="text-xs text-text-secondary">Category</p><p className="text-sm text-text-primary">{selectedLead.category}</p></div>
                  <div className="bg-dark rounded-lg p-3"><p className="text-xs text-text-secondary">Score</p><p className="text-sm font-mono text-text-primary">{selectedLead.score}</p></div>
                </div>
                <div>
                  <p className="text-xs text-text-secondary mb-2">Move to Stage</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(columns).filter(([k]) => k !== selectedStage).map(([key, col]) => (
                      <button key={key} onClick={() => moveLead(selectedLead.id, key)}
                        className="px-3 py-1.5 bg-dark border border-border rounded-lg text-xs text-text-primary hover:border-accent transition-colors">
                        {col.title}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-accent text-dark hover:brightness-110 gap-2"><Phone size={14} /> Call</Button>
                  <Button variant="outline" className="flex-1 border-border text-text-primary hover:bg-accent-dim gap-2"><Mail size={14} /> Email</Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
