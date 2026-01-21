import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load .env like debug_create_event.js
const possibleEnvPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env')
]

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    console.log('Loading .env from', envPath)
    dotenv.config({ path: envPath })
    break
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  console.log('\n=== Checking schedule_items table ===\n')

  const { data, error } = await supabase
    .from('schedule_items')
    .select('id, client_id, title, scheduled_at, status, channel, agency_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (!data || data.length === 0) {
    console.log('No events found in the database.')
    return
  }

  console.log(`Found ${data.length} events:\n`)
  data.forEach((event, i) => {
    console.log(`${i + 1}. "${event.title}"`)
    console.log(`   Client ID: ${event.client_id}`)
    console.log(`   Agency ID: ${event.agency_id}`)
    console.log(`   Scheduled: ${event.scheduled_at}`)
    console.log(`   Status: ${event.status}`)
    console.log(`   Channel: ${event.channel}`)
    console.log('')
  })
}

main()
