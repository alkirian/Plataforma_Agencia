# Cadence

Base funcional (frontend + backend) para gestionar clientes, cronogramas y documentos.

## Tech
- Frontend: React (Vite)
- Backend: Node.js + Express
- DB: Supabase (PostgreSQL)

## Quickstart (Windows PowerShell)
1) Backend
- Copia `backend/.env.example` a `backend/.env` y rellena:
	- SUPABASE_URL, SUPABASE_KEY (anon), SUPABASE_SERVICE_KEY (service_role)
- Instala y arranca:
	- cd .\backend; npm install; npm run dev

2) Frontend
- Copia `frontend/.env.example` a `frontend/.env.local` y rellena:
	- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
- Instala y arranca:
	- cd ..\frontend; npm install; npm run dev

Puertos por defecto:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001 (API base: /api/v1)

## Notas
- Asegúrate de que frontend y backend usen el MISMO proyecto de Supabase.
- La tabla de perfil puede llamarse `profiles` o `profile`; el backend detecta ambos.
