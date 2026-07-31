# ResumeAI Pro

ResumeAI Pro is a production-oriented AI resume platform. This repository is currently at the initial setup stage and contains only the backend and frontend scaffolding required for future development.

## Technology Stack

- Backend: Java 21, Spring Boot 3.5.16, Maven
- Persistence: Spring Data JPA, PostgreSQL
- Security foundation: Spring Security
- Frontend: React, Vite, JavaScript
- Frontend HTTP and routing: Axios, React Router DOM

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
mvn clean package
DB_PASSWORD=your_postgres_password mvn spring-boot:run
```

Ensure `JAVA_HOME` points to a full JDK 21 installation before running Maven. Before running against PostgreSQL, create a local database named `resume_ai_db`. The backend reads `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` from environment variables, with local defaults for URL and username.

### Frontend

```bash
cd frontend
npm install
npm run dev
```
