
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjddxzofnbpvqurwbugb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZGR4em9mbmJwdnF1cndidWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0OTM3NCwiZXhwIjoyMDcxNjI1Mzc0fQ.0FM6VCJVEeBYJa4rDBPY-8IcMVrGQ-OhIk428Q_8Rgs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyColumn() {
  console.log('Verificando columna agency_id en tabla clients...');
  
  try {
    // Intentamos seleccionar SOLO la columna agency_id
    const { data, error } = await supabase
      .from('clients')
      .select('agency_id')
      .limit(1);

    if (error) {
      console.error('❌ Error al seleccionar agency_id:', error.message);
      console.error('Código de error:', error.code);
      if (error.message.includes('does not exist')) {
        console.log('CONCLUSIÓN: La columna agency_id NO existe.');
      }
    } else {
      console.log('✅ ÉXITO: La consulta select("agency_id") funcionó correctamente.');
      console.log('Data recibida:', data);
      console.log('CONCLUSIÓN: La columna agency_id SÍ existe.');
    }
  } catch (e) {
    console.error('Excepción:', e);
  }
}

verifyColumn();
