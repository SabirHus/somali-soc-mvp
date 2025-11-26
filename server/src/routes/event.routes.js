import { Router } from 'express';
import {
  createEventHandler,
  listEventsHandler,
  getEventHandler,
  updateEventHandler,
  deleteEventHandler,
  getEventSummaryHandler,
  getEventAttendeesHandler
} from '../controllers/event.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { adminRateLimiter } from '../middleware/rate-limit.js';
import { asyncHandler } from '../middleware/error-handler.js';

const router = Router();

// Public routes
router.get('/', asyncHandler(listEventsHandler));
router.get('/:id', asyncHandler(getEventHandler));

// Admin routes
router.post(
  '/',
  requireAuth,
  adminRateLimiter,
  asyncHandler(createEventHandler)
);

router.put(
  '/:id',
  requireAuth,
  adminRateLimiter,
  asyncHandler(updateEventHandler)
);

router.delete(
  '/:id',
  requireAuth,
  adminRateLimiter,
  asyncHandler(deleteEventHandler)
);

router.get(
  '/:id/summary',
  requireAuth,
  adminRateLimiter,
  asyncHandler(getEventSummaryHandler)
);

router.get(
  '/:id/attendees',
  requireAuth,
  adminRateLimiter,
  asyncHandler(getEventAttendeesHandler)
);

export default router;