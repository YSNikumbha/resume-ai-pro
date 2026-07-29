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
mvn spring-boot:run
```

Ensure `JAVA_HOME` points to a full JDK 21 installation before running Maven. Before running against PostgreSQL, create a local database named `resume_ai_db` and replace the `CHANGE_ME` placeholder in `backend/src/main/resources/application.properties` with your local password.

### Frontend

```bash
cd frontend
npm install
npm run dev
```
