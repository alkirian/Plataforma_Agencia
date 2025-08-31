#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const frontendSrc = path.join(__dirname, 'frontend/src');

// Patrones de reemplazo para diferentes ubicaciones
const fixes = [
  {
    // Archivos en src/ root level que importan de utils/
    pattern: /import logger from '\.\/utils\/logger'/g,
    replacement: "import { logger } from './utils/logger'"
  },
  {
    // Archivos en subcarpetas que importan con ../utils/logger
    pattern: /import logger from '\.\.\/utils\/logger'/g,
    replacement: "import { logger } from '../utils/logger'"
  },
  {
    // Archivos en subcarpetas anidadas que importan con ../../utils/logger
    pattern: /import logger from '\.\.\/\.\.\/utils\/logger'/g,
    replacement: "import { logger } from '../../utils/logger'"
  }
];

async function fixLoggerImports() {
  console.log('🔧 Fixing logger imports...');
  
  // Buscar todos los archivos JS/JSX en frontend/src
  const files = await glob('**/*.{js,jsx}', { 
    cwd: frontendSrc,
    ignore: ['node_modules/**', 'dist/**', 'build/**']
  });
  
  let fixedFiles = 0;
  
  for (const file of files) {
    const filePath = path.join(frontendSrc, file);
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileChanged = false;
    
    // Aplicar todas las correcciones
    for (const fix of fixes) {
      const beforeCount = (newContent.match(fix.pattern) || []).length;
      newContent = newContent.replace(fix.pattern, fix.replacement);
      const afterCount = (newContent.match(fix.pattern) || []).length;
      
      if (beforeCount > afterCount) {
        fileChanged = true;
        console.log(`✅ Fixed ${beforeCount} imports in ${file}`);
      }
    }
    
    if (fileChanged) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      fixedFiles++;
    }
  }
  
  console.log(`\n🎉 Fixed logger imports in ${fixedFiles} files!`);
}

fixLoggerImports().catch(console.error);