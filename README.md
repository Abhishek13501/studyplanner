# StudyForge

StudyForge is an AI-powered study quiz generator. Users enter a topic or paste their study notes, and the application generates an interactive five-question multiple-choice quiz. Answers are checked immediately, explanations are shown after each selection, and wrong answers can be retried without making another AI request.

---

## Features

- Free-form topic or notes input
- AI-generated quizzes with exactly 5 questions
- Four answer options per question
- Immediate correct / incorrect feedback on selection
- Explanation shown after every answer
- Previous / Next navigation across questions
- Final score with percentage and contextual message
- Retry wrong answers using existing quiz data — no extra API call
- Loading state with disabled controls during generation
- Frontend empty-input validation
- Backend input validation (HTTP 400)
- Safe error messages for Groq / API failures (HTTP 500, 502)
- 30-second request timeout with user-friendly message
- Stale request protection — older responses never overwrite a newer request
- Responsive layout for mobile (320 px+) and desktop

---

## Tech Stack

**Frontend**
- React 19
- Vite
- JavaScript (ES modules)
- CSS (custom properties, no UI library)

**Backend**
- Node.js
- Express.js

**AI**
- Groq API
- Model: `openai/gpt-oss-120b`
- JSON mode enabled for structured output

**Other**
- Fetch API (built-in, no Axios)
- dotenv
- cors
- Git

---

## Architecture

```
User Input
    │
    ▼
React (App.jsx)
    │  POST /api/generate  { input: "topic" }
    ▼
Express Backend (server/index.js)
    │  Validates input
    │  Builds prompt
    ▼
Groq API  (openai/gpt-oss-120b, JSON mode)
    │
    ▼
Express Backend
    │  JSON.parse()
    │  validateQuiz()  →  HTTP 502 if structure is invalid
    ▼
React Quiz UI
    │  Answer selection → immediate feedback → explanation
    │  Previous / Next navigation
    │  Finish Quiz → score calculation
    ▼
Results Screen
    │  Score  |  Percentage  |  Message
    ▼
Retry Wrong Answers
    │  Filters wrong questions from existing quiz data
    │  No new API request
    ▼
Try Another Quiz  →  resets all state, returns to input screen
```

**Why the backend exists**

The Groq API key must never be sent to the browser — any user could read it from the network tab and use it at your expense. The Express server acts as a secure proxy: the frontend sends the user's input to Express, Express attaches the API key and forwards the request to Groq, and only the structured quiz data is returned to the browser.

---

## Project Structure

```
studyforge/
├── src/
│   ├── App.jsx          React application — all UI logic and state
│   ├── App.css          Component styles
│   ├── index.css        Global reset, design tokens, Inter font
│   └── main.jsx         React entry point
├── server/
│   ├── index.js         Express server — POST /api/generate
│   └── validateQuiz.js  Validates the parsed Groq response shape
├── .env.example         Template showing required environment variables
├── .gitignore           Excludes .env, node_modules, dist
├── package.json         Scripts and dependencies
└── README.md
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd studyforge
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your `.env` file

```bash
cp .env.example .env
```

Open `.env` and add your Groq API key:

```
GROQ_API_KEY=your_key_here
```

> **Important:** `.env` is listed in `.gitignore` and must never be committed to version control. Your API key would be publicly visible and could be used without your consent.

### 4. Get a Groq API key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign in and navigate to **API Keys**
3. Create a new key and paste it into your `.env` file

### 5. Start the backend

```bash
npm run server
```

The Express server runs on `http://localhost:5000`.

### 6. Start the frontend (separate terminal)

```bash
npm run dev
```

Vite starts on `http://localhost:5173`. Open that URL in your browser.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes | Your Groq API key. Used only by the Express backend. Never sent to the browser. |

---

## API Endpoint

### `POST /api/generate`

**Request body**
```json
{ "input": "your topic or study notes" }
```

