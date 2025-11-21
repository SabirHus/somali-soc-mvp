import 'dotenv/config';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 4000;
const WEB_ORIGIN = process.env.WEB_ORIGIN || process.env.APP_URL || 'http://localhost:5173';

// NOTE: If you verify Stripe signatures you need the raw body:
app.use((req, res, next) => {
  if (req.originalUrl === '/webhooks/stripe') {
    // raw buffer body (Express v4)
    let data = Buffer.alloc(0);
    req.setEncoding('utf8');
    req.on('data', (chunk) => { data += chunk; });
    req.on('end', () => { req.rawBody = data; next(); });
  } else {
    next();
  }
});

app.use(helmet());
app.use(morgan('dev'));
app.use(cors({ origin: WEB_ORIGIN, credentials: true }));
app.use(express.json());

// routes
app.use('/', routes);

app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
  console.log(`CORS origin: ${WEB_ORIGIN}`);
});
