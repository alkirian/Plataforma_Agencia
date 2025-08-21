// src/services/webSources.service.js
import { supabaseAdmin } from '../config/supabaseClient.js';

/**
 * Inicia un scraping web creando una fuente y delegando a la Edge Function.
 *
 * Contrato:
 * - Entrada: clientId (string), url (string), agencyId (string)
 * - Salida: registro creado en web_sources
 * - Errores: lanza Error con mensaje claro
 */
export const startScraping = async (clientId, url, _agencyId) => {
  if (!clientId || !url /* || !agencyId */) {
    throw new Error('clientId y url son requeridos');
  }

  // Normaliza datos mínimos para el MVP
  const seedUrl = url.trim();
  let urlRoot = null;
  try {
    const u = new URL(seedUrl);
    urlRoot = `${u.protocol}//${u.host}`;
  } catch {
    throw new Error('URL inválida');
  }

  // 1) Crea el registro en web_sources con estado pending
  const insertPayload = {
    client_id: clientId,
    // agency_id: agencyId, // <- La tabla no tiene esta columna: no enviar
    seed_url: seedUrl,
    url_root: urlRoot,
    status: 'pending',
    pages_crawled: 0,
  };

  const { data: created, error: insertError } = await supabaseAdmin
    .from('web_sources')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertError) {
    throw new Error(`No se pudo crear la fuente web: ${insertError.message}`);
  }

  // 2) Invoca de forma asíncrona la Edge Function
  try {
    // eslint-disable-next-line no-void
    void supabaseAdmin.functions.invoke('web-scraper', {
      body: { sourceId: created.id, clientId },
    });
  } catch (err) {
    await supabaseAdmin
      .from('web_sources')
      .update({ status: 'failed', error_message: `invoke error: ${err.message}` })
      .eq('id', created.id);
  }

  return created;
};

export const listWebSourcesByClient = async (clientId, agencyId) => {
  // Filtra por agency vía JOIN con clients (no requiere columna agency_id en web_sources)
  const { data, error } = await supabaseAdmin
    .from('web_sources')
    .select(
      `
      id, client_id, seed_url, url_root, status, pages_crawled, max_pages, last_url,
      error_message, started_at, completed_at, created_at, updated_at,
      client:clients!inner(agency_id)
    `
    )
    .eq('client_id', clientId)
    // Nota: si tu PostgREST no acepta 'client.agency_id', usa 'clients.agency_id'
    .eq('client.agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`No se pudieron listar las fuentes: ${error.message}`);

  // Remueve el objeto anidado 'client' del resultado
  const cleaned = (data || []).map(({ client, ...ws }) => ws);
  return cleaned;
};
