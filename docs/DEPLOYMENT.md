# Deployment Guide

ResumeAI Pro is ready for repository-side production deployment preparation. This guide covers a generic static frontend host, a generic Docker-compatible backend host, managed PostgreSQL with pgvector, and Gemini API access.

```text
Browser
  |
  v
React frontend
  |
  | HTTPS
  v
Spring Boot API
  |
  v
Managed PostgreSQL + pgvector
  |
  v
Gemini API
```

Do not commit real credentials. Configure secrets only in the deployment platform's secret or environment manager.

## PHASE 1 — CREATE PRODUCTION POSTGRESQL

Create a managed PostgreSQL database that supports:

- PostgreSQL 16 compatible behavior
- pgvector support
- SSL support

Collect these connection values from the managed database provider:

```text
DB_HOST=YOUR_DATABASE_HOST
DB_PORT=YOUR_DATABASE_PORT
DB_NAME=YOUR_DATABASE_NAME
DB_USERNAME=YOUR_DATABASE_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD
```

The application uses one JDBC value built from those settings:

```text
DB_URL=jdbc:postgresql://HOST:PORT/DATABASE?sslmode=require
```

Use `?sslmode=require` unless your database provider gives a stricter provider-specific JDBC string. Do not disable certificate verification globally in application code.

Enable the required extensions through the provider-approved SQL console, migration process, or administration workflow:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Verify the extensions:

```sql
SELECT extname
FROM pg_extension
WHERE extname IN ('vector','hstore','uuid-ossp');
```

Expected extensions:

```text
vector
hstore
uuid-ossp
```

After backend startup, verify the vector table:

```sql
SELECT COUNT(*) FROM resume_vector_store;
```

Zero rows are valid until a resume has been indexed.

Production database verification SQL:

```sql
SELECT COUNT(*) FROM users;

SELECT COUNT(*) FROM resumes;

SELECT COUNT(*) FROM resume_analyses;

SELECT COUNT(*) FROM job_matches;

SELECT COUNT(*) FROM resume_chat_messages;

SELECT COUNT(*) FROM resume_vector_store;
```

Do not assume rows exist before users exercise the application.

For the MVP, production currently inherits `spring.jpa.hibernate.ddl-auto=update` from shared configuration. Do not set production to `create` or `create-drop`; those modes can destroy data. A formal Flyway or Liquibase workflow is a future hardening step.

## PHASE 2 — DEPLOY BACKEND

Deploy the Spring Boot backend using a generic Docker-compatible host:

```text
Backend root: backend
Build method: backend/Dockerfile
Health path: /actuator/health
Default container port: 8080
```

Required backend environment variables:

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

`PORT` is only needed when the host supplies a runtime port. The production profile supports `server.port=${PORT:8080}`, so the backend listens on `8080` if `PORT` is absent.

Before the frontend exists, set `FRONTEND_URL` to the planned placeholder origin only if the backend host requires a value. After frontend deployment, update `FRONTEND_URL` to the exact HTTPS frontend origin and restart or redeploy the backend.

Keep `GEMINI_MODEL` configurable. The recommended chat model example is `gemini-3.6-flash`. Do not change the embedding model from `gemini-embedding-001` unless a separate embedding migration is planned.

The backend production profile supports HTTPS-terminating proxies with:

```properties
server.forward-headers-strategy=framework
```

Backend-specific checklist: [docs/BACKEND_DEPLOYMENT_CHECKLIST.md](BACKEND_DEPLOYMENT_CHECKLIST.md).

### JWT Secret

Generate the production JWT secret locally:

```bash
openssl rand -base64 48
```

Store the output only in the cloud secret manager or backend environment variable as `JWT_SECRET`. Never commit the generated value and never paste it into frontend configuration.

### Gemini Key

The production Gemini key must:

- Be newly generated, or rotated if it was ever exposed
- Remain backend-only
- Never use a `VITE_` prefix
- Never appear in the frontend bundle
- Never be committed

## PHASE 3 — DEPLOY FRONTEND

Deploy the React frontend as a static Vite build:

```text
Root directory: frontend
Install: npm ci
Build command: npm run build
Output directory: dist
```

Required frontend build variable:

```text
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api
```

`VITE_*` variables are injected at build time. Changing `VITE_API_BASE_URL` requires rebuilding and redeploying the frontend.

Do not expose backend secrets in frontend environment variables. `GEMINI_API_KEY`, `JWT_SECRET`, `DB_PASSWORD`, and `DB_URL` must never appear in the browser bundle. Only public browser-safe values such as `VITE_API_BASE_URL` belong in frontend configuration.

React Router uses browser history, so production static hosting must route unknown paths to `index.html`. The nginx Docker image already includes:

```nginx
try_files $uri $uri/ /index.html;
```

For non-nginx static hosting, configure equivalent SPA rewrite behavior so refreshing `/dashboard`, `/resumes`, `/job-matches`, and other protected routes returns the React app instead of a hosting 404.

## Final CORS Update Flow

1. Deploy production database.
2. Deploy backend.
3. Obtain backend URL.
4. Set frontend `VITE_API_BASE_URL`.
5. Deploy frontend.
6. Obtain frontend URL.
7. Set backend `FRONTEND_URL` to exact frontend origin.
8. Restart/redeploy backend.
9. Test CORS.

