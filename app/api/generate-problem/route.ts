import { NextResponse } from 'next/server';

export async function POST() {
  const prompt = `
  Generate one Primary 5 math word problem suitable for 10–11-year-olds.
  It should involve real-world context (money, distance, time, etc.).
  Return JSON in this exact format:
  {
    "problem_text": "string",
    "final_answer": number
  }
  Only output valid JSON.
  `

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const data = await res.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ error: "Empty response from Gemini", data }, { status: 500 });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Try to extract JSON with regex in case Gemini adds explanation text
      const match = text.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : null;
    }

    if (!parsed) {
      return NextResponse.json({ error: "Could not parse Gemini output", raw: text }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
