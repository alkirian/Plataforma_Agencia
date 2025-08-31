import { supabaseAdmin } from '../config/supabaseClient.js';
import { getUserAgencyId } from '../helpers/userHelpers.js';

export const handleUpdateClientMeta = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const { website, social_links, name, industry } = req.body || {};

    const updates = {};
    if (typeof website === 'string') updates.website = website || null;
    if (social_links && typeof social_links === 'object') updates.social_links = social_links;
    if (typeof name === 'string') updates.name = name.trim();
    if (typeof industry === 'string') updates.industry = industry.trim();
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: 'Sin cambios' });

    // Si se actualiza el nombre, validar unicidad por agencia (case-insensitive)
    if (updates.name) {
      const nameToCheck = updates.name;
      const { data: existing, error: existErr } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('agency_id', agencyId)
        .ilike('name', nameToCheck)
        .neq('id', clientId);
      if (existErr) return res.status(400).json({ success: false, message: existErr.message });
      if (existing && existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Ya existe un cliente con ese nombre en tu agencia.' });
      }
    }

    const { data, error } = await supabaseAdmin
      .from('clients')
      .update(updates)
      .eq('id', clientId)
      .eq('agency_id', agencyId)
      .select('*')
      .single();

    if (error) return res.status(400).json({ success: false, message: error.message });
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// Preferencias por usuario para clientes (p.ej. color de tarjeta)
export const handleGetClientUserPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { data, error } = await supabaseAdmin
      .from('client_user_preferences')
      .select('client_id, color, pinned, favorite')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    const map = {};
    (data || []).forEach(row => { map[row.client_id] = { color: row.color, pinned: !!row.pinned, favorite: !!row.favorite }; });
    res.status(200).json({ success: true, data: map });
  } catch (error) {
    next(error);
  }
};

export const handleUpsertClientUserPreference = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { clientId } = req.params;
    const { color, pinned, favorite } = req.body || {};
    if (!clientId) return res.status(400).json({ success: false, message: 'clientId requerido' });
    const row = { user_id: userId, client_id: clientId };
    if (color === null) row.color = null; // permitir limpiar color
    if (typeof color === 'string' && color.trim()) row.color = color.trim();
    if (typeof pinned === 'boolean') row.pinned = pinned;
    if (typeof favorite === 'boolean') row.favorite = favorite;
    if (!('color' in row) && !('pinned' in row) && !('favorite' in row)) {
      return res.status(400).json({ success: false, message: 'Sin cambios' });
    }
    const { data, error } = await supabaseAdmin
      .from('client_user_preferences')
      .upsert(row, { onConflict: 'user_id,client_id' })
      .select('client_id, color, pinned, favorite')
      .single();
    if (error) throw new Error(error.message);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteClientUserPreference = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { clientId } = req.params;
    if (!clientId) return res.status(400).json({ success: false, message: 'clientId requerido' });
    const { error } = await supabaseAdmin
      .from('client_user_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('client_id', clientId);
    if (error) throw new Error(error.message);
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const handleListContacts = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const { data, error } = await supabaseAdmin
      .from('client_contacts')
      .select('*')
      .eq('client_id', clientId)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    next(error);
  }
};

export const handleUpsertContacts = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const contacts = Array.isArray(req.body?.contacts) ? req.body.contacts : [];
    if (!contacts.length) return res.status(400).json({ success: false, message: 'contacts requerido' });

    // Sanitize
    const rows = contacts.map(c => ({
      id: c.id || undefined,
      client_id: clientId,
      agency_id: agencyId,
      name: String(c.name || '').trim().slice(0, 100) || null,
      email: String(c.email || '').trim().slice(0, 150) || null,
      phone: String(c.phone || '').trim().slice(0, 40) || null,
      role: String(c.role || '').trim().slice(0, 80) || null,
    }));

    const { data, error } = await supabaseAdmin
      .from('client_contacts')
      .upsert(rows)
      .select('*');
    if (error) throw new Error(error.message);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteContact = async (req, res, next) => {
  try {
    const { clientId, contactId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const { error } = await supabaseAdmin
      .from('client_contacts')
      .delete()
      .eq('id', contactId)
      .eq('client_id', clientId)
      .eq('agency_id', agencyId);
    if (error) throw new Error(error.message);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
