-- =====================================================================
-- SQL Migration: Auto-delete storage files on metadata deletion
-- =====================================================================
-- Este script define la lógica en base de datos para automatizar la limpieza
-- de archivos en Supabase Storage cuando se elimina un registro de metadatos.
--
-- Tienes DOS opciones para implementar esto:
--   Opción A: Triggers nativos con la extensión net/http (directo en SQL).
--   Opción B: Webhook de base de datos llamando a una Edge Function (Recomendado).
-- =====================================================================

------------------------------------------------------------------------
-- OPCIÓN A: Trigger Directo en PostgreSQL (Usando extensión pg_net)
-- Nota: Asegúrate de habilitar la extensión pg_net en Supabase primero.
------------------------------------------------------------------------

-- 1. Habilitar la extensión de red si no existe
create extension if not exists pg_net with schema extensions;

-- 2. Crear la función del trigger para content_assets
create or replace function public.delete_content_asset_from_storage()
returns trigger
security definer
language plpgsql
as $$
declare
  project_id text;
  auth_header text;
  request_url text;
begin
  -- Obtener ID del proyecto desde la URL configurada en la base (ejemplo o fallback)
  -- NOTA: Reemplazar con tus credenciales reales o variables locales.
  project_id := 'inoremwazicuzbsehzax'; 
  auth_header := 'Bearer ' || auth.role(); -- O tu service role key

  request_url := 'https://' || project_id || '.supabase.co/storage/v1/object/content-assets/' || OLD.storage_path;

  -- Realizar la llamada de eliminación de forma asíncrona
  perform net.http_delete(
    url := request_url,
    headers := jsonb_build_object(
      'Authorization', auth_header
    )
  );

  return OLD;
end;
$$;

-- 3. Enlazar el trigger a la tabla content_assets
drop trigger if exists tr_delete_storage_content_asset on public.content_assets;
create trigger tr_delete_storage_content_asset
  after delete on public.content_assets
  for each row
  execute function public.delete_content_asset_from_storage();


------------------------------------------------------------------------
-- OPCIÓN B: Webhook de Base de Datos + Edge Function (RECOMENDADO por robustez)
------------------------------------------------------------------------
/*
  Pasos para configurar desde la interfaz visual de Supabase:
  
  1. Crear una Edge Function (ej: 'delete-storage-file'):
     Ejecuta en tu terminal:
     $ supabase functions new delete-storage-file
     
     Escribe la lógica en 'supabase/functions/delete-storage-file/index.ts':
     ------------------------------------------------------------------
     import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
     import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

     serve(async (req) => {
       try {
         const payload = await req.json()
         // Supabase Webhooks envían el registro viejo en 'old_record' para DELETE
         const oldRecord = payload.old_record
         if (!oldRecord || !oldRecord.storage_path) {
           return new Response("No storage path provided", { status: 400 })
         }

         const supabase = createClient(
           Deno.env.get('SUPABASE_URL')!,
           Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
         )

         // Eliminar archivo físico
         const { error } = await supabase.storage
           .from('content-assets')
           .remove([oldRecord.storage_path])

         if (error) throw error

         return new Response("Archivo eliminado del storage exitosamente", { status: 200 })
       } catch (err) {
         return new Response(JSON.stringify({ error: err.message }), { status: 500 })
       }
     })
     ------------------------------------------------------------------

  2. Desplegar la función en tu proyecto en la nube:
     $ supabase functions deploy delete-storage-file

  3. Configurar el Webhook en el Dashboard de Supabase:
     - Ve a **Database** -> **Webhooks**.
     - Haz clic en **Create a new webhook**.
     - Name: `delete_content_asset_file`.
     - Table: Select `public.content_assets`.
     - Events: Select `DELETE`.
     - Webhook Type: Select `Supabase Edge Functions`.
     - Edge Function: Select `delete-storage-file`.
     - Method: `POST`.
     - Timeout: `5000` ms.
     - Guarda el Webhook.

  ¡Listo! Con esto, cada vez que elimines una fila en public.content_assets,
  Supabase Storage se limpiará automáticamente sin dejar residuos.
*/
