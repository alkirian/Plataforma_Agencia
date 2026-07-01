import { createJimp } from '@jimp/core';
import { defaultFormats, defaultPlugins } from 'jimp';
import webp from '@jimp/wasm-webp';

const JimpWebp = createJimp({
  formats: [...defaultFormats, webp],
  plugins: defaultPlugins,
});

async function run() {
  try {
    console.log('Creating a 10x10 WebP image in memory...');
    const img = new JimpWebp({ width: 10, height: 10, color: 0xFF0000FF });
    
    console.log('Encoding to image/webp...');
    const buf = await img.getBuffer('image/webp');
    console.log('WebP Buffer success! Buffer length:', buf.length);
    
    console.log('Decoding WebP buffer...');
    const decodedImg = await JimpWebp.read(buf);
    console.log('WebP Decode success! Dimensions:', decodedImg.width, 'x', decodedImg.height);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
