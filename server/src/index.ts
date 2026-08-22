import express from 'express';
import cors from 'cors';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './lib/auth';
import { prisma } from './lib/db';

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

// Admin: Update Member Profile, Role & Subscription Plan
app.put('/api/admin/members/:id', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
    }

    const { id } = req.params;
    const { name, email, role, plan, planStatus, password } = req.body;

    // Check if target user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Check if email changed and is already taken
    if (email && email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailInUse) {
        return res.status(400).json({ error: 'Email address is already in use by another member.' });
      }
    }

    // Update user properties
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(email ? { email: email.toLowerCase().trim() } : {}),
        ...(role && (role === 'admin' || role === 'user') ? { role } : {}),
        ...(plan && ['basic', 'pro', 'elite'].includes(plan) ? { plan } : {}),
        ...(planStatus ? { planStatus } : {}),
      },
    });

    // If new password is provided, update password via Better Auth API
    if (password && password.length >= 8) {
      try {
        await auth.api.setUserPassword({
          body: {
            userId: id,
            newPassword: password,
          },
          headers: fromNodeHeaders(req.headers),
        });
      } catch (pwdErr) {
        console.error('Password update warning:', pwdErr);
      }
    }

    return res.json({
      success: true,
      message: `Member "${updatedUser.name}" updated successfully.`,
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return res.status(500).json({ error: error.message || 'Internal server error while updating member.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 GymFlow Backend Server running on http://localhost:${PORT}`);
});
