// server/src/config/cors.js

import cors from 'cors';

// Read allowed origins from env (comma-separated)
const rawOrigins = process.env.WEB_ORIGIN || '';
export const allowedOrigins = rawOrigins
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

// Optional: log once at startup so you can see what’s actually allowed
console.log('CORS: allowed origins =>', allowedOrigins);

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow non-browser tools / same-origin (no Origin header)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS: blocked origin ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
