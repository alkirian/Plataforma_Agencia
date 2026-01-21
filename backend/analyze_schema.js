
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjddxzofnbpvqurwbugb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZGR4em9mbmJwdnF1cndidWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0OTM3NCwiZXhwIjoyMDcxNjI1Mzc0fQ.0FM6VCJVEeBYJa4rDBPY-8IcMVrGQ-OhIk428Q_8Rgs';

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  'clients',
  'documents',
  'tasks',
  'schedule_items',
  'agencies'
];

async function analyzeSchema() {
  console.log('Analizando esquema en:', supabaseUrl);
  const schema = {};

  for (const table of tables) {
    // Hack: Supabase JS client doesn't give easy access to information_schema via standard methods
    // unless we use rpc or have direct SQL access.
    // But we can infer columns by selecting one row (if it exists) or we can try to use the
    // 'rpc' if there is a function, but we don't know of one.
    //
    // ALTERNATIVE: We can use the REST API to query the OpenAPI spec!
    // Supabase exposes an OpenAPI spec at /rest/v1/?apikey=...
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseKey}`);
      const spec = await response.json();
      
      if (spec.definitions && spec.definitions[table]) {
        schema[table] = Object.keys(spec.definitions[table].properties);
      } else {
        schema[table] = 'DEFINITION NOT FOUND IN OPENAPI';
      }
    } catch (e) {
      schema[table] = `ERROR: ${e.message}`;
    }
  }

  console.log(JSON.stringify(schema, null, 2));
}

analyzeSchema();
