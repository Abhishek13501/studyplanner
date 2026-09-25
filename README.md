# StudyForge

An AI-powered study assistant that converts free-form notes or topics into structured quizzes.

## Tech Stack

- React 19 (Vite, JavaScript)
- Express.js
- Node.js
- Groq API _(not yet integrated)_

## Installation

```bash
cd studyforge
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

`.env` is listed in `.gitignore` and will never be committed.

## Running the Frontend

```bash
npm run dev
```

Runs on http://localhost:5173

## Running the Backend

```bash
npm run server
```

Runs on http://localhost:5000

## API Endpoint

### POST /api/generate

**Request body:**
```json
{ "input": "your topic or notes" }
```

**Success (200):**
```json
{ "message": "Backend is working", "input": "your topic or notes" }
```

**Validation error (400):**
```json
{ "error": "Input is required" }
```

## Current Project Status

- [x] React frontend scaffolded (placeholder UI)
- [x] Express backend with POST /api/generate
- [ ] Groq API integration
- [ ] Quiz UI
