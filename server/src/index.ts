import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './lib/auth';
import { prisma } from './lib/db';


export const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// 1. Security Headers (Defense-in-depth: MIME-sniffing, Clickjacking, Referrer-policy)
app.use(
  helmet({
    contentSecurityPolicy: false, // Compatible with Vite client & inline styles
    crossOriginEmbedderPolicy: false,
  })
);

// 2. API Rate Limiting
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // Limit each IP to 60 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'test',
});

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Generous limit for dashboard polling and SSE reconnects
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' },
  skip: (req) => process.env.NODE_ENV === 'test' || req.path === '/api/gym/live-stream',
});

app.use('/api/auth/', authRateLimiter);
app.use('/api/', generalApiLimiter);

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
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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

// 17 Hourly Slot Definitions (6 AM to 10 PM)
const HOURLY_SLOTS_CONFIG = [
  { id: '1', hour24: 6, time: '6 AM', baselineRatio: 0.15 },
  { id: '2', hour24: 7, time: '7 AM', baselineRatio: 0.20 },
  { id: '3', hour24: 8, time: '8 AM', baselineRatio: 0.35 },
  { id: '4', hour24: 9, time: '9 AM', baselineRatio: 0.25 },
  { id: '5', hour24: 10, time: '10 AM', baselineRatio: 0.18 },
  { id: '6', hour24: 11, time: '11 AM', baselineRatio: 0.20 },
  { id: '7', hour24: 12, time: '12 PM', baselineRatio: 0.28 },
  { id: '8', hour24: 13, time: '1 PM', baselineRatio: 0.22 },
  { id: '9', hour24: 14, time: '2 PM', baselineRatio: 0.18 },
  { id: '10', hour24: 15, time: '3 PM', baselineRatio: 0.22 },
  { id: '11', hour24: 16, time: '4 PM', baselineRatio: 0.45 },
  { id: '12', hour24: 17, time: '5 PM', baselineRatio: 0.65 },
  { id: '13', hour24: 18, time: '6 PM', baselineRatio: 0.75 },
  { id: '14', hour24: 19, time: '7 PM', baselineRatio: 0.80 },
  { id: '15', hour24: 20, time: '8 PM', baselineRatio: 0.55 },
  { id: '16', hour24: 21, time: '9 PM', baselineRatio: 0.35 },
  { id: '17', hour24: 22, time: '10 PM', baselineRatio: 0.15 },
];

