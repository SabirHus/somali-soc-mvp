import express from "express";
import { stripeWebhook } from "../controllers/webhook.controller.js";

const router = express.Router();

// WHY raw: Stripe signature requires the exact raw payload
router.post("/webhooks/stripe", express.raw({ type: "application/json" }), stripeWebhook);

export default router;
