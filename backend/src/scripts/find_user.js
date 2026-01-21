import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Try multiple paths for .env
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

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findUser() {
  console.log('Searching for users...')
  
  // 1. Search in profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(1)

  if (profiles && profiles.length > 0) {
    console.log('Found Profile:', JSON.stringify(profiles[0]))
    fs.writeFileSync('found_user.json', JSON.stringify(profiles[0], null, 2))
    return
  }

  console.log('No profiles found. Checking agencies...')
  
  // 2. Check agencies (needed to create a profile)
  const { data: agencies, error: agencyError } = await supabase
    .from('agencies')
    .select('*')
    .limit(1)
    
  if (agencyError) console.error('Agency error:', agencyError)
  
  if (!agencies || agencies.length === 0) {
      console.log('No agencies found. Creating one...')
      // Create agency logic would go here, but let's just log for now
      console.log('ABORT: No agencies found to link user to.')
      return
  }
  
  console.log('Found Agency:', agencies[0])
  const agencyId = agencies[0].id

  // 3. Create Auth User
  console.log('Creating new user...')
  const email = `test_generated_${Date.now()}@example.com`
  const password = 'password123'
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  
  if (authError) {
      console.error('Auth create error:', authError)
      return
  }
  
  const userId = authData.user.id
  console.log('Created Auth User:', userId)

  // 4. Create Profile
  console.log('Creating profile...')
  const { data: profileData, error: createProfileError } = await supabase
    .from('profiles')
    .insert([{
        id: userId,
        agency_id: agencyId,
        role: 'admin',
        email: email,
        name: 'Test Owner'
    }])
    .select()
    .single()
    
  if (createProfileError) {
      console.error('Profile create error:', createProfileError)
  } else {
      console.log('Created Profile:', profileData)
      fs.writeFileSync('found_user.json', JSON.stringify(profileData, null, 2))
  }
}

findUser()