**Success — HTTP 200**
```json
{
  "title": "JavaScript Promises Quiz",
  "questions": [
    {
      "question": "What does Promise.all() do?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Promise.all() resolves when all supplied promises have fulfilled."
    }
  ]
}
```

**Error responses**

| Status | Body | Cause |
|---|---|---|
| 400 | `{ "error": "Input is required" }` | Missing, empty, or whitespace-only input |
| 500 | `{ "error": "Failed to generate quiz" }` | Groq API or network failure |
| 502 | `{ "error": "Invalid AI response" }` | Groq returned non-JSON text |
| 502 | `{ "error": "Invalid quiz format" }` | JSON parsed but failed structure validation |

---

## AI Response Handling

1. The backend builds a prompt that embeds the user's input and instructs the model to return only valid JSON.
2. `response_format: { type: 'json_object' }` (JSON mode) is passed to the Groq API to further enforce structured output.
3. The raw text from Groq is parsed with `JSON.parse()`. If parsing throws, the backend returns HTTP 502 with a safe error message — no internal details are exposed.
4. The parsed object is passed to `validateQuiz()` in `server/validateQuiz.js`, which checks every field: title, question count, option count, `correctIndex` range, explanation presence.
5. Only a fully valid quiz object is forwarded to the React frontend.

---

## Error Handling

| Scenario | Handled by | Response |
|---|---|---|
| Empty input (frontend) | React state check | Shows inline error, no request sent |
| Empty input (backend) | Express validation | HTTP 400 `Input is required` |
| Groq API failure | Express `try/catch` | HTTP 500 `Failed to generate quiz` |
| Groq returns non-JSON | `JSON.parse()` catch | HTTP 502 `Invalid AI response` |
| Quiz fails structure check | `validateQuiz()` | HTTP 502 `Invalid quiz format` |
| Server not running | Fetch `catch` | Frontend shows connection error |
| Request takes > 30 s | `AbortController` + `setTimeout` | Frontend shows timeout message |
| User clicks Generate again while a request is in flight | Request ID guard | Previous request is aborted; its response is silently discarded if it arrives late |

---

## Why Retry Does Not Call the AI Again

When the results screen is shown, the full quiz is already in React state. Clicking "Retry Wrong Answers" runs a `.filter()` over the existing questions, keeping only those where the stored answer does not match `correctIndex`. That filtered array becomes a new quiz object entirely in memory — no network request is made. This keeps the retry instant and avoids burning API quota on data already available locally.

---

## Security

- The Groq API key is stored in `.env`, which is excluded from Git via `.gitignore`.
- The key is read from `process.env.GROQ_API_KEY` only inside the Express backend.
- The frontend communicates with `http://localhost:5000` — it never receives or transmits the API key.
- CORS is configured to allow requests only from `http://localhost:5173` (the Vite dev server).

This setup is appropriate for local development. A production deployment would require HTTPS, a proper secrets manager, and environment-specific CORS configuration.

---

## Limitations

- Quiz quality depends on the AI model's output for the given topic. Niche or ambiguous inputs may produce lower-quality questions.
- The application always generates exactly 5 questions per quiz.
- No user accounts, no persistent quiz history, no database.
- No offline mode — the application requires both the local backend and Groq API to be reachable.
- API availability and response time depend on Groq's service status.

---

## Future Improvements

- Quiz history saved locally (localStorage) or in a database
- Selectable difficulty level passed to the prompt
- More question types (true/false, short answer)
- Persistent progress tracking across sessions
- User authentication
- Score analytics over time
- Production deployment configuration (environment variables, HTTPS, process manager)

---

## AI Usage

This project was developed with the assistance of AI coding tools for implementation guidance, debugging, and iteration. All generated code was reviewed, tested, and understood before being accepted. The developer made the final decisions on architecture, feature scope, and implementation approach.

---

## Development Process

The project was built incrementally across small, focused commits — one meaningful feature per commit. This approach kept each change reviewable and made it easy to isolate and debug issues at every stage.

---

## License

This project was created as part of a frontend internship assignment for Flam.
