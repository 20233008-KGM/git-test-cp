import { createClient } from '@supabase/supabase-js'
const supabaseUrl = "https://exsboyynrmxtdyyyqkyy.supabase.co"
const supabasePublishableKey = "sb_publishable_X3Jdgr-8-dlozDpGuUSc1g_5vWyCVBW"
export const supabase = createClient(supabaseUrl, supabasePublishableKey)