import { GoogleGenerativeAI } from "@google/genai";

// 1. Ensure the key is read correctly
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

export const generateWelcomeMessage = async (patient: any) => {
  // 2. Safety Check: If no API key, don't crash the app
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    console.error("AI Error: VITE_GEMINI_API_KEY is missing in environment variables.");
    return `Welcome to the clinic, ${patient.name}! We look forward to seeing you.`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Write a short, friendly 2-line welcome message for a new medical patient named ${patient.name}.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // 3. Safety Check: Ensure response exists before reading
    if (!response || !response.text) {
      return "Welcome! We're glad to have you with us.";
    }

    return response.text();
  } catch (error) {
    console.error("Gemini AI failed:", error);
    return "Welcome! Your registration was successful.";
  }
};
