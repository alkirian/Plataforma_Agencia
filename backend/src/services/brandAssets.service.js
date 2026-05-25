import { createAuthenticatedClient } from '../config/supabaseClient.js';

const ensureClientAccess = async (supabaseAuth, clientId) => {
  const { data: client, error } = await supabaseAuth
    .from('clients')
    .select('id, agency_id')
    .eq('id', clientId)
    .single();

  if (error || !client) {
    throw new Error('Cliente no encontrado.');
  }

  return client;
};

export const getBrandAssetsByClient = async (clientId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  await ensureClientAccess(supabaseAuth, clientId);

  const { data, error } = await supabaseAuth
    .from('brand_assets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

export const createBrandAsset = async (clientId, assetData, token, userId = null) => {
  const supabaseAuth = createAuthenticatedClient(token);
  const client = await ensureClientAccess(supabaseAuth, clientId);

  const payload = {
    ...assetData,
    client_id: clientId,
    agency_id: client.agency_id,
    created_by: userId || null,
  };

  const { data, error } = await supabaseAuth
    .from('brand_assets')
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteBrandAsset = async (clientId, assetId, token) => {
  const supabaseAuth = createAuthenticatedClient(token);
  await ensureClientAccess(supabaseAuth, clientId);

  const { data: asset, error: findError } = await supabaseAuth
    .from('brand_assets')
    .select('id, storage_path, client_id')
    .eq('id', assetId)
    .eq('client_id', clientId)
    .single();

  if (findError || !asset) throw new Error('Asset no encontrado.');

  const { error } = await supabaseAuth
    .from('brand_assets')
    .delete()
    .eq('id', assetId)
    .eq('client_id', clientId);

  if (error) throw new Error(error.message);
  return asset;
};
