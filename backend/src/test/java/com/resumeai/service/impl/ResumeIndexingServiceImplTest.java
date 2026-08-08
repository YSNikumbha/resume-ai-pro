package com.resumeai.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.resumeai.dto.rag.ResumeChunk;
import com.resumeai.dto.response.ResumeIndexResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeIndexStatus;
import com.resumeai.entity.User;
import com.resumeai.entity.UserRole;
import com.resumeai.exception.ResumeIndexingException;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.ResumeChunkingService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;

@ExtendWith(MockitoExtension.class)
class ResumeIndexingServiceImplTest {

    private static final String EMAIL = "owner@example.com";
    private static final String RESUME_TEXT = """
            SUMMARY
            Java Spring Boot React PostgreSQL resume with backend APIs, frontend workflows, and database experience.
            """;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private ResumeChunkingService chunkingService;

    @Mock
    private ObjectProvider<VectorStore> vectorStoreProvider;

    @Mock
    private VectorStore vectorStore;

    @Captor
    private ArgumentCaptor<List<Document>> documentListCaptor;

    private ResumeIndexingServiceImpl indexingService;
    private AtomicReference<Resume> savedResume;

    @BeforeEach
    void setUp() {
        savedResume = new AtomicReference<>();
        indexingService = new ResumeIndexingServiceImpl(
                userRepository,
                resumeRepository,
                chunkingService,
                vectorStoreProvider,
                testTransactionManager()
        );
    }

    @Test
    void userCanIndexOwnedResume() {
        Resume resume = mockOwnedResume(RESUME_TEXT);
        mockPersistence(resume);
        mockVectorStore();
        when(chunkingService.chunk(RESUME_TEXT)).thenReturn(chunks());

        ResumeIndexResponse response = indexingService.indexResume(10L, EMAIL);

        assertThat(response.getResumeId()).isEqualTo(10L);
        assertThat(response.getStatus()).isEqualTo(ResumeIndexStatus.INDEXED);
        assertThat(response.getChunkCount()).isEqualTo(2);
    }

    @Test
    void userCannotIndexAnotherUsersResume() {
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> indexingService.indexResume(10L, EMAIL))
                .isInstanceOf(ResumeNotFoundException.class);

