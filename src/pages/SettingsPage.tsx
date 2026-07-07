import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Users, Bell, Shield, Camera, Plus, Trash2, Mail, MessageSquare, TrendingUp, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

const settingsTabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
]

const teamMembers = [
  { name: 'John Doe', email: 'john@example.com', role: 'Owner', status: 'Active', avatar: 'JD' },
  { name: 'Alice Martinez', email: 'alice@example.com', role: 'Admin', status: 'Active', avatar: 'AM' },
  { name: 'Bob Wilson', email: 'bob@example.com', role: 'Member', status: 'Pending', avatar: 'BW' },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [notifs, setNotifs] = useState({
    newLeads: true,
    enrichment: true,
    replies: true,
    digest: false,
    marketing: false,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your account, team, and preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-card border border-border rounded-xl p-2 space-y-1">
            {settingsTabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-accent-dim text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-white/5'}`}>
                <tab.icon size={16} /> {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
            {/* PROFILE */}
            {activeTab === 'profile' && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <h2 className="font-display font-bold text-lg text-text-primary">Profile</h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xl relative">
                    JD
                    <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary"><Camera size={12} /></button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">John Doe</p>
                    <p className="text-xs text-text-secondary">john@example.com</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div><label className="text-xs text-text-secondary mb-1 block">Full Name</label><Input defaultValue="John Doe" className="bg-dark border-border text-text-primary" /></div>
                  <div><label className="text-xs text-text-secondary mb-1 block">Email</label><Input defaultValue="john@example.com" className="bg-dark border-border text-text-primary" /></div>
                  <div><label className="text-xs text-text-secondary mb-1 block">Company</label><Input defaultValue="Doe Marketing LLC" className="bg-dark border-border text-text-primary" /></div>
                  <div><label className="text-xs text-text-secondary mb-1 block">Phone</label><Input defaultValue="(214) 555-0100" className="bg-dark border-border text-text-primary" /></div>
                </div>
                <div><label className="text-xs text-text-secondary mb-1 block">Bio</label><textarea defaultValue="Local marketing specialist helping home service businesses grow." className="w-full h-24 px-3 py-2 bg-dark border border-border rounded-md text-text-primary text-sm resize-none" /></div>
                <Button className="bg-accent text-dark hover:brightness-110">Save Changes</Button>
              </div>
            )}

            {/* TEAM */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display font-bold text-lg text-text-primary">Team Members</h2>
                    <Button size="sm" className="bg-accent text-dark hover:brightness-110 gap-2" onClick={() => setInviteOpen(true)}><Plus size={14} /> Invite</Button>
                  </div>
                  <div className="space-y-3">
                    {teamMembers.map(m => (
                      <div key={m.email} className="flex items-center justify-between bg-dark rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{m.avatar}</div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{m.name}</p>
                            <p className="text-xs text-text-secondary">{m.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs bg-card px-2 py-0.5 rounded text-text-secondary">{m.role}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${m.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{m.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {inviteOpen && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <h3 className="font-display font-bold text-text-primary mb-4">Invite Team Member</h3>
                    <div className="flex gap-3">
                      <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address" className="bg-dark border-border text-text-primary flex-1" />
                      <select className="h-9 px-3 bg-dark border border-border rounded-md text-text-primary text-sm">
                        <option>Member</option><option>Admin</option>
                      </select>
                      <Button className="bg-accent text-dark hover:brightness-110" onClick={() => setInviteOpen(false)}>Send Invite</Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS */}
            {activeTab === 'notifications' && (
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <h2 className="font-display font-bold text-lg text-text-primary">Notification Preferences</h2>
                {[
                  { key: 'newLeads', label: 'New Lead Alerts', desc: 'Get notified when high-score leads are found' },
                  { key: 'enrichment', label: 'Enrichment Complete', desc: 'Notification when lead enrichment finishes' },
                  { key: 'replies', label: 'Email Replies', desc: 'Alert when a lead replies to your outreach' },
                  { key: 'digest', label: 'Weekly Digest', desc: 'Summary of your week every Monday' },
                  { key: 'marketing', label: 'Marketing Emails', desc: 'Product updates, tips, and offers' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{n.label}</p>
                      <p className="text-xs text-text-secondary">{n.desc}</p>
                    </div>
                    <Switch checked={notifs[n.key as keyof typeof notifs]} onCheckedChange={(v) => setNotifs({ ...notifs, [n.key]: v })} />
                  </div>
                ))}
                <Button className="bg-accent text-dark hover:brightness-110">Save Preferences</Button>
              </div>
            )}

            {/* SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="font-display font-bold text-lg text-text-primary mb-4">Change Password</h2>
                  <div className="space-y-4 max-w-md">
                    <Input type="password" placeholder="Current password" className="bg-dark border-border text-text-primary" />
                    <Input type="password" placeholder="New password" className="bg-dark border-border text-text-primary" />
                    <Input type="password" placeholder="Confirm new password" className="bg-dark border-border text-text-primary" />
                    <Button className="bg-accent text-dark hover:brightness-110">Update Password</Button>
                  </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-bold text-text-primary">Two-Factor Authentication</h3>
                      <p className="text-xs text-text-secondary mt-1">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>
                </div>
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                  <h3 className="font-display font-bold text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-xs text-text-secondary mb-4">Once you delete your account, there is no going back.</p>
                  <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"><Trash2 size={14} /> Delete Account</Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
