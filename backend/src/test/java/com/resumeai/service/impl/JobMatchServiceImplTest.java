package com.resumeai.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.config.AiProperties;
import com.resumeai.dto.ai.JobMatchAiResult;
import com.resumeai.dto.request.JobMatchRequest;
import com.resumeai.dto.response.JobMatchResponse;
import com.resumeai.entity.JobDescription;
import com.resumeai.entity.JobMatch;
import com.resumeai.entity.JobMatchStatus;
import com.resumeai.entity.Resume;
import com.resumeai.entity.User;
import com.resumeai.entity.UserRole;
import com.resumeai.exception.JobMatchAiException;
import com.resumeai.exception.JobMatchNotFoundException;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.mapper.JobMatchJsonMapper;
import com.resumeai.repository.JobDescriptionRepository;
import com.resumeai.repository.JobMatchRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.JobMatchAiService;
import java.time.LocalDateTime;
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
class JobMatchServiceImplTest {

    private static final String EMAIL = "owner@example.com";
    private static final String RESUME_TEXT = "Java Spring Boot React PostgreSQL resume";
    private static final String JOB_DESCRIPTION_TEXT =
            "We need a Java developer with Spring Boot, React, PostgreSQL, REST APIs, and cloud deployment experience.";

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private JobDescriptionRepository jobDescriptionRepository;

    @Mock
    private JobMatchRepository jobMatchRepository;

    @Mock
    private JobMatchAiService jobMatchAiService;

    private JobMatchServiceImpl jobMatchService;
    private AtomicReference<JobDescription> savedJobDescription;
    private AtomicReference<JobMatch> savedJobMatch;

    @BeforeEach
    void setUp() {
        savedJobDescription = new AtomicReference<>();
        savedJobMatch = new AtomicReference<>();

        AiProperties aiProperties = new AiProperties();
        aiProperties.setModel("gemini-3.5-flash");

        jobMatchService = new JobMatchServiceImpl(
                userRepository,
                resumeRepository,
                jobDescriptionRepository,
                jobMatchRepository,
                jobMatchAiService,
                new JobMatchJsonMapper(new ObjectMapper()),
                aiProperties,
                testTransactionManager()
        );
    }

    @Test
    void userCanMatchOwnedResume() {
        mockMatchPersistence();
        User user = user();
        Resume resume = resume(user, RESUME_TEXT);
        mockOwnedResume(user, resume);
        when(jobMatchAiService.match(RESUME_TEXT, JOB_DESCRIPTION_TEXT)).thenReturn(validAiResult());

        JobMatchResponse response = jobMatchService.createMatch(request(), EMAIL);

        assertThat(response.getId()).isEqualTo(300L);
        assertThat(response.getResumeId()).isEqualTo(10L);
        assertThat(response.getStatus()).isEqualTo(JobMatchStatus.COMPLETED);
        assertThat(response.getMatchScore()).isEqualTo(78);
        assertThat(response.getMatchedSkills()).containsExactly("Java", "Spring Boot", "React");
    }

    @Test
    void userCannotMatchAnotherUsersResume() {
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobMatchService.createMatch(request(), EMAIL))
                .isInstanceOf(ResumeNotFoundException.class);

