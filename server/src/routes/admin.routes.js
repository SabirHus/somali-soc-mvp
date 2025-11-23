import express from 'express';
import { adminList, adminToggle } from '../controllers/admin.controller.js';

const router = express.Router();

// All routes here are already protected by requireAuth middleware in app.js
router.get('/attendees', adminList);
router.post('/toggle-checkin', adminToggle);

export default router;