import { Jimp } from 'jimp';

console.log('Testing Jimp crop function...');
try {
  // Create a blank 1024x1536 image in memory using Jimp
  const image = new Jimp({ width: 1024, height: 1536, color: 0xFF0000FF }); // Solid red
  console.log('Original size:', image.width, 'x', image.height);
  
  // Crop to 4:5 (1024x1280)
  image.crop({ x: 0, y: 128, w: 1024, h: 1280 });
  console.log('Cropped size:', image.width, 'x', image.height);
  
  // Get buffer
  const buffer = await image.getBuffer('image/png');
  console.log('Buffer length:', buffer.length);
  console.log('Jimp test successful!');
} catch (e) {
  console.error('Jimp test failed:', e);
}
