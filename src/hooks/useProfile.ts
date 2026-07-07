import { useState, useEffect } from 'react'
import { supabase, getProfile, updateProfile } from '@/lib/supabase'

export interface Profile {
  id: string
  email: string
  full_name?: string
  company_name?: string
  phone?: string
  avatar_url?: string
  plan: 'starter' | 'growth' | 'agency'
  plan_status: string
  leads_used_monthly: number
  monthly_lead_limit: number
  created_at: string
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile().then(({ profile, error }) => {
      if (profile) setProfile(profile as unknown as Profile)
      setLoading(false)
    })
  }, [])

  const update = async (updates: Partial<Profile>) => {
    const { profile: updated } = await updateProfile(updates as Record<string, unknown>)
    if (updated) setProfile(updated as unknown as Profile)
    return updated
  }

  return { profile, loading, update }
}
