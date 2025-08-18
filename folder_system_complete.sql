-- =====================================================
-- MIGRACIÓN COMPLETA: SISTEMA DE CARPETAS PARA DOCUMENTOS
-- =====================================================
-- Descripción: Implementa un sistema completo de carpetas jerárquicas
-- para organizar documentos de clientes con validaciones y seguridad
-- =====================================================

-- Paso 1: Crear tabla de carpetas de documentos
-- =====================================================
CREATE TABLE IF NOT EXISTS document_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  -- Restricciones de integridad
  CONSTRAINT folder_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
  CONSTRAINT folder_name_max_length CHECK (LENGTH(name) <= 255),
  CONSTRAINT no_self_reference CHECK (id != parent_folder_id),
  CONSTRAINT valid_description_length CHECK (description IS NULL OR LENGTH(description) <= 1000)
);

-- Paso 2: Agregar columna folder_id a la tabla documents existente
-- =====================================================
DO $$ 
BEGIN
  -- Verificar si la columna ya existe antes de agregarla
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE documents 
    ADD COLUMN folder_id UUID REFERENCES document_folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Paso 3: Crear índices para optimizar rendimiento
-- =====================================================

-- Índices para búsquedas frecuentes en document_folders
CREATE INDEX IF NOT EXISTS idx_document_folders_client_agency 
ON document_folders(client_id, agency_id);

CREATE INDEX IF NOT EXISTS idx_document_folders_parent 
ON document_folders(parent_folder_id) 
WHERE parent_folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_document_folders_client_parent 
ON document_folders(client_id, parent_folder_id);

CREATE INDEX IF NOT EXISTS idx_document_folders_name 
ON document_folders(client_id, LOWER(name));

-- Índices para búsquedas frecuentes en documents
CREATE INDEX IF NOT EXISTS idx_documents_folder 
ON documents(folder_id) 
WHERE folder_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_documents_client_folder 
ON documents(client_id, folder_id);

CREATE INDEX IF NOT EXISTS idx_documents_folder_created 
ON documents(folder_id, created_at DESC);

-- Paso 4: Habilitar Row Level Security (RLS)
-- =====================================================
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen para evitar conflictos
DROP POLICY IF EXISTS "Users can view folders from their agency" ON document_folders;
DROP POLICY IF EXISTS "Users can create folders in their agency" ON document_folders;
DROP POLICY IF EXISTS "Users can update folders from their agency" ON document_folders;
DROP POLICY IF EXISTS "Users can delete folders from their agency" ON document_folders;

-- Política: Ver carpetas de la propia agencia
CREATE POLICY "Users can view folders from their agency" ON document_folders
  FOR SELECT USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política: Crear carpetas en la propia agencia
CREATE POLICY "Users can create folders in their agency" ON document_folders
  FOR INSERT WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política: Actualizar carpetas de la propia agencia
