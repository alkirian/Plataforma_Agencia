# Backend - Cadence

Base de backend con Node.js, Express.js y Supabase (PostgreSQL) lista para desarrollo y despliegue.

## Requisitos
- Node.js 18+ y npm

## Instalación
1. Ir al directorio backend e instalar dependencias:
```powershell
cd c:\Users\User\Documents\Plataforma_Agencia\backend
npm install
```

2. Crear archivo `.env` basado en `.env.example`:
```
PORT=3001
SUPABASE_URL=TU_URL_DE_SUPABASE_AQUI
SUPABASE_KEY=TU_ANON_KEY_DE_SUPABASE_AQUI
SUPABASE_SERVICE_KEY=TU_SERVICE_KEY_DE_SUPABASE_AQUI
OPENAI_API_KEY=tu_openai_api_key
```

## Scripts
- Desarrollo con recarga:
```powershell
npm run dev
```

- Producción:
```powershell
npm start
```

## Endpoints
- GET `/api/v1/health` – Comprobación de salud.
- GET `/` – Mensaje de bienvenida.
 
### IA (Chat e Ideas)
- POST `/api/v1/clients/:clientId/chat` – chat conversacional con contexto del cliente (RAG). Requiere auth y `OPENAI_API_KEY` en backend.
- GET `/api/v1/clients/:clientId/chat/history` – historial paginado de mensajes.
- POST `/api/v1/clients/:clientId/generate-ideas` – generación de ideas para calendario.

## Estructura
```
src/
  api/
    index.js
  config/
    supabaseClient.js
  middleware/
    errorHandler.js
  index.js
```

## Notas
- `type: module` habilita ES Modules (import/export).
- `supabaseClient` centraliza la conexión a la base de datos.
- `errorHandler` gestiona errores de forma consistente.
