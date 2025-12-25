
import { GoogleGenAI, Type } from "@google/genai";
import { Patient, CLINIC_TREATMENTS } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateWelcomeMessage = async (patient: Patient) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Draft a warm, professional welcoming message for a new patient named ${patient.name}. 
               The clinic name is 'MedPulse Wellness'. Mention that we are excited to have them. 
               Keep it friendly and suitable for WhatsApp. Max 2-3 sentences.`,
  });
  return response.text || "Welcome to MedPulse Wellness! We're glad you're here.";
};

export const generateAppointmentReminder = async (patient: Patient, appointmentTime: string, leadTime: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Draft a professional appointment reminder for ${patient.name}. 
               Appointment Time: ${appointmentTime}. 
               Lead time: ${leadTime} before the appointment. 
               Keep it concise and helpful for a messaging app.`,
  });
  return response.text || `Reminder: Your appointment at MedPulse is scheduled for ${appointmentTime}.`;
};

export const generateCareInstructions = async (sessionNotes: string, results: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the following session notes and results, generate a concise list of home care instructions for the patient.
               Notes: ${sessionNotes}
               Results: ${results}
               Format as a simple bulleted list.`,
  });
  return response.text || "Follow general wellness guidelines and stay hydrated.";
};

export const consultPatientAI = async (concern: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are a professional medical aesthetic consultant for MedPulse Wellness.
               A patient has the following concern: "${concern}".
               Based on this concern, recommend the BEST treatment from our available list:
               ${CLINIC_TREATMENTS.join(', ')}.
               
               Explain WHY you recommend it and what they can expect. 
               Keep your tone empathetic, professional, and reassuring.
               Limit your response to 4 sentences.`,
  });
  return response.text || "Based on your concern, we recommend a consultation with our specialist to determine the best plan.";
};
