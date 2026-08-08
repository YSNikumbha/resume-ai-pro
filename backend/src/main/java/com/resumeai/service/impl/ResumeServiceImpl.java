package com.resumeai.service.impl;

import com.resumeai.dto.StoredFileDetails;
import com.resumeai.dto.response.ResumeDetailResponse;
import com.resumeai.dto.response.ResumeResponse;
import com.resumeai.entity.JobDescription;
import com.resumeai.entity.JobMatch;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeIndexStatus;
import com.resumeai.entity.User;
import com.resumeai.exception.EmbeddingConfigurationException;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeProcessingException;
import com.resumeai.rag.RagMetadata;
import com.resumeai.repository.JobDescriptionRepository;
import com.resumeai.repository.JobMatchRepository;
import com.resumeai.repository.ResumeAnalysisRepository;
import com.resumeai.repository.ResumeChatMessageRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.FileStorageService;
import com.resumeai.service.PdfTextExtractor;
import com.resumeai.service.ResumeService;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class ResumeServiceImpl implements ResumeService {

    private static final int PREVIEW_LENGTH = 300;
    private static final String RESUME_NOT_FOUND_MESSAGE = "Resume not found.";
    private static final String USER_NOT_FOUND_MESSAGE = "User not found.";
    private static final String RAG_UNAVAILABLE_MESSAGE =
            "Resume index is temporarily unavailable. Please try again later.";

    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final ResumeChatMessageRepository resumeChatMessageRepository;
    private final JobMatchRepository jobMatchRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PdfTextExtractor pdfTextExtractor;
    private final ObjectProvider<VectorStore> vectorStoreProvider;

    @Override
    @Transactional
    public ResumeDetailResponse uploadResume(MultipartFile file, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        StoredFileDetails storedFile = fileStorageService.store(file);

        try {
            String extractedText = pdfTextExtractor.extractText(storedFile.filePath());
            Resume resume = buildResume(user, storedFile, extractedText);
            return toDetailResponse(resumeRepository.save(resume));
        } catch (RuntimeException exception) {
            deleteStoredFileAfterFailure(storedFile.filePath(), exception);
            throw exception;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeResponse> getCurrentUserResumes(String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        return resumeRepository.findAllByUserIdOrderByUploadedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeDetailResponse getResume(Long resumeId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        Resume resume = getOwnedResume(resumeId, user.getId());
        return toDetailResponse(resume);
    }

    @Override
    @Transactional
    public void deleteResume(Long resumeId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        Resume resume = getOwnedResume(resumeId, user.getId());

        deleteVectorChunksForResume(resume, user.getId());
        resumeChatMessageRepository.deleteAllByResumeIdAndUserId(resume.getId(), user.getId());
        deleteJobMatchesForResume(resume.getId(), user.getId());
        resumeAnalysisRepository.deleteAllByResumeIdAndUserId(resume.getId(), user.getId());
        resumeRepository.delete(resume);
        resumeRepository.flush();
        fileStorageService.delete(Path.of(resume.getFilePath()));
    }

    private void deleteVectorChunksForResume(Resume resume, Long userId) {
        VectorStore vectorStore = vectorStoreProvider.getIfAvailable();
        if (vectorStore == null) {
            if (resume.getIndexStatus() == ResumeIndexStatus.INDEXED
                    || resume.getIndexStatus() == ResumeIndexStatus.INDEXING) {
                throw new EmbeddingConfigurationException(RAG_UNAVAILABLE_MESSAGE);
            }
            return;
        }

        vectorStore.delete(RagMetadata.ownerResumeFilter(userId, resume.getId()));
    }

    private void deleteJobMatchesForResume(Long resumeId, Long userId) {
        List<JobMatch> jobMatches = jobMatchRepository.findAllByResumeIdAndUserIdOrderByCreatedAtDesc(resumeId, userId);
        if (jobMatches.isEmpty()) {
            return;
        }

        List<JobDescription> jobDescriptions = new ArrayList<>(jobMatches.size());
        for (JobMatch jobMatch : jobMatches) {
            JobDescription jobDescription = jobMatch.getJobDescription();
            if (jobDescription != null) {
                jobDescriptions.add(jobDescription);
            }
        }

        jobMatchRepository.deleteAll(jobMatches);
        jobMatchRepository.flush();

        Set<Long> deletedJobDescriptionIds = new HashSet<>();
        for (JobDescription jobDescription : jobDescriptions) {
            Long jobDescriptionId = jobDescription.getId();
            if (jobDescriptionId != null
                    && deletedJobDescriptionIds.add(jobDescriptionId)
                    && jobMatchRepository.countByJobDescriptionId(jobDescriptionId) == 0) {
                jobDescriptionRepository.delete(jobDescription);
            }
        }
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResumeProcessingException(USER_NOT_FOUND_MESSAGE));
    }

    private Resume getOwnedResume(Long resumeId, Long userId) {
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResumeNotFoundException(RESUME_NOT_FOUND_MESSAGE));
    }

    private Resume buildResume(User user, StoredFileDetails storedFile, String extractedText) {
        return Resume.builder()
                .user(user)
                .originalFileName(storedFile.originalFileName())
                .storedFileName(storedFile.storedFileName())
                .filePath(storedFile.filePath().toString())
                .contentType(storedFile.contentType())
                .fileSize(storedFile.fileSize())
                .extractedText(extractedText)
                .build();
    }

    private void deleteStoredFileAfterFailure(Path filePath, RuntimeException originalException) {
        try {
            fileStorageService.delete(filePath);
        } catch (RuntimeException cleanupException) {
            originalException.addSuppressed(cleanupException);
        }
    }

    private ResumeResponse toResponse(Resume resume) {
        return ResumeResponse.builder()
                .id(resume.getId())
                .originalFileName(resume.getOriginalFileName())
                .contentType(resume.getContentType())
                .fileSize(resume.getFileSize())
                .uploadedAt(resume.getUploadedAt())
                .updatedAt(resume.getUpdatedAt())
                .indexStatus(resume.getIndexStatus())
                .indexedAt(resume.getIndexedAt())
                .indexedChunkCount(resume.getIndexedChunkCount())
                .indexingFailureMessage(resume.getIndexingFailureMessage())
                .extractedTextPreview(buildPreview(resume.getExtractedText()))
                .build();
    }

    private ResumeDetailResponse toDetailResponse(Resume resume) {
        return ResumeDetailResponse.builder()
                .id(resume.getId())
                .originalFileName(resume.getOriginalFileName())
                .contentType(resume.getContentType())
                .fileSize(resume.getFileSize())
                .uploadedAt(resume.getUploadedAt())
                .updatedAt(resume.getUpdatedAt())
                .indexStatus(resume.getIndexStatus())
                .indexedAt(resume.getIndexedAt())
                .indexedChunkCount(resume.getIndexedChunkCount())
                .indexingFailureMessage(resume.getIndexingFailureMessage())
                .extractedText(resume.getExtractedText())
                .build();
    }

    private String buildPreview(String extractedText) {
        if (extractedText == null || extractedText.isBlank()) {
            return "";
        }

        String trimmedText = extractedText.trim();
        return trimmedText.length() <= PREVIEW_LENGTH
                ? trimmedText
                : trimmedText.substring(0, PREVIEW_LENGTH);
    }
}
