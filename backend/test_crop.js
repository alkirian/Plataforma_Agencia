import dotenv from 'dotenv';
dotenv.config();

import { cropToAspectRatio } from './src/services/ai.service.js';
import fs from 'fs';

async function run() {
  try {
    // Usar un base64 transparente de 100x100
    const base64Str = 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH6AYXDhUAAAAAAABJREFUeNrtlEERAAAMAjHMv+lR2MHJtAECxAAAAABAAAAAQAAAAEAAAAAEAAAABAAAAAQAAAAEAAAAAEAAAABAAAAAQAAAAEAAAAAEAAAAAPgB4EAAAdF3BbgAAAAABJRU5ErkJggg==';
    
    console.log('Testing crop to 9:16...');
    const res916 = await cropToAspectRatio(base64Str, 'image/png', '9:16');
    console.log('Success 9:16! Base64 length:', res916.length);
    
    console.log('Testing crop to 16:9...');
    const res169 = await cropToAspectRatio(base64Str, 'image/png', '16:9');
    console.log('Success 16:9! Base64 length:', res169.length);
  } catch (err) {
    console.error('Critical Error:', err);
  }
}

run();
