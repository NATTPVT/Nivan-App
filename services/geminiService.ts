

/**
v3
 * HELPER: A shared function to call our secure Netlify backend.
 * This keeps our API Key hidden from the browser.
 */

async function callAiProxy(prompt: string) {
  const response = await fetch('/.netlify/functions/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) throw new Error('AI Proxy failed');

  const data = await response.json();
  // Extract the text from the Gemini response structure
  return data.candidates[0].content.parts[0].text;
}

/**
 * 1. Generates a welcome message for new patients.
 * Used in App.tsx
 */
export async function generateWelcomeMessage(patient: any) {
  const prompt = `Write a warm, professional welcome message for a new patient named ${patient.name} at MedPulse Connect clinic.`;
  try {
    return await callAiProxy(prompt);
  } catch (error) {
    console.error("Welcome AI Error:", error);
    return `Welcome to MedPulse Connect, ${patient.name}! We are happy to have you.`;
  }
}

/**
 * 2. Generates an appointment reminder.
 * Used in AppointmentsView.tsx (FIXES THE BUILD ERROR)
 */
export async function generateAppointmentReminder(appointment: any, patient: any) {
  const dateStr = new Date(appointment.dateTime).toLocaleString();
  const prompt = `Write a short, professional appointment reminder for ${patient.name}. 
  Appointment: ${appointment.type}
  Time: ${dateStr}
  Clinic: MedPulse Connect. 
  Ask them to arrive 10 minutes early.`;

  try {
    return await callAiProxy(prompt);
  } catch (error) {
    console.error("Reminder AI Error:", error);
    return `Friendly reminder: You have a ${appointment.type} appointment on ${dateStr} at MedPulse Connect.`;
  }
}




/*
/**
 * This service now calls our secure Netlify Function 
 * instead of talking to Google Gemini directly from the browser.
  this version has problem and is replaced by above one
 
export async function generateWelcomeMessage(patient: any) {
  // 1. Prepare the prompt for the AI
  const prompt = `Write a professional and friendly welcome message for a new patient at MedPulse Connect clinic. 
  Patient Name: ${patient.name}
  The message should be warm and mention we are looking forward to providing them with excellent care.`;

  try {
    // 2. Call your Netlify function (the middleman)
    const response = await fetch('/.netlify/functions/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();

    // 3. Extract the AI's response text from the Gemini data format
    // This matches the structure returned by the Gemini API
    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    console.error("AI Service Error:", error);
    // Fallback message if the AI fails or the key is missing
    return `Welcome to MedPulse Connect, ${patient.name}! We're glad to have you with us.`;
  }
}
*/

//due to changes to keep API secure below code is replaced by above code 
/*
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
*/





