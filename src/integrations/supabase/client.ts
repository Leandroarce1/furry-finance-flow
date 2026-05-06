import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://drukcihyysdriwweewgo.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRydWtjaWh5eXNkcml3d2Vld2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwOTE5NjcsImV4cCI6MjA5MzY2Nzk2N30.s5GLVKic-JeHBGIiyCaFF_OTDYyzwo3AxzJWOKiD3T0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
