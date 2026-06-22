import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({
  connectionString,
  max: 5,                    // Cap at 5 simultaneous DB connections
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail fast if no connection in 5s
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });