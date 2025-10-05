'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

interface MathProblem {
  problem_text: string
  final_answer: number
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const generateProblem = async () => {
    setIsLoading(true)
    setFeedback('')
    setUserAnswer('')
    try {
      const res = await fetch('/api/generate-problem', { method: 'POST' })
      const data = await res.json()
      if (data.problem_text) {
        setProblem(data)

        // save to supabase
        const { data: insertData, error } = await supabase
          .from('math_problem_sessions')
          .insert([{ problem_text: data.problem_text, final_answer: data.final_answer }])
          .select('id')
          .single()

        if (error) console.error('Supabase insert error:', error)
        else setSessionId(insertData.id)
      }
    } catch (err) {
      console.error(err)
      setFeedback("⚠️ Something went wrong while generating the problem. Please try again.")
    }
    setIsLoading(false)
  }

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    e.preventDefault()
    if (!problem || !sessionId) return
    setIsLoading(true)
    try {
      const userNum = parseFloat(userAnswer)
      const correct = userNum === Number(problem.final_answer)
      setIsCorrect(correct)

      // Generate feedback from Gemini
      const feedbackRes = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemText: problem.problem_text,
          userAnswer: userNum,
          finalAnswer: problem.final_answer,
        }),
      })
      const { feedback } = await feedbackRes.json()
      setFeedback(feedback)

      // Save submission to Supabase
      const { error } = await supabase.from('math_problem_submissions').insert([
        {
          session_id: sessionId,
          user_answer: userNum,
          is_correct: correct,
          feedback_text: feedback,
        },
      ])
      if (error) console.error('Supabase submission error:', error)
    } catch (err) {
      console.error(err)
      setFeedback("⚠️ Something went wrong while submitting the answer. Please try again.")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-100 via-indigo-100 to-yellow-100">
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <h1 className="text-5xl font-extrabold text-center mb-8 text-indigo-700 drop-shadow-sm">
          🧮 Fun Math Challenge!
        </h1>

        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border-4 border-sky-200 transition-transform hover:scale-[1.01]">
          <button
            onClick={generateProblem}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-400 hover:to-indigo-400 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-2xl shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
          >
            {isLoading ? '🎲 Generating...' : '✨ Generate New Problem'}
          </button>
        </div>

        {problem && (
          <div className="bg-white rounded-3xl shadow-xl border-l-8 border-yellow-300 p-6 mb-6">
            <h2 className="text-2xl font-bold mb-3 text-indigo-700">🧠 Problem:</h2>
            <p className="text-lg text-gray-800 mb-6 leading-relaxed">{problem.problem_text}</p>

            <form onSubmit={submitAnswer} className="space-y-4">
              <div>
                <label htmlFor="answer" className="block text-sm font-medium text-indigo-700 mb-2">
                  ✏️ Your Answer:
                </label>
                <input
                  type="number"
                  id="answer"
                  step="any"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-gray-800 text-lg"
                  placeholder="Type your answer here..."
                  required
                />
              </div>

              <button
                type="submit"
                disabled={!userAnswer || isLoading}
                className="mt-4 w-full bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-300 hover:to-emerald-400 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-2xl shadow-md transition-all duration-200 ease-in-out transform hover:scale-105"
              >
                🚀 Submit Answer
              </button>
            </form>
          </div>
        )}

        {feedback && (
          <div
            className={`rounded-3xl shadow-xl p-6 border-4 ${
              isCorrect
                ? 'bg-green-50 border-green-200'
                : 'bg-pink-50 border-pink-200'
            }`}
          >
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700">
              {isCorrect ? '🎉 Great job!' : '🤔 Let’s try again!'}
            </h2>
            <p className="text-gray-800 leading-relaxed text-lg">{feedback}</p>
          </div>
        )}
      </main>
    </div>
  )
}