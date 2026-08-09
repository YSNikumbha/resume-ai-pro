# ResumeAI Pro

[![CI](https://github.com/YSNikumbha/resume-ai-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/YSNikumbha/resume-ai-pro/actions/workflows/ci.yml)

ResumeAI Pro is a Spring Boot and React resume platform with authenticated PDF upload, text extraction, resume history, Gemini-powered resume analysis, AI resume-to-job matching, and single-resume RAG chat with pgvector source citations.

## Deployment

Live Demo: Not deployed yet

API: Not deployed yet

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment requirements, environment variables, database checks, storage limitations, health checks, and the smoke-test checklist.

## Technology Stack

- Backend: Java 21, Spring Boot 3.5.16, Spring AI 1.1.8, Maven
- Persistence: Spring Data JPA, PostgreSQL
- Security: Spring Security, JWT
- AI provider: Google Gemini Developer API through Spring AI Google GenAI
- Frontend: React, Vite, JavaScript
- Frontend HTTP and routing: Axios, React Router DOM

## Spring AI Compatibility

The detected Spring Boot version is `3.5.16`. Phase 5 uses stable `org.springframework.ai:spring-ai-bom:1.1.8` because Spring AI `1.1.x` is the compatible line for Spring Boot `3.5.x`. Spring AI `2.0.x` targets Spring Boot `4.x`, so this project does not upgrade Boot just to use a newer AI release.

The Gemini chat dependency is:

```xml
org.springframework.ai:spring-ai-starter-model-google-genai
```

Phase 7 reuses Spring AI `1.1.8` and adds compatible Maven Central dependencies:

```xml
org.springframework.ai:spring-ai-starter-model-google-genai-embedding
org.springframework.ai:spring-ai-starter-vector-store-pgvector
```

No snapshot or milestone dependencies are used, and no non-Maven Central repository is required.

## Folder Structure

```text
resume-ai-pro/
├── backend/
├── frontend/
├── docs/
├── database/
├── postman/
└── README.md
```

## Setup

### Backend

```bash
cd backend
JAVA_HOME=/path/to/jdk-21 mvn clean package
cp src/main/resources/application-local.example.properties src/main/resources/application-local.properties
JAVA_HOME=/path/to/jdk-21 SPRING_PROFILES_ACTIVE=local mvn spring-boot:run
```

Ensure `JAVA_HOME` points to a full JDK 21 installation before running Maven. Before running against PostgreSQL, create a local database named `resume_ai_db`.

Keep local secrets in `backend/src/main/resources/application-local.properties`. This file is ignored by git and should contain your local database password, JWT secret, and Gemini key:

```properties
spring.datasource.password=your_local_database_password
app.jwt.secret=your_local_jwt_secret_at_least_256_bits_long
spring.ai.google.genai.api-key=your_google_ai_studio_key
```

Install and enable pgvector in the database before using resume chat:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Gemini Setup

Required for analysis: set `spring.ai.google.genai.api-key` in `application-local.properties`.

Optional AI settings can also be set in `application-local.properties` or environment variables: `GEMINI_MODEL`, `GEMINI_EMBEDDING_MODEL`, `AI_MAX_RESUME_CHARACTERS`, `AI_MAX_JOB_DESCRIPTION_CHARACTERS`, `AI_MAX_JOB_MATCH_INPUT_CHARACTERS`, `RAG_CHUNK_SIZE`, `RAG_CHUNK_OVERLAP`, `RAG_TOP_K`, `RAG_SIMILARITY_THRESHOLD`, and `RAG_MAX_QUESTION_LENGTH`.

In the local/default profile, the backend can start without `GEMINI_API_KEY`. If analysis is requested without a key, the API returns HTTP 503 with:

```text
AI analysis is not configured. Please contact the administrator.
```

Do not commit `.env` files or API keys.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

For local development, the frontend defaults to `http://localhost:8080/api`. To override it, copy `frontend/.env.example` to an ignored local env file and set `VITE_API_BASE_URL`.

## Docker Compose

Run the production-like local stack with Spring Boot, Nginx, and PostgreSQL 16 with pgvector:

```bash
cp .env.example .env
docker compose up --build
```

Before starting, replace the placeholder values in `.env`. Use a long JWT signing secret, and set `GEMINI_API_KEY` when testing AI analysis, job matching, resume indexing, or RAG chat. The frontend is built with `VITE_API_BASE_URL=http://localhost:8080/api`, because the browser calls the backend through the host-mapped port, not the Docker service name.

Services:

```text
frontend: http://localhost:3000
backend:  http://localhost:8080
health:   http://localhost:8080/actuator/health
database: db:5432 inside the Docker network
```

Stop the stack without deleting persisted data:

```bash
docker compose down
```

Destructive reset, deleting the PostgreSQL and upload volumes:

```bash
docker compose down -v
```

Warning: `docker compose down -v` deletes database data and uploaded resume files stored in Docker volumes.

## Production Environment Variables

Backend production runs with the `prod` Spring profile and reads secrets from environment variables. Do not commit real values.

```text
DB_URL=jdbc:postgresql://<host>:<port>/<database>
DB_USERNAME=<database_user>
DB_PASSWORD=<database_password>
JWT_SECRET=<strong_jwt_signing_secret>
GEMINI_API_KEY=<google_gemini_api_key>
FRONTEND_URL=https://<frontend-domain>
UPLOAD_DIR=/app/uploads/resumes
```

Frontend production builds read:

```text
VITE_API_BASE_URL=https://<backend-domain>/api
```

Production health check:

```http
GET /actuator/health
```

## AI Resume Analysis

Analysis is available for authenticated users only. The backend loads a resume owned by the current user, reads the already extracted text from PostgreSQL, sends a delimited prompt to Gemini, validates structured output, stores the report in `resume_analyses`, and returns arrays and objects to the frontend.

API endpoints:

```http
POST /api/analyses/resumes/{resumeId}
GET /api/analyses/{analysisId}
GET /api/analyses/resumes/{resumeId}
GET /api/analyses
```

The ATS score is based only on the resume text, not on a job description. It is AI-generated guidance and may differ from employer ATS systems.

## AI Job Description Matching

Job matching is available for authenticated users only. The backend verifies the selected resume belongs to the current user, stores the pasted job description in `job_descriptions`, creates a `job_matches` record, sends only the resume text and job description to Gemini, validates structured output, and returns arrays and objects to the frontend.

API endpoints:

```http
POST /api/job-matches
GET /api/job-matches
GET /api/job-matches/{id}
GET /api/job-matches/resumes/{resumeId}
DELETE /api/job-matches/{id}
```

The match score is based only on the selected resume and pasted job description. It is AI-generated guidance and does not guarantee interview selection.

## Resume RAG Chat

Resume chat is available for authenticated users only. The backend verifies resume ownership, chunks the extracted resume text, embeds chunks with Google GenAI `text-embedding-004`, stores vectors in PostgreSQL pgvector, and retrieves only chunks matching the current user's `userId` and selected `resumeId`.

Chat requests do not send the whole resume to Gemini. They send only retrieved resume chunks and return source citation cards.

API endpoints:

```http
POST /api/rag/resumes/{resumeId}/index
GET /api/rag/resumes/{resumeId}/index-status
DELETE /api/rag/resumes/{resumeId}/index
POST /api/rag/resumes/{resumeId}/chat
GET /api/rag/resumes/{resumeId}/chat-history
```

The frontend displays:

```text
Answers are generated only from retrieved resume content and may miss information if the resume is incomplete.
```

See `docs/RAG.md` for architecture, prompt flow, pgvector setup, security filters, and limitations.

Known limitations:

- RAG is single-resume only; it does not search across multiple resumes or job descriptions.
- No OCR or DOCX processing.
- Analysis, matching, indexing, and chat are synchronous and may take several seconds.
- AI output can be incomplete or imperfect, so users should review results before acting on them.
