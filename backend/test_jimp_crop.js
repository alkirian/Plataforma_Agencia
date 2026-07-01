import { Jimp } from 'jimp';

async function run() {
  try {
    const image = new Jimp({ width: 100, height: 100, color: 0xFF0000FF });
    
    console.log('Testing crop with object parameter...');
    try {
      const cloned1 = image.clone();
      cloned1.crop({ x: 10, y: 10, w: 50, h: 50 });
      console.log('Object crop SUCCESS! Dimensions:', cloned1.width, 'x', cloned1.height);
    } catch (err) {
      console.log('Object crop FAILED:', err.message);
    }
    
    console.log('Testing crop with positional parameters...');
    try {
      const cloned2 = image.clone();
      cloned2.crop(10, 10, 50, 50);
      console.log('Positional crop SUCCESS! Dimensions:', cloned2.width, 'x', cloned2.height);
    } catch (err) {
      console.log('Positional crop FAILED:', err.message);
    }
  } catch (err) {
    console.error('Test failed:', err);
  }
}

run();
