/**
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
 * Used in AppointmentsView.tsx
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

/**
 * 3. Generates care instructions based on session notes.
 * FIXES BUILD ERROR: imported by views/SessionsView.tsx
 */
export async function generateCareInstructions(sessionNotes: string, results: string) {
  const prompt = `Based on the following session notes and results, generate a concise list of home care instructions for the patient.
  Notes: ${sessionNotes}
  Results: ${results}
  Format as a simple bulleted list.`;

  try {
    return await callAiProxy(prompt);
  } catch (error) {
    console.error("Care Instructions AI Error:", error);
    return "• Follow general wellness guidelines\n• Stay hydrated\n• Rest as needed";
  }
}

/**
 * 4. AI Consultant for patient concerns.
 * Recommended for ConsultView or similar
 */
export async function consultPatientAI(concern: string, availableTreatments: string[]) {
  const prompt = `You are a professional medical aesthetic consultant for MedPulse Connect.
  A patient has the following concern: "${concern}".
  Based on this concern, recommend the BEST treatment from our list: ${availableTreatments.join(', ')}.
  Explain WHY you recommend it. Keep it empathetic and limit to 4 sentences.`;

  try {
    return await callAiProxy(prompt);
  } catch (error) {
    console.error("Consult AI Error:", error);
    return "Based on your concern, we recommend a consultation with our specialist to determine the best treatment plan.";
  }
}
