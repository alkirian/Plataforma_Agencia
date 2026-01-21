IA Ideas: Guía de implementación en Supabase (Revisar antes de crear)

Resumen

- Objetivo: almacenar ideas generadas por IA por cliente, feedback de like/dislike y relación con calendario.
- Importante: antes de crear tablas nuevas, revisar los esquemas actuales en Supabase (schemas, tablas y funciones) para reutilizar estructuras existentes cuando sea posible.

Revisión previa recomendada

1. schedule_items (existente)
   - Campos observados: id, client_id, title, description, copy (agregado por migración), scheduled_at, status, channel, priority.
   - Uso: seguirá siendo la fuente de verdad para el calendario. Las ideas seleccionadas se insertan aquí.
   - Decidir si conviene agregar campos opcionales (p. ej. media_type, media_description, hashtags, cta, platforms) o mantenerlos solo en ai_ideas y volcar un “copy enriquecido” en schedule_items.

2. context/documentos (existentes)
   - Ya se utiliza la RPC search_context_chunks para recuperación de contexto (RAG). No requiere cambios para esta fase.

3. Actividad/bitácora (si existe activity_log)
   - Ver si conviene registrar acciones como IDEA_GENERATED, IDEA_LIKED, IDEA_ADDED_TO_CALENDAR.

Propuesta de nuevas tablas (crear solo si no hay equivalentes)

1. ai_ideas
   - id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
   - client_id: uuid NOT NULL REFERENCES clients(id)
   - session_id: uuid NOT NULL (para agrupar generaciones)
   - tone: text
   - prompt: text
   - title: text NOT NULL
   - copy: text
   - hashtags: text[]
   - cta: text
   - media_type: text
   - media_description: text
   - platforms: text[]
   - suggested_date: date
   - status: text CHECK (status IN ('generated','selected','added')) DEFAULT 'generated'
   - like_count: int DEFAULT 0
   - dislike_count: int DEFAULT 0
   - created_by: uuid REFERENCES users(id)
   - created_at: timestamptz DEFAULT now()

2. ai_idea_feedback
   - id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
   - idea_id: uuid NOT NULL REFERENCES ai_ideas(id) ON DELETE CASCADE
   - user_id: uuid NOT NULL REFERENCES users(id)
   - value: smallint NOT NULL CHECK (value IN (1, -1))
   - created_at: timestamptz DEFAULT now()
   - CONSTRAINT one_feedback_per_user UNIQUE (idea_id, user_id)

3. (Opcional) Índices
   - CREATE INDEX ai_ideas_client_idx ON ai_ideas(client_id);
   - CREATE INDEX ai_ideas_session_idx ON ai_ideas(session_id);

Policies RLS (ejemplo; ajustar a su modelo de tenant)

- En ai_ideas y ai_idea_feedback, permitir SELECT/INSERT/UPDATE solo a usuarios de la misma agencia y con acceso al client_id asociado.
- Reutilizar las mismas lógicas de RLS ya aplicadas a schedule_items/clients cuando sea posible.

Endpoints backend requeridos

1. Generación (ya listo): POST /api/v1/clients/:clientId/generate-ideas
   - Body: { tone?, userPrompt?, count?, preferWeekdays?, allowedWeekdays?, month?, year?, platforms? }
   - Respuesta: array de ideas [{ title, copy, hashtags[], call_to_action, media{type,description}, platforms[], scheduled_at, status }]
   - Nota: Actualmente no persiste en BD; cuando exista ai_ideas, persistir cada item con session_id y devolver id.

2. Feedback (proponer)
   - POST /api/v1/clients/:clientId/ideas/:ideaId/feedback { value: 'like'|'dislike' }
   - Lógica: upsert en ai_idea_feedback; actualizar agregados like_count/dislike_count en ai_ideas.

3. Agregar al calendario (actual)
   - El frontend ya usa POST /api/v1/clients/:clientId/schedule con { title, copy, scheduled_at, status, channel }.
   - Al persistir ai_ideas, marcar status='added' y opcionalmente guardar el schedule_item_id resultante.

Notas de modelado y migración

- Si se prefiere no crear tablas nuevas aún, mantener todo en memoria/UI y volcar al calendario; sin aprendizaje.
- Para aprendizaje sin fine-tuning: generar “patrones” por cliente a partir de ai_idea_feedback (ej. tipos de media más gustados, estilos de copy, CTAs). Pasar top señales al prompt.
- Evitar almacenar prompts/respuestas completas por privacidad; guardar solo metadatos (session_id, conteos, fechas, tono, resumen breve opcional).

Plan de implementación sugerido

1. Validar si existe alguna tabla que ya cubra ideas/propuestas (reutilizar si aplica).
2. Si no hay, crear ai_ideas y ai_idea_feedback con RLS.
3. Ampliar el endpoint de generación para persistir ideas con session_id y devolver ids.
4. Crear endpoint de feedback y adaptar el frontend para enviar likes/dislikes.
5. Ajustar el prompting para usar señales del feedback en nuevas generaciones.

Checklist

- [ ] Revisar tablas actuales en Supabase (clients, schedule_items, activity, otras).
- [ ] Decidir si hashtags/cta/media/plataformas deben ir en schedule_items o solo en ai_ideas.
- [ ] Crear migraciones SQL (o usar supabase CLI) si se requieren tablas nuevas.
- [ ] Añadir policies RLS compatibles con el multi-tenant actual.
- [ ] Añadir logs mínimos de costo/uso (sin datos sensibles).
