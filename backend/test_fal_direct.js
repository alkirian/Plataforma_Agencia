import 'dotenv/config';
import axios from 'axios';

console.log('Testing Fal.ai image generation with polling...');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  let response = await axios.post(
    'https://queue.fal.run/fal-ai/flux/schnell',
    {
      prompt: 'A professional minimalist background for a plant shop with clean lighting',
      image_size: 'square'
    },
    {
      headers: {
        'Authorization': `Key ${process.env.FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  let data = response.data;
  console.log(`Submitted to queue. ID: ${data.request_id}. Position: ${data.queue_position}`);

  while (data.status === 'IN_QUEUE' || data.status === 'IN_PROGRESS') {
    await delay(1500);
    const statusResponse = await axios.get(data.status_url, {
      headers: { 'Authorization': `Key ${process.env.FAL_KEY}` }
    });
    data = statusResponse.data;
    console.log(`Polling status: ${data.status}...`);
  }

  if (data.status === 'COMPLETED') {
    const resultResponse = await axios.get(data.response_url, {
      headers: { 'Authorization': `Key ${process.env.FAL_KEY}` }
    });
    console.log('Success! Result:', JSON.stringify(resultResponse.data, null, 2));
  } else {
    console.error('Failed or cancelled. Data:', data);
  }
} catch (e) {
  console.error('Error during Fal.ai test:', e.response?.data || e.message);
}
