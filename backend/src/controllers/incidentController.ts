import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { runAIAnalysis } from '../services/aiService';
import { sendStatusNotification } from '../services/emailService';
import { performReverseGeocode } from '../services/geocodingService';
import { syncDepartmentStatuses } from './departmentController';
import { messaging } from '../config/firebase';

// ─── SSE: Admin real-time new-incident notifications ──────────────────────────
// Stores all connected admin browser clients
const sseClients = new Set<Response>();

/** Register a new SSE connection (called from route handler) */
export const addSseClient = (res: Response) => sseClients.add(res);

/** Remove an SSE client when they disconnect */
export const removeSseClient = (res: Response) => sseClients.delete(res);

/** Broadcast a JSON event to all connected admin SSE clients */
export const broadcastSseEvent = (event: string, data: object) => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try { client.write(payload); } catch { sseClients.delete(client); }
  });
  console.log(`📡 SSE broadcast '${event}' → ${sseClients.size} admin client(s)`);
};
// ─────────────────────────────────────────────────────────────────────────────

const getTagalogStatus = (status: string) => {
  switch (status) {
    case 'PENDING': return 'Naghihintay ng review';
    case 'REVIEWING': return 'Nire-review ng MDRRMO';
    case 'DISPATCHED': return 'Na-dispatch na ang responder!';
    case 'RESOLVED': return 'Resolved na ang iyong report';
    case 'REJECTED': return 'Hindi na-approve ang report';
    default: return status;
  }
};

// Balayan, Batangas municipality boundary (bounding box)
const BALAYAN_BOUNDS = {
  north: 14.050,
  south: 13.880,
  east: 120.820,
  west: 120.650,
};

// GET /api/incidents — List all incidents with optional search & status filter
export const getIncidents = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { aiDetectedType: { contains: search as string, mode: 'insensitive' } },
        { id: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const incidents = await prisma.incident.findMany({
      where,
      include: { reporter: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(incidents);
  } catch (error: any) {
    console.error("❌ GET incidents error:", error.message);
    res.status(500).json({ error: "Failed to fetch incidents", details: error.message });
  }
};

// GET /api/incidents/my/:userId — Get incidents for a specific user (mobile history)
export const getMyIncidents = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const incidents = await prisma.incident.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(incidents);
  } catch (error: any) {
    console.error("❌ GET my incidents error:", error.message);
    res.status(500).json({ error: "Failed to fetch your incidents", details: error.message });
  }
};

// GET /api/incidents/stats — Dashboard statistics
export const getIncidentStats = async (_req: Request, res: Response) => {
  try {
    const [total, pending, reviewing, dispatched, resolved, rejected] = await Promise.all([
      prisma.incident.count(),
      prisma.incident.count({ where: { status: 'PENDING' } }),
      prisma.incident.count({ where: { status: 'REVIEWING' } }),
      prisma.incident.count({ where: { status: 'DISPATCHED' } }),
      prisma.incident.count({ where: { status: 'RESOLVED' } }),
      prisma.incident.count({ where: { status: 'REJECTED' } }),
    ]);

    res.json({ total, pending, reviewing, dispatched, resolved, rejected });
  } catch (error: any) {
    console.error("❌ GET stats error:", error.message);
    res.status(500).json({ error: "Failed to fetch stats", details: error.message });
  }
};

// GET /api/incidents/:id — Single incident detail
export const getIncident = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: { reporter: { select: { id: true, name: true, email: true, role: true } } },
    });

    if (!incident) {
      return res.status(404).json({ error: "Incident not found" });
    }

    res.json(incident);
  } catch (error: any) {
    console.error("❌ GET incident error:", error.message);
    res.status(500).json({ error: "Failed to fetch incident", details: error.message });
  }
};

