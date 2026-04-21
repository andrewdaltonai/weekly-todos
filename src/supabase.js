import { createClient } from '@supabase/supabase-js'

// 🔑 Paste your Supabase Project URL and anon key here
const SUPABASE_URL = 'https://deqcbzcvlrpbbazrjrzn.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlcWNiemN2bHJwYmJhenJqcnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3NTc2MzMsImV4cCI6MjA5MjMzMzYzM30.5XhR8a4eEwZnsVKRxMgnje4TF6NIKu7LABE2HQQbR9A'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
