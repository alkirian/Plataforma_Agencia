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
    const user = authData.user
    
    const supabaseAuthenticated = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
    
    const { data: profile } = await supabaseAuthenticated
      .from('profiles')
      .select('agency_id')
      .single()
      
    console.log('Testing Insert with NULL industry...')
    const payload = {
      name: 'Empresa Test Payload',
      industry: null,
      email: undefined, // Supabase ignores undefined keys, effectively not sending them
      agency_id: profile.agency_id,
      user_id: user.id
    }

    const { data, error } = await supabaseAuthenticated
      .from('clients')
      .insert(payload)
      .select()

    if (error) {
      console.error('INSERT ERROR:', JSON.stringify(error, null, 2))
    } else {
      console.log('SUCCESS:', data)
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err)
  }
}

main()