CREATE POLICY "Users can update folders from their agency" ON document_folders
  FOR UPDATE USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  ) WITH CHECK (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política: Eliminar carpetas de la propia agencia
CREATE POLICY "Users can delete folders from their agency" ON document_folders
  FOR DELETE USING (
    agency_id IN (
      SELECT agency_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Paso 5: Funciones de validación y utilidad
-- =====================================================

-- Función para prevenir referencias circulares en la jerarquía
CREATE OR REPLACE FUNCTION check_folder_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  cycle_check_limit INTEGER := 20; -- Límite de profundidad para evitar loops infinitos
  current_folder_id UUID;
  depth_counter INTEGER := 0;
BEGIN
  -- Solo verificar si hay parent_folder_id
  IF NEW.parent_folder_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar que no se esté intentando hacer una carpeta padre de sí misma
  IF NEW.id = NEW.parent_folder_id THEN
    RAISE EXCEPTION 'Una carpeta no puede ser padre de sí misma';
  END IF;
  
  -- Seguir la cadena de padres para detectar ciclos
  current_folder_id := NEW.parent_folder_id;
  
  WHILE current_folder_id IS NOT NULL AND depth_counter < cycle_check_limit LOOP
    -- Si encontramos la carpeta actual en la cadena, hay un ciclo
    IF current_folder_id = NEW.id THEN
      RAISE EXCEPTION 'Se detectó una referencia circular en la jerarquía de carpetas';
    END IF;
    
    -- Obtener el siguiente padre en la cadena
    SELECT parent_folder_id INTO current_folder_id
    FROM document_folders 
    WHERE id = current_folder_id;
    
    depth_counter := depth_counter + 1;
  END LOOP;
  
  -- Verificar límite de profundidad
  IF depth_counter >= cycle_check_limit THEN
    RAISE EXCEPTION 'La jerarquía de carpetas excede la profundidad máxima permitida (%))', cycle_check_limit;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener la ruta completa de una carpeta
CREATE OR REPLACE FUNCTION get_folder_path(folder_id UUID)
RETURNS TEXT AS $$
DECLARE
  folder_path TEXT := '';
  current_folder RECORD;
  current_id UUID := folder_id;
  path_parts TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Si folder_id es NULL, retornar ruta raíz
  IF folder_id IS NULL THEN
    RETURN '/';
  END IF;
  
  -- Construir el path desde la carpeta hacia la raíz
  WHILE current_id IS NOT NULL LOOP
    SELECT name, parent_folder_id INTO current_folder
    FROM document_folders 
    WHERE id = current_id;
    
    -- Si no encontramos la carpeta, salir del loop
    IF NOT FOUND THEN
      EXIT;
    END IF;
    
    -- Agregar el nombre al inicio del array
    path_parts := current_folder.name || path_parts;
    current_id := current_folder.parent_folder_id;
  END LOOP;
  
  -- Construir la ruta final
  IF array_length(path_parts, 1) > 0 THEN
    folder_path := '/' || array_to_string(path_parts, '/');
  ELSE
    folder_path := '/';
  END IF;
  
  RETURN folder_path;
END;
$$ LANGUAGE plpgsql;

-- Paso 6: Crear triggers
-- =====================================================

-- Eliminar triggers existentes si existen
DROP TRIGGER IF EXISTS check_folder_hierarchy_trigger ON document_folders;
DROP TRIGGER IF EXISTS update_folder_updated_at_trigger ON document_folders;

-- Trigger para verificar jerarquía en INSERT/UPDATE
CREATE TRIGGER check_folder_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON document_folders
  FOR EACH ROW
  EXECUTE FUNCTION check_folder_hierarchy();

-- Trigger para actualizar updated_at automáticamente
CREATE TRIGGER update_folder_updated_at_trigger
  BEFORE UPDATE ON document_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_updated_at();

-- Paso 7: Vista para obtener carpetas con información adicional
-- =====================================================
CREATE OR REPLACE VIEW folder_summary AS
SELECT 
  df.*,
  get_folder_path(df.id) as full_path,
  (
    SELECT COUNT(*) 
    FROM documents d 
    WHERE d.folder_id = df.id
  ) as document_count,
  (
    SELECT COUNT(*) 
    FROM document_folders child 
    WHERE child.parent_folder_id = df.id
  ) as subfolder_count,
  p.full_name as created_by_name
FROM document_folders df
LEFT JOIN profiles p ON df.created_by = p.id;

-- Paso 8: Comentarios para documentación
-- =====================================================
COMMENT ON TABLE document_folders IS 'Almacena la estructura jerárquica de carpetas para organizar documentos de clientes';
COMMENT ON COLUMN document_folders.id IS 'Identificador único de la carpeta';
COMMENT ON COLUMN document_folders.client_id IS 'Referencia al cliente propietario de la carpeta';
COMMENT ON COLUMN document_folders.agency_id IS 'Referencia a la agencia para control de acceso';
COMMENT ON COLUMN document_folders.name IS 'Nombre de la carpeta (máximo 255 caracteres)';
COMMENT ON COLUMN document_folders.description IS 'Descripción opcional de la carpeta';
COMMENT ON COLUMN document_folders.parent_folder_id IS 'NULL para carpetas raíz, ID del padre para carpetas anidadas';
COMMENT ON COLUMN document_folders.created_by IS 'Usuario que creó la carpeta';

COMMENT ON COLUMN documents.folder_id IS 'NULL para documentos en raíz, ID de carpeta para documentos organizados';

COMMENT ON FUNCTION check_folder_hierarchy() IS 'Previene referencias circulares en la jerarquía de carpetas';
COMMENT ON FUNCTION get_folder_path(UUID) IS 'Retorna la ruta completa de una carpeta desde la raíz';
COMMENT ON VIEW folder_summary IS 'Vista con información resumida de carpetas incluyendo conteos y rutas';

-- Paso 9: Datos de ejemplo (opcional - remover en producción)
-- =====================================================
/*
-- Ejemplo de carpetas para testing (descomenta si necesitas datos de prueba)
INSERT INTO document_folders (client_id, agency_id, name, description, created_by) VALUES
('client-uuid-here', 'agency-uuid-here', 'Contratos', 'Documentos contractuales', auth.uid()),
('client-uuid-here', 'agency-uuid-here', 'Propuestas', 'Propuestas comerciales', auth.uid()),
('client-uuid-here', 'agency-uuid-here', 'Material Gráfico', 'Logos, imágenes, designs', auth.uid());
*/

-- Paso 10: Verificación de la migración
-- =====================================================
DO $$
DECLARE
  folder_table_exists BOOLEAN;
  folder_column_exists BOOLEAN;
  index_count INTEGER;
  policy_count INTEGER;
  trigger_count INTEGER;
BEGIN
  -- Verificar que la tabla fue creada
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'document_folders'
  ) INTO folder_table_exists;
  
  -- Verificar que la columna folder_id fue agregada
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'folder_id'
  ) INTO folder_column_exists;
  
  -- Contar índices creados
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes 
  WHERE tablename IN ('document_folders', 'documents') 
  AND indexname LIKE 'idx_%folder%';
  
  -- Contar políticas RLS
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'document_folders';
  
  -- Contar triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE event_object_table = 'document_folders';
  
  -- Mostrar resultados
  RAISE NOTICE '=== VERIFICACIÓN DE MIGRACIÓN ===';
  RAISE NOTICE 'Tabla document_folders creada: %', folder_table_exists;
  RAISE NOTICE 'Columna folder_id agregada: %', folder_column_exists;
  RAISE NOTICE 'Índices creados: %', index_count;
  RAISE NOTICE 'Políticas RLS creadas: %', policy_count;
  RAISE NOTICE 'Triggers creados: %', trigger_count;
  
  IF folder_table_exists AND folder_column_exists AND index_count >= 5 AND policy_count >= 4 AND trigger_count >= 2 THEN
    RAISE NOTICE '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE';
  ELSE
    RAISE WARNING '⚠️  MIGRACIÓN INCOMPLETA - Revisar errores arriba';
  END IF;
END $$;

-- =====================================================
-- FIN DE LA MIGRACIÓN
-- =====================================================