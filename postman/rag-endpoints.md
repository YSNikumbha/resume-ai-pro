# ResumeAI Pro Phase 7 RAG Endpoints

Base URL:

```text
http://localhost:8080/api
```

All RAG endpoints require JWT authentication.

```http
Authorization: Bearer <JWT_TOKEN>
```

## Index Resume

```http
POST /rag/resumes/1/index
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
{
  "resumeId": 1,
  "resumeFileName": "resume.pdf",
  "status": "INDEXED",
  "chunkCount": 8,
  "indexedAt": "2026-08-01T18:30:00",
  "failureMessage": null
}
```

## Get Index Status

```http
GET /rag/resumes/1/index-status
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
{
  "resumeId": 1,
  "resumeFileName": "resume.pdf",
  "status": "INDEXED",
  "chunkCount": 8,
  "indexedAt": "2026-08-01T18:30:00",
  "failureMessage": null
}
```

## Delete Resume Index

```http
DELETE /rag/resumes/1/index
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
{
  "success": true,
  "message": "Resume index deleted successfully."
}
```

## Ask Resume

```http
POST /rag/resumes/1/chat
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

Request body:

```json
{
  "question": "What technical skills are mentioned?"
}
```

Successful response:

```json
{
  "id": 40,
  "resumeId": 1,
  "resumeFileName": "resume.pdf",
  "question": "What technical skills are mentioned?",
  "answer": "The resume mentions Java, Spring Boot, React, PostgreSQL, and REST APIs [Source 1].",
  "sources": [
    {
      "chunkIndex": 2,
      "sectionName": "SKILLS",
      "excerpt": "Java Spring Boot React PostgreSQL REST APIs...",
      "similarityScore": 0.91
    }
  ],
  "modelName": "gemini-3.5-flash",
  "createdAt": "2026-08-01T18:32:00",
  "insufficientContext": false
}
```

Insufficient context response:

```json
{
  "id": 41,
  "resumeId": 1,
  "resumeFileName": "resume.pdf",
  "question": "What salary is expected?",
  "answer": "I could not find enough information in this resume to answer that question.",
  "sources": [],
  "modelName": "gemini-3.5-flash",
  "createdAt": "2026-08-01T18:33:00",
  "insufficientContext": true
}
```

## Chat History

```http
GET /rag/resumes/1/chat-history
Authorization: Bearer <JWT_TOKEN>
```

Returns newest chat messages first.

## Common Error Responses

Resume not indexed:

```json
{
  "success": false,
  "message": "Resume is not indexed for chat."
}
```

Resume not found or owned by another user:

```json
{
  "success": false,
  "message": "Resume not found."
}
```

Embedding/vector store unavailable:

```json
{
  "success": false,
  "message": "Resume indexing is not configured. Please contact the administrator."
}
```

Chat provider unavailable:

```json
{
  "success": false,
  "message": "Resume chat provider is temporarily unavailable. Please try again later."
}
```
