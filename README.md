# ResumeAI Pro

ResumeAI Pro is a Spring Boot and React resume platform with authenticated PDF upload, text extraction, resume history, Gemini-powered resume analysis, and AI resume-to-job matching.

## Technology Stack

- Backend: Java 21, Spring Boot 3.5.16, Spring AI 1.1.8, Maven
- Persistence: Spring Data JPA, PostgreSQL
- Security: Spring Security, JWT
- AI provider: Google Gemini Developer API through Spring AI Google GenAI
- Frontend: React, Vite, JavaScript
- Frontend HTTP and routing: Axios, React Router DOM

## Spring AI Compatibility

The detected Spring Boot version is `3.5.16`. Phase 5 uses stable `org.springframework.ai:spring-ai-bom:1.1.8` because Spring AI `1.1.x` is the compatible line for Spring Boot `3.5.x`. Spring AI `2.0.x` targets Spring Boot `4.x`, so this project does not upgrade Boot just to use a newer AI release.

The Gemini dependency is:

```xml
org.springframework.ai:spring-ai-starter-model-google-genai
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
GEMINI_API_KEY=your_google_ai_studio_key JAVA_HOME=/path/to/jdk-21 mvn spring-boot:run
```

Ensure `JAVA_HOME` points to a full JDK 21 installation before running Maven. Before running against PostgreSQL, create a local database named `resume_ai_db`.

### Gemini Setup

Required for analysis:

```bash
export GEMINI_API_KEY=your_google_ai_studio_key
```

Optional AI settings:

```bash
export GEMINI_MODEL=gemini-3.5-flash
export AI_TEMPERATURE=0.2
export AI_MAX_RESUME_CHARACTERS=30000
export AI_MAX_JOB_DESCRIPTION_CHARACTERS=20000
export AI_MAX_JOB_MATCH_INPUT_CHARACTERS=45000
```

The backend can start without `GEMINI_API_KEY`. If analysis is requested without a key, the API returns HTTP 503 with:

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

Known limitations:

- No embeddings, RAG, vector database, or resume chat.
- No OCR or DOCX processing.
- Analysis and matching are synchronous and may take several seconds.
- AI output can be incomplete or imperfect, so users should review results before acting on them.
