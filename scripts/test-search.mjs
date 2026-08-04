import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://uynjrlkwhnswpksbqdfy.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Need a real jwt to call the edge function.
// Let's use service role key just to bypass, wait, Edge Functions check auth.getUser() which needs a valid JWT.
