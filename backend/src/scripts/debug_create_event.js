
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  try {
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

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase URL or Anon Key')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log('Logging in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test_automation@agency.com',
      password: 'password123'
    })

    if (authError) {
      console.error('Login failed:', authError)
      return
    }

    const token = authData.session.access_token
    
    const supabaseAuthenticated = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })

    // 1. Get a client
    const { data: clients, error: clientError } = await supabaseAuthenticated
        .from('clients')
        .select('id, name, agency_id')
        .limit(1)
        .order('created_at', { ascending: false });

    if (clientError || !clients.length) {
        console.error('No clients found or error:', clientError);
        return;
    }

    const client = clients[0];
    console.log(`Using client: ${client.name} (${client.id})`);

    // 2. Create Event
    const eventPayload = {
        client_id: client.id,
        // agency_id: client.agency_id, // REMOVED to test auto-fetch
        title: 'Reunión Auto-Fetch Agency',
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'Pendiente', // Capitalized ENUM
        channel: 'IG',
        copy: 'Discusión sobre Q1'
    };

    const { data: event, error: eventError } = await supabaseAuthenticated
        .from('schedule_items')
        .insert(eventPayload)
        .select()
        .single();

    if (eventError) {
        console.error('FAIL:', eventError.message);
    } else {
        console.log('SUCCESS: Event created. ID:', event.id);
    }

  } catch (err) {
    console.error('CRITICAL ERROR:', err)
  }
}

main()