Production CORS is controlled by:

```text
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
```

The backend reads this through `app.frontend.url` and allows only the configured origin. Wildcard CORS is not used. JWT requests keep using the `Authorization` header.

## HTTPS Requirement

Production frontend and backend must both use HTTPS:

```text
Frontend: https://YOUR_FRONTEND_DOMAIN
Backend: https://YOUR_BACKEND_DOMAIN
Frontend API: VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api
Backend CORS: FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
```

Do not allow:

```text
HTTPS frontend -> HTTP backend
```

Browsers block mixed-content requests.

## Persistent Upload Storage

Resume PDFs are stored on the backend filesystem under:

```text
UPLOAD_DIR=/app/uploads/resumes
```

Production hosts may use ephemeral container filesystems. Use one of these production-safe options:

1. Persistent mounted disk/volume
2. Future migration to object storage

Object storage migration is intentionally out of scope for this phase.

Known limitation: uploaded files may disappear after a service restart if `UPLOAD_DIR` is not backed by persistent storage.

## Restart Persistence Test

Run this after production deployment if uploaded resume PDFs are expected to survive service restarts:

1. Upload resume.
2. Verify DB record.
3. Verify PDF file exists on persistent storage.
4. Restart backend.
5. Login.
6. Verify resume still exists.
7. Verify PDF operation still works.
8. Verify vector rows remain.

## Health Checks

Backend health check:

```http
GET /actuator/health
```

Expected healthy response:

```json
{"status":"UP"}
```

Validate a deployed backend with:

```bash
curl https://YOUR_BACKEND_DOMAIN/actuator/health
```

Expected response:

```json
{"status":"UP"}
```

Only safe actuator endpoints should be exposed publicly:

```properties
management.endpoints.web.exposure.include=health,info
management.endpoint.health.show-details=never
```

Do not expose `env`, `beans`, `heapdump`, `mappings`, or other sensitive actuator endpoints publicly.

## Production Smoke Test Checklist

Use the full live smoke-test checklist in [docs/LIVE_SMOKE_TEST.md](LIVE_SMOKE_TEST.md) after deploying the database, backend, and frontend.

- [ ] Landing page loads
- [ ] Register works
- [ ] Login works
- [ ] JWT protected endpoint works
- [ ] Dashboard loads
- [ ] Resume upload works
- [ ] PDF text extraction works
- [ ] Resume history loads
- [ ] Resume details load
- [ ] AI resume analysis works
- [ ] ATS score displays
- [ ] Re-analysis creates another record
- [ ] Job matching works
- [ ] Job match history loads
- [ ] Resume indexing reaches INDEXED
- [ ] resume_vector_store receives rows
- [ ] Resume Chat answers grounded questions
- [ ] Source citations appear
- [ ] Unrelated question returns insufficient context
- [ ] Browser refresh works on protected routes
- [ ] Logout works
- [ ] Login again works
- [ ] Existing records remain after login
- [ ] Backend /actuator/health returns UP
- [ ] No CORS errors
- [ ] No mixed-content errors
- [ ] No API keys appear in frontend
- [ ] Uploaded files persist after service restart if persistent storage is configured

## Rollback / Troubleshooting

### Backend Health Fails

Check the backend service logs, confirm `SPRING_PROFILES_ACTIVE=prod`, verify the host is routing to the configured `PORT`, and call `/actuator/health`. Do not expose stack traces or secrets in public responses.

### Database Connection Fails

Confirm `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` are configured in the backend host. Verify the database accepts connections from the backend network and that the JDBC URL uses the provider-required SSL mode.

### CORS Failure

Confirm `FRONTEND_URL` exactly matches the browser origin, including scheme and host. After updating `FRONTEND_URL`, restart or redeploy the backend.

### Gemini 4xx/5xx

Confirm `GEMINI_API_KEY` is configured backend-side and `GEMINI_MODEL` is supported for the account. Log only provider status/error type, not API keys, prompts, resume text, job descriptions, RAG context, or complete provider responses.

### Resume Upload Disappears Or Fails

Confirm `UPLOAD_DIR=/app/uploads/resumes` points to persistent storage and that the backend runtime user has read/write permissions for that mounted disk or volume. Ephemeral container storage can lose uploaded PDFs after restart or redeploy.

### Frontend Refresh Returns 404

Configure the frontend host with SPA fallback to `index.html`. For nginx, keep `try_files $uri $uri/ /index.html;`.

### Vector Extension Missing

Enable `vector`, `hstore`, and `uuid-ossp` using the managed database provider's approved process. Do not drop extensions or production tables.

### RAG Indexing Fails

Confirm the backend can reach the database, required extensions exist, `resume_vector_store` can be created/updated, `GEMINI_API_KEY` is configured, and `gemini-embedding-001` remains the embedding model.

## Manual Actions Still Required

- Create managed PostgreSQL account/database
- Enable required extensions
- Add production DB credentials
- Deploy backend using cloud dashboard/CLI
- Add Gemini/JWT production secrets
- Deploy frontend
- Obtain real frontend/backend URLs
- Update `FRONTEND_URL`
- Configure persistent storage
- Perform final live smoke test
