# Deployment Guide

ResumeAI Pro is deployment-ready for a separately hosted React frontend, Spring Boot API, managed PostgreSQL database with pgvector, and Gemini API access.

## Architecture

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

The frontend is a static Vite build. The backend runs with the Spring `prod` profile and connects to managed PostgreSQL using JDBC. Gemini access stays backend-side only.

## Backend Environment Variables

Set these variables on the backend host. Do not commit real values.

```text
SPRING_PROFILES_ACTIVE=prod
DB_URL=jdbc:postgresql://HOST:PORT/DATABASE
DB_USERNAME=YOUR_DATABASE_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD
JWT_SECRET=YOUR_LONG_RANDOM_JWT_SECRET
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
UPLOAD_DIR=/app/uploads/resumes
```

`DB_URL` must use the JDBC format:

```text
jdbc:postgresql://HOST:PORT/DATABASE
```

Use a strong JWT secret suitable for HMAC signing. Keep `GEMINI_API_KEY` only in the backend environment; the frontend must never receive it.

## Frontend Environment Variable

Set this variable before building the frontend:

```text
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api
```

Vite injects `VITE_*` variables at build time. If the backend URL changes after the frontend is built, rebuild and redeploy the frontend with the new `VITE_API_BASE_URL`.

## Managed PostgreSQL Requirements

Production PostgreSQL must support pgvector and allow the required extensions:

```text
vector
hstore
uuid-ossp
```

Verify installed extensions with:

```sql
SELECT extname
FROM pg_extension
WHERE extname IN ('vector','hstore','uuid-ossp');
```

If any extension is missing, enable it through the managed database provider's approved process or an authorized migration. Do not run destructive database commands against production.

## CORS

Production CORS is controlled by:

```text
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
```

The backend reads this through `app.frontend.url` and allows only the configured origin. Wildcard CORS is not used. The production profile requires `FRONTEND_URL`, so localhost should not be used in production configuration.

## HTTPS

Both frontend and backend should be served over HTTPS in production. Configure:

```text
FRONTEND_URL=https://YOUR_FRONTEND_DOMAIN
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN/api
```

Do not point the production frontend to an `http://` API URL, because browsers will block mixed-content requests from an HTTPS page.

## File Storage Limitation

Resume PDFs are currently stored on the backend filesystem under `UPLOAD_DIR`.

Some hosting providers use ephemeral container filesystems. Production resume storage therefore requires one of these:

- A persistent disk or mounted volume attached to the backend service.
- A later migration to cloud object storage.

Do not use ephemeral-only storage for production uploads. S3, Cloudinary, or other object storage migration is intentionally out of scope for this phase.

## Startup And Health

Use the backend health endpoint for platform health checks:

```http
GET /actuator/health
```

The endpoint exposes no health details in production. A healthy response should return HTTP 200 with a minimal status payload.

## Post-Deployment Database Checks

Use read-only checks where possible.

Verify basic database connectivity:

```sql
SELECT current_database(), current_user;
SELECT 1;
```

Verify required extensions:

```sql
SELECT extname
FROM pg_extension
WHERE extname IN ('vector','hstore','uuid-ossp');
```

Verify the pgvector table exists after the application has started and RAG schema initialization has run:

```sql
SELECT to_regclass('public.resume_vector_store') AS vector_table;
```

Verify vector rows are created after indexing a resume:

```sql
SELECT COUNT(*) AS vector_row_count
FROM resume_vector_store;
```

If the table does not exist, confirm the backend can connect to the production database and that the configured database user has the permissions required by Spring AI pgvector schema initialization.

## Deployment Smoke Test

- [ ] Landing page loads
- [ ] Register works
- [ ] Login works
- [ ] JWT-protected request works
- [ ] Resume PDF upload works
- [ ] AI analysis works
- [ ] Job matching works
- [ ] Resume indexing works
- [ ] pgvector rows are created
- [ ] Resume chat works
- [ ] Source citations appear
- [ ] Logout works
- [ ] Browser refresh works on React routes
- [ ] HTTPS has no mixed-content error

## Security Checklist

- [ ] No real secrets are committed.
- [ ] `JWT_SECRET` is long, random, and stored only in backend secret management.
- [ ] `GEMINI_API_KEY` is configured only backend-side.
- [ ] Managed PostgreSQL does not expose unnecessary public access.
- [ ] Database access is restricted by provider firewall, network rules, or private networking where available.
- [ ] CORS is restricted to the production `FRONTEND_URL`.
- [ ] `/actuator/health` exposes no sensitive details.
- [ ] Production logs exclude resume content, job descriptions, prompts, retrieved RAG context, JWTs, passwords, API keys, and complete provider responses.

## Remaining Deployment Decisions

- Choose frontend hosting and configure `VITE_API_BASE_URL` before building.
- Choose backend hosting with Java 21 support and persistent upload storage.
- Choose managed PostgreSQL with pgvector support and install required extensions.
- Configure production secrets in the hosting provider's secret manager.
- Configure HTTPS domains for both frontend and backend.
