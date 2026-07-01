import { Jimp } from 'jimp';

async function test() {
  const img = new Jimp({ width: 10, height: 10, color: 0xFF0000FF });
  console.log('getBuffer exists?', typeof img.getBuffer);
  console.log('getBufferAsync exists?', typeof img.getBufferAsync);
  try {
    const buf = await img.getBuffer('image/png');
    console.log('getBuffer png success! Buffer length:', buf.length);
  } catch (err) {
    console.error('getBuffer png failed:', err.message);
  }
}
test();
