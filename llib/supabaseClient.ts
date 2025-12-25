import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://colqvicukkqtiwxqdfri.supabase.co';
const supabaseKey = 'sb_publishable_mNlmpHa-avmbeMi5g5l4yQ_7crPZbAp';

export const supabase = createClient(supabaseUrl, supabaseKey);
