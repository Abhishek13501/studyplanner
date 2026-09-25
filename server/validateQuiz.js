function validateQuiz(quiz) {
  if (!quiz || typeof quiz !== 'object' || Array.isArray(quiz)) {
    return { valid: false, error: 'Quiz must be a non-null object' }
  }

  if (!quiz.title || typeof quiz.title !== 'string' || quiz.title.trim() === '') {
    return { valid: false, error: 'title must be a non-empty string' }
  }

  if (!Array.isArray(quiz.questions)) {
    return { valid: false, error: 'questions must be an array' }
  }

  if (quiz.questions.length !== 5) {
    return { valid: false, error: `Expected 5 questions, got ${quiz.questions.length}` }
  }

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i]

    if (!q || typeof q !== 'object' || Array.isArray(q)) {
      return { valid: false, error: `Question ${i + 1} must be a non-null object` }
    }

    if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
      return { valid: false, error: `Question ${i + 1}: question must be a non-empty string` }
    }

    if (!Array.isArray(q.options)) {
      return { valid: false, error: `Question ${i + 1}: options must be an array` }
    }

    if (q.options.length !== 4) {
      return { valid: false, error: `Question ${i + 1}: expected 4 options, got ${q.options.length}` }
    }

    for (let j = 0; j < q.options.length; j++) {
      if (typeof q.options[j] !== 'string' || q.options[j].trim() === '') {
        return { valid: false, error: `Question ${i + 1}, option ${j + 1} must be a non-empty string` }
      }
    }

    if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex > 3) {
      return { valid: false, error: `Question ${i + 1}: correctIndex must be an integer from 0 to 3` }
    }

    if (!q.explanation || typeof q.explanation !== 'string' || q.explanation.trim() === '') {
      return { valid: false, error: `Question ${i + 1}: explanation must be a non-empty string` }
    }
  }

  return { valid: true }
}

export default validateQuiz
