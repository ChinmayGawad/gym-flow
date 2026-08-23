import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './lib/auth';
import { prisma } from './lib/db';


const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;


const clientUrl = process.env.CLIENT_URL || '';
const clientOrigins = clientUrl
  ? [
      clientUrl,
      clientUrl.startsWith('http') ? clientUrl : `https://${clientUrl}`,
      clientUrl.startsWith('http') ? clientUrl.replace(/^https?:\/\//, '') : clientUrl,
    ]
  : [];

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...clientOrigins,
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

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Better Auth Route Handler (Web Standard Adapter compatible with Bun/Node/Docker)
app.all('/api/auth/*', async (req, res) => {
  try {
    const rawProto = req.headers['x-forwarded-proto'];
    const protocol = Array.isArray(rawProto) ? rawProto[0] : (rawProto ? rawProto.split(',')[0].trim() : (req.secure ? 'https' : 'http'));
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const url = `${protocol}://${host}${req.originalUrl}`;

    let body: string | undefined = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body !== undefined) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const webHeaders = fromNodeHeaders(req.headers);
    const request = new Request(url, {
      method: req.method,
      headers: webHeaders,
      body,
    });

    const response = await auth.handler(request);

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const data = await response.text();
    return res.send(data);
  } catch (authErr: any) {
    console.error('Better Auth execution error:', authErr);
    return res.status(500).json({ error: authErr.message || 'Authentication error' });
  }
});



// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'gymflow-server' });
});

// Live SSE Stream clients
const sseClients = new Set<express.Response>();

