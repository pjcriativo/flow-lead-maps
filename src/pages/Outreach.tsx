import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Send, Mail, Eye, MousePointer, Plus, Edit3, Play, Pause, ChevronRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

const sendData = [
  { day: 'Mon', sent: 45, opened: 23 },
  { day: 'Tue', sent: 52, opened: 31 },
  { day: 'Wed', sent: 38, opened: 19 },
  { day: 'Thu', sent: 61, opened: 34 },
  { day: 'Fri', sent: 49, opened: 27 },
  { day: 'Sat', sent: 15, opened: 8 },
  { day: 'Sun', sent: 12, opened: 6 },
]

const sequences = [
  { id: 1, name: 'Initial Outreach', steps: 3, active: true, openRate: 42, replyRate: 18, lastEdited: '2 hours ago' },
  { id: 2, name: 'Follow-Up Sequence', steps: 4, active: true, openRate: 38, replyRate: 12, lastEdited: '1 day ago' },
  { id: 3, name: 'Re-engagement', steps: 2, active: false, openRate: 25, replyRate: 8, lastEdited: '3 days ago' },
]

const sequenceSteps: Record<number, { day: number; name: string; subject: string }[]> = {
  1: [
    { day: 0, name: 'Initial Contact', subject: 'Quick question about {{business_name}}' },
    { day: 3, name: 'Value Add', subject: 'How we helped a {{category}} in {{city}}' },
    { day: 7, name: 'Final Touch', subject: 'Last try — want to grow {{business_name}}?' },
  ],
  2: [
    { day: 0, name: 'Warm Intro', subject: 'Loved your work at {{business_name}}' },
    { day: 2, name: 'Case Study', subject: '3X leads for a {{category}} near you' },
    { day: 5, name: 'Social Proof', subject: '{{city}} {{category}} seeing 200% ROI' },
    { day: 10, name: 'Break-Up', subject: 'Should I close your file?' },
  ],
  3: [
    { day: 0, name: 'We Miss You', subject: 'Still interested in growing {{business_name}}?' },
    { day: 5, name: 'Special Offer', subject: '50% off for returning {{category}} owners' },
  ],
}

const templates = [
  { id: 1, name: 'Initial Outreach', subject: 'Quick question about {{business_name}}', opens: 42, uses: 234 },
  { id: 2, name: 'Value Proposition', subject: 'How we helped a {{category}} in {{city}}', opens: 51, uses: 189 },
  { id: 3, name: 'Social Proof', subject: '{{city}} {{category}} seeing 200% ROI', opens: 38, uses: 156 },
  { id: 4, name: 'Urgency', subject: '3 spots left for {{category}} in {{city}}', opens: 45, uses: 134 },
  { id: 5, name: 'Break-Up', subject: 'Should I close your file?', opens: 62, uses: 98 },
]

const kpis = [
  { label: 'Total Sent', value: '2,847', icon: Send },
  { label: 'Open Rate', value: '34.2%', icon: Eye },
  { label: 'Click Rate', value: '12.8%', icon: MousePointer },
]

const tabs = ['Sequences', 'Templates', 'Analytics']

export default function Outreach() {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null)
  const [seqActive, setSeqActive] = useState<Record<number, boolean>>({ 1: true, 2: true, 3: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-text-primary">Outreach</h1>
          <p className="text-sm text-text-secondary mt-1">Email sequences, templates, and campaign analytics.</p>
        </div>
        <Button className="bg-accent text-dark hover:brightness-110 gap-2"><Plus size={16} /> New Sequence</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-border rounded-lg p-1 w-fit">
        {tabs.map((tab, i) => (
          <button key={tab} onClick={() => { setActiveTab(i); setSelectedSeq(null) }}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === i ? 'bg-accent text-dark' : 'text-text-secondary hover:text-text-primary'}`}>
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* SEQUENCES TAB */}
        {activeTab === 0 && (
          <motion.div key="seq" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {sequences.map((seq) => (
              <div key={seq.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSeqActive({ ...seqActive, [seq.id]: !seqActive[seq.id] })} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${seqActive[seq.id] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {seqActive[seq.id] ? <Pause size={16} /> : <Play size={16} />}
                    </button>
                    <div>
                      <h3 className="font-display font-bold text-text-primary">{seq.name}</h3>
                      <p className="text-xs text-text-secondary">{seq.steps} steps &middot; Open rate: {seq.openRate}% &middot; Reply rate: {seq.replyRate}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">Edited {seq.lastEdited}</span>
                    <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary" onClick={() => setSelectedSeq(selectedSeq === seq.id ? null : seq.id)}>
                      <Edit3 size={14} />
                    </Button>
                    <ChevronRight size={16} className={`text-text-secondary transition-transform ${selectedSeq === seq.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                <AnimatePresence>
                  {selectedSeq === seq.id && sequenceSteps[seq.id] && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden border-t border-border">
                      <div className="px-6 py-4 space-y-4">
                        <div className="flex items-center gap-2">
                          {sequenceSteps[seq.id].map((step, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className="bg-dark border border-border rounded-lg p-3 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Clock size={12} className="text-accent" />
                                  <span className="text-xs font-mono text-accent">Day {step.day}</span>
                                </div>
                                <p className="text-sm font-medium text-text-primary">{step.name}</p>
                                <p className="text-xs text-text-secondary mt-1">{step.subject}</p>
                              </div>
                              {i < sequenceSteps[seq.id].length - 1 && <div className="w-8 h-px bg-border" />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </motion.div>
        )}

        {/* TEMPLATES TAB */}
        {activeTab === 1 && (
          <motion.div key="tmpl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tmpl, i) => (
              <motion.div key={tmpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <Mail size={18} className="text-accent" />
                  <span className="text-xs font-mono text-emerald-400">{tmpl.opens}% opens</span>
                </div>
                <h3 className="font-display font-bold text-sm text-text-primary mb-1">{tmpl.name}</h3>
                <p className="text-xs text-text-secondary mb-4">{tmpl.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-secondary">{tmpl.uses} uses</span>
                  <Button variant="ghost" size="sm" className="text-accent hover:bg-accent-dim text-xs">Use</Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 2 && (
          <motion.div key="anly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {kpis.map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-xl p-6 text-center">
                  <kpi.icon size={20} className="text-accent mx-auto mb-3" />
                  <p className="font-display font-bold text-2xl text-text-primary">{kpi.value}</p>
                  <p className="text-xs text-text-secondary mt-1">{kpi.label}</p>
                </motion.div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-display font-bold text-lg text-text-primary mb-4">Weekly Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sendData}>
                  <XAxis dataKey="day" tick={{ fill: '#8B95A5', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8B95A5', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#141821', border: '1px solid #1E2530', borderRadius: '8px', color: '#F4F6F8' }} />
                  <Bar dataKey="sent" fill="#1E2530" radius={[4, 4, 0, 0]} name="Sent" />
                  <Bar dataKey="opened" fill="#10B981" radius={[4, 4, 0, 0]} name="Opened" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
