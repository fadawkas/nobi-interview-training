# NobiAI

A full-stack AI-powered interview preparation platform built with React, TypeScript, Express.js, and FastAPI.

## Prerequisites

Make sure these are installed on your machine:

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/)

## Clone the Repository

```bash
git clone https://github.com/fadawkas/nobiAI.git
docker compose up --build
```

## Project Structure

- `frontend/` - React + TypeScript + Vite web application
- `backend/` - Express.js REST API
- `ai_service/` - FastAPI service for ASR (speech-to-text) and FEM (facial emotion analysis)
- `shared_data/` - Shared volume for audio/video files between services

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Express.js, MongoDB (Mongoose)
- **AI Service**: FastAPI, OpenAI Whisper (ASR), Facial Emotion Model
- **Infrastructure**: Docker, Docker Compose
