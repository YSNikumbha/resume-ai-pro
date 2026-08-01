# ResumeAI Pro Phase 5 Analysis Endpoints

Base URL:

```text
http://localhost:8080/api
```

All analysis endpoints require JWT authentication.

```http
Authorization: Bearer <JWT_TOKEN>
```

## Analyze Resume

```http
POST /analyses/resumes/1
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
{
  "id": 10,
  "resumeId": 1,
  "resumeFileName": "resume.pdf",
  "summary": "Concise resume summary.",
  "atsScore": 82,
  "skills": ["Java", "Spring Boot", "React"],
  "education": [
    {
      "institution": "Example University",
      "qualification": "B.Tech",
      "field": "Computer Science",
      "startYear": 2020,
      "endYear": 2024
    }
  ],
  "experience": [
    {
      "organization": "Example Company",
      "role": "Software Engineer",
      "duration": "2024 - Present",
      "responsibilities": ["Built REST APIs", "Improved frontend workflows"]
    }
  ],
  "projects": [
    {
      "name": "ResumeAI Pro",
      "description": "Resume upload and analysis platform.",
      "technologies": ["Java", "React", "PostgreSQL"],
      "highlights": ["Implemented JWT authentication"]
    }
  ],
  "strengths": ["Clear technical stack"],
  "weaknesses": ["Needs more measurable achievements"],
  "suggestions": ["Add quantified impact for projects"],
  "analyzedAt": "2026-08-01T15:10:30",
  "updatedAt": "2026-08-01T15:10:35",
  "modelName": "gemini-3.5-flash",
  "status": "COMPLETED",
  "failureMessage": null
}
```

Missing Gemini API key:

```json
{
  "success": false,
  "message": "AI analysis is not configured. Please contact the administrator."
}
```

## Get Analysis

```http
GET /analyses/10
Authorization: Bearer <JWT_TOKEN>
```

Returns one analysis owned by the authenticated user.

If the analysis does not exist or belongs to another user:

```json
{
  "success": false,
  "message": "Analysis not found."
}
```

## Get Resume Analysis History

```http
GET /analyses/resumes/1
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
[
  {
    "id": 10,
    "resumeId": 1,
    "resumeFileName": "resume.pdf",
    "summary": "Concise resume summary.",
    "atsScore": 82,
    "skills": ["Java", "Spring Boot"],
    "education": [],
    "experience": [],
    "projects": [],
    "strengths": ["Clear skills"],
    "weaknesses": ["Needs metrics"],
    "suggestions": ["Add quantified achievements"],
    "analyzedAt": "2026-08-01T15:10:30",
    "updatedAt": "2026-08-01T15:10:35",
    "modelName": "gemini-3.5-flash",
    "status": "COMPLETED",
    "failureMessage": null
  }
]
```

## Get All Current User Analyses

```http
GET /analyses
Authorization: Bearer <JWT_TOKEN>
```

Returns newest analyses first for the authenticated user.

## Common Error Responses

Resume text unavailable:

```json
{
  "success": false,
  "message": "Resume text is unavailable for analysis."
}
```

Provider unavailable:

```json
{
  "success": false,
  "message": "AI analysis provider is temporarily unavailable. Please try again later."
}
```

Unexpected AI output:

```json
{
  "success": false,
  "message": "AI analysis returned an unexpected response. Please try again later."
}
```
