const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load .env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvents() {
  console.log('Checking schedule_items table...\n');

  const { data, error } = await supabase
    .from('schedule_items')
    .select('id, client_id, title, scheduled_at, status, channel, agency_id, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No events found in the database.');
    return;
  }

  console.log(`Found ${data.length} events:\n`);
  data.forEach((event, i) => {
    console.log(`${i + 1}. "${event.title}"`);
    console.log(`   Client ID: ${event.client_id}`);
    console.log(`   Agency ID: ${event.agency_id}`);
    console.log(`   Scheduled: ${event.scheduled_at}`);
    console.log(`   Status: ${event.status}`);
    console.log(`   Channel: ${event.channel}`);
    console.log(`   Created: ${event.created_at}`);
    console.log('');
  });
}

checkEvents();
