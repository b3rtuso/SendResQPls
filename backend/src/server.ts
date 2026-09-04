import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import rateLimit from 'express-rate-limit';
import incidentRoutes from './routes/incidentRoutes';
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';
import callLogRoutes from './routes/callLogRoutes';
import { incidentWorker } from './queues/incidentQueue'; // Start background AI worker

import { prisma } from './config/db';
import bcrypt from 'bcrypt';

const app = express();

// ── Trust Render's reverse proxy (required for express-rate-limit to work) ──────
// '1' = trust exactly one proxy hop (Render's load balancer). This allows
// express-rate-limit to read the real client IP from X-Forwarded-For.
app.set('trust proxy', 1);

// ── Security Headers (helmet) ──────────────────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, HSTS, and 11 other headers.
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS — allow our production & preview frontend origins ─────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL,           // production frontend (set in Render env vars)
  'http://localhost:5173',            // Vite dev server
  'http://localhost:4173',            // Vite preview
  'http://localhost:3000',
  'capacitor://localhost',
  'http://localhost',
].filter(Boolean) as string[];

const isOriginAllowed = (origin?: string): boolean => {
  // Allow server-to-server requests (no origin header, e.g. curl, Postman, mobile webview native bridges)
  if (!origin) return true;

  // Exact match with known static whitelist
  if (allowedOrigins.includes(origin)) return true;

  // Allow all Vercel deployments (production domain, preview branches, PR previews)
  if (/^https:\/\/([a-zA-Z0-9-_]+\.)?vercel\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-zA-Z0-9-_]+-b3rtusos-projects\.vercel\.app$/.test(origin)) return true;

  // Local development / mobile emulators on any port
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;

  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

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

// ── Health check — ping this with Better Stack / UptimeRobot to prevent cold starts ──
// Placed BEFORE rate limiters so monitoring pings never get throttled or counted against users
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use(globalLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/incidents/create', reportLimiter); // tighter limit for new report submissions
app.use('/api/departments', departmentRoutes);
app.use('/api/call-logs', callLogRoutes);

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

// ── Global Error Handler ──────────────────────────────────────────────────────
// NOTE: Never expose stack traces or raw error messages to clients in production.
app.use((err: any, req: any, res: any, _next: any) => {
  console.error('[ERROR]', err.message, err.stack);
  res.status(err.status || 500).json({
    error: err.status ? err.message : 'An internal server error occurred.',
    // Only expose stack in local development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});