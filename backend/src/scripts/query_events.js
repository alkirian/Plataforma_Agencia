
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

    // Query all events
    console.log('\n=== Querying schedule_items ===\n')
    const { data: events, error: eventsError } = await supabaseAuthenticated
        .from('schedule_items')
        .select('id, client_id, title, scheduled_at, status, channel, agency_id')
        .order('created_at', { ascending: false })
        .limit(10)

    if (eventsError) {
        console.error('Error querying events:', eventsError.message)
        return
    }

    if (!events || events.length === 0) {
        console.log('No events found in schedule_items table.')
        return
    }

    console.log(`Found ${events.length} events:\n`)
    events.forEach((e, i) => {
        console.log(`${i+1}. "${e.title}"`)
        console.log(`   ID: ${e.id}`)
        console.log(`   Client: ${e.client_id}`)
        console.log(`   Agency: ${e.agency_id}`)
        console.log(`   Date: ${e.scheduled_at}`)
        console.log(`   Status: ${e.status}`)
        console.log(`   Channel: ${e.channel}`)
        console.log('')
    })

  } catch (err) {
    console.error('CRITICAL ERROR:', err)
  }
}

main()
