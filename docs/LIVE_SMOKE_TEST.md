# Live Smoke Test

Run this checklist after the production database, backend, and frontend are deployed with real production environment variables. Do not paste secrets into browser-visible configuration or test notes.

## Frontend And Auth

- [ ] Landing page loads
- [ ] Login page loads
- [ ] Register works
- [ ] Login works
- [ ] Dashboard loads
- [ ] Protected routes redirect correctly

## Resume Workflow

- [ ] Resume upload works
- [ ] Uploaded PDF persists
- [ ] Resume extraction works
- [ ] AI analysis works
- [ ] ATS score renders
- [ ] Re-analysis works

## Job Matching

- [ ] Job match works
- [ ] Match history works

## RAG Chat

- [ ] Resume indexing reaches INDEXED
- [ ] Vector rows created
- [ ] Resume Chat works
- [ ] Source citations render
- [ ] Insufficient-context behavior works

## Routing

- [ ] Page refresh on /dashboard works
- [ ] Page refresh on resume details works
- [ ] Page refresh on chat works

## Persistence

- [ ] Logout works
- [ ] Login again works
- [ ] Database history remains

## Production Safety

- [ ] Backend health is UP
- [ ] No browser CORS errors
- [ ] No mixed-content errors
- [ ] No secrets in frontend JS bundle

## Production Database Persistence Check

Run these read-only checks after smoke testing. Counts may be zero before the corresponding feature has been used.

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM resumes;
SELECT COUNT(*) FROM resume_analyses;
SELECT COUNT(*) FROM job_matches;
SELECT COUNT(*) FROM resume_chat_messages;
SELECT COUNT(*) FROM resume_vector_store;
```

## Restart Persistence Test

1. Upload resume.
2. Verify DB record.
3. Verify PDF file exists on persistent storage.
4. Restart backend.
5. Login.
6. Verify resume still exists.
7. Verify PDF operation still works.
8. Verify vector rows remain.
