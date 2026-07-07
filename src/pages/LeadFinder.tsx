import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, MapPin, Phone, Globe, Star, Sparkles, Save, Filter, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'

const niches = ['All Niches', 'Plumber', 'Roofer', 'Dentist', 'Electrician', 'Lawyer', 'Restaurant', 'HVAC', 'Landscaper', 'Cleaning', 'Handyman', 'Pool Service']
const radii = ['5 miles', '10 miles', '25 miles', '50 miles']

const mockLeads = [
  { name: "Mike's Plumbing", address: '1234 Main St, Dallas, TX 75201', phone: '(214) 555-0123', website: 'mikesplumbing.com', reviews: 12, rating: 4.2, score: 92, hasWebsite: true },
  { name: 'Elite Roofing Solutions', address: '5678 Oak Ave, Houston, TX 77001', phone: '(713) 555-0456', website: null, reviews: 3, rating: 3.8, score: 87, hasWebsite: false },
  { name: 'Park Cities Dental', address: '9012 Maple Dr, Dallas, TX 75205', phone: '(214) 555-0789', website: 'parkcitiesdental.com', reviews: 45, rating: 4.7, score: 85, hasWebsite: true },
  { name: 'Apex Electric Co', address: '3456 Pine St, Austin, TX 78701', phone: '(512) 555-0321', website: null, reviews: 8, rating: 4.1, score: 78, hasWebsite: false },
  { name: 'Sunset HVAC Services', address: '7890 Cedar Ln, San Antonio, TX 78201', phone: '(210) 555-0654', website: 'sunsethvac.com', reviews: 22, rating: 4.3, score: 73, hasWebsite: true },
  { name: 'Premier Law Group', address: '2468 Elm St, Dallas, TX 75202', phone: '(214) 555-0987', website: 'premierlaw.com', reviews: 67, rating: 4.5, score: 71, hasWebsite: true },
  { name: 'Green Leaf Landscaping', address: '1357 Birch Rd, Fort Worth, TX 76101', phone: '(817) 555-0145', website: null, reviews: 5, rating: 3.5, score: 68, hasWebsite: false },
  { name: 'Golden Touch Cleaners', address: '8642 Willow Way, Houston, TX 77002', phone: '(713) 555-0278', website: 'goldentouchclean.com', reviews: 18, rating: 4.0, score: 64, hasWebsite: true },
  { name: 'FixIt Handyman', address: '4321 Spruce St, Austin, TX 78702', phone: '(512) 555-0512', website: null, reviews: 2, rating: 3.2, score: 61, hasWebsite: false },
  { name: 'Texas Pool Pros', address: '9753 Palm Ave, Dallas, TX 75203', phone: '(214) 555-0845', website: 'txpoolpros.com', reviews: 31, rating: 4.4, score: 58, hasWebsite: true },
  { name: 'Rapid Auto Repair', address: '1593 Oak Lane, Houston, TX 77004', phone: '(713) 555-0369', website: null, reviews: 0, rating: 0, score: 95, hasWebsite: false },
  { name: 'Sunrise Bakery', address: '7531 Main Street, Dallas, TX 75204', phone: '(214) 555-0731', website: 'sunrisebakery.com', reviews: 89, rating: 4.6, score: 45, hasWebsite: true },
  { name: 'Metro Painting Co', address: '2468 Commerce St, Austin, TX 78703', phone: '(512) 555-0198', website: null, reviews: 7, rating: 3.9, score: 82, hasWebsite: false },
  { name: 'Coastal Cafe', address: '3579 Beach Blvd, Houston, TX 77005', phone: '(713) 555-0526', website: 'coastalcafe.com', reviews: 156, rating: 4.8, score: 35, hasWebsite: true },
  { name: 'Atlas Fitness Gym', address: '9517 Highland Rd, Dallas, TX 75206', phone: '(214) 555-0873', website: 'atlasfitness.com', reviews: 43, rating: 4.3, score: 52, hasWebsite: true },
  { name: 'Bright Smiles Dental', address: '7532 Oakmont Ave, Fort Worth, TX 76102', phone: '(817) 555-0246', website: null, reviews: 1, rating: 5.0, score: 88, hasWebsite: false },
  { name: 'Reliable Movers', address: '1594 River Rd, San Antonio, TX 78202', phone: '(210) 555-0579', website: 'reliablemovers.com', reviews: 28, rating: 4.1, score: 70, hasWebsite: true },
  { name: 'Urban Coffee House', address: '3578 Lamar St, Austin, TX 78704', phone: '(512) 555-0932', website: 'urbancoffee.com', reviews: 203, rating: 4.9, score: 30, hasWebsite: true },
  { name: 'Fresh Cut Barbershop', address: '8643 Magnolia Ave, Dallas, TX 75207', phone: '(214) 555-0165', website: null, reviews: 4, rating: 3.7, score: 75, hasWebsite: false },
  { name: 'Summit Roofing', address: '9516 Mountain View, Houston, TX 77006', phone: '(713) 555-0498', website: 'summitroofing.com', reviews: 19, rating: 4.2, score: 80, hasWebsite: true },
]

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? 'bg-emerald-500/10 text-emerald-400' : score >= 60 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'
  return <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${color}`}>{score}</span>
}

export default function LeadFinder() {
  const [city, setCity] = useState('Dallas, TX')
  const [niche, setNiche] = useState('Plumber')
  const [radius, setRadius] = useState('25 miles')
  const [minReviews, setMinReviews] = useState([0])
  const [hasWebsite, setHasWebsite] = useState(false)
  const [minRating, setMinRating] = useState([0])
  const [showFilters, setShowFilters] = useState(false)

  const filtered = mockLeads.filter(l => {
    if (l.reviews < minReviews[0]) return false
    if (hasWebsite && !l.hasWebsite) return false
    if (l.rating < minRating[0]) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-text-primary">Lead Finder</h1>
        <p className="text-sm text-text-secondary mt-1">Search Google Maps for local businesses in any city.</p>
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <Input value={city} onChange={e => setCity(e.target.value)} className="pl-9 bg-dark border-border text-text-primary" placeholder="City, State" />
          </div>
          <div className="relative">
            <select value={niche} onChange={e => setNiche(e.target.value)} className="h-9 px-3 pr-8 bg-dark border border-border rounded-md text-text-primary text-sm appearance-none cursor-pointer">
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="relative">
            <select value={radius} onChange={e => setRadius(e.target.value)} className="h-9 px-3 pr-8 bg-dark border border-border rounded-md text-text-primary text-sm appearance-none cursor-pointer">
              {radii.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <Button className="bg-accent text-dark hover:brightness-110 gap-2">
            <Search size={16} /> Search
          </Button>
          <Button variant="outline" className="border-border text-text-primary hover:bg-accent-dim gap-2" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} /> Filters
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4 border-t border-border grid sm:grid-cols-3 gap-6">
            <div>
              <label className="text-xs text-text-secondary mb-2 block">Min Reviews: {minReviews[0]}</label>
              <Slider value={minReviews} onValueChange={setMinReviews} max={200} step={1} className="w-full" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={hasWebsite} onCheckedChange={setHasWebsite} />
              <span className="text-sm text-text-primary">Has website</span>
            </div>
            <div>
              <label className="text-xs text-text-secondary mb-2 block">Min Rating: {minRating[0]}</label>
              <Slider value={minRating} onValueChange={setMinRating} max={5} step={0.5} className="w-full" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Results */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <p className="text-sm text-text-secondary">{filtered.length} leads found</p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">Export CSV</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-text-secondary uppercase tracking-wider bg-dark">
                <th className="px-6 py-3 font-medium">Business</th>
                <th className="px-6 py-3 font-medium">Address</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Reviews</th>
                <th className="px-6 py-3 font-medium">Score</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => (
                <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-t border-border hover:bg-accent-dim/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{lead.name}</p>
                      {lead.website && <p className="text-xs text-accent">{lead.website}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{lead.address}</td>
                  <td className="px-6 py-4 text-sm text-text-secondary">{lead.phone}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-text-primary">{lead.rating || 'N/A'}</span>
                      <span className="text-xs text-text-secondary">({lead.reviews})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><ScoreBadge score={lead.score} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-accent hover:bg-accent-dim gap-1">
                        <Sparkles size={14} /> Enrich
                      </Button>
                      <Button variant="ghost" size="sm" className="text-text-secondary hover:text-text-primary">
                        <Save size={14} />
                      </Button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
