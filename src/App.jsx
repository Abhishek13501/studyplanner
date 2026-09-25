import { useState, useRef } from 'react'
import './App.css'

function getScoreMessage(percentage) {
  if (percentage === 100) return '🎉 Perfect score! Outstanding work.'
  if (percentage >= 80)  return '👏 Great job! You know this topic well.'
  if (percentage >= 60)  return '👍 Good effort. A little more review will help.'
  if (percentage >= 40)  return '📖 Keep studying — you\'re making progress.'
  return '💪 This topic needs more attention. Give it another read!'
}

function App() {
  const [input, setInput]     = useState('')
  const [quiz, setQuiz]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  // answers[i] = option index chosen for question i, or null if unanswered
  const [answers, setAnswers] = useState([])
  // null = quiz in progress; object = quiz finished
  const [result, setResult] = useState(null)

  // Each request gets an incrementing ID. Before updating state, we check
  // that the response belongs to the latest request — older responses are discarded.
  const requestIdRef       = useRef(0)
  const abortControllerRef = useRef(null)

  const TIMEOUT_MS = 30_000

  async function handleGenerate() {
    const trimmed = input.trim()

    if (!trimmed) {
      setError('Please enter a topic or some study notes before generating.')
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    const controller = new AbortController()
    abortControllerRef.current = controller

    const timeoutId = setTimeout(() => controller.abort('timeout'), TIMEOUT_MS)

    setLoading(true)
    setError('')
    setQuiz(null)
    setCurrentQuestion(0)
    setAnswers([])
    setResult(null)

    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: trimmed }),
        signal: controller.signal,
      })

      // Discard if a newer request has already taken over
      if (requestId !== requestIdRef.current) return

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setAnswers(new Array(data.questions.length).fill(null))
      setQuiz(data)
    } catch (err) {
      if (requestId !== requestIdRef.current) return

      if (err.name === 'AbortError') {
        // 'timeout' is the reason string passed to controller.abort() above
        if (err.message === 'timeout') {
          setError('The request took too long. Please try again.')
        }
        return
      }

      setError('Unable to connect to the server. Please try again.')
    } finally {
      clearTimeout(timeoutId)
      // Only the latest request should turn off the loading state
      if (requestId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }

  function handleSelectOption(optionIndex) {
    if (answers[currentQuestion] !== null) return
    const updated = [...answers]
    updated[currentQuestion] = optionIndex
    setAnswers(updated)
  }

  function handlePrevious() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  function handleNext() {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  function handleFinish() {
    const correct = quiz.questions.reduce((count, question, index) => {
      return answers[index] === question.correctIndex ? count + 1 : count
    }, 0)

    const total      = quiz.questions.length
    const percentage = Math.round((correct / total) * 100)

    setResult({ correct, total, percentage })
  }

  function handleRetry() {
    const wrongQuestions = quiz.questions.filter((question, index) => {
      return answers[index] !== question.correctIndex
    })

    setQuiz({ title: `${quiz.title} — Retry`, questions: wrongQuestions })
    setAnswers(new Array(wrongQuestions.length).fill(null))
    setCurrentQuestion(0)
    setResult(null)
  }

  function handleReset() {
    setQuiz(null)
    setCurrentQuestion(0)
    setAnswers([])
    setResult(null)
    // Keep input populated so the user can adjust and regenerate without retyping
  }

  function getOptionClass(optionIndex, correctIndex) {
    const selected = answers[currentQuestion]
    if (selected === null) return 'option-btn'
    if (optionIndex === correctIndex) return 'option-btn correct'
    if (optionIndex === selected)     return 'option-btn incorrect'
    return 'option-btn'
  }

  const q              = quiz ? quiz.questions[currentQuestion] : null
  const selectedAnswer = quiz ? answers[currentQuestion] : null
  const isLastQuestion = quiz ? currentQuestion === quiz.questions.length - 1 : false
  const wrongCount     = result
    ? quiz.questions.filter((q, i) => answers[i] !== q.correctIndex).length
    : 0

  return (
    <div className="app">
      <header className="app-header">
        <h1>StudyForge</h1>
        <p>Enter a topic or paste your study notes and get an instant quiz.</p>
      </header>

      <main className="app-main">

        {result ? (
          <div className="results-card">
            <h2 className="results-title">{quiz.title}</h2>
            <p className="results-score">
              {result.correct} / {result.total}
            </p>
            <p className="results-percentage">{result.percentage}%</p>
            <p className="results-message">{getScoreMessage(result.percentage)}</p>
            {wrongCount > 0 && (
              <button className="retry-btn" onClick={handleRetry}>
                Retry Wrong Answers ({wrongCount})
              </button>
            )}
            <button className="generate-btn" onClick={handleReset}>
              Try Another Quiz
            </button>
          </div>
        ) : (
          <>
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

                  {!isLastQuestion && (
                    <button className="nav-btn" onClick={handleNext}>
                      Next →
                    </button>
                  )}

                  {isLastQuestion && (
                    <button className="nav-btn finish-btn" onClick={handleFinish}>
                      Finish Quiz
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}

export default App
