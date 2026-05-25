# Cadence

Plataforma para agencias creativas que centraliza la gestión de clientes, cronogramas de contenido, documentos y tendencias.

## Stack Tecnológico

* **Frontend**: React (Vite + Tailwind CSS)
* **Backend**: Node.js con Express.js
* **Base de Datos**: Supabase (PostgreSQL)

---

## Desarrollo Local

### Backend
1. Navega a la carpeta `/backend`.
2. Crea un archivo `.env` a partir del `.env.example` y añade tus credenciales de Supabase e Inteligencia Artificial.
3. Ejecuta `npm install` para instalar las dependencias.
4. Ejecuta `npm run dev` para iniciar el servidor de desarrollo local (puerto 3001).

### Frontend
1. Navega a la carpeta `/frontend`.
2. Crea un archivo `.env.local` a partir del `.env.example` y añade la URL de tu backend (`VITE_API_BASE_URL=http://localhost:3001/api/v1`) y tus credenciales de Supabase.
3. Ejecuta `npm install` para instalar las dependencias.
4. Ejecuta `npm run dev` para iniciar la aplicación (puerto 5173).

---

## 🚀 Guía de Despliegue en la Nube (¡100% Gratis y Rápido!)

Esta guía te guiará paso a paso para desplegar la plataforma completa en producción de manera gratuita utilizando **Supabase** (Base de Datos), **Render** (Backend) y **Vercel** (Frontend).

### Paso 1: Base de Datos (Supabase)
Si ya tienes un proyecto de Supabase en la nube, asegúrate de haber ejecutado los scripts de migración para que las tablas estén listas:
1. Ve al panel de control de tu proyecto en [Supabase](https://supabase.com/).
2. Entra en **SQL Editor** -> **New Query**.
3. Pega y ejecuta el contenido del archivo `supabase-setup.sql` (esto creará las tablas principales).
4. Luego, ejecuta los demás archivos `.sql` de migración en la raíz del proyecto para habilitar RLS y otras características si es necesario.
5. Ve a **Project Settings** -> **API** y copia las siguientes claves:
   - `Project URL` (será tu `SUPABASE_URL`)
   - `anon public` (será tu `SUPABASE_KEY` / `VITE_SUPABASE_ANON_KEY`)
   - `service_role` (será tu `SUPABASE_SERVICE_KEY` para el backend. **¡Mantén esta clave segura!**)

---

### Paso 2: Desplegar el Backend (en Render)
Render alojará tu servidor de Express de manera gratuita.
1. Crea una cuenta gratuita en [Render](https://render.com/).
2. Haz clic en **New** (Nuevo) y selecciona **Web Service**.
3. Conecta tu repositorio de GitHub donde subiste este proyecto.
4. Configura el servicio con los siguientes datos:
   - **Name**: `cadence-backend` (o el nombre que prefieras)
   - **Runtime**: `Node`
   - **Root Directory**: `backend` *(¡Muy importante para que solo compile el backend!)*
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (Gratuito)
5. Abre la sección **Advanced** y añade las siguientes **Variables de Entorno** (Environment Variables):
   - `PORT`: `3001`
   - `SUPABASE_URL`: *(Tu URL de Supabase)*
   - `SUPABASE_KEY`: *(Tu anon key de Supabase)*
   - `SUPABASE_SERVICE_KEY`: *(Tu service_role key de Supabase)*
   - `GEMINI_API_KEY`: *(Tu clave de Gemini AI si la usas)*
   - `OPENAI_API_KEY`: *(Tu clave de OpenAI si la usas)*
   - `TAVILY_API_KEY`: *(Tu clave de Tavily para buscar tendencias si la usas)*
6. Haz clic en **Create Web Service**.
7. Una vez que termine de compilar, Render te dará una URL pública (ejemplo: `https://cadence-backend.onrender.com`). **Copia esta URL**, la usaremos para el frontend.

---

### Paso 3: Desplegar el Frontend (en Vercel)
Vercel alojará tu frontend de React súper rápido y gratis.
1. Crea una cuenta gratuita en [Vercel](https://vercel.com/) (puedes iniciar sesión con tu cuenta de GitHub).
2. Haz clic en **Add New** -> **Project**.
3. Selecciona tu repositorio de GitHub del proyecto.
4. Configura el proyecto con los siguientes datos:
   - **Framework Preset**: `Vite` (Vercel lo detectará automáticamente)
   - **Root Directory**: Haz clic en **Edit** y selecciona la carpeta `frontend`.
   - **Build and Output Settings**: Déjalo por defecto (compilará con `npm run build` y saldrá en `dist`).
5. Abre la sección **Environment Variables** (Variables de entorno) y agrega estas variables:
   - `VITE_SUPABASE_URL`: *(Tu URL de Supabase)*
   - `VITE_SUPABASE_ANON_KEY`: *(Tu anon key de Supabase)*
   - `VITE_API_BASE_URL`: `https://tu-url-de-render.onrender.com/api/v1` *(Reemplaza con la URL pública que te dio Render en el Paso 2, asegurándote de añadir `/api/v1` al final)*
6. Haz clic en **Deploy** (Desplegar).

¡Listo! Vercel te dará una URL pública espectacular (ejemplo: `https://cadence-agency.vercel.app`) donde tu equipo y clientes podrán acceder y probar todas las funcionalidades en tiempo real desde cualquier dispositivo.

