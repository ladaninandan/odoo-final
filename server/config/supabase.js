import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

if (supabaseUrl && supabaseKey) {
    console.log(`Supabase Connected: ${new URL(supabaseUrl).hostname}`);
} else {
    console.error('Supabase configuration is missing in .env!');
}

export default supabase;
