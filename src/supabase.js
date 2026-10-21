import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://maufzxklswpcyjarfqqf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hdWZ6eGtsc3dwY3lqYXJmcXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MDEwNzYsImV4cCI6MjEwODE3NzA3Nn0.EUHVIa63r3sCyuY92A_ii6fr-jgkGEf5VPrr2fxxLdI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)