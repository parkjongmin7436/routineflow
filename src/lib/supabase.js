import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 테이블 이름 상수
export const TABLES = {
  EVENTS: 'events',
  ROUTINES: 'routines',
  TODOS: 'todos',
  CATEGORIES: 'categories',
  EXERCISES: 'exercises',
  ANNIVERSARIES: 'anniversaries'
}
