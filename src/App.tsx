import { Routes, Route } from 'react-router'
import Layout from './components/Layout'
import DashboardLayout from './components/DashboardLayout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import LeadFinder from './pages/LeadFinder'
import Scoring from './pages/Scoring'
import Enrichment from './pages/Enrichment'
import Integrations from './pages/Integrations'
import Outreach from './pages/Outreach'
import Pipeline from './pages/Pipeline'
import Billing from './pages/Billing'
import SettingsPage from './pages/SettingsPage'

const Login = () => (
  <div className="min-h-screen flex items-center justify-center bg-dark">
    <div className="text-center">
      <h1 className="text-3xl font-bold text-white mb-2 font-display">LeadSift</h1>
      <p className="text-text-secondary mb-6">Sign in to your account</p>
      <div className="bg-card border border-border rounded-lg p-8 w-96">
        <input
          placeholder="Email"
          className="w-full mb-3 px-4 py-2 bg-dark border border-border rounded text-white placeholder:text-text-secondary"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-4 py-2 bg-dark border border-border rounded text-white placeholder:text-text-secondary"
        />
        <button className="w-full py-2 bg-accent text-dark font-semibold rounded hover:brightness-110 transition-all">
          Sign In
        </button>
      </div>
    </div>
  </div>
)

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/finder" element={<LeadFinder />} />
        <Route path="/scoring" element={<Scoring />} />
        <Route path="/enrichment" element={<Enrichment />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/pipeline" element={<Pipeline />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}
