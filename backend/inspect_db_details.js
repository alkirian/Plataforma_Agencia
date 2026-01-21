
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspect() {
  console.log('🔍 Inspecting Database Details...');

  // 1. Inspect Enum 'item_status'
  // Note: We can't easily query pg_enum via Supabase JS client directly without RPC or raw SQL if not exposed.
  // But we can try to insert a dummy value and see the error message which often lists valid values, 
  // OR we can try to fetch the introspection schema if possible. 
  // A simpler way with the JS client is to use the rpc call if we had one, but we don't.
  // However, we can try to guess or just look at the error message we got: "invalid input value for enum item_status: "pending""
  // Let's try to insert a row with a known wrong value to trigger the error message again, maybe it lists valid ones?
  // Actually, the best way is to check the types definition in frontend/src/types/supabase.types.ts if it was generated from DB.
  // But let's try to query the postgres types via a direct SQL query if we can? No, we can't run raw SQL easily.
  
  // Alternative: Try to fetch one existing row from schedule_items and see what status it has.
  const { data: existingItems, error: fetchError } = await supabase
    .from('schedule_items')
    .select('status')
    .limit(5);

  if (fetchError) {
    console.log('❌ Error fetching schedule_items:', fetchError.message);
  } else {
    console.log('✅ Existing schedule_items statuses:', existingItems.map(i => i.status));
  }

  // 2. Inspect 'context_sources' columns
  // We can just select * from it with limit 0 to get the structure, or look at the error.
  // The error was "Could not find the 'content' column".
  const { data: contextData, error: contextError } = await supabase
    .from('context_sources')
    .select('*')
    .limit(1);

  if (contextError) {
    console.log('❌ Error inspecting context_sources:', contextError.message);
  } else if (contextData.length > 0) {
    console.log('✅ context_sources columns:', Object.keys(contextData[0]));
  } else {
    console.log('⚠️ context_sources is empty, cannot infer columns from data. Trying to insert dummy to see valid columns error?');
    // Attempt insert to see if it complains about missing columns or we can infer something.
    // Actually, if we select '*' and get empty array, we don't get keys.
    // Let's try to select a specific column we know exists, like 'id', and see if it works.
  }
  
  // Let's try to "discover" columns by trying to select them.
  const potentialColumns = ['id', 'content', 'type', 'metadata', 'created_at', 'name', 'url'];
  const { data: colCheck, error: colError } = await supabase
    .from('context_sources')
    .select(potentialColumns.join(','))
    .limit(1);
    
   if (colError) {
       console.log('❌ Column check error:', colError.message);
   }

}

inspect();
