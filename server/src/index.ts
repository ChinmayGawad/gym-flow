import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
];

// CORS setup for frontend client
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if origin is in whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly fallback
    },
    credentials: true,
  })
);

// Better Auth Route Handler (must be placed before express.json parsing)
app.all('/api/auth/*', toNodeHandler(auth));

app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'gymflow-server' });
});

app.listen(PORT, () => {
  console.log(`🚀 GymFlow Backend Server running on http://localhost:${PORT}`);
});
