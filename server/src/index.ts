import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
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

// Helper to get or create Gym Settings (Default Capacity: 30)
async function getOrCreateGymSettings() {
  let settings = await prisma.gymSettings.findUnique({
    where: { id: 'default' },
  });
  if (!settings) {
    settings = await prisma.gymSettings.create({
      data: {
        id: 'default',
        capacity: 30,
        gymName: 'GymFlow Fitness',
      },
    });
  }
  return settings;
}

// 1. GET /api/gym/status - Real-time Gym Status, Capacity & Occupancy
app.get('/api/gym/status', async (req, res) => {
  try {
    const settings = await getOrCreateGymSettings();
    const capacity = settings.capacity;

    // Registered members in system
    const totalRegisteredMembers = await prisma.user.count();

    // Checked-in members
    const checkedInCount = await prisma.user.count({
      where: { isCheckedIn: true },
    });

    // Check if current user is signed in & their check-in state
    let isCheckedInSelf = false;
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user?.id) {
        const currentUser = await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { isCheckedIn: true },
        });
        isCheckedInSelf = !!currentUser?.isCheckedIn;
      }
    } catch {
      // Unauthenticated visitor
      isCheckedInSelf = false;
    }

    const percentage = Math.round((checkedInCount / capacity) * 100);
    const turnoutPercentage =
      totalRegisteredMembers > 0
        ? Math.round((checkedInCount / totalRegisteredMembers) * 100)
        : 0;

    let status = 'MODERATE';
    let waitTime = '10 min';

    if (percentage < 40) {
      status = 'LOW';
      waitTime = '0–5 min';
    } else if (percentage < 75) {
      status = 'MODERATE';
      waitTime = '10 min';
    } else {
      status = 'HIGH';
      waitTime = '15–25 min';
    }

    return res.json({
      success: true,
      peopleCount: checkedInCount,
      capacity,
      totalRegisteredMembers,
      percentage,
      turnoutPercentage,
      status,
      waitTime,
      isCheckedInSelf,
      gymName: settings.gymName,
    });
  } catch (error: any) {
    console.error('Error fetching gym status:', error);
    return res.status(500).json({ error: 'Failed to fetch gym status.' });
  }
});

// 2. POST /api/gym/checkin-toggle - Member Self Check-In / Check-Out
app.post('/api/gym/checkin-toggle', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Authentication required to check in.' });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newCheckedInState = !user.isCheckedIn;

    if (newCheckedInState) {
      // Member is checking IN
      await prisma.user.update({
        where: { id: userId },
        data: {
          isCheckedIn: true,
          lastCheckInAt: new Date(),
        },
      });

      // Create new VisitLog record
      await prisma.visitLog.create({
        data: {
          userId,
          checkInTime: new Date(),
        },
      });
    } else {
      // Member is checking OUT
      await prisma.user.update({
        where: { id: userId },
        data: {
          isCheckedIn: false,
        },
      });

      // Close open visit log
      const openLog = await prisma.visitLog.findFirst({
        where: {
          userId,
          checkOutTime: null,
        },
        orderBy: { checkInTime: 'desc' },
      });

      if (openLog) {
        const checkOutTime = new Date();
        const durationMinutes = Math.max(
          1,
          Math.round((checkOutTime.getTime() - openLog.checkInTime.getTime()) / (1000 * 60))
        );

        await prisma.visitLog.update({
          where: { id: openLog.id },
          data: {
            checkOutTime,
            durationMinutes,
          },
        });
      }
    }

    // Return updated gym metrics
    const settings = await getOrCreateGymSettings();
    const checkedInCount = await prisma.user.count({ where: { isCheckedIn: true } });
    const totalRegisteredMembers = await prisma.user.count();
    const percentage = Math.round((checkedInCount / settings.capacity) * 100);

    return res.json({
      success: true,
      isCheckedIn: newCheckedInState,
      message: newCheckedInState
        ? 'Welcome to the gym! You are now checked in.'
        : 'You have been checked out. Great workout!',
      peopleCount: checkedInCount,
      capacity: settings.capacity,
      totalRegisteredMembers,
      percentage,
    });
  } catch (error: any) {
    console.error('Error toggling member self check-in:', error);
    return res.status(500).json({ error: 'Failed to update check-in status.' });
  }
});

// 3. GET /api/user/visits - Fetch Member's Workout Visit History & Database Logs
app.get('/api/user/visits', async (req, res) => {
  try {
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      userId = null;
    }

    if (userId) {
      const dbVisits = await prisma.visitLog.findMany({
        where: { userId },
        orderBy: { checkInTime: 'desc' },
      });

      return res.json({
        success: true,
        visits: dbVisits,
      });
    }

    // Return general recent visit logs from database
    const generalVisits = await prisma.visitLog.findMany({
      take: 15,
      orderBy: { checkInTime: 'desc' },
    });

    return res.json({
      success: true,
      visits: generalVisits,
    });
  } catch (error: any) {
    console.error('Error fetching user visit logs:', error);
    return res.status(500).json({ error: 'Failed to fetch visit logs.' });
  }
});