export async function generateForecastData(targetDate: string, currentUserId: string | null = null) {
  const settings = await getOrCreateGymSettings();
  const capacity = settings.capacity;

  const plannedVisits = await prisma.plannedVisit.findMany({
    where: {
      scheduledDate: targetDate,
      status: 'planned',
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  let maxCount = 0;
  const rawSlots = HOURLY_SLOTS_CONFIG.map((slot) => {
    const slotVisits = plannedVisits.filter((v) => v.hour24 === slot.hour24);
    const plannedCount = slotVisits.length;
    const walkIns = Math.round(capacity * slot.baselineRatio * 0.4);
    const predictedCount = Math.min(capacity, plannedCount + walkIns);

    if (predictedCount > maxCount) {
      maxCount = predictedCount;
    }

    const percentage = Math.round((predictedCount / capacity) * 100);
    let status: 'LOW' | 'MODERATE' | 'HIGH' = 'MODERATE';
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

    const hasUserBooked = !!currentUserId && slotVisits.some((v) => v.userId === currentUserId);
    const userVisit = currentUserId ? slotVisits.find((v) => v.userId === currentUserId) : undefined;

    return {
      id: slot.id,
      time: slot.time,
      hour24: slot.hour24,
      plannedCount,
      predictedCount: Math.max(1, predictedCount),
      percentage: Math.max(8, percentage),
      status,
      waitTime,
      isHigh: percentage >= 75,
      isHighest: false,
      isOptimal: false,
      plannedMembers: slotVisits.map((v) => ({
        id: v.user.id,
        name: v.user.name,
        image: v.user.image,
        workoutFocus: v.workoutFocus,
      })),
      hasUserBooked,
      userVisitId: userVisit?.id,
    };
  });

  // Mark highest slot
  let minCount = Infinity;
  let optimalSlot = rawSlots[4]; // default 10 AM

  const forecast = rawSlots.map((slot) => {
    const isHighest = slot.predictedCount === maxCount && maxCount > 0;
    // Find quietest operational window (prefer morning 10 AM or afternoon 2 PM when low)
    if (slot.predictedCount <= minCount && slot.hour24 >= 8 && slot.hour24 <= 16) {
      minCount = slot.predictedCount;
      optimalSlot = slot;
    }
    return {
      ...slot,
      isHighest,
    };
  });

  // Mark optimal
  forecast.forEach((slot) => {
    if (slot.hour24 === optimalSlot.hour24) {
      slot.isOptimal = true;
    }
  });

  // User's planned visit for the day if any
  const userPlannedVisit = currentUserId
    ? await prisma.plannedVisit.findFirst({
        where: {
          userId: currentUserId,
          scheduledDate: targetDate,
          status: 'planned',
        },
      })
    : null;

  return {
    success: true,
    date: targetDate,
    capacity,
    totalPlannedVisits: plannedVisits.length,
    optimalWindow: {
      timeRange: optimalSlot.hour24 <= 11 ? `${optimalSlot.time} – 11:30 AM` : `${optimalSlot.time} – 3:30 PM`,
      expectedPeople: optimalSlot.predictedCount,
      plannedCount: optimalSlot.plannedCount,
      status: optimalSlot.status,
    },
    forecast,
    userPlannedVisit: userPlannedVisit
      ? {
          id: userPlannedVisit.id,
          scheduledDate: userPlannedVisit.scheduledDate,
          timeSlot: userPlannedVisit.timeSlot,
          hour24: userPlannedVisit.hour24,
          workoutFocus: userPlannedVisit.workoutFocus,
          notes: userPlannedVisit.notes,
        }
      : null,
  };
}

export async function broadcastForecastUpdate(date?: string) {
  if (sseClients.size === 0) return;
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const forecastData = await generateForecastData(targetDate, null);
    const payload = JSON.stringify({
      type: 'forecast_update',
      ...forecastData,
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
    console.error('Error broadcasting forecast update:', err);
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

// 1.1 GET /api/gym/forecast - Dynamic Hourly Crowd Predictions based on Planned Member Visits
app.get('/api/gym/forecast', async (req, res) => {
  try {
    const queryDate = (req.query.date as string) || new Date().toISOString().split('T')[0];

    // Check if user is logged in
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

    const forecastData = await generateForecastData(queryDate, userId);
    return res.json(forecastData);
  } catch (error: any) {
    console.error('Error generating gym forecast:', error);
    return res.status(500).json({ error: 'Failed to generate crowd forecast.' });
  }
});

// Zod Input Validation Schemas
const PlannedVisitSchema = z.object({
  scheduledDate: z.string().min(1, 'scheduledDate, timeSlot, and hour24 are required.'),
  timeSlot: z.string().min(1, 'scheduledDate, timeSlot, and hour24 are required.'),
  hour24: z.number({ required_error: 'scheduledDate, timeSlot, and hour24 are required.', invalid_type_error: 'scheduledDate, timeSlot, and hour24 are required.' }).transform((val) => Math.max(6, Math.min(22, parseInt(String(val), 10)))),
  workoutFocus: z.string().optional(),
  notes: z.string().optional(),
});

const CapacityUpdateSchema = z.object({
  capacity: z.any().refine((val) => {
    const n = typeof val === 'number' ? val : parseInt(String(val), 10);
    return !isNaN(n) && Number.isInteger(n) && n >= 10 && n <= 2000;
  }, {
    message: 'Capacity must be a valid number between 10 and 2000.',
  }).transform((val) => typeof val === 'number' ? val : parseInt(String(val), 10)),
  gymName: z.string().min(1).optional(),
});

const MemberUpdateSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  plan: z.string().optional(),
  planStatus: z.string().optional(),
  password: z.string().optional(),
});

const WorkoutLogSchema = z.object({
  workoutType: z.string().min(1).max(100).optional(),
  durationMinutes: z.coerce.number().int().min(1).max(480).optional(),
  calories: z.coerce.number().int().min(0).max(5000).optional(),
  notes: z.string().max(500).optional(),
});

// 1.2 POST /api/gym/planned-visits - Schedule / Declare Member Visit Slot (e.g. 11:00 AM)
app.post('/api/gym/planned-visits', async (req, res) => {
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
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Authentication required to schedule a visit.' });
      }
      // Fallback to first active member for seamless local demo if unauthenticated
      const demoUser = await prisma.user.findFirst({ where: { role: 'user' } });
      if (demoUser) {
        userId = demoUser.id;
      } else {
        return res.status(401).json({ error: 'Authentication required to schedule a visit.' });
      }
    }

    const parseResult = PlannedVisitSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'scheduledDate, timeSlot, and hour24 are required.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { scheduledDate, timeSlot, hour24, workoutFocus, notes } = parseResult.data;

    // Upsert or replace user's planned visit for this date
    const existing = await prisma.plannedVisit.findFirst({
      where: {
        userId,
        scheduledDate,
      },
    });

    let plannedVisit;
    if (existing) {
      plannedVisit = await prisma.plannedVisit.update({
        where: { id: existing.id },
        data: {
          timeSlot: timeSlot.trim(),
          hour24,
          workoutFocus: workoutFocus?.trim() || 'General Strength & Conditioning',
          notes: notes?.trim() || null,
          status: 'planned',
        },
      });
    } else {
      plannedVisit = await prisma.plannedVisit.create({
        data: {
          userId,
          scheduledDate,
          timeSlot: timeSlot.trim(),
          hour24,
          workoutFocus: workoutFocus?.trim() || 'General Strength & Conditioning',
          notes: notes?.trim() || null,
          status: 'planned',
        },
      });
    }

    // Broadcast updated forecast and live status immediately to all connected clients & tabs
    await broadcastForecastUpdate(scheduledDate);
    await broadcastGymStatusUpdate();

    return res.json({
      success: true,
      message: `Visit scheduled for ${timeSlot} on ${scheduledDate}.`,
      plannedVisit,
    });
  } catch (error: any) {
    console.error('Error scheduling planned visit:', error);
    return res.status(500).json({ error: 'Failed to schedule planned visit.' });
  }
});

// 1.3 DELETE /api/gym/planned-visits/:id - Cancel Scheduled Visit Slot
app.delete('/api/gym/planned-visits/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.plannedVisit.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Planned visit not found.' });
    }

    const targetDate = existing.scheduledDate;
    await prisma.plannedVisit.delete({
      where: { id },
    });

    // Broadcast updated forecast to all connected clients
    await broadcastForecastUpdate(targetDate);
    await broadcastGymStatusUpdate();

    return res.json({
      success: true,
      message: 'Scheduled visit cancelled successfully.',
    });
  } catch (error: any) {
    console.error('Error cancelling planned visit:', error);
    return res.status(500).json({ error: 'Failed to cancel scheduled visit.' });
  }
});

