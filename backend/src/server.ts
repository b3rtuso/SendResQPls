import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import rateLimit from 'express-rate-limit';
import incidentRoutes from './routes/incidentRoutes';
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import { incidentWorker } from './queues/incidentQueue'; // Start background AI worker

import { prisma } from './config/db';
import bcrypt from 'bcrypt';

const app = express();

app.use(cors());
app.use(express.json());

// ── Cache-Control Headers Middleware ──────────────────────────────────────────
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, no-cache, must-revalidate');
  } else {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
});

// ── Rate Limiters ─────────────────────────────────────────────────────────────

// 1. Global limiter — applies to every route
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per IP per window
  standardHeaders: true,     // Return RateLimit-* headers
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// 2. Auth limiter — strict, prevents brute-force on login/register
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                   // Only 10 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // Don't count successful logins against the limit
});

// 3. Report submission limiter — prevent spam reports from the mobile app
const reportLimiter = rateLimit({
  windowMs: 60 * 1000,       // 1 minute window
  max: 5,                    // Max 5 new reports per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You are submitting reports too quickly. Please wait a moment.' },
});

app.use(globalLimiter);

// ── Health check — ping this with UptimeRobot every 5 min to prevent cold starts ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/incidents/create', reportLimiter); // tighter limit for new report submissions
app.use('/api/departments', departmentRoutes);

// Auto-seed default MDRRMO admin on startup if no admin exists in the database
async function seedDefaultAdmin() {
  try {
    // Check if ANY admin user already exists in Postgres
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!existingAdmin) {
      const defaultEmail = 'admin@mdrrmo.gov.ph';
      const defaultPassword = 'MdrrmoAdmin2026!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 8); // 8 rounds for faster boot
      
      await prisma.user.create({
        data: {
          email: defaultEmail,
          name: 'MDRRMO Balayan Admin',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          phoneNumber: '09171234567'
        }
      });
      console.log('✅ Default MDRRMO admin seeded successfully in database:');
      console.log(`📧 Email: ${defaultEmail}`);
      console.log(`🔑 Password: ${defaultPassword}`);
    } else {
      console.log(`ℹ️ Admin account already exists in database: ${existingAdmin.email}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to seed default MDRRMO admin:', error.message);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 System running on port ${PORT}`);
  console.log(`⚙️  Background worker: ${incidentWorker.name} (concurrency: 5)`);
  await seedDefaultAdmin();
});

// Add this at the end of src/server.ts
app.use((err: any, req: any, res: any, next: any) => {
  console.error("DEBUGGER CAUGHT ERROR:", err);
  res.status(500).json({
    message: "Global Error Caught",
    errorName: err.name,
    errorMessage: err.message,
    expectedField: err.field || "Unknown", // Multer specifically adds this
    stack: err.stack
  });
});