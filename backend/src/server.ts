import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import incidentRoutes from './routes/incidentRoutes';
import authRoutes from './routes/authRoutes';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 System running on port ${PORT}`));
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