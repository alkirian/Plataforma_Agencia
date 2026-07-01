import dotenv from 'dotenv';
dotenv.config();

import { cropToAspectRatio } from './src/services/ai.service.js';

async function run() {
  try {
    const url = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200&auto=format&fit=crop';
    const resp = await fetch(url);
    const buffer = await resp.arrayBuffer();
    const base64Str = Buffer.from(buffer).toString('base64');
    
    console.log('Testing crop of real image to 9:16...');
    const res916 = await cropToAspectRatio(base64Str, 'image/jpeg', '9:16');
    console.log('Success! Base64 length:', res916.length);
  } catch (err) {
    console.error('Critical Error:', err);
  }
}

run();
