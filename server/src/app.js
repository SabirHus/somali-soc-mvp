import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { prisma } from './models/prisma.js';
import { sendOrderEmail } from './services/email.service.js';
import publicRoutes from './routes/public.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import { requireAuth } from './middleware/auth.middleware.js';

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PORT = process.env.PORT || 4000;
const WEB_ORIGIN = process.env.WEB_ORIGIN || 'http://localhost:5173';

// ============================================
// WEBHOOK ROUTE (MUST BE BEFORE express.json())
// ============================================
app.post('/webhooks/stripe', 
  express.raw({ type: 'application/json' }), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('✅ Webhook received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      try {
        const { name, email, phone, quantity } = session.metadata;
        const code = `SS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const attendee = await prisma.attendee.create({
          data: {
            name,
            email,
            phone: phone || null,
            quantity: parseInt(quantity),
            status: 'PAID',
            code,
            stripeSessionId: session.id,
            checkedIn: false
          }
        });

        console.log('✅ Attendee created:', attendee.id);

        await sendOrderEmail({
          email,
          name,
          code,
          quantity: parseInt(quantity),
          amount: session.amount_total / 100
        });

        console.log('✅ Email sent to:', email);
      } catch (err) {
        console.error('❌ Error processing webhook:', err);
        return res.status(500).json({ error: 'Failed to process payment' });
      }
    }

    res.json({ received: true });
});

// ============================================
// MIDDLEWARE (AFTER WEBHOOK)
// ============================================
app.use(express.json());
app.use(cors({ 
  origin: WEB_ORIGIN,
  credentials: true 
}));

// ============================================
// ROUTES
// ============================================
app.use('/api', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAuth, adminRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Webhook endpoint: http://localhost:${PORT}/webhooks/stripe`);
});

export default app;