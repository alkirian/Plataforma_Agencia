# API de Fuentes de Contexto

## Resumen

El módulo de **Fuentes de Contexto** permite agregar, gestionar y buscar diferentes tipos de información contextual para los clientes, que se utiliza posteriormente para generar respuestas más precisas y personalizadas del asistente de IA.

### Tipos de Fuentes Soportados

- **📄 Documentos** (`document`): PDFs, imágenes, DOCX, archivos de texto
- **🌐 URLs** (`url`): Páginas web que se procesan mediante scraping
- **✍️ Información Manual** (`manual`): Texto directo ingresado por el usuario  
- **📝 Notas** (`note`): Información contextual adicional y observaciones

## Autenticación

Todas las rutas requieren autenticación mediante Bearer token en el header `Authorization`.

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Base URL
```
/api/v1/context-sources
```

---

## 1. Procesar Documento

**POST** `/api/v1/context-sources/:clientId/document`

Procesa un documento subido previamente al storage como fuente de contexto.

### Parámetros de URL
- `clientId` (uuid, requerido): ID del cliente

### Body
```json
{
  "file_name": "manual-marca.pdf",
  "storage_path": "documents/client-123/manual-marca.pdf", 
  "file_type": "application/pdf",
  "file_size": 2048576,
  "metadata": {
    "category": "brand_guidelines",
    "importance": "high"
  }
}
```

### Respuesta
```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "client_id": "client-uuid",
    "agency_id": "agency-uuid",
    "file_name": "manual-marca.pdf",
    "source_type": "document",
    "ai_status": "pending",
    "source_metadata": {
      "original_filename": "manual-marca.pdf",
      "upload_method": "context_source",
      "category": "brand_guidelines",
      "importance": "high"
    },
    "created_at": "2024-01-15T10:30:00Z"
  },
  "message": "Documento agregado como fuente de contexto"
}
```

---

## 2. Procesar URL

**POST** `/api/v1/context-sources/:clientId/url`

Procesa una URL mediante scraping web para extraer su contenido.

### Body
```json
{
  "url": "https://ejemplo.com/about",
  "title": "Página Sobre Nosotros",
  "description": "Información institucional del cliente", 
  "tags": ["institucional", "valores", "historia"]
}
```

### Respuesta
```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "file_name": "Página Sobre Nosotros",
    "source_type": "url",
    "ai_status": "processing",
    "source_metadata": {
      "url": "https://ejemplo.com/about",
      "title": "Página Sobre Nosotros", 
      "excerpt": "Somos una empresa líder en...",
      "scraped_at": "2024-01-15T10:30:00Z",
      "user_title": "Página Sobre Nosotros",
      "tags": ["institucional", "valores", "historia"],
      "processing_method": "puppeteer_scraping"
    }
  },
  "message": "URL procesada como fuente de contexto"
}
```

---

## 3. Agregar Información Manual

**POST** `/api/v1/context-sources/:clientId/manual`

Agrega información de texto ingresada manualmente.

### Body
```json
{
  "content": "El cliente maneja un tono informal y jovial en redes sociales. Su audiencia principal son millennials interesados en tecnología. Evitar temas políticos o controversiales.",
  "title": "Guías de Tono y Voz", 
  "category": "brand_voice",
  "tags": ["tono", "audiencia", "guidelines"],
  "importance": "high"
}
```

### Respuesta
```json
{
  "success": true,
  "data": {
    "id": "doc-uuid",
    "file_name": "Guías de Tono y Voz",
    "source_type": "manual",
    "ai_status": "processing",
    "source_metadata": {
      "category": "brand_voice",
      "tags": ["tono", "audiencia", "guidelines"],
      "importance": "high",
      "created_by_user": "user-uuid",
      "input_method": "manual_text"
    }
  },
  "message": "Información manual agregada como fuente de contexto"
}
```

---

## 4. Agregar Nota

**POST** `/api/v1/context-sources/:clientId/note`

Agrega una nota contextual breve.

### Body
```json
{
  "note": "Cliente prefiere publicar contenido los martes y jueves a las 18:00 hrs",
  "title": "Horarios de Publicación",
  "note_type": "scheduling", 
  "importance": "medium",
  "tags": ["horarios", "preferencias"]
}
```

### Respuesta Similar a información manual con `source_type: "note"`

---

## 5. Listar Fuentes de Contexto

**GET** `/api/v1/context-sources/:clientId`

Obtiene todas las fuentes de contexto de un cliente.

### Query Parameters
- `source_type` (opcional): Filtrar por tipo (`document`, `url`, `manual`, `note`)
- `ai_status` (opcional): Filtrar por estado (`pending`, `processing`, `ready`, `error`)
- `limit` (opcional): Límite de resultados (default: 50)

### Ejemplos
```
GET /api/v1/context-sources/client-123
GET /api/v1/context-sources/client-123?source_type=url&ai_status=ready
GET /api/v1/context-sources/client-123?limit=20
```

### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "id": "doc-uuid-1",
      "file_name": "Manual de Marca",
      "source_type": "document", 
      "ai_status": "ready",
      "source_metadata": {...},
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": "doc-uuid-2", 
      "file_name": "Página Web Principal",
      "source_type": "url",
      "ai_status": "ready", 
      "source_metadata": {...},
      "created_at": "2024-01-15T11:00:00Z"
    }
  ],
  "count": 2
}
```

---

## 6. Actualizar Fuente de Contexto

**PUT** `/api/v1/context-sources/:clientId/:sourceId`

Actualiza metadatos de una fuente de contexto.

### Campos Permitidos
```json
{
  "file_name": "Nuevo nombre",
  "source_metadata": {
    "tags": ["nueva", "etiqueta"],
    "importance": "high"
  }
}
```

---

## 7. Eliminar Fuente de Contexto

**DELETE** `/api/v1/context-sources/:clientId/:sourceId`

Elimina una fuente de contexto y sus chunks asociados.

### Respuesta
```
Status: 204 No Content
```

---

## 8. Buscar en Fuentes de Contexto

**POST** `/api/v1/context-sources/:clientId/search`

Realiza búsqueda semántica en las fuentes de contexto.

### Body
```json
{
  "query": "información sobre el logo y colores de la marca",
  "source_types": ["document", "manual"],
  "limit": 10
}
```

### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "id": "chunk-uuid",
      "content": "El logo debe utilizarse siempre en su versión original...",
      "similarity": 0.85,
      "document_name": "Manual de Marca",
      "document_source_type": "document",
      "document_source_metadata": {...},
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "query": "información sobre el logo y colores de la marca"
}
```

---

## 9. Estadísticas de Fuentes de Contexto

**GET** `/api/v1/context-sources/:clientId/stats`

Obtiene estadísticas resumidas de las fuentes de contexto.

### Respuesta
```json
{
  "success": true,
  "data": {
    "total": 15,
    "by_type": {
      "document": 5,
      "url": 3, 
      "manual": 4,
      "note": 3
    },
    "by_status": {
      "ready": 12,
      "processing": 2,
      "error": 1
    },
    "ready_count": 12
  }
}
```

---

## Estados de Procesamiento

- **`pending`**: Fuente creada pero no procesada aún
- **`processing`**: Procesamiento en curso (extracción de texto, generación de embeddings)
- **`ready`**: Fuente procesada y disponible para búsquedas 
- **`error`**: Error durante el procesamiento

---

## Códigos de Error Comunes

- **400 Bad Request**: Datos faltantes o inválidos
- **401 Unauthorized**: Token de autenticación inválido
- **403 Forbidden**: Sin permisos para acceder al cliente
- **404 Not Found**: Fuente de contexto no encontrada
- **500 Internal Server Error**: Error del servidor

---

## Ejemplos de Integración

### Flujo Típico de Uso

1. **Crear fuentes de contexto**:
   ```javascript
   // Documento
   await fetch('/api/v1/context-sources/client-123/document', {
     method: 'POST',
     headers: { 
       'Authorization': 'Bearer ' + token,
       'Content-Type': 'application/json' 
     },
     body: JSON.stringify({
       file_name: 'brand-guide.pdf',
       storage_path: 'documents/client-123/brand-guide.pdf',
       file_type: 'application/pdf',
       file_size: 1024000
     })
   });
   
   // URL
   await fetch('/api/v1/context-sources/client-123/url', {
     method: 'POST', 
     headers: {
       'Authorization': 'Bearer ' + token,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       url: 'https://cliente.com/about',
       title: 'Sobre Nosotros'
     })
   });
   ```

2. **Monitorear procesamiento**:
   ```javascript
   const checkStatus = async () => {
     const response = await fetch('/api/v1/context-sources/client-123?ai_status=processing');
     const { data } = await response.json();
     
     if (data.length === 0) {
       console.log('Todas las fuentes están listas');
     }
   };
   ```

3. **Buscar información**:
   ```javascript
   const search = await fetch('/api/v1/context-sources/client-123/search', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + token,
       'Content-Type': 'application/json'  
     },
     body: JSON.stringify({
       query: 'colores de la marca',
       limit: 5
     })
   });
   
   const { data: results } = await search.json();
   ```

---

## Notas Importantes

- Las fuentes de contexto se procesan de forma **asíncrona**
- Los documentos grandes pueden tardar varios minutos en procesarse
- El scraping de URLs puede fallar si el sitio bloquea bots
- Se recomienda verificar el estado `ai_status` antes de usar las fuentes en búsquedas
- Los embeddings se generan automáticamente usando OpenAI `text-embedding-3-small`
- Todas las operaciones respetan las políticas RLS (Row Level Security) de Supabase

---

## Integración con IA

Las fuentes de contexto se integran automáticamente con el servicio de IA:

- Al generar ideas de contenido, la IA busca automáticamente en todas las fuentes
- El contexto se etiqueta por tipo de fuente (📄 DOCUMENTO, 🌐 WEB, etc.)
- Se priorizan las fuentes más relevantes semánticamente a la consulta
- La información se combina de forma inteligente para generar respuestas coherentes