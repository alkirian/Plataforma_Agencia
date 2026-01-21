
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listClients() {
  const { data, error } = await supabase.from('clients')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching clients:', error);
  } else {
    console.log('Clients:', JSON.stringify(data, null, 2));
  }
}

listClients();
