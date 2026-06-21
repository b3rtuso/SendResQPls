import { Router } from 'express';
import { upload } from '../middleware/upload';
import {
  getIncidents,
  getIncident,
  getIncidentStats,
  getMyIncidents,
  reportIncident,
  updateIncidentStatus,
  reverseGeocode,
  addSseClient,
  removeSseClient,
} from '../controllers/incidentController';


const router = Router();

// Stats must come BEFORE /:id to avoid matching "stats" as an id
router.get('/stats', getIncidentStats);

// Geocoding reverse lookup
router.get('/geocode/reverse', reverseGeocode);

// SSE: Admin web panel real-time incident stream — must be before /:id
router.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send a heartbeat comment every 25s to keep the connection alive
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { clearInterval(heartbeat); }
  }, 25000);

  addSseClient(res);
  console.log(`🔌 SSE client connected (total: ${(res as any)._header ? 1 : 0})`);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSseClient(res);
    console.log('🔌 SSE client disconnected');
  });
});


// User's own incidents (for mobile history) — must come before /:id
router.get('/my/:userId', getMyIncidents);

// List all incidents (supports ?search= and ?status= query params)
router.get('/', getIncidents);

// Get single incident by ID
router.get('/:id', getIncident);

// User sends photo + location → AI classifies → saves to DB
router.post('/report', upload.single('photo'), reportIncident);

// Admin updates the situation
router.patch('/:id/status', updateIncidentStatus);

export default router;