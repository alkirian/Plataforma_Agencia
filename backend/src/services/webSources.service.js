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

  // Idempotencia: si ya existe una fuente para (client_id, url_root),
  // reusar o reencolar según su estado.
  const { data: existing, error: existingError } = await supabaseAdmin
    .from('web_sources')
    .select('*')
    .eq('client_id', clientId)
    .eq('url_root', urlRoot)
    .maybeSingle();

  if (existingError) {
    // No lanzamos error duro; continuamos a insert como fallback
    // pero log de servidor sería útil
    // console.warn('Lookup web_source error:', existingError);
  }

  if (existing) {
    // Si ya está en curso, devolvemos tal cual
    if (existing.status === 'pending' || existing.status === 'scraping') {
      // Fire-and-forget re-invoke is optional; evitamos tormenta de invocaciones
      return existing;
    }

    // Si estaba completed/failed, reseteamos y reencolamos
    const resetPayload = {
      status: 'pending',
      pages_crawled: 0,
      error_message: null,
      last_url: null,
      started_at: null,
      completed_at: null,
      seed_url: seedUrl, // actualiza semilla si cambió
    };

    const { data: updated, error: upError } = await supabaseAdmin
      .from('web_sources')
      .update(resetPayload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (upError) {
      throw new Error(`No se pudo reencolar la fuente web: ${upError.message}`);
    }

    try {
      // eslint-disable-next-line no-void
      void supabaseAdmin.functions.invoke('web-scraper', {
        body: { sourceId: updated.id, clientId },
      });
    } catch (err) {
      await supabaseAdmin
        .from('web_sources')
        .update({ status: 'failed', error_message: `invoke error: ${err.message}` })
        .eq('id', updated.id);
    }

    return updated;
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

  // Duplicado por condición de carrera o doble submit: recuperar y reusar
  if (insertError) {
    const msg = (insertError.message || '').toLowerCase();
    const details = (insertError.details || '').toLowerCase();
    const isDup = insertError.code === '23505' || insertError.status === 409 || msg.includes('duplicate key') || details.includes('duplicate');
    if (isDup) {
      const { data: dup, error: fetchDupErr } = await supabaseAdmin
        .from('web_sources')
        .select('*')
        .eq('client_id', clientId)
        .eq('url_root', urlRoot)
        .maybeSingle();
      if (!fetchDupErr && dup) return dup;
    }
  }

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
