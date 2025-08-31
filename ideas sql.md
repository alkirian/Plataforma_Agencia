# Ideas SQL

Guía paso a paso para habilitar la persistencia de ideas generadas por IA y feedback en Supabase. Antes de crear tablas nuevas, revisa tus esquemas actuales para reutilizar estructuras existentes cuando sea posible.

## 0) Revisar esquemas existentes (importante)
- Revisa si ya tienes tablas equivalentes o reutilizables:
  - `clients` (existe) con `agency_id`.
  - `schedule_items` (existe) como calendario final (las ideas seleccionadas se insertan ahí).
  - Cualquier tabla de “ideas”, “propuestas” o “feedback” que puedas reutilizar.
- Si encuentras algo reutilizable, adapta los nombres de columnas/policies en lugar de crear las tablas nuevas.

## 1) Crear tablas para ideas y feedback
Archivo: `backend/supabase/ai_ideas_schema.sql`

Incluye:
- Extensión `pgcrypto` (para `gen_random_uuid()`).
- Tablas `ai_ideas` y `ai_idea_feedback` con índices y RLS activado.
- Policies de ejemplo (permisivas, solo para arranque). Debes ajustarlas a tu modelo multi‑tenant.

Opciones para aplicar el SQL:
- Supabase Studio → SQL Editor → pega el contenido de `backend/supabase/ai_ideas_schema.sql` → Run.
- CLI: `supabase db push` o `psql` apuntando a tu DB.

Esquema resumido:
- `ai_ideas`
  - `id uuid PK`, `client_id uuid`, `agency_id uuid`, `session_id uuid`, `seq smallint`
  - `tone text`, `prompt text`, `title text`, `copy text`, `hashtags text[]`, `cta text`
  - `media_type text`, `media_description text`, `platforms text[]`
  - `suggested_date date`, `status text` ('generated'|'selected'|'added')
  - `like_count int`, `dislike_count int`, `created_by uuid`, `created_at timestamptz`
- `ai_idea_feedback`
  - `id uuid PK`, `idea_id uuid`, `user_id uuid`, `value smallint (1|-1)`, `created_at`
  - Única: `(idea_id, user_id)`

Nota: `agency_id` se completa desde `clients.agency_id` en el backend al insertar.

## 2) Ajustar RLS (Row Level Security)
Las policies del SQL son permisivas (útiles para desarrollo). Ajústalas a tu modelo de agencia/usuarios. Ejemplos orientativos (adáptalos):

1) Solo usuarios de la misma agencia pueden ver/insertar ideas del cliente
```sql
-- Ejemplo: asumiendo que tienes una tabla agency_members (agency_id, user_id)
drop policy if exists ai_ideas_select on public.ai_ideas;
drop policy if exists ai_ideas_insert on public.ai_ideas;

create policy ai_ideas_select on public.ai_ideas
for select
using (
  exists (
    select 1
    from public.clients c
    join public.agency_members am on am.agency_id = c.agency_id
    where c.id = ai_ideas.client_id
      and am.user_id = auth.uid()
  )
);

create policy ai_ideas_insert on public.ai_ideas
for insert
with check (
  exists (
    select 1
    from public.clients c
    join public.agency_members am on am.agency_id = c.agency_id
    where c.id = ai_ideas.client_id
      and am.user_id = auth.uid()
  )
);
```

2) Feedback: el usuario puede ver/upsert de ideas a las que tiene acceso
```sql
drop policy if exists ai_feedback_select on public.ai_idea_feedback;
drop policy if exists ai_feedback_upsert on public.ai_idea_feedback;

create policy ai_feedback_select on public.ai_idea_feedback
for select using (
  exists (
    select 1
    from public.ai_ideas i
    join public.clients c on c.id = i.client_id
    join public.agency_members am on am.agency_id = c.agency_id
    where i.id = ai_idea_feedback.idea_id
      and am.user_id = auth.uid()
  )
);

create policy ai_feedback_upsert on public.ai_idea_feedback
for all using (
  exists (
    select 1
    from public.ai_ideas i
    join public.clients c on c.id = i.client_id
    join public.agency_members am on am.agency_id = c.agency_id
    where i.id = ai_idea_feedback.idea_id
      and am.user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.ai_ideas i
    join public.clients c on c.id = i.client_id
    join public.agency_members am on am.agency_id = c.agency_id
    where i.id = ai_idea_feedback.idea_id
      and am.user_id = auth.uid()
  )
);
```

Si no tienes `agency_members`, reemplaza la lógica por tus funciones/tablas de membership (p. ej., `is_user_in_agency(auth.uid(), c.agency_id)` o similar).

## 3) (Opcional) Marcar idea como “agregada al calendario”
Puedes extender `ai_ideas` para guardar el `schedule_item_id` cuando el usuario agrega la idea al calendario:
```sql
alter table public.ai_ideas add column if not exists schedule_item_id uuid null;
```
Luego, en el backend, tras crear el evento en `schedule_items`, actualizar `ai_ideas`:
```sql
update public.ai_ideas
set status = 'added', schedule_item_id = :newItemId
where id = :ideaId;
```

## 4) RAG (opcional): función `search_context_chunks`
Si quieres contexto en la generación, asegúrate de tener una RPC `search_context_chunks` (usa pgvector + embeddings). Si no existe, la generación igual funciona sin contexto (fallback ya implementado).

## 5) Variables de entorno (backend)
Asegúrate de tener:
- `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_KEY` (ya en uso)
- `OPENAI_API_KEY` (para la generación)

## 6) Cómo probar
1) Generación desde UI: Cronograma → “Generar ideas IA” → elige tono/prompt/cantidad → Generar.
   - Si la migración se aplicó correctamente, las ideas devueltas tendrán `id` y `session_id`.
2) Feedback: usa el pulgar arriba/abajo en la card de cada idea.
   - Verifica en DB: `select id, like_count, dislike_count from ai_ideas order by created_at desc limit 10;`
3) Listado (opcional): `GET /api/v1/clients/:clientId/ideas?month=&year=&sessionId=`
4) Calendario: “Agregar al calendario” crea el evento en `schedule_items` y se ve al instante.

## 7) Solución de problemas
- 401/403 al insertar/listar: revisa las policies RLS; el backend inserta usando el token del usuario (no el service key) para respetar RLS.
- 500 en generación por “función search_context_chunks no existe”: es normal si no la creaste; el backend ahora hace fallback sin RAG.
- Feedback no se guarda: asegúrate de que la idea tenga `id` (si no aplicaste el SQL, no habrá persistencia) y que RLS permita insertar en `ai_idea_feedback`.

## 8) Limpieza / rollback
Para quitar las tablas (solo si es necesario):
```sql
drop table if exists public.ai_idea_feedback cascade;
drop table if exists public.ai_ideas cascade;
```

---
Con esto queda todo listo para almacenar ideas generadas, registrar feedback y reusar las señales en futuras generaciones. Si quieres, puedo ajustar las policies a tu modelo real de agencias/usuarios y agregar el guardado de `schedule_item_id` al confirmar “Agregar al calendario”.

