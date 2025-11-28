// server/src/config/cors.js

import cors from "cors";

// WEB_ORIGIN can be a single URL or a comma-separated list
const rawOrigins = process.env.WEB_ORIGIN || "";

// Normalise to an array of trimmed, non-empty URLs
const allowedOrigins = rawOrigins
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

console.log("[CORS] Allowed origins:", allowedOrigins);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests without an Origin header (curl, health checks, etc.)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      // Origin is allowed – echo it back so the browser is happy
      return callback(null, true);
    }

    console.warn("[CORS] Blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});
