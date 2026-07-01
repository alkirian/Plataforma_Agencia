import 'dotenv/config';
import { adaptPostFormat } from './src/services/adapt.service.js';

// Usamos una URL pública de Unsplash para verificar la descarga e integración sin depender de la DB en local
const testImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop';
const targetRatio = '9:16';

const brandContext = {
  clientId: 'test-client-id',
  name: 'Antigravity Studio',
  industry: 'Software and AI Agency'
};

const runTest = async () => {
  console.log('🧪 [TEST] Iniciando prueba de adaptPostFormat...');
  try {
    const result = await adaptPostFormat(testImageUrl, targetRatio, brandContext);
    console.log('🎉 [TEST] ¡Flujo de adaptación completado exitosamente!');
    console.log('Metadatos devueltos:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ [TEST] Error al ejecutar la prueba:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
};

runTest();
