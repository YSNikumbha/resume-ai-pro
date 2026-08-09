package com.resumeai.service.impl;

import com.resumeai.config.AiProperties;
import com.resumeai.dto.ai.ResumeAnalysisAiResult;
import com.resumeai.exception.AiAnalysisException;
import com.resumeai.exception.AiConfigurationException;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.service.ResumeAiService;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class ResumeAiServiceImpl implements ResumeAiService {

    private static final String MISSING_CONFIGURATION_MESSAGE =
            "AI analysis is not configured. Please contact the administrator.";
    private static final String PROVIDER_UNAVAILABLE_MESSAGE =
            "AI analysis provider is temporarily unavailable. Please try again later.";
    private static final String UNEXPECTED_OUTPUT_MESSAGE =
            "AI analysis returned an unexpected response. Please try again later.";
    private static final String BLANK_TEXT_MESSAGE = "Resume text is unavailable for analysis.";

    private final ObjectProvider<ChatClient> chatClientProvider;
    private final AiProperties aiProperties;
    private final String apiKey;
    private final Resource promptTemplateResource;

    public ResumeAiServiceImpl(
            ObjectProvider<ChatClient> chatClientProvider,
            AiProperties aiProperties,
            @Value("${spring.ai.google.genai.api-key:}") String apiKey,
            @Value("classpath:/prompts/resume-analysis-prompt.st") Resource promptTemplateResource
    ) {
        this.chatClientProvider = chatClientProvider;
        this.aiProperties = aiProperties;
        this.apiKey = apiKey;
        this.promptTemplateResource = promptTemplateResource;
    }

    @Override
    public ResumeAnalysisAiResult analyze(String resumeText) {
        if (!StringUtils.hasText(resumeText)) {
            throw new ResumeTextUnavailableException(BLANK_TEXT_MESSAGE);
        }

        ensureConfigured();

        try {
            String prompt = buildPrompt(limitResumeText(resumeText));
            ResumeAnalysisAiResult result = getChatClient()
                    .prompt(prompt)
                    .options(ChatOptions.builder()
                            .model(aiProperties.getModel())
                            .build())
                    .call()
                    .entity(ResumeAnalysisAiResult.class);

            return normalizeAndValidate(result);
        } catch (AiConfigurationException | ResumeTextUnavailableException | AiAnalysisException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.warn("AI provider call failed: {}", exception.getClass().getSimpleName());
            throw new AiAnalysisException(
                    PROVIDER_UNAVAILABLE_MESSAGE,
                    AiAnalysisException.FailureType.PROVIDER_UNAVAILABLE,
                    exception
            );
        }
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(apiKey)) {
            throw new AiConfigurationException(MISSING_CONFIGURATION_MESSAGE);
        }

        if (getChatClient() == null) {
            throw new AiConfigurationException(MISSING_CONFIGURATION_MESSAGE);
        }
    }

    private ChatClient getChatClient() {
        return chatClientProvider.getIfAvailable();
    }

    private String limitResumeText(String resumeText) {
        String trimmedText = resumeText.trim();
        int maxCharacters = aiProperties.getMaxResumeCharacters();
        return trimmedText.length() <= maxCharacters
                ? trimmedText
                : trimmedText.substring(0, maxCharacters);
    }

    private String buildPrompt(String resumeText) {
        BeanOutputConverter<ResumeAnalysisAiResult> outputConverter =
                new BeanOutputConverter<>(ResumeAnalysisAiResult.class);
        PromptTemplate promptTemplate = new PromptTemplate(promptTemplateResource);

        return promptTemplate.render(Map.of(
                "resumeText", resumeText,
                "format", outputConverter.getFormat()
        ));
    }

    private ResumeAnalysisAiResult normalizeAndValidate(ResumeAnalysisAiResult result) {
        if (result == null) {
            throw unexpectedOutputException();
        }

        ResumeAnalysisAiResult normalized = new ResumeAnalysisAiResult(
                cleanText(result.summary()),
                normalizeScore(result.atsScore()),
                cleanStringList(result.skills()),
                cleanEducation(result.education()),
                cleanExperience(result.experience()),
                cleanProjects(result.projects()),
                cleanStringList(result.strengths()),
                cleanStringList(result.weaknesses()),
                cleanStringList(result.suggestions())
        );

        if (isCompletelyEmpty(normalized)) {
            throw unexpectedOutputException();
        }

        return normalized;
    }

    private Integer normalizeScore(Integer atsScore) {
        if (atsScore == null) {
            return null;
        }

        return Math.max(0, Math.min(100, atsScore));
    }

    private List<String> cleanStringList(List<String> values) {
        if (values == null) {
            return Collections.emptyList();
        }

        return values.stream()
                .map(this::cleanText)
                .filter(Objects::nonNull)
                .toList();
    }

    private List<ResumeAnalysisAiResult.EducationItem> cleanEducation(
            List<ResumeAnalysisAiResult.EducationItem> education
    ) {
        if (education == null) {
            return Collections.emptyList();
        }

        return education.stream()
                .filter(Objects::nonNull)
                .map(item -> new ResumeAnalysisAiResult.EducationItem(
                        cleanText(item.institution()),
                        cleanText(item.qualification()),
                        cleanText(item.field()),
                        item.startYear(),
                        item.endYear()
                ))
                .filter(this::hasEducationContent)
                .toList();
    }

    private List<ResumeAnalysisAiResult.ExperienceItem> cleanExperience(
            List<ResumeAnalysisAiResult.ExperienceItem> experience
    ) {
        if (experience == null) {
            return Collections.emptyList();
        }

        return experience.stream()
                .filter(Objects::nonNull)
                .map(item -> new ResumeAnalysisAiResult.ExperienceItem(
                        cleanText(item.organization()),
                        cleanText(item.role()),
                        cleanText(item.duration()),
                        cleanStringList(item.responsibilities())
                ))
                .filter(this::hasExperienceContent)
                .toList();
    }

    private List<ResumeAnalysisAiResult.ProjectItem> cleanProjects(List<ResumeAnalysisAiResult.ProjectItem> projects) {
        if (projects == null) {
            return Collections.emptyList();
        }

        return projects.stream()
                .filter(Objects::nonNull)
                .map(item -> new ResumeAnalysisAiResult.ProjectItem(
                        cleanText(item.name()),
                        cleanText(item.description()),
                        cleanStringList(item.technologies()),
                        cleanStringList(item.highlights())
                ))
                .filter(this::hasProjectContent)
                .toList();
    }

    private String cleanText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String cleaned = value.replace("\u0000", "").trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private boolean hasEducationContent(ResumeAnalysisAiResult.EducationItem item) {
        return item.institution() != null
                || item.qualification() != null
                || item.field() != null
                || item.startYear() != null
                || item.endYear() != null;
    }

    private boolean hasExperienceContent(ResumeAnalysisAiResult.ExperienceItem item) {
        return item.organization() != null
                || item.role() != null
                || item.duration() != null
                || !item.responsibilities().isEmpty();
    }

    private boolean hasProjectContent(ResumeAnalysisAiResult.ProjectItem item) {
        return item.name() != null
                || item.description() != null
                || !item.technologies().isEmpty()
                || !item.highlights().isEmpty();
    }

    private boolean isCompletelyEmpty(ResumeAnalysisAiResult result) {
        return result.summary() == null
                && result.atsScore() == null
                && result.skills().isEmpty()
                && result.education().isEmpty()
                && result.experience().isEmpty()
                && result.projects().isEmpty()
                && result.strengths().isEmpty()
                && result.weaknesses().isEmpty()
                && result.suggestions().isEmpty();
    }

    private AiAnalysisException unexpectedOutputException() {
        return new AiAnalysisException(
                UNEXPECTED_OUTPUT_MESSAGE,
                AiAnalysisException.FailureType.UNEXPECTED_OUTPUT
        );
    }
}
