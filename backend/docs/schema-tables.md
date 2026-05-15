# Database Schema Tables — NobiAI Backend

This document describes all Mongoose schemas used across the models in `backend/src/models/`. Each table lists the field names, types, constraints, defaults, and descriptions.

---

## 1. User (`userModel.js`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `name` | `String` | ✅ | — | Display name of the user |
| `email` | `String` | ✅ (unique) | — | Email address (lowercased, trimmed) |
| `password` | `String` | ✅ | — | Hashed password |
| `phone` | `String` | ✘ | `""` | Phone number |
| `domicile` | `String` | ✘ | `""` | City / region of residence |
| `description` | `String` | ✘ | `""` | Short bio or description |
| `cv.filename` | `String` | ✘ | `""` | Uploaded CV file name |
| `cv.url` | `String` | ✘ | `""` | Uploaded CV file URL |
| `createdAt` | `Date` | auto | — | Mongoose timestamp |
| `updatedAt` | `Date` | auto | — | Mongoose timestamp |

**Indexes:**
- `email` — unique index (declared via `unique: true`)

---

## 2. Session (`sessionModel.js`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `userId` | `ObjectId` (ref `User`) | ✅ | — | Owner of the session |
| `title` | `String` | ✘ | `"Interview Practice Session"` | Session display title |
| `jobRole` | `String` | ✘ | `""` | Target job role |
| `companyName` | `String` | ✘ | `""` | Target company name |
| `sourceType` | `String` | ✘ | `""` | Source of questions (JD / CV / link) |
| `totalQuestions` | `Number` | ✅ | — | Number of questions generated |
| `generatedQuestions` | `[GeneratedQuestion]` | ✘ | `[]` | Embedded sub-documents (see below) |
| `totalScore` | `Number` | ✘ | `null` | Overall session score |
| `overallEvaluation` | `String` | ✘ | `""` | Summary evaluation text |
| `status` | `String` (enum) | ✘ | `"active"` | Session state |
| `createdAt` | `Date` | auto | — | Mongoose timestamp |
| `updatedAt` | `Date` | auto | — | Mongoose timestamp |

**`status` enum values:** `active` · `processing` · `completed` · `failed`

**Indexes:**
- `userId` — single-field index

---

## 3. GeneratedQuestion (embedded sub-schema)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `questionId` | `String` | ✅ | — | Unique question identifier |
| `questionNumber` | `Number` | ✅ | — | Sequential question number within session |
| `questionText` | `String` | ✅ | — | The question text |
| `category` | `String` | ✘ | `""` | Question category / topic |
| `difficulty` | `String` | ✘ | `""` | Difficulty level |

**Note:** This schema is embedded inside `Session.generatedQuestions` with `{ _id: false }`, meaning no separate MongoDB collection exists.

---

## 4. SessionAnswer (`sessionAnswerModel.js`)

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `sessionId` | `ObjectId` (ref `Session`) | ✅ | — | Parent session |
| `userId` | `ObjectId` (ref `User`) | ✅ | — | Answering user |
| `questionId` | `String` | ✅ | — | Reference to the original question |
| `questionNumber` | `Number` | ✅ | — | Question number within the session |
| `questionText` | `String` | ✅ | — | Stored question text (denormalized) |
| `videoPath` | `String` | ✘ | `""` | Relative path to video recording |
| `audioPath` | `String` | ✘ | `""` | Relative path to extracted audio |
| `transcript` | `String` | ✘ | `""` | ASR-generated transcript |
| `asrMetadata` | `Mixed` | ✘ | `null` | Raw ASR output metadata |
| `femResult` | `Mixed` | ✘ | `null` | Facial expression analysis output |
| `femSummary` | `String` | ✘ | `""` | Short summary of FEM result |
| `answerEvaluation` | `Mixed` | ✘ | `null` | Gemini answer evaluation output |
| `answerScore` | `Number` | ✘ | `null` | Score for answer correctness |
| `communicationScore` | `Number` | ✘ | `null` | Score for communication skills |
| `expressionScore` | `Number` | ✘ | `null` | Score for facial expressions |
| `expressionComment` | `String` | ✘ | `""` | Comment on expression performance |
| `overallQuestionScore` | `Number` | ✘ | `null` | Combined overall question score |
| `optimalAnswer` | `String` | ✘ | `""` | Ideal / reference answer text |
| `processingStatus` | `String` (enum) | ✘ | `"queued"` | Current pipeline stage |
| `processingError` | `String` | ✘ | `""` | Error message if pipeline failed |
| `createdAt` | `Date` | auto | — | Mongoose timestamp |
| `updatedAt` | `Date` | auto | — | Mongoose timestamp |

**`processingStatus` enum values:**

| Value | Meaning |
|-------|---------|
| `queued` | Waiting to be processed |
| `processing` | Pipeline running |
| `audio_extracted` | Audio extracted from video |
| `asr_completed` | Speech-to-text done |
| `fem_completed` | Facial expression analysis done |
| `evaluating` | LLM evaluation in progress |
| `completed` | All pipeline steps finished successfully |
| `failed` | Pipeline encountered an error |

**Indexes:**
- `sessionId` — single-field index
- `userId` — single-field index
- `{ sessionId: 1, questionNumber: 1 }` — compound unique index (one answer per question per session)

---

## 5. Schema Relationships

```
User (1) ──< Session (N)
 │                  │
 │                  └── hasMany ── GeneratedQuestion (embedded)
 │
 └──< SessionAnswer (N)
      │
      └── belongsTo ── Session
      └── belongsTo ── User
```

- **User → Session**: one-to-many
- **Session → GeneratedQuestion**: one-to-many (embedded, no separate collection)
- **Session → SessionAnswer**: one-to-many (via `sessionId`)
- **User → SessionAnswer**: one-to-many (via `userId`)
- **SessionAnswer → Session + User**: many-to-one

---

## 6. Collection Summary

| Collection | Mongoose Model | Schema File | Document Count Hint |
|------------|---------------|-------------|-------------------|
| `users` | `User` | `userModel.js` | One per registered user |
| `sessions` | `Session` | `sessionModel.js` | One per practice session |
| `sessionanswers` | `SessionAnswer` | `sessionAnswerModel.js` | One per answered question |

---
*Generated from `backend/src/models/` — updated 2026-05-08*