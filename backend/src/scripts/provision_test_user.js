import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envPaths = [
  path.join(__dirname, '../../.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '../.env')
]

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p })
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

const TEST_EMAIL = 'test_automation@agency.com'
const TEST_PASSWORD = 'password123'

async function provisionUser() {
  console.log('Provisioning test user...')
  
  // 1. Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError
  
  let user = users.find(u => u.email === TEST_EMAIL)
  let userId

  if (user) {
    console.log('User exists.')
    userId = user.id
    // Update password to ensure it matches
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: TEST_PASSWORD })
    if (updateError) console.error('Error resetting password:', updateError)
    else console.log('Password reset to default.')
  } else {
    console.log('Creating new user...')
    const { data, error: createError } = await supabase.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true
    })
    if (createError) throw createError
    user = data.user
    userId = user.id
    console.log('User created.')
  }

  // 2. Ensure Profile Exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (!profile) {
    console.log('Profile missing. Finding agency...')
    const { data: agencies } = await supabase.from('agencies').select('id').limit(1)
    if (!agencies || agencies.length === 0) {
        console.error('No agencies found! Cannot create profile.')
        return
    }
    const agencyId = agencies[0].id
    
    console.log('Creating profile...')
    const { error: insertError } = await supabase.from('profiles').insert([{
        id: userId,
        agency_id: agencyId,
        role: 'admin',
        email: TEST_EMAIL,
        name: 'Test Automation'
    }])
    if (insertError) console.error('Error creating profile:', insertError)
    else console.log('Profile created.')
  } else {
      console.log('Profile exists.')
  }

  // 3. Write credentials
  const creds = { email: TEST_EMAIL, password: TEST_PASSWORD }
  fs.writeFileSync('credentials.json', JSON.stringify(creds, null, 2))
  console.log('Credentials saved to credentials.json')
}

provisionUser().catch(console.error)
