import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Known incident types the AI should recognize
const KNOWN_INCIDENT_TYPES = [
  'fire', 'flood', 'accident', 'medical', 'trauma', 'crime',
  'landslide', 'typhoon', 'earthquake', 'rescue', 'emergency',
  'shooting', 'robbery', 'assault', 'drowning', 'explosion',
  'structural', 'road', 'vehicle', 'injury', 'collapse'
];

/** Returns true if the AI incident type is recognizable */
export const isRecognizedIncident = (incidentType: string): boolean => {
  if (!incidentType) return false;
  const lower = incidentType.toLowerCase();
  // Generic/fallback responses are treated as unrecognized
  if (lower.includes('pending review') || lower.includes('unknown') || lower.includes('unclear')) return false;
  return KNOWN_INCIDENT_TYPES.some(keyword => lower.includes(keyword));
};

export const runAIAnalysis = async (imageUrl: string) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageData = Buffer.from(imageResponse.data).toString("base64");

    const prompt = `You are an emergency incident classifier for MDRRMO Balayan, Batangas Philippines.
Analyze this image and determine if it shows a real emergency incident.

Return ONLY a JSON object with this exact structure:
{
  "incidentType": "<specific type or 'Unrecognized'>",
  "recommendedDept": "<BFP|PNP|MEDICAL|ENGINEERING|RESCUE|UNKNOWN>",
  "confidence": "<high|medium|low>",
  "recognized": <true|false>,
  "suggestAction": "<PROCESS|REJECT>"
}

Rules:
- If the image clearly shows fire/flood/accident/crime/medical emergency/trauma/structural damage/road hazard → recognized: true, suggestAction: "PROCESS"
- If the image is unclear, a selfie, a random photo, food, scenery, text/meme, or anything NOT an emergency → recognized: false, incidentType: "Unrecognized", suggestAction: "REJECT"
- confidence: "high" if very clear, "medium" if somewhat clear, "low" if unclear
- When in doubt, lean toward recognized: false and suggestAction: "REJECT" to reduce false alarms`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageData, mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

    // Normalize the recognized flag
    if (parsed.recognized === undefined) {
      parsed.recognized = isRecognizedIncident(parsed.incidentType);
    }

    return parsed;

  } catch (error: any) {
    console.error("❌ Gemini AI Service Error:", error.message);
    // Fallback: treat as unrecognized so admin can decide
    return {
      incidentType: "Emergency (Pending Review)",
      recommendedDept: "RESCUE",
      confidence: "low",
      recognized: false,
    };
  }
};