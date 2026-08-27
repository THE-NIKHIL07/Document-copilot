/** Single source of truth for environment config. */

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000') as string
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://gelkmoejuydwbsiroogb.supabase.co') as string
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_s1o-x7myE_Kgmbcf4QC-lA_2RySJsMR') as string

export const env = {
  apiBaseUrl,
  supabaseUrl,
  supabaseAnonKey,
} as const

