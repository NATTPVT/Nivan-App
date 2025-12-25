import { Config, Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  const { prompt } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
};
