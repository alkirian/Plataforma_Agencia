
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
    console.log('Logged in successfully. Token obtained.')

    // Get latest client
    const supabaseAuthenticated = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
      })

    const { data: clients, error: clientError } = await supabaseAuthenticated
        .from('clients')
        .select('id, name')
        .limit(1)
        .order('created_at', { ascending: false })

    if (clientError || !clients.length) {
        console.error('No clients found or error:', clientError)
        return
    }

    const client = clients[0]
    console.log(`\nUsing client: ${client.name} (${client.id})`)

    // Test the backend API endpoint
    console.log('\n=== Testing /api/v1/clients/{id}/schedule endpoint ===\n')
    
    const response = await fetch(`http://localhost:3001/api/v1/clients/${client.id}/schedule`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Response status:', response.status)
    const data = await response.json()
    console.log('Response body:', JSON.stringify(data, null, 2))

  } catch (err) {
    console.error('CRITICAL ERROR:', err)
  }
}

main()
