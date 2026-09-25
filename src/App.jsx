import { useState } from 'react'
import './App.css'

function App() {
  const [input, setInput]     = useState('')
  const [quiz, setQuiz]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleGenerate() {
    const trimmed = input.trim()

    if (!trimmed) {
      setError('Please enter a topic or some study notes before generating.')
      return
    }

    setLoading(true)
    setError('')
    setQuiz(null)

    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Backend returned a 4xx/5xx — show its error message if available
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setQuiz(data)
    } catch {
      // Network failure or the server is not running
      setError('Could not reach the server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>StudyForge</h1>
        <p>Enter a topic or paste your study notes and get an instant quiz.</p>
      </header>

      <main className="app-main">
        <textarea
          className="input-area"
          placeholder="e.g. The water cycle, JavaScript promises, Chapter 3 notes…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          rows={6}
        />

        {error && <p className="error-message">{error}</p>}

        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? 'Generating…' : 'Generate Quiz'}
        </button>

        {/* Temporary: show raw JSON for verification — will be replaced by quiz UI */}
        {quiz && (
          <pre className="quiz-preview">
            {JSON.stringify(quiz, null, 2)}
          </pre>
        )}
      </main>
    </div>
  )
}

export default App
