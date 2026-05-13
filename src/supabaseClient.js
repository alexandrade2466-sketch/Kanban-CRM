import { createClient } from '@supabase/supabase-js'
import { createLocalSupabaseMarked } from './localSupabase'

const rawUrl = import.meta.env.VITE_SUPABASE_URL
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const url = rawUrl == null ? '' : String(rawUrl).trim()
const key = rawKey == null ? '' : String(rawKey).trim()
const forceLocal =
  import.meta.env.VITE_USE_LOCAL_DB === 'true' || import.meta.env.VITE_USE_LOCAL_DB === '1'

/** True when the app uses browser localStorage instead of Supabase. */
export const isLocalMode = forceLocal || !url || !key

export const supabase = isLocalMode ? createLocalSupabaseMarked() : createClient(url, key)