// 4. POST /api/user/visits - Persist New Workout Session to Database
app.post('/api/user/visits', async (req, res) => {
  try {
    let userId: string | null = null;
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      });
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      userId = null;
    }

    if (!userId) {
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      } else {
        return res.status(401).json({ error: 'Authentication required to log workouts.' });
      }
    }

    const { workoutType, durationMinutes, calories, notes } = req.body;
    const duration = parseInt(durationMinutes, 10) || 60;
    const caloriesBurned = parseInt(calories, 10) || 300;

    const checkInTime = new Date();
    const checkOutTime = new Date(checkInTime.getTime() + duration * 60 * 1000);

    const newLog = await prisma.visitLog.create({
      data: {
        userId,
        checkInTime,
        checkOutTime,
        durationMinutes: duration,
        workoutType: workoutType || 'General Strength & Conditioning',
        caloriesBurned,
        notes: notes || null,
      },
    });

    return res.json({
      success: true,
      message: 'Workout session saved to database successfully.',
      visit: newLog,
    });
  } catch (error: any) {
    console.error('Error creating workout log in database:', error);
    return res.status(500).json({ error: 'Failed to save workout log.' });
  }
});

// 5. PUT /api/admin/gym/capacity - Gym Owner Update Facility Capacity
app.put('/api/admin/gym/capacity', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
    }

    const { capacity, gymName } = req.body;
    const parsedCapacity = parseInt(capacity, 10);

    if (isNaN(parsedCapacity) || parsedCapacity < 10 || parsedCapacity > 2000) {
      return res.status(400).json({ error: 'Capacity must be a valid number between 10 and 2000.' });
    }

    const updatedSettings = await prisma.gymSettings.upsert({
      where: { id: 'default' },
      update: {
        capacity: parsedCapacity,
        ...(gymName ? { gymName: gymName.trim() } : {}),
      },
      create: {
        id: 'default',
        capacity: parsedCapacity,
        gymName: gymName?.trim() || 'GymFlow Fitness',
      },
    });

    // Record in OccupancyLog
    const checkedInCount = await prisma.user.count({ where: { isCheckedIn: true } });
    await prisma.occupancyLog.create({
      data: {
        occupantsCount: checkedInCount,
        capacity: parsedCapacity,
      },
    });

    return res.json({
      success: true,
      message: `Gym capacity updated to ${parsedCapacity} occupants.`,
      settings: updatedSettings,
    });
  } catch (error: any) {
    console.error('Error updating gym capacity:', error);
    return res.status(500).json({ error: 'Failed to update gym capacity.' });
  }
});

// 4. POST /api/admin/members/:id/checkin-toggle - Admin Master Member Check-In
app.post('/api/admin/members/:id/checkin-toggle', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
    }

    const { id } = req.params;
    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const newCheckedInState = !targetUser.isCheckedIn;

    if (newCheckedInState) {
      await prisma.user.update({
        where: { id },
        data: {
          isCheckedIn: true,
          lastCheckInAt: new Date(),
        },
      });

      await prisma.visitLog.create({
        data: {
          userId: id,
          checkInTime: new Date(),
        },
      });
    } else {
      await prisma.user.update({
        where: { id },
        data: {
          isCheckedIn: false,
        },
      });

      const openLog = await prisma.visitLog.findFirst({
        where: {
          userId: id,
          checkOutTime: null,
        },
        orderBy: { checkInTime: 'desc' },
      });

      if (openLog) {
        const checkOutTime = new Date();
        const durationMinutes = Math.max(
          1,
          Math.round((checkOutTime.getTime() - openLog.checkInTime.getTime()) / (1000 * 60))
        );

        await prisma.visitLog.update({
          where: { id: openLog.id },
          data: {
            checkOutTime,
            durationMinutes,
          },
        });
      }
    }

    const checkedInCount = await prisma.user.count({ where: { isCheckedIn: true } });

    return res.json({
      success: true,
      userId: id,
      isCheckedIn: newCheckedInState,
      message: `${targetUser.name} is now ${newCheckedInState ? 'checked in' : 'checked out'}.`,
      checkedInCount,
    });
  } catch (error: any) {
    console.error('Error toggling member check-in by admin:', error);
    return res.status(500).json({ error: 'Failed to update member check-in status.' });
  }
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

// Serve React SPA Frontend static files in production if client/dist exists
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 GymFlow Server running on http://localhost:${PORT}`);
});

