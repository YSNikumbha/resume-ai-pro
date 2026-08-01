# ResumeAI Pro Phase 4 Resume Endpoints

Base URL:

```text
http://localhost:8080/api
```

All resume endpoints require JWT authentication.

```http
Authorization: Bearer <JWT_TOKEN>
```

## Upload Resume

```http
POST /resumes/upload
Content-Type: multipart/form-data
Authorization: Bearer <JWT_TOKEN>
```

Postman body:

```text
Body tab -> form-data
Key: file
Type: File
Value: select a PDF resume
```

Successful response:

```json
{
  "id": 1,
  "originalFileName": "resume.pdf",
  "contentType": "application/pdf",
  "fileSize": 245760,
  "uploadedAt": "2026-08-01T10:15:30",
  "updatedAt": "2026-08-01T10:15:30",
  "extractedText": "Extracted resume text..."
}
```

## List Resumes

```http
GET /resumes
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
[
  {
    "id": 1,
    "originalFileName": "resume.pdf",
    "contentType": "application/pdf",
    "fileSize": 245760,
    "uploadedAt": "2026-08-01T10:15:30",
    "updatedAt": "2026-08-01T10:15:30",
    "extractedTextPreview": "First 300 characters of extracted text..."
  }
]
```

## Get Resume By ID

```http
GET /resumes/1
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
{
  "id": 1,
  "originalFileName": "resume.pdf",
  "contentType": "application/pdf",
  "fileSize": 245760,
  "uploadedAt": "2026-08-01T10:15:30",
  "updatedAt": "2026-08-01T10:15:30",
  "extractedText": "Full extracted resume text..."
}
```

If the resume does not exist or belongs to another user:

```json
{
  "success": false,
  "message": "Resume not found."
}
```

## Delete Resume

```http
DELETE /resumes/1
Authorization: Bearer <JWT_TOKEN>
```

Successful response:

```json
{
  "success": true,
  "message": "Resume deleted successfully."
}
```

## Common Error Responses

Invalid file:

```json
{
  "success": false,
  "message": "Only PDF files are allowed."
}
```

Empty file:

```json
{
  "success": false,
  "message": "Uploaded file cannot be empty."
}
```

File too large:

```json
{
  "success": false,
  "message": "File size must not exceed 5 MB."
}
```
