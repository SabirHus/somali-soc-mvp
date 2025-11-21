import { Router } from "express";
import { envCheck } from "../controllers/env.controller.js";
// ... existing imports

const router = Router();

// existing routes...
router.get("/health", (req, res) => res.json({ ok: true }));

// NEW
router.get("/env-check", envCheck);

export default router;
