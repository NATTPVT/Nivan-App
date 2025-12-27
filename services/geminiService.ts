import { GoogleGenerativeAI } from "@google/genai";

// Initialize with a fallback to avoid "undefined" crash on load
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const generateWelcomeMessage = async (patient: any) => {
  if (!apiKey) return `Welcome ${patient.name}!`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Write a very short (1 sentence) friendly welcome message for a patient named ${patient.name} at a medical clinic.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Welcome to our clinic!";
  } catch (error) {
    console.error("AI Error:", error);
    return "Welcome to our clinic!";
  }
};

export const consultPatientAI = async (concern: string) => {
  if (!apiKey) return "AI Service is temporarily unavailable (Missing Key).";

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `You are a medical aesthetic assistant. A patient says: "${concern}". Recommend 1-2 treatments from this list: Facial, CO2 Laser, Botox, Chemical Peel. Keep it brief and professional.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Consult Error:", error);
    return "Unable to generate recommendation at this time.";
  }
};
