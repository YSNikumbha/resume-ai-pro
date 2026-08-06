# Resume RAG and Chat

## What An Embedding Is

An embedding is a numeric representation of text. Similar text produces vectors that are close to each other, which lets the app search resume sections by meaning instead of exact keyword matching.

ResumeAI Pro uses Google GenAI `text-embedding-004` through Spring AI.

## What Chunking Is

Chunking splits extracted resume text into smaller sections before embedding. This phase uses a custom character-based splitter because resumes are short, section-oriented documents and the app needs predictable section metadata for citations.

The splitter:

- normalizes repeated blank lines
- detects common headings such as `SUMMARY`, `SKILLS`, `EXPERIENCE`, `EDUCATION`, `PROJECTS`, and `CERTIFICATIONS`
- applies configurable chunk size and overlap
- avoids empty chunks
- preserves `sectionName`, `chunkIndex`, and character positions internally

## What Vector Similarity Means

For each chat question, Spring AI embeds the question and compares it to stored resume chunk vectors. Cosine similarity is used, so retrieved chunks are the sections whose meanings are closest to the question.

## What pgvector Does

`pgvector` adds a vector column and similarity indexes to PostgreSQL. ResumeAI Pro stores chunk content, embeddings, and metadata in the `resume_vector_store` table managed by Spring AI's PgVector store.

The application enables schema initialization for the MVP:

```properties
spring.ai.vectorstore.pgvector.initialize-schema=true
spring.ai.vectorstore.pgvector.table-name=resume_vector_store
spring.ai.vectorstore.pgvector.distance-type=COSINE_DISTANCE
spring.ai.vectorstore.pgvector.index-type=HNSW
```

The PostgreSQL database must have the extension installed:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Indexing Flow

1. The user clicks Index Resume for a resume they own.
2. The backend loads the authenticated user from the JWT email.
3. The backend loads the resume with `resumeId` and authenticated `userId`.
4. Existing vectors for that exact `userId` and `resumeId` are deleted.
5. Extracted resume text is chunked.
6. Each chunk is converted to a Spring AI `Document`.
7. Metadata is attached: `userId`, `resumeId`, `originalFileName`, `chunkIndex`, `sectionName`, and `uploadedAt`.
8. The documents are embedded by Google GenAI and stored in pgvector.
9. The resume row is updated to `INDEXED`, with `indexedAt` and `indexedChunkCount`.

If indexing fails, the resume is marked `FAILED`, partial vectors are removed where possible, and only a safe failure message is stored.

## Retrieval Flow

1. The user asks a question about one indexed resume.
2. The backend verifies the resume belongs to the authenticated user.
3. The backend rejects non-indexed resumes with HTTP 409.
4. Spring AI performs similarity search with top-K and similarity threshold settings.
5. Every search includes metadata filters equivalent to:

```text
userId == authenticatedUserId AND resumeId == requestedResumeId
```

No global vector search is used.

## Prompt Augmentation

Only retrieved chunks are inserted into the Gemini prompt. The complete resume is not sent during chat.

Prompt structure:

```text
QUESTION:
{question}

RETRIEVED RESUME CONTEXT:

[Source 1]
Section: {section}
Content: {content}

ANSWER:
```

The prompt tells Gemini to answer only from the supplied context, cite `[Source 1]`, `[Source 2]`, and return the standard insufficient-context answer when retrieval does not contain enough information.

## Source Citations

API responses include `sources`, each with:

- `chunkIndex`
- `sectionName`
- a short `excerpt`
- `similarityScore`

Internal vector IDs and full retrieved context are not returned to the frontend.

## Security Filters

- `/api/rag/**` requires authentication.
- The frontend never sends `userId`.
- Indexing, status, delete, chat, and chat history all load resumes by authenticated user ownership.
- Vector deletion and search are filtered by both `userId` and `resumeId`.
- Guessing another user's resume ID returns 404.
- Logs include safe IDs and durations only.
- Logs do not include resume text, questions, retrieved context, prompts, JWTs, API keys, or provider responses.

## Chat History

ResumeAI Pro stores a simple chat history in `resume_chat_messages`. It stores the user's question, generated answer, source excerpts/metadata, insufficient-context flag, model name, and timestamp.

It does not store the complete prompt or complete retrieved context.

## Hallucination Limitations

RAG reduces hallucination by grounding answers in retrieved resume sections, but it does not guarantee perfect answers. Retrieval can miss relevant text if the resume is incomplete, poorly extracted, or below the similarity threshold.

The frontend displays:

```text
Answers are generated only from retrieved resume content and may miss information if the resume is incomplete.
```

## Ordinary LLM Calls vs RAG

Ordinary analysis and job matching send the full relevant input directly to Gemini. RAG first retrieves small, semantically relevant resume chunks from pgvector and only sends those chunks to Gemini.

This makes chat answers scoped, citeable, and safer for repeated question-answering.

## Why This Is Single-Resume RAG

This phase intentionally searches one selected resume only. It does not search across multiple resumes, job descriptions, web pages, or uploaded research documents.

## Future Multi-Document Improvements

Future phases could add:

- multi-resume retrieval
- job-description-aware retrieval
- richer section parsers
- re-ranking
- multi-document citations
- background indexing queues
- deletion audits for vector cleanup
