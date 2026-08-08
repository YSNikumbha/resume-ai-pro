package com.resumeai.service.impl;

import com.resumeai.dto.rag.ResumeChunk;
import com.resumeai.dto.response.ResumeIndexResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeIndexStatus;
import com.resumeai.entity.User;
import com.resumeai.exception.EmbeddingConfigurationException;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.exception.ResumeIndexingException;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.rag.RagMetadata;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.ResumeChunkingService;
import com.resumeai.service.ResumeIndexingService;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeIndexingServiceImpl implements ResumeIndexingService {

    private static final String USER_NOT_FOUND_MESSAGE = "User not found.";
    private static final String RESUME_NOT_FOUND_MESSAGE = "Resume not found.";
    private static final String RESUME_TEXT_UNAVAILABLE_MESSAGE = "Resume text is unavailable for indexing.";
    private static final String RESUME_TEXT_TOO_SHORT_MESSAGE =
            "Resume text is too short for indexing. Upload a text-based PDF resume with extractable text.";
    private static final String RAG_UNAVAILABLE_MESSAGE =
            "Resume indexing is not configured. Please contact the administrator.";
    private static final String INDEXING_FAILURE_MESSAGE = "Resume indexing failed. Please try again later.";
    private static final int MIN_INDEXABLE_RESUME_CHARACTERS = 50;
    private static final int MAX_FAILURE_MESSAGE_LENGTH = 500;

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeChunkingService chunkingService;
    private final ObjectProvider<VectorStore> vectorStoreProvider;
    private final PlatformTransactionManager transactionManager;

    @Override
    public ResumeIndexResponse indexResume(Long resumeId, String authenticatedEmail) {
        long startedAt = System.currentTimeMillis();
        IndexContext context;
        try {
            context = createIndexingState(resumeId, authenticatedEmail);
        } catch (ResumeTextUnavailableException exception) {
            markTextUnavailableFailure(resumeId, authenticatedEmail, exception);
            throw exception;
        }

        log.info("Resume indexing requested for resumeId={} userId={}.", context.resumeId(), context.userId());

        try {
            VectorStore vectorStore = getVectorStore();
            vectorStore.delete(RagMetadata.ownerResumeFilter(context.userId(), context.resumeId()));

            List<ResumeChunk> chunks = chunkingService.chunk(context.resumeText());
            if (chunks.isEmpty()) {
                throw new ResumeIndexingException(INDEXING_FAILURE_MESSAGE);
            }

            vectorStore.add(toDocuments(context, chunks));
            ResumeIndexResponse response = completeIndexing(context.resumeId(), context.userId(), chunks.size());

            log.info("Resume indexing completed for resumeId={} userId={} chunks={} durationMs={}.",
                    context.resumeId(), context.userId(), chunks.size(), elapsedMillis(startedAt));
            return response;
        } catch (RuntimeException exception) {
            removePartialVectors(context.userId(), context.resumeId());
            failIndexing(context.resumeId(), context.userId(), exception);
            log.warn("Resume indexing failed for resumeId={} userId={} durationMs={} errorType={}.",
                    context.resumeId(), context.userId(), elapsedMillis(startedAt), exception.getClass().getSimpleName());
            throw userFacingIndexingException(exception);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeIndexResponse getIndexStatus(Long resumeId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        Resume resume = getOwnedResume(resumeId, user.getId());
        return toResponse(resume);
    }

    @Override
    @Transactional
    public void deleteResumeIndex(Long resumeId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        Resume resume = getOwnedResume(resumeId, user.getId());

        deleteVectors(user.getId(), resume.getId(), resume.getIndexStatus());
        resetIndexFields(resume);
        resumeRepository.save(resume);
    }

    public void deleteVectorsForOwnedResume(User user, Resume resume) {
        deleteVectors(user.getId(), resume.getId(), resume.getIndexStatus());
        resetIndexFields(resume);
        resumeRepository.save(resume);
    }

    private IndexContext createIndexingState(Long resumeId, String authenticatedEmail) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        return Objects.requireNonNull(transactionTemplate.execute(status -> {
            User user = getUser(authenticatedEmail);
            Resume resume = getOwnedResume(resumeId, user.getId());

            String extractedText = resume.getExtractedText();
            if (!StringUtils.hasText(extractedText)) {
                throw new ResumeTextUnavailableException(RESUME_TEXT_UNAVAILABLE_MESSAGE);
            }

            String normalizedExtractedText = extractedText.replaceAll("\\s+", " ").trim();
            if (normalizedExtractedText.length() < MIN_INDEXABLE_RESUME_CHARACTERS) {
                throw new ResumeTextUnavailableException(RESUME_TEXT_TOO_SHORT_MESSAGE);
            }

            resume.setIndexStatus(ResumeIndexStatus.INDEXING);
            resume.setIndexedAt(null);
            resume.setIndexedChunkCount(0);
            resume.setIndexingFailureMessage(null);
            Resume savedResume = resumeRepository.save(resume);

            return new IndexContext(
                    user.getId(),
                    savedResume.getId(),
                    savedResume.getOriginalFileName(),
                    savedResume.getUploadedAt(),
                    extractedText
            );
        }));
    }

    private ResumeIndexResponse completeIndexing(Long resumeId, Long userId, int chunkCount) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        return Objects.requireNonNull(transactionTemplate.execute(status -> {
            Resume resume = getOwnedResume(resumeId, userId);
            resume.setIndexStatus(ResumeIndexStatus.INDEXED);
            resume.setIndexedAt(LocalDateTime.now());
            resume.setIndexedChunkCount(chunkCount);
            resume.setIndexingFailureMessage(null);
            return toResponse(resumeRepository.save(resume));
        }));
    }

    private void failIndexing(Long resumeId, Long userId, RuntimeException exception) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        transactionTemplate.executeWithoutResult(status ->
                resumeRepository.findByIdAndUserId(resumeId, userId).ifPresent(resume -> {
                    resume.setIndexStatus(ResumeIndexStatus.FAILED);
                    resume.setIndexedAt(null);
                    resume.setIndexedChunkCount(0);
                    resume.setIndexingFailureMessage(safeFailureMessage(exception));
                    resumeRepository.save(resume);
                })
        );
    }

    private void markTextUnavailableFailure(
            Long resumeId,
            String authenticatedEmail,
            ResumeTextUnavailableException exception
    ) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        try {
            transactionTemplate.executeWithoutResult(status -> {
                User user = getUser(authenticatedEmail);
                resumeRepository.findByIdAndUserId(resumeId, user.getId()).ifPresent(resume -> {
                    resume.setIndexStatus(ResumeIndexStatus.FAILED);
                    resume.setIndexedAt(null);
                    resume.setIndexedChunkCount(0);
                    resume.setIndexingFailureMessage(safeFailureMessage(exception));
                    resumeRepository.save(resume);
                });
            });
        } catch (RuntimeException statusException) {
            log.warn("Unable to save resume indexing validation failure for resumeId={} errorType={}.",
                    resumeId, statusException.getClass().getSimpleName());
        }
    }

    private void removePartialVectors(Long userId, Long resumeId) {
        try {
            VectorStore vectorStore = vectorStoreProvider.getIfAvailable();
            if (vectorStore != null) {
                vectorStore.delete(RagMetadata.ownerResumeFilter(userId, resumeId));
            }
        } catch (RuntimeException exception) {
            log.warn("Partial resume vector cleanup failed for resumeId={} userId={} errorType={}.",
                    resumeId, userId, exception.getClass().getSimpleName());
        }
    }

    private void deleteVectors(Long userId, Long resumeId, ResumeIndexStatus currentStatus) {
        VectorStore vectorStore = vectorStoreProvider.getIfAvailable();
        if (vectorStore == null) {
            if (currentStatus == ResumeIndexStatus.INDEXED || currentStatus == ResumeIndexStatus.INDEXING) {
                throw new EmbeddingConfigurationException(RAG_UNAVAILABLE_MESSAGE);
            }
            return;
        }

        try {
            vectorStore.delete(RagMetadata.ownerResumeFilter(userId, resumeId));
        } catch (RuntimeException exception) {
            throw new ResumeIndexingException(INDEXING_FAILURE_MESSAGE, exception);
        }
    }

    private VectorStore getVectorStore() {
        VectorStore vectorStore = vectorStoreProvider.getIfAvailable();
        if (vectorStore == null) {
            throw new EmbeddingConfigurationException(RAG_UNAVAILABLE_MESSAGE);
        }
        return vectorStore;
    }

    private List<Document> toDocuments(IndexContext context, List<ResumeChunk> chunks) {
        return chunks.stream()
                .map(chunk -> Document.builder()
                        .text(chunk.content())
                        .metadata(metadata(context, chunk))
                        .build())
                .toList();
    }

    private Map<String, Object> metadata(IndexContext context, ResumeChunk chunk) {
        Map<String, Object> metadata = new HashMap<>();
        metadata.put(RagMetadata.USER_ID, String.valueOf(context.userId()));
        metadata.put(RagMetadata.RESUME_ID, String.valueOf(context.resumeId()));
        metadata.put(RagMetadata.ORIGINAL_FILE_NAME, context.originalFileName());
        metadata.put(RagMetadata.CHUNK_INDEX, chunk.chunkIndex());
        metadata.put(RagMetadata.SECTION_NAME, chunk.sectionName());
        metadata.put(RagMetadata.UPLOADED_AT, context.uploadedAt() == null ? "" : context.uploadedAt().toString());
        metadata.put("startCharacter", chunk.startCharacter());
        metadata.put("endCharacter", chunk.endCharacter());
        return metadata;
    }

    private void resetIndexFields(Resume resume) {
        resume.setIndexStatus(ResumeIndexStatus.NOT_INDEXED);
        resume.setIndexedAt(null);
        resume.setIndexedChunkCount(0);
        resume.setIndexingFailureMessage(null);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_MESSAGE));
    }

    private Resume getOwnedResume(Long resumeId, Long userId) {
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResumeNotFoundException(RESUME_NOT_FOUND_MESSAGE));
    }

    private ResumeIndexResponse toResponse(Resume resume) {
        return ResumeIndexResponse.builder()
                .resumeId(resume.getId())
                .resumeFileName(resume.getOriginalFileName())
                .status(resume.getIndexStatus())
                .chunkCount(resume.getIndexedChunkCount())
                .indexedAt(resume.getIndexedAt())
                .failureMessage(resume.getIndexingFailureMessage())
                .build();
    }

    private String safeFailureMessage(RuntimeException exception) {
        String message = switch (exception) {
            case EmbeddingConfigurationException embeddingConfigurationException ->
                    embeddingConfigurationException.getMessage();
            case ResumeTextUnavailableException resumeTextUnavailableException ->
                    resumeTextUnavailableException.getMessage();
            default -> INDEXING_FAILURE_MESSAGE;
        };

        if (!StringUtils.hasText(message)) {
            return INDEXING_FAILURE_MESSAGE;
        }

        return message.length() <= MAX_FAILURE_MESSAGE_LENGTH
                ? message
                : message.substring(0, MAX_FAILURE_MESSAGE_LENGTH);
    }

    private RuntimeException userFacingIndexingException(RuntimeException exception) {
        if (exception instanceof EmbeddingConfigurationException
                || exception instanceof ResumeTextUnavailableException
                || exception instanceof ResumeIndexingException) {
            return exception;
        }
        return new ResumeIndexingException(INDEXING_FAILURE_MESSAGE, exception);
    }

    private long elapsedMillis(long startedAt) {
        return System.currentTimeMillis() - startedAt;
    }

    private record IndexContext(
            Long userId,
            Long resumeId,
            String originalFileName,
            LocalDateTime uploadedAt,
            String resumeText
    ) {
    }
}