// 1.4 GET /api/user/planned-visits - Fetch Current Member's Upcoming Scheduled Visits
app.get('/api/user/planned-visits', async (req, res) => {
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
      const demoUser = await prisma.user.findFirst({ where: { role: 'user' } });
      if (demoUser) userId = demoUser.id;
      else return res.json({ success: true, visits: [] });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingVisits = await prisma.plannedVisit.findMany({
      where: {
        userId,
        scheduledDate: { gte: todayStr },
        status: 'planned',
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { hour24: 'asc' },
      ],
    });

    return res.json({
      success: true,
      visits: upcomingVisits,
    });
  } catch (error: any) {
    console.error('Error fetching user planned visits:', error);
    return res.status(500).json({ error: 'Failed to fetch planned visits.' });
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
      if (process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Authentication required to log workouts.' });
      }
      const firstUser = await prisma.user.findFirst();
      if (firstUser) {
        userId = firstUser.id;
      } else {
        return res.status(401).json({ error: 'Authentication required to log workouts.' });
      }
    }

    const parseResult = WorkoutLogSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid workout details.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { workoutType, durationMinutes, calories, notes } = parseResult.data;
    const duration = durationMinutes || 60;
    const caloriesBurned = calories || 300;

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

    const parseResult = CapacityUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: parseResult.error.errors[0]?.message || 'Capacity must be a valid number between 10 and 2000.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { capacity: parsedCapacity, gymName } = parseResult.data;

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

    // Broadcast live change and updated forecast immediately to all connected clients
    await broadcastGymStatusUpdate();
    await broadcastForecastUpdate();

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

    const parseResult = MemberUpdateSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        error: 'Invalid member update payload.',
        details: parseResult.error.flatten().fieldErrors,
      });
    }

    const { id } = req.params;
    const { name, email, role, plan, planStatus, password } = parseResult.data;

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
        ...(planStatus && ['active', 'paused', 'expired'].includes(planStatus) ? { planStatus } : {}),
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

    // Seed realistic planned visits for today if none exist
    const todayStr = new Date().toISOString().split('T')[0];
    const existingVisitsCount = await prisma.plannedVisit.count({
      where: { scheduledDate: todayStr },
    });

    if (existingVisitsCount === 0) {
      const allMembers = await prisma.user.findMany({ take: 10 });
      if (allMembers.length > 0) {
        const seedSlots = [
          { hour: 8, time: '8:00 AM', focus: 'HIIT & Mobility' },
          { hour: 11, time: '11:00 AM', focus: 'Chest & Triceps' },
          { hour: 11, time: '11:00 AM', focus: 'Upper Body Power' },
          { hour: 17, time: '5:00 PM', focus: 'Leg Day & Squats' },
          { hour: 18, time: '6:00 PM', focus: 'Back & Biceps' },
          { hour: 18, time: '6:00 PM', focus: 'Deadlifts & Core' },
          { hour: 19, time: '7:00 PM', focus: 'Strength & Conditioning' },
        ];

        for (let i = 0; i < seedSlots.length; i++) {
          const member = allMembers[i % allMembers.length];
          const slot = seedSlots[i];
          await prisma.plannedVisit.create({
            data: {
              userId: member.id,
              scheduledDate: todayStr,
              timeSlot: slot.time,
              hour24: slot.hour,
              workoutFocus: slot.focus,
              notes: 'Scheduled for regular training session',
              status: 'planned',
            },
          });
        }
        console.log(`[Seed] Initialized ${seedSlots.length} sample planned visit notes for ${todayStr}`);
      }
    }
  } catch (seedErr) {
    console.warn('[Seed] Note during startup seed:', seedErr);
  }
}

// Start server unless running under a test runner (tests import the app directly)
if (process.env.NODE_ENV !== 'test' && process.env.VITEST !== 'true') {
  const portNumber = Number(process.env.PORT) || 3000;

  app.listen(portNumber, '0.0.0.0', async () => {
    console.log(`🚀 GymFlow Server running on port ${portNumber}`);
    await ensureInitialSeed();
  });
}



