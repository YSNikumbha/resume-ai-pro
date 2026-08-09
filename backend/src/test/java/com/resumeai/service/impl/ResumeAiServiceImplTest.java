package com.resumeai.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.resumeai.config.AiProperties;
import com.resumeai.dto.ai.ResumeAnalysisAiResult;
import com.resumeai.exception.AiAnalysisException;
import com.resumeai.exception.AiConfigurationException;
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
class ResumeAiServiceImplTest {

    @Mock
    private ObjectProvider<ChatClient> chatClientProvider;

    @Mock
    private ChatClient chatClient;

    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;

    @Mock
    private ChatClient.CallResponseSpec responseSpec;

    private ResumeAiServiceImpl resumeAiService;

    @BeforeEach
    void setUp() {
        AiProperties aiProperties = new AiProperties();
        aiProperties.setModel("gemini-3.6-flash");
        aiProperties.setMaxResumeCharacters(30000);

        resumeAiService = new ResumeAiServiceImpl(
                chatClientProvider,
                aiProperties,
                "test-key",
                new ClassPathResource("prompts/resume-analysis-prompt.st")
        );
    }

    @Test
    void blankResumeTextRejected() {
        assertThatThrownBy(() -> resumeAiService.analyze(" "))
                .isInstanceOf(ResumeTextUnavailableException.class);

        verifyNoInteractions(chatClient);
    }

    @Test
    void atsScoreBelowZeroIsNormalized() {
        mockAiResult(validResult(-10));

        ResumeAnalysisAiResult result = resumeAiService.analyze("Java developer resume");

        assertThat(result.atsScore()).isZero();
    }

    @Test
    void atsScoreAboveOneHundredIsNormalized() {
        mockAiResult(validResult(140));

        ResumeAnalysisAiResult result = resumeAiService.analyze("Java developer resume");

        assertThat(result.atsScore()).isEqualTo(100);
    }

    @Test
    void nullListsBecomeEmptyLists() {
        mockAiResult(new ResumeAnalysisAiResult(
                "Clear resume summary.",
                78,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        ));

        ResumeAnalysisAiResult result = resumeAiService.analyze("Java developer resume");

        assertThat(result.skills()).isEmpty();
        assertThat(result.education()).isEmpty();
        assertThat(result.experience()).isEmpty();
        assertThat(result.projects()).isEmpty();
        assertThat(result.strengths()).isEmpty();
        assertThat(result.weaknesses()).isEmpty();
        assertThat(result.suggestions()).isEmpty();
    }

    @Test
    void invalidAiResponseThrowsAiAnalysisException() {
        mockAiResult(new ResumeAnalysisAiResult(
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

        assertThatThrownBy(() -> resumeAiService.analyze("Java developer resume"))
                .isInstanceOf(AiAnalysisException.class)
                .extracting("failureType")
                .isEqualTo(AiAnalysisException.FailureType.UNEXPECTED_OUTPUT);
    }

    @Test
    void missingApiKeyThrowsAiConfigurationException() {
        AiProperties aiProperties = new AiProperties();
        ResumeAiServiceImpl unconfiguredService = new ResumeAiServiceImpl(
                chatClientProvider,
                aiProperties,
                "",
                new ClassPathResource("prompts/resume-analysis-prompt.st")
        );

        assertThatThrownBy(() -> unconfiguredService.analyze("Java developer resume"))
                .isInstanceOf(AiConfigurationException.class)
                .hasMessage("AI analysis is not configured. Please contact the administrator.");
    }

    private void mockAiResult(ResumeAnalysisAiResult result) {
        when(chatClientProvider.getIfAvailable()).thenReturn(chatClient);
        when(chatClient.prompt(anyString())).thenReturn(requestSpec);
        when(requestSpec.options(any(ChatOptions.class))).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(responseSpec);
        when(responseSpec.entity(ResumeAnalysisAiResult.class)).thenReturn(result);
    }

    private ResumeAnalysisAiResult validResult(int atsScore) {
        return new ResumeAnalysisAiResult(
                "Strong Java and React resume.",
                atsScore,
                List.of("Java", "React"),
                List.of(),
                List.of(),
                List.of(),
                List.of("Clear technical skills"),
                List.of("Add more metrics"),
                List.of("Quantify project impact")
        );
    }
}
