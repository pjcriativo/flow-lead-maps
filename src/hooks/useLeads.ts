import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Lead {
  id: string
  business_name: string
  address?: string
  city?: string
  state?: string
  phone?: string
  email?: string
  website?: string
  category?: string
  rating?: number
  review_count?: number
  score: number
  status: string
  has_website?: boolean
  has_photos?: boolean
  has_hours?: boolean
  notes?: string
  created_at: string
}

export function useLeads(listId?: string) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .order('score', { ascending: false })
      if (listId) query = query.eq('list_id', listId)
      const { data, error } = await query
      if (error) throw error
      setLeads(data || [])
    } catch (e: any) {
      // If table doesn't exist yet, use empty array
      setLeads([])
    }
    setLoading(false)
  }, [listId])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const searchLeads = useCallback((query: string) => {
    if (!query.trim()) return leads
    const q = query.toLowerCase()
    return leads.filter(l =>
      l.business_name?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q) ||
      l.category?.toLowerCase().includes(q)
    )
  }, [leads])

  return { leads, loading, error, refresh: fetchLeads, searchLeads }
}
