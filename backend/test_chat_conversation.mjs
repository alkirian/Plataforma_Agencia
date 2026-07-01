import 'dotenv/config';
import { handleChatConversation } from './src/services/ai.service.js';

async function run() {
  const clientId = '121b35f7-db69-44ee-ae83-3c9d569a340c';
  const token = process.env.SUPABASE_SERVICE_KEY;
  const userPrompt = 'Generar 3 ideas de posts alineadas con los pilares de mi marca y mi tono.';
  
  console.log('Calling handleChatConversation for client:', clientId);
  try {
    const result = await handleChatConversation({
      clientId,
      userPrompt,
      chatHistory: [],
      token,
      agentId: 'brand_coach'
    });
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error during execution:', err);
  }
}

run();
