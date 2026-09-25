import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 5000

// Allow requests from the Vite dev server
app.use(cors({ origin: 'http://localhost:5173' }))

// Parse incoming JSON request bodies
app.use(express.json())

app.post('/api/generate', (req, res) => {
  const { input } = req.body

  if (!input || typeof input !== 'string' || input.trim() === '') {
    return res.status(400).json({ error: 'Input is required' })
  }

  return res.status(200).json({
    message: 'Backend is working',
    input: input.trim(),
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
