import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Target, Sparkles, CheckCircle, MapPin, Zap, ChevronDown, PlayCircle } from 'lucide-react'

function useCountUp(end: number, duration: number = 1500, startCounting: boolean = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!startCounting) return
    let startTime: number | null = null
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [end, duration, startCounting])
  return count
}

function Counter({ end, suffix = '', start }: { end: number; suffix?: string; start: boolean }) {
  const count = useCountUp(end, 1500, start)
  return <span>{count.toLocaleString()}{suffix}</span>
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }} className={className}>
      {children}
    </motion.div>
  )
}

function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="bg-white border border-[#E2E5EA] rounded-xl mb-3 overflow-hidden">
      <button onClick={onClick} className="w-full flex items-center justify-between px-6 py-5 text-left">
        <span className="text-base font-medium text-[#0B0E14] font-body">{question}</span>
        <ChevronDown size={20} className={`text-[#8B95A5] transition-transform duration-200 flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <p className="px-6 pb-5 text-sm text-[#8B95A5] leading-relaxed">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Home() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)
  const [annual, setAnnual] = useState(false)
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-100px' })
  const heroRef = useRef(null)
  const heroInView = useInView(heroRef, { once: true })

  const toggleFAQ = (i: number) => setOpenFAQ(openFAQ === i ? null : i)

  const faqs = [
    { q: 'How is this different from Maps-to-Cash?', a: 'LeadSift is real software, not a course. Log in, search a city, and get scored leads with contact info instantly.' },
    { q: 'Where does the lead data come from?', a: 'We source from Google Maps, public business directories, and enrichment partners. All data is publicly available.' },
    { q: 'Can I export leads to my CRM?', a: 'Yes — Connect GoHighLevel, Mailchimp, HubSpot, ActiveCampaign, Zapier, or export CSV.' },
    { q: 'Is there a free trial?', a: 'Absolutely. Start with 50 leads/mo on our free Starter plan. Upgrade when ready.' },
    { q: 'Do I need technical skills?', a: 'Not at all. If you can use Google Maps, you can use LeadSift. Everything is point-and-click.' },
  ]

  const steps = [
    { num: '01', icon: MapPin, title: 'Search', desc: 'Type a city and niche. LeadSift pulls every matching business from Google Maps.' },
    { num: '02', icon: Target, title: 'Score', desc: 'Our AI ranks leads by intent signals — website quality, reviews, ad spend, and more.' },
    { num: '03', icon: Sparkles, title: 'Enrich', desc: 'One click adds emails, phone numbers, and social profiles from 20+ data sources.' },
    { num: '04', icon: CheckCircle, title: 'Connect', desc: 'Export to your CRM or outreach tool. Start conversations with leads ready to buy.' },
  ]

  const features = [
    { icon: Target, title: 'AI Lead Scoring', desc: 'Automatic 0-100 scoring based on website quality, reviews, social presence, and ad spend signals.' },
    { icon: MapPin, title: 'Google Maps Integration', desc: 'Search any city and niche. We pull real-time business data directly from Google Maps.' },
    { icon: Sparkles, title: 'Real-Time Enrichment', desc: 'Fill in missing contact data — emails, phones, social profiles — from 20+ data sources.' },
    { icon: Zap, title: 'Built-In Outreach', desc: 'Email sequences that convert. Pre-built templates, automated follow-ups, and open tracking.' },
  ]

  const plans = [
    { name: 'Starter', monthly: 29, annual: 23, leads: '100', integrations: '1', outreach: false, support: 'Email' },
    { name: 'Growth', monthly: 79, annual: 63, leads: '500', integrations: '3', outreach: true, support: 'Priority', popular: true },
    { name: 'Agency', monthly: 197, annual: 157, leads: 'Unlimited', integrations: 'Unlimited', outreach: true, support: 'Dedicated', team: true },
  ]

  return (
    <div>
      {/* HERO */}
      <section ref={heroRef} className="relative min-h-screen bg-[#0B0E14] overflow-hidden flex items-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div key={i} className="absolute w-1.5 h-1.5 rounded-full bg-[#10B981]" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: 0.08 }}
              animate={{ y: [0, -30, 0], x: [0, Math.random() * 20 - 10, 0], opacity: [0.08, 0.15, 0.08] }}
              transition={{ duration: 4 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }} />
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-xs font-medium text-[#8B95A5] uppercase tracking-[0.08em] mb-4">
                STOP BUYING COURSES. START CLOSING DEALS.
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-[#F4F6F8] leading-[1.1] mb-6">
                The <span className="text-[#10B981]">AI-Powered</span> Lead Gen Engine That Turns Google Maps Into a <span className="text-[#10B981]">Pipeline</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-base text-[#8B95A5] leading-relaxed max-w-[520px] mb-8">
                LeadSift replaces the $2,000 Maps-to-Cash course with software that actually finds, scores, and connects you with high-intent local business leads — in real time.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={heroInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-wrap gap-4 mb-6">
                <Link to="/login" className="px-8 py-4 bg-[#10B981] text-[#0B0E14] font-display font-bold text-base rounded-xl hover:brightness-110 transition-all">
                  Start Your 7-Day Free Trial
                </Link>
                <button className="flex items-center gap-2 px-6 py-4 border border-[#1E2530] text-[#F4F6F8] font-medium rounded-xl hover:bg-[#141821] transition-all">
                  <PlayCircle size={18} /> Watch 2-Min Demo
                </button>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={heroInView ? { opacity: 1 } : {}} transition={{ duration: 0.4, delay: 0.7 }} className="text-xs text-[#8B95A5]">
                No credit card required &middot; 500+ active users &middot; 4.9/5 rating
              </motion.p>
            </div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={heroInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} className="relative hidden lg:block">
              <div className="relative">
                <img src="/hero-dashboard.jpg" alt="LeadSift Dashboard" className="rounded-2xl shadow-2xl border border-[#1E2530] w-full" />
                <div className="absolute -bottom-4 -right-4 bg-[#141821] border border-[#1E2530] rounded-xl px-4 py-3 flex items-center gap-3 shadow-xl">
                  <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center">
                    <Sparkles size={14} className="text-[#10B981]" />
                  </div>
                  <div>
                    <p className="text-xs text-[#8B95A5]">AI Co-Pilot</p>
                    <p className="text-sm text-[#F4F6F8] font-medium">23 new leads found</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 bg-[#0B0E14]" id="features">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <FadeIn>
            <p className="text-xs font-medium text-[#10B981] uppercase tracking-[0.08em] mb-3">HOW IT WORKS</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#F4F6F8] mb-4">From Search to Close in 4 Steps</h2>
            <p className="text-base text-[#8B95A5] max-w-xl mb-16">No more outdated lists. No more manual research. Just qualified leads delivered to your pipeline.</p>
          </FadeIn>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <FadeIn key={step.num} delay={i * 0.1}>
                <div className="relative">
                  <div className="text-xs font-mono text-[#10B981] mb-3">{step.num}</div>
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center mb-4">
                    <step.icon size={22} className="text-[#10B981]" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#F4F6F8] mb-2">{step.title}</h3>
                  <p className="text-sm text-[#8B95A5] leading-relaxed">{step.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 bg-[#F4F6F8]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <FadeIn>
            <p className="text-xs font-medium text-[#10B981] uppercase tracking-[0.08em] mb-3">FEATURES</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#0B0E14] mb-12">Everything You Need to Fill Your Pipeline</h2>
          </FadeIn>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <div className="bg-white rounded-2xl p-8 border border-[#E2E5EA] hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center mb-5">
                    <f.icon size={22} className="text-[#10B981]" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-[#0B0E14] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#8B95A5] leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="py-24 bg-[#F4F6F8]" id="pricing">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <FadeIn>
            <p className="text-xs font-medium text-[#10B981] uppercase tracking-[0.08em] mb-3">PRICING</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#0B0E14] mb-4">Simple, Transparent Pricing</h2>
            <p className="text-base text-[#8B95A5] mb-8">Start free. Scale when ready. No hidden fees.</p>
            <div className="flex items-center justify-center gap-3 mb-12">
              <span className={`text-sm font-medium ${!annual ? 'text-[#0B0E14]' : 'text-[#8B95A5]'}`}>Monthly</span>
              <button onClick={() => setAnnual(!annual)} className={`w-12 h-6 rounded-full transition-colors ${annual ? 'bg-[#10B981]' : 'bg-[#E2E5EA]'}`}>
                <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${annual ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-medium ${annual ? 'text-[#0B0E14]' : 'text-[#8B95A5]'}`}>Annual <span className="text-[#10B981]">Save 20%</span></span>
            </div>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, i) => (
              <FadeIn key={plan.name} delay={i * 0.1}>
                <div className={`relative rounded-2xl p-8 ${plan.popular ? 'bg-[#0B0E14] border-2 border-[#10B981]' : 'bg-white border border-[#E2E5EA]'}`}>
                  {plan.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#10B981] text-[#0B0E14] text-xs font-semibold rounded-full">Most Popular</span>}
                  <h3 className={`font-display font-bold text-xl mb-2 ${plan.popular ? 'text-[#F4F6F8]' : 'text-[#0B0E14]'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className={`text-4xl font-bold ${plan.popular ? 'text-[#F4F6F8]' : 'text-[#0B0E14]'}`}>${annual ? plan.annual : plan.monthly}</span>
                    <span className={`text-sm ${plan.popular ? 'text-[#8B95A5]' : 'text-[#8B95A5]'}`}>/mo</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-[#10B981] flex-shrink-0" /><span className={plan.popular ? 'text-[#F4F6F8]' : 'text-[#0B0E14]'}>{plan.leads} leads/mo</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-[#10B981] flex-shrink-0" /><span className={plan.popular ? 'text-[#F4F6F8]' : 'text-[#0B0E14]'}>{plan.integrations} integration{plan.integrations !== '1' ? 's' : ''}</span></li>
                    <li className="flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-[#10B981] flex-shrink-0" /><span className={plan.popular ? 'text-[#F4F6F8]' : 'text-[#0B0E14]'}>{plan.outreach ? 'Outreach sequences' : 'CSV export'}</span></li>
                    {plan.team && <li className="flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-[#10B981] flex-shrink-0" /><span className={plan.popular ? 'text-[#F4F6F8]' : 'text-[#0B0E14]'}>Team seats (3)</span></li>}
                    <li className="flex items-center gap-2 text-sm"><CheckCircle size={16} className="text-[#10B981] flex-shrink-0" /><span className={plan.popular ? 'text-[#F4F6F8]' : 'text-[#0B0E14]'}>{plan.support} support</span></li>
                  </ul>
                  <Link to="/login" className={`block text-center w-full py-3 rounded-xl font-semibold transition-all ${plan.popular ? 'bg-[#10B981] text-[#0B0E14] hover:brightness-110' : 'border border-[#E2E5EA] text-[#0B0E14] hover:bg-[#0B0E14] hover:text-[#F4F6F8]'}`}>
                    Get Started
                  </Link>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section ref={statsRef} className="py-24 bg-[#0B0E14]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[{ end: 500, suffix: '+', label: 'Cities Covered' }, { end: 40, suffix: '+', label: 'Industries' }, { end: 1000000, suffix: '+', label: 'Leads Found' }, { end: 49, suffix: '/5', label: 'User Rating', decimal: true }].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <div className="font-display font-bold text-4xl md:text-5xl text-[#10B981] mb-2">
                    {stat.decimal ? <>{Math.floor(statsInView ? (useCountUp(49, 1500, true) / 10) : 0)}<span className="text-2xl">/5</span></> : <Counter end={stat.end} suffix={stat.suffix} start={statsInView} />}
                  </div>
                  <p className="text-sm text-[#8B95A5]">{stat.label}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#F4F6F8]" id="faq">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          <FadeIn>
            <p className="text-xs font-medium text-[#10B981] uppercase tracking-[0.08em] mb-3 text-center">FAQ</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#0B0E14] mb-12 text-center">Frequently Asked Questions</h2>
          </FadeIn>
          {faqs.map((faq, i) => (
            <FAQItem key={i} question={faq.q} answer={faq.a} isOpen={openFAQ === i} onClick={() => toggleFAQ(i)} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0B0E14]">
        <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
          <FadeIn>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-[#F4F6F8] mb-4">Ready to Find Your Next Client?</h2>
            <p className="text-base text-[#8B95A5] mb-8 max-w-xl mx-auto">Join 500+ agencies using LeadSift to source high-intent local business leads without the manual grind.</p>
            <Link to="/login" className="inline-block px-8 py-4 bg-[#10B981] text-[#0B0E14] font-display font-bold text-base rounded-xl hover:brightness-110 transition-all">
              Start Free Trial — No Credit Card
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
