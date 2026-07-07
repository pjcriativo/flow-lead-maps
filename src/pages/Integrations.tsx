import { useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Mail, Zap, Slack, FileSpreadsheet, Webhook, Settings, CheckCircle, Plug, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const integrations = [
  { id: 'gohighlevel', name: 'GoHighLevel', description: 'CRM & marketing automation', icon: Building2, connected: false, color: '#10B981' },
  { id: 'hubspot', name: 'HubSpot', description: 'Marketing, sales & service', icon: Building2, connected: false, color: '#FF7A59' },
  { id: 'mailchimp', name: 'Mailchimp', description: 'Email marketing campaigns', icon: Mail, connected: true, color: '#FFE01B' },
  { id: 'activecampaign', name: 'ActiveCampaign', description: 'Customer experience automation', icon: Zap, connected: false, color: '#0056D2' },
  { id: 'zapier', name: 'Zapier', description: 'Workflow automation', icon: Zap, connected: true, color: '#FF4A00' },
  { id: 'slack', name: 'Slack', description: 'Team notifications', icon: Slack, connected: false, color: '#4A154B' },
  { id: 'googlesheets', name: 'Google Sheets', description: 'Export leads to spreadsheets', icon: FileSpreadsheet, connected: false, color: '#34A853' },
  { id: 'webhook', name: 'Webhook', description: 'Custom HTTP endpoints', icon: Webhook, connected: false, color: '#8B95A5' },
]

export default function IntegrationsPage() {
  const [items, setItems] = useState(integrations)
  const [modalOpen, setModalOpen] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState('')

  const toggleConnect = (id: string) => {
    setItems(items.map(item => item.id === id ? { ...item, connected: !item.connected } : item))
    setModalOpen(null)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Integrations</h1>
        <p className="text-sm text-text-secondary mt-1">Connect your favorite tools to LeadSift.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-5 hover:border-accent/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '15' }}>
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              {item.connected && <CheckCircle size={18} className="text-emerald-400" />}
            </div>
            <h3 className="font-display font-bold text-sm text-text-primary mb-1">{item.name}</h3>
            <p className="text-xs text-text-secondary mb-4">{item.description}</p>
            <div className="flex gap-2">
              <Button size="sm" variant={item.connected ? 'outline' : 'default'}
                className={item.connected ? 'border-border text-text-secondary hover:text-text-primary text-xs' : 'bg-accent text-dark hover:brightness-110 text-xs'}
                onClick={() => item.connected ? toggleConnect(item.id) : setModalOpen(item.id)}>
                {item.connected ? 'Disconnect' : 'Connect'}
              </Button>
              {item.connected && (
                <Button size="sm" variant="ghost" className="text-text-secondary hover:text-text-primary px-2">
                  <Settings size={14} />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Connection Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setModalOpen(null)}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card border border-border rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-text-primary">Connect {integrations.find(i => i.id === modalOpen)?.name}</h3>
              <button onClick={() => setModalOpen(null)} className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
            </div>
            <p className="text-sm text-text-secondary mb-4">Enter your API key to connect this integration.</p>
            <Input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" className="bg-dark border-border text-text-primary mb-4" type="password" />
            <div className="flex gap-3">
              <Button variant="outline" className="border-border text-text-primary flex-1" onClick={() => setModalOpen(null)}>Cancel</Button>
              <Button className="bg-accent text-dark flex-1 hover:brightness-110" onClick={() => toggleConnect(modalOpen)}>Connect</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
