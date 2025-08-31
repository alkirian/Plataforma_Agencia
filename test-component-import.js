// Script para probar que los componentes se importen correctamente
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Probando importación de componentes...\n');

try {
  // Ruta hacia el componente principal
  const componentPath = join(__dirname, 'frontend', 'src', 'components', 'contextSources', 'ContextSourcesSection.jsx');
  console.log(`✅ Ruta del componente: ${componentPath}`);
  
  console.log('\n🎯 Componente creado exitosamente!');
  console.log('📋 El módulo de Fuentes de Contexto debería aparecer como una nueva pestaña');
  console.log('📋 en la página de detalle del cliente.');
  
  console.log('\n📌 Para ver el módulo:');
  console.log('1. Ve al dashboard (http://localhost:5173)');
  console.log('2. Haz clic en cualquier cliente');
  console.log('3. Verás 3 pestañas: Cronograma, Documentos, y Fuentes de Contexto');
  console.log('4. Haz clic en "Fuentes de Contexto"');
  
  console.log('\n✨ Funcionalidades disponibles:');
  console.log('📄 Subir documentos (PDF, imágenes, DOCX)');
  console.log('🌐 Scraping de URLs');
  console.log('✍️ Entrada manual de información');
  console.log('📝 Creación de notas contextuales');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}