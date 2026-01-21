
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjddxzofnbpvqurwbugb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZGR4em9mbmJwdnF1cndidWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0OTM3NCwiZXhwIjoyMDcxNjI1Mzc0fQ.0FM6VCJVEeBYJa4rDBPY-8IcMVrGQ-OhIk428Q_8Rgs';

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
  'clients',
  'documents',
  'context_sources',
  'tasks',
  'agencies',
  'agency_members',
  'schedule_items',
  'profiles',
  'subscriptions',
  'news_posts'
];

async function checkTables() {
  console.log('Verificando tablas en:', supabaseUrl);
  const results = {};

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        if (error.code === '42P01') { // undefined_table
          results[table] = 'MISSING';
        } else {
          results[table] = `ERROR: ${error.message}`;
        }
      } else {
        results[table] = 'EXISTS';
      }
    } catch (e) {
      results[table] = `EXCEPTION: ${e.message}`;
    }
  }

  console.table(results);
}

checkTables();
