import { useState } from 'react'
import './App.css'

function App() {
  // ── Generation form state ──────────────────────────────
  const [input, setInput]     = useState('')
  const [quiz, setQuiz]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // ── Quiz navigation state ──────────────────────────────
  const [currentQuestion, setCurrentQuestion] = useState(0)
  // null = nothing selected yet; number = index of the chosen option
  const [selectedAnswer, setSelectedAnswer]   = useState(null)

  // ── Generate quiz ──────────────────────────────────────
  async function handleGenerate() {
    const trimmed = input.trim()

    if (!trimmed) {
      setError('Please enter a topic or some study notes before generating.')
      return
    }

    setLoading(true)
    setError('')
    setQuiz(null)
    // Reset quiz navigation whenever a new quiz is generated
    setCurrentQuestion(0)
    setSelectedAnswer(null)

    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setQuiz(data)
    } catch {
      setError('Could not reach the server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  // ── Option selection ───────────────────────────────────
  function handleSelectOption(index) {
    // Ignore clicks after the user has already answered
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
  }

  // ── Navigation ─────────────────────────────────────────
  function handleNext() {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
    }
  }

  function handlePrevious() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setSelectedAnswer(null)
    }
  }

  // ── Derive per-option CSS class ────────────────────────
  // Called after an answer is selected to colour correct/wrong options.
  function getOptionClass(optionIndex, correctIndex) {
    if (selectedAnswer === null) return 'option-btn'
    if (optionIndex === correctIndex) return 'option-btn correct'
    if (optionIndex === selectedAnswer) return 'option-btn incorrect'
    return 'option-btn'
  }

  // ── Render ─────────────────────────────────────────────
  const q = quiz ? quiz.questions[currentQuestion] : null

  return (
    <div className="app">
      <header className="app-header">
        <h1>StudyForge</h1>
        <p>Enter a topic or paste your study notes and get an instant quiz.</p>
      </header>

      <main className="app-main">
        {/* ── Input form ── */}
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

        {/* ── Quiz interface ── */}
        {quiz && (
          <div className="quiz">
            <h2 className="quiz-title">{quiz.title}</h2>

            <p className="question-counter">
              Question {currentQuestion + 1} of {quiz.questions.length}
            </p>

            <p className="question-text">{q.question}</p>

            <ul className="options-list">
              {q.options.map((option, index) => (
                <li key={index}>
                  <button
                    className={getOptionClass(index, q.correctIndex)}
                    onClick={() => handleSelectOption(index)}
                    disabled={selectedAnswer !== null}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>

            {/* Explanation appears only after the user selects an answer */}
            {selectedAnswer !== null && (
              <div className="explanation">
                <strong>
                  {selectedAnswer === q.correctIndex ? '✓ Correct!' : '✗ Incorrect'}
                </strong>
                <p>{q.explanation}</p>
              </div>
            )}

            <div className="nav-buttons">
              {currentQuestion > 0 && (
                <button className="nav-btn" onClick={handlePrevious}>
                  ← Previous
                </button>
              )}
              {currentQuestion < quiz.questions.length - 1 && (
                <button className="nav-btn" onClick={handleNext}>
                  Next →
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
