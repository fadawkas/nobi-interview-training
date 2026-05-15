# NobiAI Class Diagram

## Database Models

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +String phone
        +String domicile
        +String description
        +Object cv
        -String cv.filename
        -String cv.url
        +Date createdAt
        +Date updatedAt
    }

    class Session {
        +ObjectId _id
        +ObjectId userId
        +String title
        +String jobRole
        +String companyName
        +String sourceType
        +Number totalQuestions
        +Array generatedQuestions
        +Number totalScore
        +String overallEvaluation
        +String status
        +Date createdAt
        +Date updatedAt
    }

    class GeneratedQuestion {
        +String questionId
        +Number questionNumber
        +String questionText
        +String category
        +String difficulty
    }

    class SessionAnswer {
        +ObjectId _id
        +ObjectId sessionId
        +ObjectId userId
        +String questionId
        +Number questionNumber
        +String questionText
        +String videoPath
        +String audioPath
        +String transcript
        +Object asrMetadata
        +Object femResult
        +String femSummary
        +Object answerEvaluation
        +Number answerScore
        +Number communicationScore
        +Number expressionScore
        +String expressionComment
        +Number overallQuestionScore
        +String optimalAnswer
        +String processingStatus
        +String processingError
        +Date createdAt
        +Date updatedAt
    }

    User "1" -- "*" Session : creates
    Session "1" -- "*" SessionAnswer : contains
    User "1" -- "*" SessionAnswer : answers
    Session "1" -- "*" GeneratedQuestion : includes
```

## Service Layer Architecture

```mermaid
classDiagram
    class AIService {
        -openRouterService
        -tavilyService
        -answerEvaluationService
        +generateInsights()
        +callLLM()
    }

    class QuestionGenerationService {
        -aiService
        -cvContextService
        -linkContextService
        +generateQuestions()
        +validateQuestions()
    }

    class AnswerEvaluationService {
        -aiService
        -mediaService
        +evaluateAnswer()
        +calculateScore()
        +generateOptimalAnswer()
    }

    class MediaService {
        -uploadMiddleware
        +extractAudio()
        +performASR()
        +analyzeFEM()
    }

    class CVContextService {
        +extractCVContext()
        +parseCV()
    }

    class LinkContextService {
        +fetchLinkContent()
        +extractRelevantInfo()
    }

    class AgendaService {
        -processAnswerJob
        +scheduleAnswerProcessing()
        +trackProgress()
    }

    class OpenRouterService {
        +callOpenRouterAPI()
        +selectModel()
    }

    class TavilyService {
        +searchCompanyInfo()
        +fetchContext()
    }

    AIService --> OpenRouterService : uses
    AIService --> TavilyService : uses
    AIService --> AnswerEvaluationService : uses
    QuestionGenerationService --> AIService : uses
    QuestionGenerationService --> CVContextService : uses
    QuestionGenerationService --> LinkContextService : uses
    AnswerEvaluationService --> MediaService : uses
    AnswerEvaluationService --> AIService : uses
```

## Controller & Route Layer

```mermaid
classDiagram
    class AuthController {
        +signUp()
        +signIn()
        +logout()
    }

    class ProfileController {
        +getProfile()
        +updateProfile()
        +uploadCV()
    }

    class SessionController {
        +createSession()
        +getSession()
        +listSessions()
        +updateSession()
    }

    class QuestionGenerationController {
        +generateQuestions()
        +getQuestions()
    }

    class AnswerProcessingController {
        +submitAnswer()
        +getAnswer()
    }

    class OrchestrationController {
        +startInterview()
        +submitAndProcess()
        +getResults()
    }

    class AuthMiddleware {
        +verifyToken()
        +requireAuth()
    }

    class UploadMiddleware {
        +handleFileUpload()
        +validateMedia()
    }

    AuthController --> AuthMiddleware : uses
    ProfileController --> AuthMiddleware : uses
    ProfileController --> UploadMiddleware : uses
    SessionController --> AuthMiddleware : uses
    QuestionGenerationController --> AuthMiddleware : uses
    AnswerProcessingController --> AuthMiddleware : uses
    AnswerProcessingController --> UploadMiddleware : uses
    OrchestrationController --> AuthMiddleware : uses
```

## Data Processing Pipeline

```mermaid
classDiagram
    class ProcessAnswerJob {
        -mediaService
        -answerEvaluationService
        -agendaService
        +processAnswer()
        +handlePipeline()
        +updateStatus()
    }

    class MediaService {
        +extractAudio()
        +performASR()
        +analyzeFEM()
    }

    class AnswerEvaluationService {
        +evaluateAnswer()
        +scoreResponse()
    }

    ProcessAnswerJob --> MediaService : uses
    ProcessAnswerJob --> AnswerEvaluationService : uses
