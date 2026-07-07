import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Auth helpers
export const signUp = async (email: string, password: string, fullName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } }
  })
  return { data, error }
}

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export const signInWithOAuth = async (provider: 'google' | 'github') => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${window.location.origin}/dashboard` }
  })
  return { data, error }
}

export const signOut = async () => {
  await supabase.auth.signOut()
}

export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export const getUser = async () => {
  const { data, error } = await supabase.auth.getUser()
  return { user: data.user, error }
}

// ─── Profile API ───
export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { profile: null }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  return { profile: data, error }
}

export const updateProfile = async (updates: Record<string, unknown>) => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: new Error('Not authenticated') }
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single()
  return { profile: data, error }
}

// ─── Leads API ───
export const createLeadList = async (list: { name: string; city: string; niche: string; radius?: number }) => {
  const { data, error } = await supabase
    .from('lead_lists')
    .insert([list])
    .select()
    .single()
  return { data, error }
}

export const getLeadLists = async () => {
  const { data, error } = await supabase
    .from('lead_lists')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const getLeads = async (listId?: string) => {
  let query = supabase.from('leads').select('*').order('score', { ascending: false })
  if (listId) query = query.eq('list_id', listId)
  const { data, error } = await query
  return { data, error }
}

export const saveLead = async (lead: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from('leads')
    .insert([lead])
    .select()
    .single()
  return { data, error }
}

export const updateLead = async (id: string, updates: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

// ─── Integrations API ───
export const getIntegrations = async () => {
  const { data, error } = await supabase
    .from('integrations')
    .select('*')
    .order('created_at', { ascending: false })
  return { data, error }
}

export const toggleIntegration = async (provider: string, isConnected: boolean, settings?: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from('integrations')
    .upsert([{ provider, is_connected: isConnected, settings }], { onConflict: 'user_id,provider' })
    .select()
    .single()
  return { data, error }
}

// ─── Activity Log ───
export const logActivity = async (action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) => {
  await supabase.from('activity_log').insert([{ action, entity_type: entityType, entity_id: entityId, metadata }])
}

export const getActivityLog = async (limit = 20) => {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
}
