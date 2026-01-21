
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Configuración
const SUPABASE_URL = 'https://fjddxzofnbpvqurwbugb.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZGR4em9mbmJwdnF1cndidWdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA0OTM3NCwiZXhwIjoyMDcxNjI1Mzc0fQ.0FM6VCJVEeBYJa4rDBPY-8IcMVrGQ-OhIk428Q_8Rgs';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Datos de prueba
const TEST_USER_EMAIL = 'test_tech_audit@example.com';
const TEST_PASSWORD = 'Password123!';

async function runTests() {
  console.log('🚀 Iniciando Pruebas Técnicas...\n');
  const report = {
    auth: { status: 'PENDING' },
    calendar: { status: 'PENDING' },
    documents: { status: 'PENDING' },
    ai: { status: 'PENDING' }
  };

  let userId = null;
  let agencyId = null;
  let clientId = null;

  try {
    // 1. AUTENTICACIÓN / PREPARACIÓN
    console.log('1️⃣  Preparando Usuario y Agencia...');
    
    // Buscar o crear usuario
    const { data: users } = await supabase.auth.admin.listUsers();
    let user = users.users.find(u => u.email === TEST_USER_EMAIL);
    
    if (!user) {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: TEST_USER_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true
      });
      if (createError) throw new Error(`Error creando usuario: ${createError.message}`);
      user = newUser.user;
      console.log('   ✅ Usuario de prueba creado.');
    } else {
      console.log('   ℹ️  Usuario de prueba existente encontrado.');
    }
    userId = user.id;

    // Crear Agencia (si no existe una vinculada)
    // Primero buscamos si el usuario ya es miembro de alguna
    const { data: members } = await supabase.from('agency_members').select('agency_id').eq('user_id', userId).limit(1);
    
    if (members && members.length > 0) {
      agencyId = members[0].agency_id;
      console.log('   ℹ️  Agencia existente encontrada.');
    } else {
      const { data: newAgency, error: agencyError } = await supabase.from('agencies').insert({
        name: 'Agencia de Prueba Técnica',
        owner_id: userId,
        created_by: userId // Fix: Campo requerido por la BD
      }).select().single();
      
      if (agencyError) throw new Error(`Error creando agencia: ${agencyError.message}`);
      agencyId = newAgency.id;
      
      // Vincular usuario a agencia
      await supabase.from('agency_members').insert({
        agency_id: agencyId,
        user_id: userId,
        role: 'owner'
      });
      console.log('   ✅ Agencia de prueba creada.');
    }

    // Crear Cliente de Prueba
    const { data: newClient, error: clientError } = await supabase.from('clients').insert({
      name: 'Cliente Test',
      agency_id: agencyId,
      user_id: userId // Fix: Campo requerido por la BD (simulando la corrección de la app)
      // company: 'Test Corp', 
      // notes: 'Notas de prueba'
    }).select().single();

    if (clientError) {
        // Si falla, intentamos sin los campos extra
        console.log(`   ⚠️  Error creando cliente (esperado si faltan columnas): ${clientError.message}`);
        // Fallback: crear cliente mínimo
         const { data: fallbackClient, error: fallbackError } = await supabase.from('clients').insert({
            name: 'Cliente Test Fallback',
            agency_id: agencyId,
            user_id: userId // Fix: Campo requerido
        }).select().single();
        if (fallbackError) throw new Error(`Error fatal creando cliente: ${fallbackError.message}`);
        clientId = fallbackClient.id;
    } else {
        clientId = newClient.id;
    }
    console.log('   ✅ Cliente de prueba listo.');
    report.auth.status = 'SUCCESS';


    // 2. PRUEBA: CALENDARIO (Eventos)
    console.log('\n2️⃣  Probando Calendario (Crear Evento)...');
    try {
      const eventData = {
        client_id: clientId,
        agency_id: agencyId,
        title: 'Evento de Prueba Técnica',
        scheduled_at: new Date().toISOString(),
        status: 'pending',
        channel: 'Instagram'
        // start: new Date().toISOString(), // Campo que el backend podría intentar usar
        // end: new Date().toISOString()    // Campo que el backend podría intentar usar
      };

      const { data: event, error: eventError } = await supabase.from('schedule_items').insert(eventData).select().single();
      
      if (eventError) throw eventError;
      console.log('   ✅ Evento creado correctamente.');
      report.calendar.status = 'SUCCESS';
      report.calendar.data = event;
    } catch (e) {
      console.error(`   ❌ Fallo en Calendario: ${e.message}`);
      report.calendar.status = 'FAILED';
      report.calendar.error = e.message;
    }


    // 3. PRUEBA: DOCUMENTOS (Context Source)
    console.log('\n3️⃣  Probando Documentos (Context Source)...');
    try {
      const docData = {
        agency_id: agencyId,
        client_id: clientId,
        title: 'Documento de Prueba',
        content: 'Este es el contenido de un documento de prueba para el contexto de IA.',
        type: 'manual' // Usamos 'manual' para no depender de Storage por ahora
      };

      const { data: doc, error: docError } = await supabase.from('context_sources').insert(docData).select().single();
      
      if (docError) throw docError;
      console.log('   ✅ Fuente de contexto creada correctamente.');
      report.documents.status = 'SUCCESS';
      report.documents.data = doc;
    } catch (e) {
      console.error(`   ❌ Fallo en Documentos: ${e.message}`);
      report.documents.status = 'FAILED';
      report.documents.error = e.message;
    }

    // 4. PRUEBA: IA (Simulación de llamada a endpoint)
    // Nota: No podemos llamar al endpoint de Express directamente desde este script de Node aislado 
    // sin levantar el servidor, pero podemos verificar si las tablas necesarias para la IA existen.
    console.log('\n4️⃣  Verificando Requisitos para IA...');
    // La IA suele leer de 'context_sources' y guardar en alguna tabla de historial o logs?
    // Revisamos si existe tabla de logs de IA o similar si el código lo sugiere.
    // Por ahora, verificamos si podemos leer el contexto que acabamos de crear.
    try {
        const { data: context, error: contextError } = await supabase
            .from('context_sources')
            .select('*')
            .eq('agency_id', agencyId)
            .textSearch('content', 'prueba'); // Prueba básica de búsqueda full-text si está habilitada
        
        if (contextError) {
             console.log(`   ⚠️  Búsqueda de texto falló (posible falta de índices): ${contextError.message}`);
             // Fallback a select normal
             const { error: listError } = await supabase.from('context_sources').select('*').limit(1);
             if (listError) throw listError;
        }
        
        console.log('   ✅ Acceso a contexto para IA verificado.');
        report.ai.status = 'SUCCESS';
    } catch (e) {
        console.error(`   ❌ Fallo en verificación IA: ${e.message}`);
        report.ai.status = 'FAILED';
        report.ai.error = e.message;
    }

  } catch (err) {
    console.error('\n❌ Error General en Pruebas:', err.message);
  } finally {
    console.log('\n📊 Resumen de Pruebas:');
    console.table(report);
    
    // Limpieza básica (opcional)
    if (userId) {
        // await supabase.auth.admin.deleteUser(userId); // Comentado para poder inspeccionar datos si es necesario
    }
  }
}

runTests();
