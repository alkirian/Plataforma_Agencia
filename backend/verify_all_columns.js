
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjddxzofnbpvqurwbugb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZGR4em9mbmJwdnF1cndidWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0OTM3NCwiZXhwIjoyMDcxNjI1Mzc0fQ.0FM6VCJVEeBYJa4rDBPY-8IcMVrGQ-OhIk428Q_8Rgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAllColumns() {
  console.log('Verificando columnas adicionales...');
  
  const checks = [
    { table: 'clients', column: 'company' },
    { table: 'clients', column: 'notes' },
    { table: 'clients', column: 'avatar_url' },
    { table: 'schedule_items', column: 'scheduled_at' },
    { table: 'schedule_items', column: 'start' }, // Checking if this exists (backend logic uses it in logs?)
    { table: 'schedule_items', column: 'end' }    // Checking if this exists
  ];

  for (const check of checks) {
    try {
      const { error } = await supabase
        .from(check.table)
        .select(check.column)
        .limit(1);

      if (error) {
        console.log(`❌ ${check.table}.${check.column}: NO EXISTE (${error.message})`);
      } else {
        console.log(`✅ ${check.table}.${check.column}: EXISTE`);
      }
    } catch (e) {
      console.log(`⚠️ ${check.table}.${check.column}: ERROR EXCEPCIÓN`);
    }
  }
}

verifyAllColumns();