        verify(vectorStore, never()).add(any());
    }

    @Test
    void blankExtractedTextRejected() {
        Resume resume = mockOwnedResume(" ");
        mockPersistence(resume);

        assertThatThrownBy(() -> indexingService.indexResume(10L, EMAIL))
                .isInstanceOf(ResumeTextUnavailableException.class);

        assertThat(savedResume.get().getIndexStatus()).isEqualTo(ResumeIndexStatus.FAILED);
        assertThat(savedResume.get().getIndexingFailureMessage()).contains("unavailable");
        verify(vectorStore, never()).add(any());
    }

    @Test
    void tooShortExtractedTextRejected() {
        Resume resume = mockOwnedResume("24955");
        mockPersistence(resume);

        assertThatThrownBy(() -> indexingService.indexResume(10L, EMAIL))
                .isInstanceOf(ResumeTextUnavailableException.class)
                .hasMessageContaining("too short");

        assertThat(savedResume.get().getIndexStatus()).isEqualTo(ResumeIndexStatus.FAILED);
        assertThat(savedResume.get().getIndexingFailureMessage()).contains("too short");
        verify(vectorStore, never()).add(any());
    }

    @Test
    void reindexRemovesPreviousChunksBeforeAddingNewChunks() {
        Resume resume = mockOwnedResume(RESUME_TEXT);
        mockPersistence(resume);
        mockVectorStore();
        when(chunkingService.chunk(RESUME_TEXT)).thenReturn(chunks());

        indexingService.indexResume(10L, EMAIL);

        InOrder inOrder = inOrder(vectorStore);
        inOrder.verify(vectorStore).delete(any(org.springframework.ai.vectorstore.filter.Filter.Expression.class));
        inOrder.verify(vectorStore).add(any());
    }

    @Test
    void indexStatusBecomesIndexed() {
        Resume resume = mockOwnedResume(RESUME_TEXT);
        mockPersistence(resume);
        mockVectorStore();
        when(chunkingService.chunk(RESUME_TEXT)).thenReturn(chunks());

        indexingService.indexResume(10L, EMAIL);

        assertThat(savedResume.get().getIndexStatus()).isEqualTo(ResumeIndexStatus.INDEXED);
        assertThat(savedResume.get().getIndexedChunkCount()).isEqualTo(2);
        assertThat(savedResume.get().getIndexedAt()).isNotNull();
    }

    @Test
    void failureStatusBecomesFailed() {
        Resume resume = mockOwnedResume(RESUME_TEXT);
        mockPersistence(resume);
        mockVectorStore();
        when(chunkingService.chunk(RESUME_TEXT)).thenThrow(new ResumeIndexingException("boom"));

        assertThatThrownBy(() -> indexingService.indexResume(10L, EMAIL))
                .isInstanceOf(ResumeIndexingException.class);

        assertThat(savedResume.get().getIndexStatus()).isEqualTo(ResumeIndexStatus.FAILED);
        assertThat(savedResume.get().getIndexingFailureMessage()).contains("Resume indexing failed");
    }

    @Test
    void metadataContainsUserIdAndResumeId() {
        Resume resume = mockOwnedResume(RESUME_TEXT);
        mockPersistence(resume);
        mockVectorStore();
        when(chunkingService.chunk(RESUME_TEXT)).thenReturn(chunks());

        indexingService.indexResume(10L, EMAIL);

        verify(vectorStore).add(documentListCaptor.capture());
        Document document = documentListCaptor.getValue().getFirst();
        assertThat(document.getMetadata()).containsEntry("userId", "1");
        assertThat(document.getMetadata()).containsEntry("resumeId", "10");
        assertThat(document.getMetadata()).containsEntry("originalFileName", "resume.pdf");
    }

    private Resume mockOwnedResume(String extractedText) {
        User user = user();
        Resume resume = resume(user, extractedText);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(resume));
        return resume;
    }

    private void mockPersistence(Resume resume) {
        when(resumeRepository.save(any(Resume.class))).thenAnswer(invocation -> {
            Resume saved = invocation.getArgument(0);
            savedResume.set(saved);
            return saved;
        });
    }

    private void mockVectorStore() {
        when(vectorStoreProvider.getIfAvailable()).thenReturn(vectorStore);
    }

    private List<ResumeChunk> chunks() {
        return List.of(
                new ResumeChunk("Java Spring Boot", 0, "SKILLS", 0, 16),
                new ResumeChunk("React PostgreSQL", 1, "SKILLS", 10, 26)
        );
    }

    private User user() {
        return User.builder()
                .id(1L)
                .fullName("Owner User")
                .email(EMAIL)
                .password("encoded")
                .role(UserRole.USER)
                .build();
    }

    private Resume resume(User user, String extractedText) {
        return Resume.builder()
                .id(10L)
                .user(user)
                .originalFileName("resume.pdf")
                .storedFileName("stored.pdf")
                .filePath("uploads/resumes/stored.pdf")
                .contentType("application/pdf")
                .fileSize(1024L)
                .extractedText(extractedText)
                .uploadedAt(LocalDateTime.now().minusDays(1))
                .indexStatus(ResumeIndexStatus.NOT_INDEXED)
                .indexedChunkCount(0)
                .build();
    }

    private PlatformTransactionManager testTransactionManager() {
        return new PlatformTransactionManager() {
            @Override
            public TransactionStatus getTransaction(TransactionDefinition definition) {
                return new SimpleTransactionStatus();
            }

            @Override
            public void commit(TransactionStatus status) {
            }

            @Override
            public void rollback(TransactionStatus status) {
            }
        };
    }
}
