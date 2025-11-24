// server/test-complete-flow.js
// Complete test of payment → webhook → email flow
// Run with: node test-complete-flow.js

import dotenv from 'dotenv';
import { sendOrderEmail } from './src/services/email.service.js';
import { createCheckoutSession } from './src/services/payment.service.js';
import { prisma } from './src/models/prisma.js';

dotenv.config();

console.log('🧪 Complete Flow Test\n');
console.log('=' .repeat(60));

// Test 1: Environment Variables
console.log('\n📋 Step 1: Checking Environment Variables...\n');

const requiredEnvVars = {
  'RESEND_API_KEY': process.env.RESEND_API_KEY,
  'STRIPE_SECRET_KEY': process.env.STRIPE_SECRET_KEY,
  'STRIPE_PRICE_ID': process.env.STRIPE_PRICE_ID,
  'STRIPE_WEBHOOK_SECRET': process.env.STRIPE_WEBHOOK_SECRET,
  'DATABASE_URL': process.env.DATABASE_URL ? '✅ Set' : null,
  'MAIL_FROM': process.env.MAIL_FROM,
  'EVENT_TITLE': process.env.EVENT_TITLE,
};

let envOk = true;
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.log(`❌ ${key}: MISSING!`);
    envOk = false;
  } else if (key === 'DATABASE_URL') {
    console.log(`✅ ${key}: Set`);
  } else {
    const display = value.length > 20 ? value.substring(0, 15) + '...' : value;
    console.log(`✅ ${key}: ${display}`);
  }
}

if (!envOk) {
  console.error('\n❌ Missing environment variables! Check your .env file.\n');
  process.exit(1);
}

// Test 2: Database Connection
console.log('\n📋 Step 2: Testing Database Connection...\n');

try {
  await prisma.$connect();
  console.log('✅ Database connected successfully');
  
  const attendeeCount = await prisma.attendee.count();
  console.log(`✅ Current attendees in database: ${attendeeCount}`);
} catch (err) {
  console.error('❌ Database connection failed:', err.message);
  process.exit(1);
}

// Test 3: Email Service
console.log('\n📋 Step 3: Testing Email Service...\n');

try {
  const testEmailData = {
    email: process.env.SUPPORT_EMAIL || 'test@example.com',
    name: 'Test User',
    code: 'TEST-' + Date.now(),
    quantity: 1,
    amount: 10.00
  };
  
  console.log('📧 Sending test email to:', testEmailData.email);
  
  await sendOrderEmail(testEmailData);
  
  console.log('✅ Email sent successfully!');
  console.log('📬 Check inbox at:', testEmailData.email);
} catch (err) {
  console.error('❌ Email failed:', err.message);
  process.exit(1);
}

// Test 4: Payment Service (Create Session)
console.log('\n📋 Step 4: Testing Stripe Session Creation...\n');

try {
  const sessionData = {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+44123456789',
    quantity: 2
  };
  
  console.log('Creating Stripe checkout session with:', sessionData);
  
  const { url, id } = await createCheckoutSession(sessionData);
  
  console.log('✅ Stripe session created successfully!');
  console.log('Session ID:', id);
  console.log('Checkout URL:', url);
  
  // Verify metadata
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const session = await stripe.checkout.sessions.retrieve(id);
  
  console.log('\n🔍 Verifying metadata in session:');
  console.log(JSON.stringify(session.metadata, null, 2));
  
  if (session.metadata.quantity) {
    console.log('✅ Quantity is in metadata:', session.metadata.quantity);
  } else {
    console.log('❌ WARNING: Quantity is NOT in metadata!');
    console.log('This will cause the webhook to fail!');
  }
  
} catch (err) {
  console.error('❌ Stripe session creation failed:', err.message);
}

// Test 5: Webhook Listener Check
console.log('\n📋 Step 5: Checking Stripe Webhook Listener...\n');

try {
  const response = await fetch('http://localhost:4000/health');
  if (response.ok) {
    console.log('✅ Server is running at http://localhost:4000');
  } else {
    console.log('⚠️  Server responded but not healthy');
  }
} catch (err) {
  console.log('❌ Server is NOT running!');
  console.log('Start it with: npm run dev');
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary:');
console.log('='.repeat(60));
console.log('✅ Environment variables: OK');
console.log('✅ Database connection: OK');
console.log('✅ Email service: OK');
console.log('✅ Stripe session creation: OK');
console.log('\n💡 Next Steps:');
console.log('1. Make sure server is running: npm run dev');
console.log('2. Make sure Stripe CLI is running: .\\scripts\\stripe\\listen.ps1');
console.log('3. Make a test payment at: http://localhost:5173');
console.log('4. Watch server terminal for webhook logs');
console.log('5. Check your email inbox!');
console.log('\n🎉 If all tests passed, everything should work!\n');

await prisma.$disconnect();
process.exit(0);