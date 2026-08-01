package com.resumeai.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.config.AiProperties;
import com.resumeai.dto.ai.ResumeAnalysisAiResult;
import com.resumeai.dto.response.ResumeAnalysisResponse;
import com.resumeai.entity.AnalysisStatus;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeAnalysis;
import com.resumeai.entity.User;
import com.resumeai.entity.UserRole;
import com.resumeai.exception.AiAnalysisException;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.mapper.ResumeAnalysisJsonMapper;
import com.resumeai.repository.ResumeAnalysisRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.ResumeAiService;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;

@ExtendWith(MockitoExtension.class)
class ResumeAnalysisServiceImplTest {

    private static final String EMAIL = "owner@example.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private ResumeAnalysisRepository resumeAnalysisRepository;

    @Mock
    private ResumeAiService resumeAiService;

    private ResumeAnalysisServiceImpl resumeAnalysisService;
    private AtomicReference<ResumeAnalysis> savedAnalysis;

    @BeforeEach
    void setUp() {
        savedAnalysis = new AtomicReference<>();

        AiProperties aiProperties = new AiProperties();
        aiProperties.setModel("gemini-2.5-flash");
        ResumeAnalysisJsonMapper jsonMapper = new ResumeAnalysisJsonMapper(new ObjectMapper());

        resumeAnalysisService = new ResumeAnalysisServiceImpl(
                userRepository,
                resumeRepository,
                resumeAnalysisRepository,
                resumeAiService,
                jsonMapper,
                aiProperties,
                testTransactionManager()
        );

    }

    @Test
    void userCanAnalyzeOwnedResume() {
        mockAnalysisPersistence();
        User user = user();
        Resume resume = resume(user, "Java React resume");
        mockOwnedResume(user, resume);
        when(resumeAiService.analyze("Java React resume")).thenReturn(validAiResult());

        ResumeAnalysisResponse response = resumeAnalysisService.analyzeResume(10L, EMAIL);

        assertThat(response.getId()).isEqualTo(100L);
        assertThat(response.getStatus()).isEqualTo(AnalysisStatus.COMPLETED);
        assertThat(response.getSkills()).containsExactly("Java", "React");
    }

    @Test
    void userCannotAnalyzeAnotherUsersResume() {
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resumeAnalysisService.analyzeResume(10L, EMAIL))
                .isInstanceOf(ResumeNotFoundException.class);

        verify(resumeAiService, never()).analyze(any());
        verify(resumeAnalysisRepository, never()).save(any());
    }

    @Test
    void analysisIsSavedAsCompletedOnSuccess() {
        mockAnalysisPersistence();
        User user = user();
        Resume resume = resume(user, "Java React resume");
        mockOwnedResume(user, resume);
        when(resumeAiService.analyze("Java React resume")).thenReturn(validAiResult());

        resumeAnalysisService.analyzeResume(10L, EMAIL);

        assertThat(savedAnalysis.get().getStatus()).isEqualTo(AnalysisStatus.COMPLETED);
        assertThat(savedAnalysis.get().getFailureMessage()).isNull();
    }

    @Test
    void analysisIsSavedAsFailedOnProviderFailure() {
        mockAnalysisPersistence();
        User user = user();
        Resume resume = resume(user, "Java React resume");
        mockOwnedResume(user, resume);
        when(resumeAiService.analyze("Java React resume")).thenThrow(new AiAnalysisException(
                "AI analysis provider is temporarily unavailable. Please try again later.",
                AiAnalysisException.FailureType.PROVIDER_UNAVAILABLE
        ));

        assertThatThrownBy(() -> resumeAnalysisService.analyzeResume(10L, EMAIL))
                .isInstanceOf(AiAnalysisException.class);

        assertThat(savedAnalysis.get().getStatus()).isEqualTo(AnalysisStatus.FAILED);
        assertThat(savedAnalysis.get().getFailureMessage()).contains("temporarily unavailable");
    }

    @Test
    void missingExtractedTextIsRejected() {
        User user = user();
        Resume resume = resume(user, " ");
        mockOwnedResume(user, resume);

        assertThatThrownBy(() -> resumeAnalysisService.analyzeResume(10L, EMAIL))
                .isInstanceOf(ResumeTextUnavailableException.class);

        verify(resumeAiService, never()).analyze(any());
    }

    private void mockOwnedResume(User user, Resume resume) {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, user.getId())).thenReturn(Optional.of(resume));
    }

    private void mockAnalysisPersistence() {
        when(resumeAnalysisRepository.save(any(ResumeAnalysis.class))).thenAnswer(invocation -> {
            ResumeAnalysis analysis = invocation.getArgument(0);
            if (analysis.getId() == null) {
                analysis.setId(100L);
            }
            savedAnalysis.set(analysis);
            return analysis;
        });
        when(resumeAnalysisRepository.findById(100L)).thenAnswer(invocation ->
                Optional.ofNullable(savedAnalysis.get()));
    }

    private ResumeAnalysisAiResult validAiResult() {
        return new ResumeAnalysisAiResult(
                "Strong resume with relevant full-stack experience.",
                82,
                List.of("Java", "React"),
                List.of(),
                List.of(),
                List.of(),
                List.of("Clear technical stack"),
                List.of("Needs more measurable outcomes"),
                List.of("Add quantified achievements")
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