```

## Processing Status Flow

```mermaid
stateDiagram-v2
    [*] --> Queued: Answer Submitted
    Queued --> Processing: Job Started
    Processing --> AudioExtracted: Audio Extraction Done
    AudioExtracted --> ASRCompleted: Speech Recognition Complete
    ASRCompleted --> FEMCompleted: Expression Analysis Done
    FEMCompleted --> Evaluating: AI Evaluation Started
    Evaluating --> Completed: All Processing Done
    
    Queued --> Failed: Error in Queue
    Processing --> Failed: Error in Processing
    AudioExtracted --> Failed: Audio Extraction Failed
    ASRCompleted --> Failed: ASR Failed
    FEMCompleted --> Failed: FEM Analysis Failed
    Evaluating --> Failed: Evaluation Failed
    
    Completed --> [*]
    Failed --> [*]
```

## Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Session Created
    Active --> Active: Questions Generated
    Active --> Active: Answers Submitted
    Active --> Processing: All Answers Submitted
    Processing --> Completed: All Answers Evaluated
    Processing --> Failed: Evaluation Error
    
    Completed --> [*]
    Failed --> [*]
```

## Entity Relationships

```mermaid
erDiagram
    USER ||--o{ SESSION : creates
    USER ||--o{ SESSION-ANSWER : provides
    SESSION ||--|{ GENERATED-QUESTION : contains
    SESSION ||--o{ SESSION-ANSWER : has
    
    USER {
        string _id
        string name
        string email
        string password
        string phone
        string domicile
        string description
        object cv
        timestamp createdAt
        timestamp updatedAt
    }
    
    SESSION {
        string _id
        string userId
        string title
        string jobRole
        string companyName
        string sourceType
        number totalQuestions
        number totalScore
        string overallEvaluation
        string status
        timestamp createdAt
        timestamp updatedAt
    }
    
    GENERATED-QUESTION {
        string questionId
        number questionNumber
        string questionText
        string category
        string difficulty
    }
    
    SESSION-ANSWER {
        string _id
        string sessionId
        string userId
        string questionId
        number questionNumber
        string questionText
        string videoPath
        string audioPath
        string transcript
        number answerScore
        number communicationScore
        number expressionScore
        number overallScore
        string processingStatus
        timestamp createdAt
        timestamp updatedAt
    }
```

## Module Dependencies

```
┌─────────────────────────────────────────────┐
│           Express Server (app.js)           │
└─────────────┬───────────────────────────────┘
              │
    ┌─────────┼────────────┬──────────────┐
    │         │            │              │
┌───▼──┐  ┌──▼───┐  ┌─────▼──┐  ┌──────▼───┐
│Auth  │  │Profile│  │Session │  │Answer    │
│Routes│  │Routes │  │Routes  │  │Processing│
└───┬──┘  └──┬───┘  └──┬──────┘  │Routes    │
    │        │         │         └──┬───────┘
    │        │         │            │
┌───▼────────▼─────────▼────────────▼────┐
│        Controllers Layer                │
├─────────────────────────────────────────┤
│ AuthController                          │
│ ProfileController                       │
│ SessionController                       │
│ QuestionGenerationController            │
│ AnswerProcessingController              │
│ OrchestrationController                 │
└───┬─────────────────────────────────────┘
    │
    │ ┌──────────────────────────────────┐
    ├─┤    Services Layer                │
    │ ├──────────────────────────────────┤
    │ │ QuestionGenerationService        │
    │ │ AnswerEvaluationService          │
    │ │ MediaService                     │
    │ │ AIService                        │
    │ │ CVContextService                 │
    │ │ LinkContextService               │
    │ │ AgendaService                    │
    │ │ OpenRouterService                │
    │ │ TavilyService                    │
    │ └──────────────────────────────────┘
    │
    │ ┌──────────────────────────────────┐
    ├─┤    Jobs Layer                    │
    │ ├──────────────────────────────────┤
    │ │ ProcessAnswerJob (Agenda.js)     │
    │ └──────────────────────────────────┘
    │
    │ ┌──────────────────────────────────┐
    ├─┤    Models Layer                  │
    │ ├──────────────────────────────────┤
    │ │ User                             │
    │ │ Session                          │
    │ │ SessionAnswer                    │
    │ └──────────────────────────────────┘
    │
    └──►  MongoDB Database
```

## Key Relationships Summary

- **User** creates multiple **Sessions** for interview practice
- **Session** contains multiple **GeneratedQuestions** based on job role and CV context
- **User** provides multiple **SessionAnswers** to questions within a session
- **SessionAnswer** tracks the complete processing pipeline: video/audio → transcript → evaluation → score
- **Services** handle business logic:
  - Question generation from CV and company context
  - Media processing (video/audio extraction, ASR, FEM)
  - Answer evaluation using AI models
- **Controllers** route HTTP requests and coordinate services
- **Jobs** handle asynchronous processing of answers through the pipeline
- **Middleware** handles authentication and file uploads

## Processing Pipeline Detail

1. **User submits answer** → VideoPath, AudioPath saved
2. **ProcessAnswerJob triggered** → Status: queued
3. **Audio Extraction** → AudioPath extracted, Status: audio_extracted
4. **ASR (Speech Recognition)** → Transcript generated, Status: asr_completed
5. **FEM Analysis** → Expression analysis, Status: fem_completed
6. **Gemini Evaluation** → Score & feedback, Status: evaluating
7. **Finalization** → OptimalAnswer generated, Status: completed
8. **Session Finalization** → TotalScore calculated, OverallEvaluation generated