// POST /api/incidents/report — Report a new incident with photo + GPS
// Pipeline: Mobile photo → upload → AI classifies → save to DB → respond to mobile user
export const reportIncident = async (req: Request, res: Response) => {
  try {
    const { userId, latitude, longitude } = req.body;
    
    if (!req.file) return res.status(400).json({ error: "No image provided" });

    // Validate location is within Balayan, Batangas
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng) || lat < BALAYAN_BOUNDS.south || lat > BALAYAN_BOUNDS.north || lng < BALAYAN_BOUNDS.west || lng > BALAYAN_BOUNDS.east) {
      return res.status(400).json({ error: 'Reports can only be submitted from within Balayan, Batangas municipality. Please enable GPS and ensure you are in the area.' });
    }

    const imageUrl = req.file.path;

    // Run AI classification on the uploaded image
    const assessment = await runAIAnalysis(imageUrl);

    // Map AI suggestion to a valid Department enum value
    let recommended: any = "RESCUE"; // Default fallback
    const aiSuggestion = assessment.recommendedDept.toUpperCase();

    if (aiSuggestion.includes("FIRE") || aiSuggestion.includes("BFP")) recommended = "BFP";
    else if (aiSuggestion.includes("POLICE") || aiSuggestion.includes("PNP")) recommended = "PNP";
    else if (aiSuggestion.includes("MEDICAL") || aiSuggestion.includes("AMBULANCE")) recommended = "MEDICAL";
    else if (aiSuggestion.includes("ENGINEERING") || aiSuggestion.includes("ROAD")) recommended = "ENGINEERING";

    // Save to database — this is what shows up in the admin Requests page
    const incident = await prisma.incident.create({
      data: {
        reporterId: userId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        photoUrl: imageUrl,
        aiDetectedType: assessment.incidentType,
        aiRecommendedDept: recommended,
        status: 'PENDING'
      }
    });

    console.log(`✅ New incident reported: ${incident.id} | Type: ${assessment.incidentType} | Dept: ${recommended}`);

    // ── Notify all admin devices via FCM push notification ──────────────────
    if (messaging) {
      try {
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN', pushToken: { not: null } },
          select: { pushToken: true },
        });
        const adminTokens = admins.map(a => a.pushToken!).filter(Boolean);
        if (adminTokens.length > 0) {
          await messaging.sendEachForMulticast({
            tokens: adminTokens,
            notification: {
              title: '🚨 Bagong Emergency Report!',
              body: `${assessment.incidentType} na na-detect sa Balayan. I-review na agad!`,
            },
            data: {
              incidentId: incident.id,
              type: 'NEW_INCIDENT',
              dept: recommended,
            },
            android: {
              notification: { sound: 'default', priority: 'high' },
            },
          });
          console.log(`📱 Admin push sent to ${adminTokens.length} device(s)`);
        }
      } catch (adminPushErr: any) {
        console.error(`⚠️ Admin push notification failed: ${adminPushErr.message}`);
      }
    }

    // ── Broadcast SSE event to admin web dashboard clients ──────────────────
    broadcastSseEvent('new_incident', {
      id: incident.id,
      aiDetectedType: assessment.incidentType,
      aiRecommendedDept: recommended,
      status: 'PENDING',
      createdAt: incident.createdAt,
    });

    // Return the full incident so the mobile app can show it in notifications/history
    res.status(201).json({
      success: true,
      message: "Emergency report submitted successfully",
      incident,
    });
  
  } catch (error: any) {
    console.error("🔥 CONTROLLER ERROR:", error); 
    res.status(500).json({ 
      success: false,
      error: "Failed to report incident", 
      details: error.message 
    });
  }
};

// PATCH /api/incidents/:id/status — Update incident status (admin action)
export const updateIncidentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, assignedDepartment } = req.body;

    const data: any = {};
    if (status) data.status = status;
    if (adminNotes) data.adminNotes = adminNotes;
    if (assignedDepartment) data.assignedDepartment = assignedDepartment;

    const updated = await prisma.incident.update({
      where: { id },
      data,
      include: { reporter: true },
    });

    // Sync department statuses dynamically in the database
    await syncDepartmentStatuses();

    const actions = [];
    if (status) actions.push(`status → ${status}`);
    if (assignedDepartment) actions.push(`dept → ${assignedDepartment}`);
    if (adminNotes) actions.push(`notes updated`);
    console.log(`📋 Incident ${id}: ${actions.join(', ') || 'updated'}`);

    // Send email notification to the reporter when status changes
    if (status && updated.reporter?.email) {
      try {
        await sendStatusNotification(
          updated.reporter.email,
          updated.reporter.name,
          updated.aiDetectedType || 'Incident Report',
          status
        );
        console.log(`📧 Status notification sent to ${updated.reporter.email}`);
      } catch (emailErr: any) {
        // Don't fail the update if email fails
        console.error(`⚠️ Email notification failed: ${emailErr.message}`);
      }
    }

    // Send push notification to the reporter via Firebase Cloud Messaging
    if (updated.reporter?.pushToken && messaging) {
      try {
        let title = 'Update sa iyong Report! 🚨';
        let body = '';

        if (status && assignedDepartment) {
          body = `Ang report mo ay na-assign sa ${assignedDepartment} at ito ay: ${getTagalogStatus(status)}`;
        } else if (status) {
          body = `Ang status ng iyong report ay: ${getTagalogStatus(status)}`;
        } else if (assignedDepartment) {
          title = 'Naka-assign na ang iyong Report! 🚒';
          body = `Ang report mo ay na-assign na sa ${assignedDepartment}`;
        }

        if (body) {
          await messaging.send({
            token: updated.reporter.pushToken,
            notification: {
              title,
              body,
            },
            data: {
              incidentId: id,
              status: status || updated.status,
              department: assignedDepartment || updated.assignedDepartment || '',
            },
            android: {
              priority: 'high', // Ensures heads-up banner even when screen is on
              notification: {
                sound: 'default',
                priority: 'high',
                clickAction: 'FCM_PLUGIN_ACTIVITY',
              },
            },
          });
          console.log(`📱 Push notification sent to user ${updated.reporter.id}`);
        }
      } catch (pushErr: any) {
        console.error(`⚠️ Push notification failed: ${pushErr.message}`);
      }
    }

    res.json({ message: `Incident updated`, updated });
  } catch (err: any) {
    console.error("❌ Update incident error:", err.message);
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};

// GET /api/incidents/geocode/reverse — Reverse geocode coordinates
export const reverseGeocode = async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng query parameters" });
    }
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: "Invalid lat or lng values" });
    }
    const result = await performReverseGeocode(latitude, longitude);
    res.json(result);
  } catch (error: any) {
    console.error("❌ reverseGeocode error:", error.message);
    res.status(500).json({ error: "Failed to reverse geocode location", details: error.message });
  }
};