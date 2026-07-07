import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) { el.scrollIntoView({ behavior: 'smooth' }); setMobileOpen(false) }
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${scrolled ? 'bg-[rgba(11,14,20,0.92)] backdrop-blur-xl border-b border-[#1E2530]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-display font-bold text-xl text-[#F4F6F8]">LeadSift</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {[{ label: 'Features', id: 'features' }, { label: 'Pricing', id: 'pricing' }, { label: 'FAQ', id: 'faq' }].map((item) => (
            <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-sm font-medium text-[#8B95A5] hover:text-[#F4F6F8] transition-colors relative group">
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#10B981] transition-all group-hover:w-full" />
            </button>
          ))}
        </div>
        <div className="hidden md:flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-[#8B95A5] hover:text-[#F4F6F8] transition-colors">Sign in</Link>
          <Link to="/login" className="px-5 py-2.5 bg-[#10B981] text-[#0B0E14] font-display font-semibold text-sm rounded-lg hover:brightness-110 transition-all">Get Started</Link>
        </div>
        <button className="md:hidden text-[#F4F6F8]" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-[rgba(11,14,20,0.98)] backdrop-blur-xl border-b border-[#1E2530]">
            <div className="px-6 py-4 flex flex-col gap-4">
              {[{ label: 'Features', id: 'features' }, { label: 'Pricing', id: 'pricing' }, { label: 'FAQ', id: 'faq' }].map((item) => (
                <button key={item.id} onClick={() => scrollToSection(item.id)} className="text-left text-sm font-medium text-[#8B95A5] hover:text-[#F4F6F8] py-2">{item.label}</button>
              ))}
              <div className="flex flex-col gap-3 pt-2 border-t border-[#1E2530]">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-[#8B95A5] hover:text-[#F4F6F8] py-2">Sign in</Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="text-center px-5 py-2.5 bg-[#10B981] text-[#0B0E14] font-display font-semibold text-sm rounded-lg">Get Started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
