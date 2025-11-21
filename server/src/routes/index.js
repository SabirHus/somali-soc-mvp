import { Router } from 'express';
import { adminList, adminToggle, adminSummary } from '../controllers/admin.controller.js';
import { stripeWebhook } from '../controllers/webhook.controller.js';

const router = Router();

// health
router.get('/health', (_req, res) => res.json({ ok: true }));

// public summary used by Register page
router.get('/summary', async (_req, res) => {
  const { data } = await (async () => ({ data: await import('../services/attendee.service.js').then(m => m.summary()) }))();
  res.json({ data });
});

// admin
router.get('/admin/attendees', adminList);
router.post('/admin/toggle', adminToggle);
router.get('/admin/summary', adminSummary);

// stripe webhook
router.post('/webhooks/stripe', stripeWebhook);

export default router;
