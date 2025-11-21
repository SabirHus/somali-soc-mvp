// server/src/app.js
// WHY: Central Express app wiring with correct Stripe webhook order.

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import routes from "./routes/index.js";
import webhookRoutes from "./routes/webhook.routes.js"; // contains /webhooks/stripe (raw body)

const app = express();

/**
 * CORS
 * - Allow your local web app origin (set WEB_ORIGIN in .env).
 * - Allow no-origin requests (curl/CLI).
 */
const WEB_ORIGIN = process.env.WEB_ORIGIN || "http://localhost:5173";
app.use(
    cors({
        origin(origin, cb) {
            if (!origin) return cb(null, true); // allow curl/Postman
            if (origin === WEB_ORIGIN) return cb(null, true);
            return cb(null, false);
        },
        credentials: true,
    })
);

// Security headers + request logging + cookies
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());

/**
 * IMPORTANT: Mount webhook route BEFORE express.json()
 * Stripe requires the exact raw request body to verify signatures.
 * webhookRoutes defines: POST /webhooks/stripe with express.raw({ type: "application/json" })
 */
app.use(webhookRoutes);

// JSON parser for all normal API routes
app.use(express.json());

/**
 * Health check (simple)
 * Note: You may also have /api/health inside routes; keeping a top-level /health is convenient.
 */
app.get("/health", (req, res) => res.json({ ok: true }));

/**
 * Main API
 */
app.use("/api", routes);

/**
 * 404 (not found) for unmatched routes
 */
app.use((req, res, next) => {
    res.status(404).json({ error: "not_found", path: req.originalUrl });
});

/**
 * Central error handler
 */
app.use((err, req, res, next) => {
    // Only log minimal info; avoid leaking secrets
    // WHY: Prevents noisy crashes; gives consistent error response
    console.error("Unhandled error:", err?.message || err);
    res.status(500).json({ error: "server_error" });
});

export default app;
