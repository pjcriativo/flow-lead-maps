import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Database, Globe, Phone, Mail, Users, BarChart3, X, Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const stats = [
  { label: 'Enrichment Rate', value: '72%', icon: BarChart3, color: 'text-emerald-400' },
  { label: 'Avg. Data Points', value: '8.4', icon: Database, color: 'text-blue-400' },
  { label: 'Credits Used', value: '340/500', icon: Sparkles, color: 'text-accent' },
]

const dataSources = [
  { name: 'Google Places', coverage: 100, icon: Globe },
  { name: 'Website Scraper', coverage: 78, icon: Globe },
  { name: 'Phone Validator', coverage: 92, icon: Phone },
  { name: 'Email Finder', coverage: 65, icon: Mail },
  { name: 'Social Discovery', coverage: 58, icon: Users },
  { name: 'Review Analyzer', coverage: 88, icon: BarChart3 },
]

const queue = [
  { name: "Mike's Plumbing", status: 'completed', sources: 6, email: 'mike@mikesplumbing.com', phone: '(214) 555-0123', facebook: 'fb.com/mikesplumbing' },
  { name: 'Elite Roofing', status: 'enriching', sources: 3, email: null, phone: '(713) 555-0456', facebook: null },
  { name: 'Park Cities Dental', status: 'pending', sources: 0, email: null, phone: null, facebook: null },
  { name: 'Apex Electric', status: 'completed', sources: 5, email: 'contact@apexelectric.com', phone: '(512) 555-0321', facebook: null },
  { name: 'Sunset HVAC', status: 'pending', sources: 0, email: null, phone: null, facebook: null },
  { name: 'Premier Law Group', status: 'enriching', sources: 4, email: null, phone: '(214) 555-0987', facebook: 'fb.com/premierlaw' },
]

export default function Enrichment() {
  const [selectedLead, setSelectedLead] = useState<typeof queue[0] | null>(null)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Lead Enrichment</h1>
        <p className="text-sm text-text-secondary mt-1">Fill in missing contact data for your leads.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <s.icon size={20} className={s.color} />
              {s.label === 'Credits Used' && (
                <div className="w-24 bg-dark rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: '68%' }} />
                </div>
              )}
            </div>
            <p className="font-display font-bold text-2xl text-text-primary">{s.value}</p>
            <p className="text-xs text-text-secondary mt-1">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Data Sources */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-display font-bold text-lg text-text-primary mb-4">Data Sources</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((ds) => (
            <div key={ds.name} className="bg-dark rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ds.icon size={16} className="text-accent" />
                <span className="text-sm font-medium text-text-primary">{ds.name}</span>
                <span className="text-xs font-mono text-text-secondary ml-auto">{ds.coverage}%</span>
              </div>
              <div className="w-full bg-card rounded-full h-1.5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${ds.coverage}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="bg-accent h-1.5 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Enrichment Queue */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-display font-bold text-lg text-text-primary">Enrichment Queue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-secondary uppercase tracking-wider bg-dark">
                <th className="px-6 py-3 font-medium">Business</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Sources Found</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item, i) => (
                <tr key={i} className="border-t border-border hover:bg-accent-dim/30 transition-colors cursor-pointer" onClick={() => setSelectedLead(item)}>
                  <td className="px-6 py-4 text-sm font-medium text-text-primary">{item.name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                      item.status === 'enriching' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.status === 'completed' ? 'bg-emerald-400' :
                        item.status === 'enriching' ? 'bg-yellow-400' : 'bg-gray-400'
                      }`} />
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-text-secondary">{item.sources}/6</td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" className="text-accent hover:bg-accent-dim gap-1">
                      <Sparkles size={14} /> {item.status === 'completed' ? 'View' : 'Enrich'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setSelectedLead(null)}>
            <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 25 }}
              className="w-full max-w-md bg-card border-l border-border h-full overflow-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-lg text-text-primary">{selectedLead.name}</h3>
                <button onClick={() => setSelectedLead(null)} className="text-text-secondary hover:text-text-primary"><X size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                {selectedLead.email && (
                  <div className="flex items-center justify-between bg-dark rounded-lg p-3">
                    <div className="flex items-center gap-2"><Mail size={14} className="text-accent" /><span className="text-sm text-text-primary">{selectedLead.email}</span></div>
                    <button className="text-text-secondary hover:text-accent"><Copy size={14} /></button>
                  </div>
                )}
                {selectedLead.phone && (
                  <div className="flex items-center justify-between bg-dark rounded-lg p-3">
                    <div className="flex items-center gap-2"><Phone size={14} className="text-accent" /><span className="text-sm text-text-primary">{selectedLead.phone}</span></div>
                    <button className="text-text-secondary hover:text-accent"><Copy size={14} /></button>
                  </div>
                )}
                {selectedLead.facebook && (
                  <div className="flex items-center justify-between bg-dark rounded-lg p-3">
                    <div className="flex items-center gap-2"><Users size={14} className="text-accent" /><span className="text-sm text-text-primary">{selectedLead.facebook}</span></div>
                    <button className="text-text-secondary hover:text-accent"><Copy size={14} /></button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
