IA: Generador de Ideas para Cronograma

Resumen
- Botón “Generar ideas IA” en Cronograma que abre un modal para elegir: tono, prompt opcional, cantidad (3/5/10/custom), preferir días hábiles (por defecto activado).
- Genera N ideas con: título, copy, hashtags, CTA, propuesta audiovisual (tipo + descripción), plataformas y fecha sugerida (YYYY-MM-DD).
- Acciones por idea: like/dislike (pulgar), editar inline, cambiar fecha sugerida y “Agregar al calendario”.
- Minimizar el modal durante la generación con barra de progreso; continuar trabajando y restaurar cuando finalice.
- Persistencia opcional: se incluyen migraciones y API para guardar ideas y feedback en Supabase (activar ejecutando SQL).

Estructura y archivos
- Backend
  - Nuevo servicio: `backend/src/services/aiIdeas.service.js`
    - Generación robusta con OpenAI. Si RAG/embeddings fallan, genera sin contexto.
    - Distribución de fechas en el mes objetivo; respeta días hábiles.
    - Inserta ideas en `ai_ideas` (si la tabla existe) con `session_id` y `seq`; devuelve `id` de cada idea.
    - Funciones extra: `upsertIdeaFeedback`, `listIdeas`.
  - Controlador: `backend/src/controllers/ai.controller.js`
    - `handleGenerateIdeas` (actualizado para pasar `userId`).
    - `handleIdeaFeedback` (nuevo).
    - `handleListIdeas` (nuevo).
  - Rutas: `backend/src/api/clients.routes.js`
    - `POST /api/v1/clients/:clientId/generate-ideas`
    - `POST /api/v1/clients/:clientId/ideas/:ideaId/feedback`
    - `GET  /api/v1/clients/:clientId/ideas?month=&year=&sessionId=`
  - Migraciones SQL: `backend/supabase/ai_ideas_schema.sql`
    - Tablas: `ai_ideas`, `ai_idea_feedback` (+ índices, `seq` para orden, `session_id`).
    - RLS placeholder: políticas permisivas para arrancar (ajustar a tu multi-tenant).
  - Doc Supabase: `backend/src/docs/ai-ideas-supabase.md` (qué revisar y cómo extender).

- Frontend
  - Botón: `frontend/src/components/ideas/IdeasAIButton.jsx`
  - Modal: `frontend/src/components/ideas/IdeasModal.jsx`
    - UI minimalista: presets de tono, prompt, cantidad, toggle hábiles.
    - Barra de progreso y opción “Minimizar” mientras genera.
    - Cards con edición inline, like/dislike (pulgar), fecha editable y “Agregar al calendario”.
    - Agregar al calendario usa `createEvent` del hook para UI inmediata.
  - Integración: `frontend/src/components/schedule/ScheduleSection.jsx`
    - Importa botón y modal; pasa `onCreateEvent={createEvent}`.
  - API: `frontend/src/api/ai.js`
    - `generateIdeas`, `sendIdeaFeedback`, `listIdeas`.

Puntos de integración
- Contexto (RAG): se usa la RPC `search_context_chunks`. Si no existe o falla, la generación continúa sin contexto.
- Persistencia: si aún no aplicaste la migración, las ideas se crean sin `id` (feedback no se enviará). Al aplicar SQL, se persistirán y el backend devolverá `id`.
- Calendario: la creación usa `createEvent` (optimistic update) y se ve de inmediato en FullCalendar.

Endpoints (backend)
- Generar ideas: `POST /api/v1/clients/:clientId/generate-ideas`
  - Body: `{ tone?, userPrompt?, count?, preferWeekdays?, allowedWeekdays?, month?, year?, platforms? }`
  - Resp: `[ { id?, title, copy, hashtags[], call_to_action, media:{type,description}, platforms[], scheduled_at, status, tone, session_id? } ]`
- Feedback: `POST /api/v1/clients/:clientId/ideas/:ideaId/feedback`
  - Body: `{ value: 'like'|'dislike'|'clear' }`
  - Resp: `{ idea_id, like_count, dislike_count }`
- Listar ideas: `GET /api/v1/clients/:clientId/ideas?month=&year=&sessionId=`

Variables de entorno
- `OPENAI_API_KEY` (backend)
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY`

Cómo aplicar la persistencia (Supabase)
1) Revisa primero tus esquemas: quizá ya tengas tablas reutilizables.
2) Si no, aplica `backend/supabase/ai_ideas_schema.sql` con Supabase CLI/Studio.
3) Ajusta RLS según tu modelo (agencia/usuarios). Las políticas de ejemplo ahora son permisivas.

Notas de diseño
- Distribución de fechas: empieza en el mes actual (o suministrado) y reparte N fechas; si faltan, toma inicios del siguiente mes. Opción para preferir hábiles (L–V) o lista explícita `allowedWeekdays`.
- Prompting: usa tono, prompt libre, plataformas sugeridas y (si disponible) contexto RAG. Limita hashtags (3–6) y copy ~180 palabras.
- UX: estética sobria y consistente, íconos claros (pulgar), feedback visual y performance percibida (barra y minimizar).

Siguientes pasos opcionales
- Reordenar ideas en UI con heurísticas basadas en feedback.
- Agregar filtros por plataforma/categoría.
- Persistir “agregado al calendario” en `ai_ideas` (guardar `schedule_item_id`).

Changelog (este PR)
- Backend: servicio, controladores, rutas nuevas, manejo de RAG resiliente, SQL de tablas.
- Frontend: botón+modal, edición inline, feedback, minimizar, progreso, integración con calendario (optimistic).

