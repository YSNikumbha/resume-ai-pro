# ResumeAI Pro Phase 6 Job Match Endpoints

Base URL:

```text
http://localhost:8080/api
```

All job-match endpoints require JWT authentication.

```http
Authorization: Bearer <JWT_TOKEN>
```

## Create Match

```http
POST /job-matches
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Request body:

```json
{
  "resumeId": 1,
  "title": "Senior Java Developer",
  "companyName": "Acme",
  "description": "We need a Java developer with Spring Boot, React, PostgreSQL, REST APIs, and cloud deployment experience. The role includes designing APIs, improving frontend workflows, and collaborating with product teams."
}
```

Successful response:

```json
{
  "id": 20,
  "resumeId": 1,
  "resumeFileName": "resume.pdf",
  "jobDescriptionId": 15,
  "jobTitle": "Senior Java Developer",
  "companyName": "Acme",
  "matchScore": 78,
  "summary": "Good match with backend and frontend overlap.",
  "matchedSkills": ["Java", "Spring Boot", "React"],
  "missingSkills": ["Kubernetes"],
  "experienceMatch": {
    "score": 82,
    "status": "STRONG",
    "explanation": "The resume shows relevant backend API experience."
  },
  "educationMatch": {
    "score": 64,
    "status": "PARTIAL",
    "explanation": "Education is related but certifications are not listed."
  },
  "strengths": ["Relevant REST API experience"],
  "gaps": ["Cloud deployment evidence is limited"],
  "recommendations": ["Add deployment impact and production metrics"],
  "keywordSuggestions": ["REST APIs", "PostgreSQL", "CI/CD"],
  "status": "COMPLETED",
  "modelName": "gemini-3.5-flash",
  "failureMessage": null,
  "createdAt": "2026-08-01T16:30:00",
  "updatedAt": "2026-08-01T16:30:07"
}
```

## List Current User Matches

```http
GET /job-matches
Authorization: Bearer <JWT_TOKEN>
```

Returns newest matches first.

## Get Match

```http
GET /job-matches/20
Authorization: Bearer <JWT_TOKEN>
```

If the match does not exist or belongs to another user:

```json
{
  "success": false,
  "message": "Job match not found."
}
```

## Resume Match History

```http
GET /job-matches/resumes/1
Authorization: Bearer <JWT_TOKEN>
```

Returns newest matches for one resume owned by the authenticated user.

## Delete Match

```http
DELETE /job-matches/20
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
{
  "success": true,
  "message": "Job match deleted successfully."
}
```

## Common Error Responses

Invalid job description:

```json
{
  "success": false,
  "message": "Job description must be between 50 and 20000 characters."
}
```

Missing Gemini API key:

```json
{
  "success": false,
  "message": "AI analysis is not configured. Please contact the administrator."
}
```

Provider unavailable:

```json
{
  "success": false,
  "message": "AI job matching provider is temporarily unavailable. Please try again later."
}
```

Unexpected AI output:

```json
{
  "success": false,
  "message": "AI job matching returned an unexpected response. Please try again later."
}
```
