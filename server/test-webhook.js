// server/test-webhook.js
import { sendOrderEmail } from './src/services/email.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testWebhookEmail() {
  console.log('Testing webhook email flow...\n');
  
  // Simulate what webhook does
  const testData = {
    email: 'sabhus191@example.com', // ← PUT YOUR EMAIL HERE
    name: 'Webhook Test User',
    code: 'WEBHOOK-' + Date.now(),
    quantity: 1,
    amount: 5.00
  };
  
  console.log('Sending email with data:', testData);
  
  try {
    await sendOrderEmail(testData);
    console.log('\n✅ SUCCESS! Webhook email flow works!');
  } catch (error) {
    console.error('\n❌ FAILED!', error);
  }
}

testWebhookEmail();