        verify(jobMatchAiService, never()).match(any(), any());
        verify(jobDescriptionRepository, never()).save(any());
        verify(jobMatchRepository, never()).save(any());
    }

    @Test
    void completedMatchIsSaved() {
        mockMatchPersistence();
        User user = user();
        Resume resume = resume(user, RESUME_TEXT);
        mockOwnedResume(user, resume);
        when(jobMatchAiService.match(RESUME_TEXT, JOB_DESCRIPTION_TEXT)).thenReturn(validAiResult());

        jobMatchService.createMatch(request(), EMAIL);

        assertThat(savedJobMatch.get().getStatus()).isEqualTo(JobMatchStatus.COMPLETED);
        assertThat(savedJobMatch.get().getFailureMessage()).isNull();
        assertThat(savedJobMatch.get().getMatchedSkills()).contains("Spring Boot");
    }

    @Test
    void failedMatchIsSavedAsFailed() {
        mockMatchPersistence();
        User user = user();
        Resume resume = resume(user, RESUME_TEXT);
        mockOwnedResume(user, resume);
        when(jobMatchAiService.match(RESUME_TEXT, JOB_DESCRIPTION_TEXT)).thenThrow(new JobMatchAiException(
                "AI job matching provider is temporarily unavailable. Please try again later.",
                JobMatchAiException.FailureType.PROVIDER_UNAVAILABLE
        ));

        assertThatThrownBy(() -> jobMatchService.createMatch(request(), EMAIL))
                .isInstanceOf(JobMatchAiException.class);

        assertThat(savedJobMatch.get().getStatus()).isEqualTo(JobMatchStatus.FAILED);
        assertThat(savedJobMatch.get().getFailureMessage()).contains("temporarily unavailable");
    }

    @Test
    void emptyExtractedResumeTextRejected() {
        User user = user();
        Resume resume = resume(user, " ");
        mockOwnedResume(user, resume);

        assertThatThrownBy(() -> jobMatchService.createMatch(request(), EMAIL))
                .isInstanceOf(ResumeTextUnavailableException.class);

        verify(jobMatchAiService, never()).match(any(), any());
        verify(jobDescriptionRepository, never()).save(any());
    }

    @Test
    void jobDescriptionIsSaved() {
        mockMatchPersistence();
        User user = user();
        Resume resume = resume(user, RESUME_TEXT);
        mockOwnedResume(user, resume);
        when(jobMatchAiService.match(RESUME_TEXT, JOB_DESCRIPTION_TEXT)).thenReturn(validAiResult());

        jobMatchService.createMatch(request(), EMAIL);

        assertThat(savedJobDescription.get().getTitle()).isEqualTo("Senior Java Developer");
        assertThat(savedJobDescription.get().getCompanyName()).isEqualTo("Acme");
        assertThat(savedJobDescription.get().getDescription()).isEqualTo(JOB_DESCRIPTION_TEXT);
    }

    @Test
    void matchHistoryReturnsNewestFirst() {
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(jobMatchRepository.findAllByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of(
                completedMatch(302L, 91, LocalDateTime.now()),
                completedMatch(301L, 64, LocalDateTime.now().minusDays(1))
        ));

        List<JobMatchResponse> responses = jobMatchService.getCurrentUserMatches(EMAIL);

        assertThat(responses).hasSize(2);
        assertThat(responses.getFirst().getId()).isEqualTo(302L);
        assertThat(responses.get(1).getId()).isEqualTo(301L);
    }

    @Test
    void deleteVerifiesOwnership() {
        User user = user();
        JobMatch match = completedMatch(300L, 78, LocalDateTime.now());
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(jobMatchRepository.findByIdAndUserId(300L, 1L)).thenReturn(Optional.of(match));
        when(jobMatchRepository.countByJobDescriptionId(200L)).thenReturn(0L);

        jobMatchService.deleteMatch(300L, EMAIL);

        verify(jobMatchRepository).delete(match);
        verify(jobMatchRepository).flush();
        verify(jobDescriptionRepository).delete(match.getJobDescription());
    }

    @Test
    void deleteRejectsUnownedMatch() {
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(jobMatchRepository.findByIdAndUserId(300L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> jobMatchService.deleteMatch(300L, EMAIL))
                .isInstanceOf(JobMatchNotFoundException.class);

        verify(jobMatchRepository, never()).delete(any());
    }

    private void mockOwnedResume(User user, Resume resume) {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, user.getId())).thenReturn(Optional.of(resume));
    }

    private void mockMatchPersistence() {
        when(jobDescriptionRepository.save(any(JobDescription.class))).thenAnswer(invocation -> {
            JobDescription jobDescription = invocation.getArgument(0);
            if (jobDescription.getId() == null) {
                jobDescription.setId(200L);
            }
            savedJobDescription.set(jobDescription);
            return jobDescription;
        });
        when(jobMatchRepository.save(any(JobMatch.class))).thenAnswer(invocation -> {
            JobMatch jobMatch = invocation.getArgument(0);
            if (jobMatch.getId() == null) {
                jobMatch.setId(300L);
            }
            savedJobMatch.set(jobMatch);
            return jobMatch;
        });
        when(jobMatchRepository.findById(300L)).thenAnswer(invocation -> Optional.ofNullable(savedJobMatch.get()));
    }

    private JobMatchRequest request() {
        JobMatchRequest request = new JobMatchRequest();
        request.setResumeId(10L);
        request.setTitle("Senior Java Developer");
        request.setCompanyName("Acme");
        request.setDescription(JOB_DESCRIPTION_TEXT);
        return request;
    }

    private JobMatchAiResult validAiResult() {
        return new JobMatchAiResult(
                78,
                "Good match with backend and frontend overlap.",
                List.of("Java", "Spring Boot", "React"),
                List.of("Kubernetes"),
                new JobMatchAiResult.MatchSection(82, "STRONG", "Relevant backend experience."),
                new JobMatchAiResult.MatchSection(64, "PARTIAL", "Education is generally relevant."),
                List.of("API experience"),
                List.of("Cloud deployment depth"),
                List.of("Add Kubernetes examples"),
                List.of("REST APIs", "PostgreSQL")
        );
    }

    private JobMatch completedMatch(Long id, int score, LocalDateTime createdAt) {
        User user = user();
        Resume resume = resume(user, RESUME_TEXT);
        JobDescription jobDescription = JobDescription.builder()
                .id(200L)
                .user(user)
                .title("Senior Java Developer")
                .companyName("Acme")
                .description(JOB_DESCRIPTION_TEXT)
                .build();

        return JobMatch.builder()
                .id(id)
                .user(user)
                .resume(resume)
                .jobDescription(jobDescription)
                .matchScore(score)
                .summary("Good match.")
                .matchedSkills("[\"Java\",\"Spring Boot\"]")
                .missingSkills("[\"Kubernetes\"]")
                .experienceMatch("{\"score\":82,\"status\":\"STRONG\",\"explanation\":\"Relevant experience.\"}")
                .educationMatch("{\"score\":64,\"status\":\"PARTIAL\",\"explanation\":\"Related education.\"}")
                .strengths("[\"Backend APIs\"]")
                .gaps("[\"Cloud examples\"]")
                .recommendations("[\"Add deployment impact\"]")
                .keywordSuggestions("[\"REST APIs\"]")
                .status(JobMatchStatus.COMPLETED)
                .modelName("gemini-3.5-flash")
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();
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
