import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const runAIAnalysis = async (imageUrl: string) => {
  try {
    // 2026 Model Name: gemini-3-flash-preview
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageData = Buffer.from(imageResponse.data).toString("base64");

    const prompt = `Analyze this disaster image. Return JSON: {"incidentType": "...", "recommendedDept": "..."}`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageData, mimeType: "image/jpeg" } }
    ]);

    const text = result.response.text();
    const jsonMatch = text.match(/\{.*\}/s);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);

  } catch (error: any) {
    // IMPORTANT: Log this so you can see it in the terminal!
    console.error("❌ Gemini AI Service Error:", error.message);
    
    // THESIS FALLBACK: Return a generic response so the database save still works
    return {
      incidentType: "Emergency (Pending Review)",
      recommendedDept: "MDRRMO Main Dispatch"
    };
  }
};