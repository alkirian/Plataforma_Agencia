import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('FATAL ERROR: Supabase URL and Key must be defined in the .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
