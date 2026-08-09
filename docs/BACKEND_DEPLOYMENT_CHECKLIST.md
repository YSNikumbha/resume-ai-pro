# Backend Deployment Checklist

Use this checklist when deploying the ResumeAI Pro Spring Boot API to a generic Docker-compatible cloud host.

## Build Package

```text
Build method: Dockerfile
Root directory: backend
Dockerfile: backend/Dockerfile
Health path: /actuator/health
Container port: 8080
Runtime profile: prod
```

The backend image uses a multi-stage Maven build and a Java 21 runtime. The runtime image runs as a non-root user and copies only the packaged JAR into `/app`.

If the platform provides a `PORT` environment variable, the production profile uses it through `server.port=${PORT:8080}`. Without `PORT`, the backend listens on `8080`.

## Required Environment Variables

Configure these values in the hosting provider's secret or environment manager. Use placeholders only in documentation and examples.

```text
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://HOST:PORT/DATABASE?sslmode=require
DB_USERNAME=YOUR_DATABASE_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD
JWT_SECRET=YOUR_LONG_RANDOM_JWT_SECRET
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.6-flash
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
UPLOAD_DIR=/app/uploads/resumes
PORT=8080
```

Generate `JWT_SECRET` locally with:

```bash
openssl rand -base64 48
```

Store the generated value only in the cloud secret manager or backend environment. Never commit it.

## Database Requirements

The managed PostgreSQL database must support pgvector and have these extensions enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Verify extensions:

```sql
SELECT extname
FROM pg_extension
WHERE extname IN ('vector','hstore','uuid-ossp');
```

Post-deployment table checks:

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM resumes;
SELECT COUNT(*) FROM resume_analyses;
SELECT COUNT(*) FROM job_matches;
SELECT COUNT(*) FROM resume_vector_store;
```

Counts may initially be zero before the application is used.

## Health Check

Validate a deployed backend with:

```bash
curl https://YOUR_BACKEND_DOMAIN/actuator/health
```

Expected response:

```json
{"status":"UP"}
```

No authentication is required for `/actuator/health`. Health details are hidden, and only `health` and `info` actuator endpoints should be exposed.

## CORS And Uploads

Before the frontend exists, set `FRONTEND_URL` to the planned placeholder origin only if the backend host requires a value. After frontend deployment, update `FRONTEND_URL` to the exact HTTPS frontend origin.

Uploaded resume PDFs are stored under:

```text
UPLOAD_DIR=/app/uploads/resumes
```

Container filesystems on many cloud providers are ephemeral. Production must use a persistent disk or mounted volume for `UPLOAD_DIR`, or a future object-storage migration.

## Checklist

- [ ] Managed PostgreSQL created
- [ ] vector enabled
- [ ] hstore enabled
- [ ] uuid-ossp enabled
- [ ] DB_URL configured
- [ ] DB_USERNAME configured
- [ ] DB_PASSWORD configured
- [ ] JWT_SECRET configured
- [ ] GEMINI_API_KEY configured
- [ ] GEMINI_MODEL configured
- [ ] FRONTEND_URL configured
- [ ] UPLOAD_DIR configured
- [ ] persistent disk configured
- [ ] backend deployed
- [ ] /actuator/health returns UP
- [ ] database tables created
- [ ] resume_vector_store exists
