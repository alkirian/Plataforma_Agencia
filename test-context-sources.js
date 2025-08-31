// Script de prueba para las APIs de fuentes de contexto
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api/v1/context-sources';
const TEST_CLIENT_ID = '123e4567-e89b-12d3-a456-426614174000'; // UUID de prueba
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'; // Token de prueba

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TEST_TOKEN}`,
};

// Función helper para hacer requests
async function makeRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers,
      ...options
    });
    
    const data = await response.json();
    console.log(`\n🔹 ${options.method || 'GET'} ${endpoint}`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    return { response, data };
  } catch (error) {
    console.error(`❌ Error en ${endpoint}:`, error.message);
  }
}

// Pruebas de las APIs
async function testAPIs() {
  console.log('🧪 Iniciando pruebas de APIs de Fuentes de Contexto\n');
  
  // 1. Probar GET de fuentes (debería estar vacío inicialmente)
  await makeRequest(`/${TEST_CLIENT_ID}`);
  
  // 2. Probar creación de fuente manual
  await makeRequest(`/${TEST_CLIENT_ID}/manual`, {
    method: 'POST',
    body: JSON.stringify({
      title: 'Información de la empresa',
      content: 'Esta empresa se especializa en servicios de consultoría tecnológica. Fundada en 2020, tiene oficinas en Madrid y Barcelona.',
      tags: ['empresa', 'consultoría', 'tecnología']
    })
  });
  
  // 3. Probar creación de fuente de nota
  await makeRequest(`/${TEST_CLIENT_ID}/note`, {
    method: 'POST', 
    body: JSON.stringify({
      title: 'Nota importante',
      content: 'El cliente prefiere comunicación por email y reuniones los martes.',
      category: 'preferencias'
    })
  });
  
  // 4. Probar creación de fuente URL
  await makeRequest(`/${TEST_CLIENT_ID}/url`, {
    method: 'POST',
    body: JSON.stringify({
      url: 'https://example.com',
      title: 'Página de ejemplo'
    })
  });
  
  // 5. Volver a listar fuentes (debería mostrar las creadas)
  await makeRequest(`/${TEST_CLIENT_ID}`);
  
  // 6. Probar estadísticas
  await makeRequest(`/${TEST_CLIENT_ID}/stats`);
  
  console.log('\n✅ Pruebas completadas');
}

// Ejecutar pruebas
testAPIs().catch(console.error);