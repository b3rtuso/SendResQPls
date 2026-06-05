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
} from '../controllers/incidentController';

const router = Router();

// Stats must come BEFORE /:id to avoid matching "stats" as an id
router.get('/stats', getIncidentStats);

// Geocoding reverse lookup
router.get('/geocode/reverse', reverseGeocode);

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