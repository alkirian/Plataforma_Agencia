import sharp from 'sharp';

export const cropToAspectRatioSharp = async (base64Str, mimeType, aspectRatio) => {
  if (!base64Str || base64Str.length < 100) return base64Str;
  if (mimeType && mimeType.includes('svg')) return base64Str;

  try {
    const imgBuffer = Buffer.from(base64Str, 'base64');
    
    // 1. Get metadata
    const metadata = await sharp(imgBuffer).metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    const channels = metadata.channels || 4;

    const parts = aspectRatio.split(':');
    if (parts.length !== 2) return base64Str;

    const targetW = parseFloat(parts[0]);
    const targetH = parseFloat(parts[1]);
    const targetRatio = targetW / targetH;
    const currentRatio = originalWidth / originalHeight;

    const ratioDiff = Math.abs(currentRatio - targetRatio) / currentRatio;

    // Map mimeType to sharp format extension
    let formatExtension = 'png';
    if (mimeType) {
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) formatExtension = 'jpeg';
      else if (mimeType.includes('webp')) formatExtension = 'webp';
      else if (mimeType.includes('gif')) formatExtension = 'gif';
    }

    // 1. Sutil stretching if difference is tiny (<= 3%)
    if (ratioDiff <= 0.03) {
      console.log(`📏 [Sharp Crop] Relación muy similar (diff: ${(ratioDiff * 100).toFixed(1)}%). Redimensionando sutilmente.`);
      const resizedBuffer = await sharp(imgBuffer)
        .resize(originalWidth, Math.round(originalWidth / targetRatio))
        .toFormat(formatExtension)
        .toBuffer();
      return resizedBuffer.toString('base64');
    }

    // 2. Determine target canvas dimensions
    let finalW = originalWidth;
    let finalH = Math.round(originalWidth / targetRatio);

    if (finalH > 2048) {
      finalH = 2048;
      finalW = Math.round(finalH * targetRatio);
    } else if (finalW > 2048) {
      finalW = 2048;
      finalH = Math.round(finalW / targetRatio);
    }

    console.log(`🎨 [Sharp Crop] Adaptando de ${originalWidth}x${originalHeight} a ${finalW}x${finalH} (Relación ${aspectRatio}) usando relleno.`);

    // 3. Extract borders for solid color detection
    const topPixels = await sharp(imgBuffer).extract({ left: 0, top: 0, width: originalWidth, height: 1 }).raw().toBuffer();
    const bottomPixels = await sharp(imgBuffer).extract({ left: 0, top: originalHeight - 1, width: originalWidth, height: 1 }).raw().toBuffer();
    const leftPixels = await sharp(imgBuffer).extract({ left: 0, top: 0, width: 1, height: originalHeight }).raw().toBuffer();
    const rightPixels = await sharp(imgBuffer).extract({ left: originalWidth - 1, top: 0, width: 1, height: originalHeight }).raw().toBuffer();

    const rgbColors = [];

    // Sample from top/bottom borders (10 points)
    for (let i = 0; i < 10; i++) {
      const x = Math.floor((originalWidth - 1) * (i / 9));
      const topIdx = x * channels;
      rgbColors.push({
        r: topPixels[topIdx],
        g: topPixels[topIdx + 1],
        b: topPixels[topIdx + 2],
        a: channels === 4 ? topPixels[topIdx + 3] : 255
      });
      const botIdx = x * channels;
      rgbColors.push({
        r: bottomPixels[botIdx],
        g: bottomPixels[botIdx + 1],
        b: bottomPixels[botIdx + 2],
        a: channels === 4 ? bottomPixels[botIdx + 3] : 255
      });
    }

    // Sample from left/right borders (10 points)
    for (let i = 0; i < 10; i++) {
      const y = Math.floor((originalHeight - 1) * (i / 9));
      const leftIdx = y * channels;
      rgbColors.push({
        r: leftPixels[leftIdx],
        g: leftPixels[leftIdx + 1],
        b: leftPixels[leftIdx + 2],
        a: channels === 4 ? leftPixels[leftIdx + 3] : 255
      });
      const rightIdx = y * channels;
      rgbColors.push({
        r: rightPixels[rightIdx],
        g: rightPixels[rightIdx + 1],
        b: rightPixels[rightIdx + 2],
        a: channels === 4 ? rightPixels[rightIdx + 3] : 255
      });
    }

    const avgR = rgbColors.reduce((sum, c) => sum + c.r, 0) / rgbColors.length;
    const avgG = rgbColors.reduce((sum, c) => sum + c.g, 0) / rgbColors.length;
    const avgB = rgbColors.reduce((sum, c) => sum + c.b, 0) / rgbColors.length;
    const avgA = rgbColors.reduce((sum, c) => sum + c.a, 0) / rgbColors.length;

    const varianceR = rgbColors.reduce((sum, c) => sum + Math.pow(c.r - avgR, 2), 0) / rgbColors.length;
    const varianceG = rgbColors.reduce((sum, c) => sum + Math.pow(c.g - avgG, 2), 0) / rgbColors.length;
    const varianceB = rgbColors.reduce((sum, c) => sum + Math.pow(c.b - avgB, 2), 0) / rgbColors.length;
    const stdDev = Math.sqrt((varianceR + varianceG + varianceB) / 3);

    console.log(`📊 [Sharp Crop] Desviación estándar de bordes: ${stdDev.toFixed(2)}`);

    let bgBuffer;
    let isSolid = stdDev < 18 && avgA > 200;

    if (isSolid) {
      console.log(`🧼 [Sharp Crop] Fondo sólido detectado. Color de relleno: rgba(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)}, ${(avgA/255).toFixed(2)})`);
    } else {
      console.log(`🖼️ [Sharp Crop] Fondo complejo detectado. Generando relleno desenfocado.`);
      let bgScaleFactor;
      if (currentRatio > targetRatio) {
        bgScaleFactor = finalH / originalHeight;
      } else {
        bgScaleFactor = finalW / originalWidth;
      }
      const bgW = Math.round(originalWidth * bgScaleFactor);
      const bgH = Math.round(originalHeight * bgScaleFactor);

      bgBuffer = await sharp(imgBuffer)
        .resize(bgW, bgH)
        .extract({
          left: Math.round((bgW - finalW) / 2),
          top: Math.round((bgH - finalH) / 2),
          width: finalW,
          height: finalH
        })
        .blur(30)
        .toBuffer();
    }

    // 5. Scale foreground to fit inside the canvas (contain)
    let fgScaleFactor;
    if (currentRatio > targetRatio) {
      fgScaleFactor = finalW / originalWidth;
    } else {
      fgScaleFactor = finalH / originalHeight;
    }

    const fgW = Math.round(originalWidth * fgScaleFactor);
    const fgH = Math.round(originalHeight * fgScaleFactor);

    const fgBuffer = await sharp(imgBuffer)
      .resize(fgW, fgH)
      .toBuffer();

    const posX = Math.round((finalW - fgW) / 2);
    const posY = Math.round((finalH - fgH) / 2);

    let finalImageBuffer;
    if (isSolid) {
      finalImageBuffer = await sharp({
        create: {
          width: finalW,
          height: finalH,
          channels: 4,
          background: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB), alpha: avgA / 255 }
        }
      })
      .composite([{ input: fgBuffer, left: posX, top: posY }])
      .toFormat(formatExtension)
      .toBuffer();
    } else {
      finalImageBuffer = await sharp(bgBuffer)
        .composite([{ input: fgBuffer, left: posX, top: posY }])
        .toFormat(formatExtension)
        .toBuffer();
    }

    return finalImageBuffer.toString('base64');
  } catch (err) {
    console.error('⚠️ [Sharp Crop] Error al adaptar imagen:', err.message);
  }
  return base64Str;
};

// Run local test with 9:16 crop on real image
async function test() {
  try {
    const url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop';
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();
    const base64Str = Buffer.from(buffer).toString('base64');
    
    console.log('Testing sharp crop of real image to 9:16...');
    const res916 = await cropToAspectRatioSharp(base64Str, 'image/jpeg', '9:16');
    console.log('Success! Base64 length:', res916.length);

    console.log('Testing sharp crop of real image to 9:16 with webp mime type...');
    const resWebp = await cropToAspectRatioSharp(base64Str, 'image/webp', '9:16');
    console.log('Success! Base64 length:', resWebp.length);
  } catch (err) {
    console.error('Test failed:', err);
  }
}
test();