export async function broadcastGymStatusUpdate() {
  if (sseClients.size === 0) return;
  try {
    const settings = await getOrCreateGymSettings();
    const totalRegisteredMembers = await prisma.user.count();
    const checkedInMembers = await prisma.user.findMany({
      where: { isCheckedIn: true },
      select: { id: true, name: true, email: true },
    });
    const checkedInCount = checkedInMembers.length;
    const capacity = settings.capacity;
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

    const payload = JSON.stringify({
      type: 'occupancy_update',
      peopleCount: checkedInCount,
      capacity,
      totalRegisteredMembers,
      percentage,
      turnoutPercentage,
      status,
      waitTime,
      gymName: settings.gymName,
      checkedInUserIds: checkedInMembers.map((m) => m.id),
      timestamp: new Date().toISOString(),
    });

    for (const client of sseClients) {
      try {
        client.write(`data: ${payload}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  } catch (err) {
    console.error('Error broadcasting gym status:', err);
  }
}

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

// 0. GET /api/gym/live-stream - Server-Sent Events (SSE) Real-Time Live Occupancy Stream
app.get('/api/gym/live-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  try {
    const settings = await getOrCreateGymSettings();
    const totalRegisteredMembers = await prisma.user.count();
    const checkedInMembers = await prisma.user.findMany({
      where: { isCheckedIn: true },
      select: { id: true },
    });
    const checkedInCount = checkedInMembers.length;
    const capacity = settings.capacity;
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

    const payload = JSON.stringify({
      type: 'occupancy_update',
      peopleCount: checkedInCount,
      capacity,
      totalRegisteredMembers,
      percentage,
      turnoutPercentage,
      status,
      waitTime,
      gymName: settings.gymName,
      checkedInUserIds: checkedInMembers.map((m) => m.id),
      timestamp: new Date().toISOString(),
    });

    res.write(`data: ${payload}\n\n`);
  } catch (err) {
    console.error('Error sending initial SSE payload:', err);
  }

  sseClients.add(res);

  // Keep-alive heartbeat every 15 seconds
  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
      sseClients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

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

      // Create open visit log
      await prisma.visitLog.create({
        data: {
          userId,
          checkInTime: new Date(),
          workoutType: 'Gym Floor Session',
          caloriesBurned: 300,
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

      // Close the most recent open visit log if any
      const openVisit = await prisma.visitLog.findFirst({
        where: { userId, checkOutTime: null },
        orderBy: { checkInTime: 'desc' },
      });

      if (openVisit) {
        const now = new Date();
        const durationMins = Math.max(15, Math.round((now.getTime() - new Date(openVisit.checkInTime).getTime()) / 60000));
        await prisma.visitLog.update({
          where: { id: openVisit.id },
          data: {
            checkOutTime: now,
            durationMinutes: durationMins,
            caloriesBurned: Math.round(durationMins * 6),
          },
        });
      }
    }

    // Return updated gym metrics
    const settings = await getOrCreateGymSettings();
    const checkedInCount = await prisma.user.count({ where: { isCheckedIn: true } });
    const totalRegisteredMembers = await prisma.user.count();
    const percentage = Math.round((checkedInCount / settings.capacity) * 100);

    // Broadcast live change immediately to all connected clients
    broadcastGymStatusUpdate();

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

// 3. GET /api/user/visits - Fetch Member's Workout Visit History & Database Logs (Manual Entries Only)
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

    // Unauthenticated: return empty list
    return res.json({
      success: true,
      visits: [],
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

    // Broadcast live change immediately to all connected clients
    broadcastGymStatusUpdate();

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

// GET /api/admin/members - Get all gym members with live check-in status
app.get('/api/admin/members', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    let userRole = (session?.user as any)?.role;
    if (!userRole && session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      userRole = dbUser?.role;
    }

    if (!session || userRole !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Administrator access required.' });
    }

    const members = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        planStatus: true,
        isCheckedIn: true,
        lastCheckInAt: true,
        createdAt: true,
        image: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      members,
    });
  } catch (error: any) {
    console.error('Error fetching admin members list:', error);
    return res.status(500).json({ error: 'Failed to fetch members list.' });
  }
});

// POST /api/admin/members/:id/checkin-toggle - Admin Master Member Check-In
app.post('/api/admin/members/:id/checkin-toggle', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    let userRole = (session?.user as any)?.role;
    if (!userRole && session?.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      userRole = dbUser?.role;
    }

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

      // Create an active visit log
      await prisma.visitLog.create({
        data: {
          userId: id,
          checkInTime: new Date(),
          workoutType: 'Gym Floor Session',
          caloriesBurned: 300,
        },
      });
    } else {
      await prisma.user.update({
        where: { id },
        data: {
          isCheckedIn: false,
        },
      });

      // Close the most recent open visit log if any
      const openVisit = await prisma.visitLog.findFirst({
        where: { userId: id, checkOutTime: null },
        orderBy: { checkInTime: 'desc' },
      });

      if (openVisit) {
        const now = new Date();
        const durationMins = Math.max(15, Math.round((now.getTime() - new Date(openVisit.checkInTime).getTime()) / 60000));
        await prisma.visitLog.update({
          where: { id: openVisit.id },
          data: {
            checkOutTime: now,
            durationMinutes: durationMins,
            caloriesBurned: Math.round(durationMins * 6),
          },
        });
      }
    }

    const checkedInCount = await prisma.user.count({ where: { isCheckedIn: true } });

    // Broadcast live change immediately to all connected clients & tabs
    broadcastGymStatusUpdate();

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

// Delete a manually logged workout session
app.delete('/api/user/visits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.visitLog.delete({
      where: { id },
    });
    return res.json({ success: true, message: 'Workout log deleted.' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete workout log.' });
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

    // Broadcast live change immediately to all connected clients
    broadcastGymStatusUpdate();

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

// Dynamic Live Simulation Step Endpoint
app.post('/api/gym/simulation-step', async (req, res) => {
  try {
    const { delta, exactCount } = req.body;
    const settings = await getOrCreateGymSettings();
    const allUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });

    if (allUsers.length > 0) {
      if (typeof exactCount === 'number') {
        const targetCount = Math.max(0, Math.min(exactCount, allUsers.length, settings.capacity));
        for (let i = 0; i < allUsers.length; i++) {
          const shouldBeIn = i < targetCount;
          if (allUsers[i].isCheckedIn !== shouldBeIn) {
            await prisma.user.update({
              where: { id: allUsers[i].id },
              data: { isCheckedIn: shouldBeIn, lastCheckInAt: shouldBeIn ? new Date() : allUsers[i].lastCheckInAt },
            });
          }
        }
      } else {
        const change = typeof delta === 'number' ? delta : (Math.random() > 0.5 ? 1 : -1);
        if (change > 0) {
          const outUser = allUsers.find(u => !u.isCheckedIn);
          if (outUser) {
            await prisma.user.update({
              where: { id: outUser.id },
              data: { isCheckedIn: true, lastCheckInAt: new Date() },
            });
          }
        } else {
          const inUser = allUsers.find(u => u.isCheckedIn);
          if (inUser) {
            await prisma.user.update({
              where: { id: inUser.id },
              data: { isCheckedIn: false },
            });
          }
        }
      }
    }

    // Broadcast update to all live streams immediately
    await broadcastGymStatusUpdate();

    const checkedInCount = await prisma.user.count({ where: { isCheckedIn: true } });
    return res.json({ success: true, peopleCount: checkedInCount, capacity: settings.capacity });
  } catch (simErr: any) {
    console.error('Simulation step error:', simErr);
    return res.status(500).json({ error: 'Failed to simulate step' });
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

// Initial database provisioning helper (creates default admin & demo member if not present)
async function ensureInitialSeed() {
  try {
    await getOrCreateGymSettings();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gymflow.com';
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
      console.log(`[Seed] Initializing default Admin account: ${adminEmail}`);
      const adminRes = await auth.api.signUpEmail({
        body: {
          email: adminEmail,
          password: process.env.ADMIN_PASSWORD || 'Admin123456!',
          name: 'Gym Head Admin',
        },
      });
      if (adminRes?.user) {
        await prisma.user.update({
          where: { id: adminRes.user.id },
          data: { role: 'admin', plan: 'elite', planStatus: 'active' },
        });
      }
    }

    const memberEmail = 'member@gymflow.com';
    const existingMember = await prisma.user.findUnique({ where: { email: memberEmail } });
    if (!existingMember) {
      console.log(`[Seed] Initializing default Member account: ${memberEmail}`);
      const memberRes = await auth.api.signUpEmail({
        body: {
          email: memberEmail,
          password: 'Member123456!',
          name: 'Chinmay Gawad',
        },
      });
      if (memberRes?.user) {
        await prisma.user.update({
          where: { id: memberRes.user.id },
          data: { role: 'user', plan: 'pro', planStatus: 'active' },
        });
      }
    }
  } catch (seedErr) {
    console.warn('[Seed] Note during startup seed:', seedErr);
  }
}

const portNumber = Number(process.env.PORT) || 3000;

app.listen(portNumber, '0.0.0.0', async () => {
  console.log(`🚀 GymFlow Server running on port ${portNumber}`);
  await ensureInitialSeed();
});



