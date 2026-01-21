
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Robust env loading
const envPaths = [
  path.join(__dirname, '../../.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '../.env')
]

let loaded = false
for (const p of envPaths) {
  if (fs.existsSync(p)) {
    console.log(`Loading .env from ${p}`)
    dotenv.config({ path: p })
    loaded = true
    break
  }
}

if (!loaded) console.warn('No .env file found!')

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkClient() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'test_automation@agency.com',
    password: 'password123'
  });

  if (authError) {
    console.error('Login failed:', authError);
    return;
  }

  const token = authData.session.access_token;
  // Get the most recent client ID from the list I just saw in browser
  // Hardcoding the one from the URL I saw in browser logs: 94a57779-6464-4fa5-b96b-a545792d5cb1
  const clientId = '94a57779-6464-4fa5-b96b-a545792d5cb1'; 

  console.log(`Fetching client ${clientId} from backend API...`);
  
  try {
    const response = await fetch(`http://localhost:3001/api/v1/clients/${clientId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Status:', response.status);
    const body = await response.text();
    console.log('Body:', body);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

checkClient();
