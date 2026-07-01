// Utility to extract dominant brand colors from uploaded logos using a hidden canvas
export const extractDominantColor = (base64Image) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = base64Image;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 50;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, 50, 50);
        const imgData = ctx.getImageData(0, 0, 50, 50).data;

        const colorCounts = {};
        let dominantColor = null;
        let maxCount = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Ignore fully transparent or highly semi-transparent pixels
          if (a < 180) continue;

          // Ignore extreme darks (black), lights (white) and neutrals (grays)
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          const diff = maxVal - minVal;

          // Ignore if difference is small (gray) or colors are too close to limits
          if (diff < 30 || (r < 50 && g < 50 && b < 50) || (r > 225 && g > 225 && b > 225)) {
            continue;
          }

          // Round values to group similar color shades together
          const roundR = Math.round(r / 12) * 12;
          const roundG = Math.round(g / 12) * 12;
          const roundB = Math.round(b / 12) * 12;
          const rgbKey = `${roundR},${roundG},${roundB}`;

          colorCounts[rgbKey] = (colorCounts[rgbKey] || 0) + 1;
          if (colorCounts[rgbKey] > maxCount) {
            maxCount = colorCounts[rgbKey];
            dominantColor = { r: roundR, g: roundG, b: roundB };
          }
        }

        if (dominantColor) {
          const toHex = (c) => {
            const hex = Math.min(255, Math.max(0, c)).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
          };
          const hexColor = `#${toHex(dominantColor.r)}${toHex(dominantColor.g)}${toHex(dominantColor.b)}`;
          resolve(hexColor);
        } else {
          resolve(null);
        }
      } catch (err) {
        console.error('Error extracting color from image canvas:', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
  });
};
