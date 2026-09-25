import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Groq from 'groq-sdk'

const app = express()
const PORT = 5000

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Allow requests from the Vite dev server
app.use(cors({ origin: 'http://localhost:5173' }))

// Parse incoming JSON request bodies
app.use(express.json())

app.post('/api/generate', async (req, res) => {
  const { input } = req.body

  if (!input || typeof input !== 'string' || input.trim() === '') {
    return res.status(400).json({ error: 'Input is required' })
  }

  const prompt = `You are a study assistant. The user has provided the following topic or notes:

"${input.trim()}"

Generate a study quiz based on this material. Return ONLY a valid JSON object. Do not include any markdown, code fences, or explanation outside the JSON.

The JSON must follow this exact structure:
{
  "title": "A short descriptive title for this quiz",
  "questions": [
    {
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why the answer is correct"
    }
  ]
}

Rules:
- Generate exactly 5 questions.
- Each question must have exactly 4 options.
- correctIndex must be an integer from 0 to 3 that identifies the correct option.
- Every question must include an explanation.
- Base all questions on the user's input.`

  try {
    const completion = await groq.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = completion.choices[0].message.content

    try {
      const quiz = JSON.parse(rawText)
      return res.status(200).json(quiz)
    } catch {
      return res.status(502).json({ error: 'Invalid AI response' })
    }
  } catch {
    return res.status(500).json({ error: 'Failed to generate quiz' })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
