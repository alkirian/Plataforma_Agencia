import { apiFetch } from './apiFetch.js';
import { supabase } from '../supabaseClient.js';

const BUCKET_NAME = 'brand-assets';

export const getBrandAssets = async clientId => {
  const resp = await apiFetch(`/clients/${clientId}/brand-assets`);
  return resp?.data ?? [];
};

export const getBrandAssetsWithPreview = async clientId => {
  const assets = await getBrandAssets(clientId);
  const enriched = await Promise.all(
    assets.map(async asset => {
      if (!asset.storage_path) return { ...asset, preview_url: null };
      const mime = asset.mime_type || '';
      const isVisual = mime.startsWith('image/') || mime.startsWith('video/');
      if (!isVisual) return { ...asset, preview_url: null };

      const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(asset.storage_path, 60 * 30);
      if (error || !data?.signedUrl) return { ...asset, preview_url: null };
      return { ...asset, preview_url: data.signedUrl };
    })
  );
  return enriched;
};

export const createBrandAsset = async (clientId, payload) => {
  const resp = await apiFetch(`/clients/${clientId}/brand-assets`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return resp?.data ?? resp;
};

export const uploadBrandAsset = async (clientId, file, options = {}) => {
  const safeName = file.name.replace(/\s+/g, '-');
  const storagePath = `${clientId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(storagePath, file);
  if (uploadError) throw uploadError;

  return createBrandAsset(clientId, {
    file_name: file.name,
    storage_path: storagePath,
    mime_type: file.type || null,
    size_bytes: file.size || null,
    asset_type: options.asset_type || 'reference',
    notes: options.notes || null,
  });
};

export const deleteBrandAsset = async (clientId, assetId) => {
  const assets = await getBrandAssets(clientId);
  const asset = assets.find(item => item.id === assetId);

  if (asset?.storage_path) {
    await supabase.storage.from(BUCKET_NAME).remove([asset.storage_path]);
  }

  const resp = await apiFetch(`/clients/${clientId}/brand-assets/${assetId}`, {
    method: 'DELETE',
  });
  return resp?.data ?? resp;
};
