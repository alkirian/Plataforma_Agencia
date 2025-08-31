import { supabaseAdmin } from '../config/supabaseClient.js';
import { getUserAgencyId } from '../helpers/userHelpers.js';

export const handleUpdateClientMeta = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const agencyId = await getUserAgencyId(req.user.id);
    const { website, social_links } = req.body || {};

    const updates = {};
    if (typeof website === 'string') updates.website = website || null;
    if (social_links && typeof social_links === 'object') updates.social_links = social_links;
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: 'Sin cambios' });

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

