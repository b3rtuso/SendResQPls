import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import incidentRoutes from './routes/incidentRoutes';
import authRoutes from './routes/authRoutes';
import departmentRoutes from './routes/departmentRoutes';

import { prisma } from './config/db';
import bcrypt from 'bcrypt';

const app = express();

app.use(cors());
app.use(express.json());

// ── Health check — ping this with UptimeRobot every 5 min to prevent cold starts ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/departments', departmentRoutes);

// Auto-seed default MDRRMO admin on startup
async function seedDefaultAdmin() {
  try {
    const adminEmail = 'admin@mdrrmo.gov.ph';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (!existingAdmin) {
      const defaultPassword = 'MdrrmoAdmin2026!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 8); // 8 rounds for faster boot
      
      await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'MDRRMO Balayan Admin',
          passwordHash: hashedPassword,
          role: 'ADMIN',
          phoneNumber: '09171234567'
        }
      });
      console.log('✅ Default MDRRMO admin seeded successfully:');
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${defaultPassword}`);
    } else {
      console.log(`ℹ️ Default MDRRMO admin already exists: ${adminEmail}`);
    }
  } catch (error: any) {
    console.error('❌ Failed to seed default MDRRMO admin:', error.message);
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 System running on port ${PORT}`);
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