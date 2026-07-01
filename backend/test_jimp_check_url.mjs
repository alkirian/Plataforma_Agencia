import { Jimp } from 'jimp';

async function run() {
  try {
    const url = 'https://inoremwazicuzbsehzax.supabase.co/storage/v1/object/public/content-assets/27ba0a50-e4d3-4342-97d1-b5b169e1b3f3/design/adapt-9-16-1781710917964.png';
    console.log('Downloading image:', url);
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP Error: ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const image = await Jimp.read(buffer);
    console.log(`Image properties:`);
    console.log(`- Width: ${image.width}`);
    console.log(`- Height: ${image.height}`);
    console.log(`- Aspect Ratio: ${(image.width / image.height).toFixed(4)}`);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
