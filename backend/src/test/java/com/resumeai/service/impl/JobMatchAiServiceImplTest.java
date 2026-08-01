package com.resumeai.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.resumeai.config.AiProperties;
import com.resumeai.dto.ai.JobMatchAiResult;
import com.resumeai.exception.JobDescriptionValidationException;
import com.resumeai.exception.JobMatchAiException;
import com.resumeai.exception.ResumeTextUnavailableException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ClassPathResource;

@ExtendWith(MockitoExtension.class)
class JobMatchAiServiceImplTest {

    @Mock
    private ObjectProvider<ChatClient> chatClientProvider;

    @Mock
    private ChatClient chatClient;

    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;

    @Mock
    private ChatClient.CallResponseSpec responseSpec;

    private JobMatchAiServiceImpl jobMatchAiService;

    @BeforeEach
    void setUp() {
        AiProperties aiProperties = new AiProperties();
        aiProperties.setModel("gemini-3.5-flash");
        aiProperties.setTemperature(0.2);
        aiProperties.setMaxResumeCharacters(30000);
        aiProperties.setMaxJobDescriptionCharacters(20000);
        aiProperties.setMaxJobMatchInputCharacters(45000);

        jobMatchAiService = new JobMatchAiServiceImpl(
                chatClientProvider,
                aiProperties,
                "test-key",
                new ClassPathResource("prompts/job-match-prompt.st")
        );
    }

    @Test
    void blankResumeRejected() {
        assertThatThrownBy(() -> jobMatchAiService.match(" ", "Detailed Java role description."))
                .isInstanceOf(ResumeTextUnavailableException.class);

        verifyNoInteractions(chatClient);
    }

    @Test
    void blankJobDescriptionRejected() {
        assertThatThrownBy(() -> jobMatchAiService.match("Java developer resume", " "))
                .isInstanceOf(JobDescriptionValidationException.class);

        verifyNoInteractions(chatClient);
    }

    @Test
    void scoreBelowZeroIsNormalized() {
        mockAiResult(validResult(-12));

        JobMatchAiResult result = jobMatchAiService.match("Java developer resume", "Java developer job.");

        assertThat(result.matchScore()).isZero();
    }

    @Test
    void scoreAboveOneHundredIsNormalized() {
        mockAiResult(validResult(145));

        JobMatchAiResult result = jobMatchAiService.match("Java developer resume", "Java developer job.");

        assertThat(result.matchScore()).isEqualTo(100);
    }

    @Test
    void sectionScoresAreNormalized() {
        mockAiResult(new JobMatchAiResult(
                75,
                "Good match.",
                List.of("Java"),
                List.of("AWS"),
                new JobMatchAiResult.MatchSection(140, "strong", "Relevant experience."),
                new JobMatchAiResult.MatchSection(-20, "partial", "Education is related."),
                List.of("Backend experience"),
                List.of("Cloud depth"),
                List.of("Add AWS examples"),
                List.of("Spring Boot")
        ));

        JobMatchAiResult result = jobMatchAiService.match("Java developer resume", "Java developer job.");

        assertThat(result.experienceMatch().score()).isEqualTo(100);
        assertThat(result.experienceMatch().status()).isEqualTo("STRONG");
        assertThat(result.educationMatch().score()).isZero();
        assertThat(result.educationMatch().status()).isEqualTo("PARTIAL");
    }

    @Test
    void nullCollectionsBecomeEmptyLists() {
        mockAiResult(new JobMatchAiResult(
                68,
                "Partial match.",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        ));

        JobMatchAiResult result = jobMatchAiService.match("Java developer resume", "Java developer job.");

        assertThat(result.matchedSkills()).isEmpty();
        assertThat(result.missingSkills()).isEmpty();
        assertThat(result.strengths()).isEmpty();
        assertThat(result.gaps()).isEmpty();
        assertThat(result.recommendations()).isEmpty();
        assertThat(result.keywordSuggestions()).isEmpty();
        assertThat(result.experienceMatch().status()).isEqualTo("NOT_FOUND");
        assertThat(result.educationMatch().status()).isEqualTo("NOT_FOUND");
    }

    @Test
    void invalidAiResponseThrowsException() {
        mockAiResult(new JobMatchAiResult(
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        ));

        assertThatThrownBy(() -> jobMatchAiService.match("Java developer resume", "Java developer job."))
                .isInstanceOf(JobMatchAiException.class)
                .extracting("failureType")
                .isEqualTo(JobMatchAiException.FailureType.UNEXPECTED_OUTPUT);
    }

    private void mockAiResult(JobMatchAiResult result) {
        when(chatClientProvider.getIfAvailable()).thenReturn(chatClient);
        when(chatClient.prompt(anyString())).thenReturn(requestSpec);
        when(requestSpec.options(any(ChatOptions.class))).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(responseSpec);
        when(responseSpec.entity(JobMatchAiResult.class)).thenReturn(result);
    }

    private JobMatchAiResult validResult(int score) {
        return new JobMatchAiResult(
                score,
                "Strong Java match.",
                List.of("Java", "Spring Boot"),
                List.of("Kubernetes"),
                new JobMatchAiResult.MatchSection(82, "STRONG", "Relevant backend experience."),
                new JobMatchAiResult.MatchSection(70, "PARTIAL", "Education is related."),
                List.of("Backend APIs"),
                List.of("Missing deployment examples"),
                List.of("Add cloud deployment examples"),
                List.of("REST APIs")
        );
    }
}
