import { validateData } from '../schemas/validation.js';
import { brandAssetSchema } from '../schemas/validation.js';
import { createBrandAsset, deleteBrandAsset, getBrandAssetsByClient } from '../services/brandAssets.service.js';

export const handleGetBrandAssets = async (req, res, next) => {
  try {
    const token = req.token || req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const assets = await getBrandAssetsByClient(clientId, token);
    res.status(200).json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

export const handleCreateBrandAsset = async (req, res, next) => {
  try {
    const token = req.token || req.headers.authorization?.split(' ')[1];
    const { clientId } = req.params;
    const validation = validateData(brandAssetSchema, req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors,
      });
    }

    const asset = await createBrandAsset(clientId, validation.data, token, req.user?.id);
    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteBrandAsset = async (req, res, next) => {
  try {
    const token = req.token || req.headers.authorization?.split(' ')[1];
    const { clientId, assetId } = req.params;
    const asset = await deleteBrandAsset(clientId, assetId, token);
    res.status(200).json({ success: true, data: asset });
  } catch (error) {
    next(error);
  }
};
