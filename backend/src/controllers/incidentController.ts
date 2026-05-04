import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { runAIAnalysis } from '../services/aiService';
import { sendStatusNotification } from '../services/emailService';

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

    res.json({ message: `Incident updated`, updated });
  } catch (err: any) {
    console.error("❌ Update incident error:", err.message);
    res.status(500).json({ error: "Update failed", details: err.message });
  }
};