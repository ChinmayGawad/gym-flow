import express from 'express';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup for frontend client
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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
