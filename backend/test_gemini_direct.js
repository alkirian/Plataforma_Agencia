import 'dotenv/config';
import { generateImageWithAI } from './src/services/ai.service.js';

console.log('Testing image generation...');
try {
  const result = await generateImageWithAI({
    prompt: 'A professional minimalist background for a plant shop with clean lighting',
    aspectRatio: '1:1'
  });
  console.log('Success! Base64 length:', result.base64 ? result.base64.length : 0);
} catch (e) {
  console.error('Error during test:', e);
}
