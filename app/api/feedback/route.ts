import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { problemText, userAnswer, finalAnswer } = await req.json()

  const prompt = `
  The student answered ${userAnswer} for this problem:
  "${problemText}"
  The correct answer is ${finalAnswer}.
  Write short, encouraging feedback for a Primary 5 student.`

  const res = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: prompt }] }
        ]
      }),
    }
  )

  const data = await res.json()
  const feedback = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Good effort!'
  return NextResponse.json({ feedback })
}