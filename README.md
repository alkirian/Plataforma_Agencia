# Cadence

Plataforma para agencias creativas que centraliza la gestión de clientes, cronogramas de contenido, documentos y tendencias.

## Stack Tecnológico

* **Frontend**: React
* **Backend**: Node.js con Express.js
* **Base de Datos**: Supabase (PostgreSQL)

---

## Instalación y Ejecución

### Backend
1.  Navega a la carpeta `/backend`.
2.  Crea un archivo `.env` a partir del `.env.example` y añade tus credenciales de Supabase.
3.  Ejecuta `npm install` para instalar las dependencias.
4.  Ejecuta `npm run dev` para iniciar el servidor.

### Frontend
1.  Navega a la carpeta `/frontend`.
2.  Ejecuta `npm install` para instalar las dependencias.
3.  Ejecuta `npm run dev` para iniciar la aplicación en modo desarrollo.

## Scripts de Desarrollo

### Scripts de Calidad de Código
- `npm run lint` - Ejecuta ESLint para verificar estilo de código
- `npm run lint:fix` - Ejecuta ESLint y corrige automáticamente los errores
- `npm run format` - Formatea el código con Prettier
- `npm run format:check` - Verifica formato sin hacer cambios
- `npm run type-check` - Verifica tipos de TypeScript

### Scripts de Análisis y Migración
- `npm run component:check` - Detecta duplicación de componentes
- `npm run component:analyze` - Análisis detallado de componentes (modo verbose)
- `npm run component:refactor` - Herramienta de refactoring automático
- `npm run validate:imports` - Valida estructura de imports
- `npm run validate:imports:fix` - Corrige imports automáticamente
- `npm run cleanup:console-logs` - Limpia y convierte console.logs a logger

### Scripts de Build y Deploy
- `npm run build` - Build completo con verificaciones de calidad
- `npm run build:production` - Build optimizado para producción
- `npm run quality:check` - Verificación completa de calidad de código
- `npm run security:audit` - Auditoria de seguridad de dependencias
