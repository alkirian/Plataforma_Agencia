#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Script para migrar console.logs a sistema de logging profesional
 * Automatiza la limpieza masiva manteniendo funcionalidad
 * 
 * Console.log permitido aquí porque es un script de línea de comandos
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Configuración del script
const config = {
  srcDir: path.join(__dirname, '../src'),
  extensions: ['*.js', '*.jsx'],
  dryRun: process.argv.includes('--dry-run'),
  backup: true
};

// Patrones de reemplazo inteligente
const replacementPatterns = [
  // Errores críticos
  {
    pattern: /console\.error\(\s*(['"`])(.*?)\1\s*,?\s*(.*?)\)/g,
    replacement: "logger.error('$2', $3)",
    import: true,
    description: 'Error crítico'
  },
  
  // Warnings importantes
  {
    pattern: /console\.warn\(\s*(['"`])(.*?)\1\s*,?\s*(.*?)\)/g,
    replacement: "logger.warn('$2', $3)",
    import: true,
    description: 'Warning importante'
  },
  
  // Info general (solo desarrollo)
  {
    pattern: /console\.info\(\s*(['"`])(.*?)\1\s*,?\s*(.*?)\)/g,
    replacement: "logger.info('$2', $3)",
    import: true,
    description: 'Información general'
  },
  
  // Debug/log general
  {
    pattern: /console\.log\(\s*(['"`])(.*?)\1\s*,?\s*(.*?)\)/g,
    replacement: "logger.debug('$2', $3)",
    import: true,
    description: 'Debug general'
  },
  
  // Console.log con solo string
  {
    pattern: /console\.log\(\s*(['"`])(.*?)\1\s*\)/g,
    replacement: "logger.debug('$2')",
    import: true,
    description: 'Debug simple'
  },
  
  // Debug avanzado con objetos
  {
    pattern: /console\.log\(\s*(['"`])(.*?)\1\s*,\s*(\{.*?\})\)/g,
    replacement: "logger.debug('$2', $3)",
    import: true,
    description: 'Debug con contexto'
  },
  
  // Console.table para datos estructurados
  {
    pattern: /console\.table\((.*?)\)/g,
    replacement: "logger.table($1)",
    import: true,
    description: 'Tabla de datos'
  },
  
  // Console.group
  {
    pattern: /console\.group\(\s*(['"`])(.*?)\1\s*\)/g,
    replacement: "logger.group('$2', () => {",
    import: true,
    description: 'Grupo de logs'
  },
  
  // Console.time para performance
  {
    pattern: /console\.time\(\s*(['"`])(.*?)\1\s*\)/g,
    replacement: "logger.time('$2')",
    import: true,
    description: 'Timing'
  },
  
  {
    pattern: /console\.timeEnd\(\s*(['"`])(.*?)\1\s*\)/g,
    replacement: "logger.timeEnd('$2')",
    import: true,
    description: 'End timing'
  }
];

// Patrones especiales por contexto
const contextualReplacements = {
  // Archivos de autenticación
  'auth': {
    pattern: /console\.(log|debug|info)\(/g,
    replacement: 'authLogger.debug(',
    import: 'authLogger'
  },
  
  // Archivos de documentos
  'document': {
    pattern: /console\.(log|debug|info)\(/g,
    replacement: 'documentsLogger.debug(',
    import: 'documentsLogger'
  },
  
  // Archivos de calendario
  'calendar|schedule': {
    pattern: /console\.(log|debug|info)\(/g,
    replacement: 'calendarLogger.debug(',
    import: 'calendarLogger'
  },
  
  // APIs
  'api': {
    pattern: /console\.(log|debug|info)\(/g,
    replacement: 'apiLogger.request(',
    import: 'apiLogger'
  }
};

/**
 * Encuentra archivos que necesitan migración
 */
async function findFilesWithConsoleLogs() {
  const patterns = config.extensions.map(ext => 
    path.join(config.srcDir, '**', ext)
  );
  
  const files = [];
  for (const pattern of patterns) {
    const matches = await glob(pattern);
    files.push(...matches);
  }
  
  const filesWithLogs = [];
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('console.')) {
      const logCount = (content.match(/console\./g) || []).length;
      filesWithLogs.push({ file, logCount });
    }
  }
  
  return filesWithLogs;
}

/**
 * Crea backup de un archivo
 */
function createBackup(filePath) {
  if (!config.backup) return;
  
  const backupPath = filePath + '.backup';
  fs.copyFileSync(filePath, backupPath);
  console.log(`✓ Backup creado: ${backupPath}`);
}

/**
 * Determina el contexto del archivo para usar logger específico
 */
function getFileContext(filePath) {
  const fileName = path.basename(filePath).toLowerCase();
  const dirName = path.dirname(filePath).toLowerCase();
  
  for (const [context, config] of Object.entries(contextualReplacements)) {
    if (fileName.includes(context) || dirName.includes(context)) {
      return { context, ...config };
    }
  }
  
  return null;
}

/**
 * Agrega import de logger al archivo si no existe
 */
function ensureLoggerImport(content, loggerType = 'logger') {
  const imports = {
    'logger': "import { logger } from '../utils/logger';",
    'authLogger': "import { authLogger } from '../utils/logger';",
    'documentsLogger': "import { documentsLogger } from '../utils/logger';",
    'calendarLogger': "import { calendarLogger } from '../utils/logger';",
    'apiLogger': "import { apiLogger } from '../utils/logger';"
  };
  
  const importStatement = imports[loggerType] || imports.logger;
  
  // Si ya tiene el import, no hacer nada
  if (content.includes(importStatement) || content.includes(`import ${loggerType}`)) {
    return content;
  }
  
  // Encontrar dónde insertar el import
  const lines = content.split('\n');
  let insertIndex = 0;
  
  // Buscar después de otros imports
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      insertIndex = i + 1;
    } else if (lines[i].trim() === '' && insertIndex > 0) {
      insertIndex = i;
      break;
    } else if (!lines[i].startsWith('import ') && !lines[i].startsWith('//') && lines[i].trim() !== '') {
      break;
    }
  }
  
  lines.splice(insertIndex, 0, importStatement);
  return lines.join('\n');
}

/**
 * Migra console.logs en un archivo
 */
function migrateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Detectar contexto específico
  const contextConfig = getFileContext(filePath);
  let replacementCount = 0;
  let loggerType = 'logger';
  
  // Aplicar reemplazos contextuales si aplica
  if (contextConfig) {
    content = content.replace(contextConfig.pattern, contextConfig.replacement);
    loggerType = contextConfig.import;
    replacementCount += (originalContent.match(contextConfig.pattern) || []).length;
  }
  
  // Aplicar patrones generales
  for (const pattern of replacementPatterns) {
    const matches = content.match(pattern.pattern) || [];
    if (matches.length > 0) {
      content = content.replace(pattern.pattern, pattern.replacement);
      replacementCount += matches.length;
      
      if (pattern.import) {
        loggerType = 'logger';
      }
    }
  }
  
  // Agregar import si hubo cambios
  if (replacementCount > 0) {
    content = ensureLoggerImport(content, loggerType);
  }
  
  return {
    content,
    changed: content !== originalContent,
    replacementCount
  };
}

/**
 * Función principal
 */
async function main() {
  console.log('🔍 Buscando archivos con console.logs...');
  
  const filesWithLogs = await findFilesWithConsoleLogs();
  
  if (filesWithLogs.length === 0) {
    console.log('✅ No se encontraron archivos con console.logs');
    return;
  }
  
  console.log(`📁 Encontrados ${filesWithLogs.length} archivos con console.logs:`);
  filesWithLogs.forEach(({ file, logCount }) => {
    console.log(`   - ${path.relative(config.srcDir, file)}: ${logCount} logs`);
  });
  
  if (config.dryRun) {
    console.log('\n🧪 Modo dry-run activado. No se modificarán archivos.');
    return;
  }
  
  console.log('\n🔧 Iniciando migración...');
  
  let totalFiles = 0;
  let totalReplacements = 0;
  
  for (const { file } of filesWithLogs) {
    try {
      // Crear backup
      createBackup(file);
      
      // Migrar archivo
      const result = migrateFile(file);
      
      if (result.changed) {
        fs.writeFileSync(file, result.content, 'utf8');
        console.log(`✅ ${path.relative(config.srcDir, file)}: ${result.replacementCount} reemplazos`);
        totalFiles++;
        totalReplacements += result.replacementCount;
      } else {
        console.log(`ℹ️  ${path.relative(config.srcDir, file)}: sin cambios`);
      }
      
    } catch (error) {
      console.error(`❌ Error procesando ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Migración completada:`);
  console.log(`   - Archivos modificados: ${totalFiles}`);
  console.log(`   - Console.logs migrados: ${totalReplacements}`);
  console.log(`   - Sistema de logging profesional implementado`);
  
  if (config.backup) {
    console.log(`\n💾 Backups creados con extensión .backup`);
    console.log(`   Puedes eliminarlos después de validar los cambios`);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, findFilesWithConsoleLogs, migrateFile };