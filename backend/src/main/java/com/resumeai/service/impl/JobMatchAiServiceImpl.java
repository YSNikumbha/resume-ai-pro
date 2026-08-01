package com.resumeai.service.impl;

import com.resumeai.config.AiProperties;
import com.resumeai.dto.ai.JobMatchAiResult;
import com.resumeai.exception.AiConfigurationException;
import com.resumeai.exception.JobDescriptionValidationException;
import com.resumeai.exception.JobMatchAiException;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.service.JobMatchAiService;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
public class JobMatchAiServiceImpl implements JobMatchAiService {

    private static final Set<String> ALLOWED_SECTION_STATUSES =
            Set.of("STRONG", "PARTIAL", "WEAK", "NOT_FOUND");
    private static final String MISSING_CONFIGURATION_MESSAGE =
            "AI analysis is not configured. Please contact the administrator.";
    private static final String PROVIDER_UNAVAILABLE_MESSAGE =
            "AI job matching provider is temporarily unavailable. Please try again later.";
    private static final String UNEXPECTED_OUTPUT_MESSAGE =
            "AI job matching returned an unexpected response. Please try again later.";
    private static final String BLANK_RESUME_MESSAGE = "Resume text is unavailable for job matching.";
    private static final String BLANK_JOB_DESCRIPTION_MESSAGE = "Job description is required for matching.";

    private final ObjectProvider<ChatClient> chatClientProvider;
    private final AiProperties aiProperties;
    private final String apiKey;
    private final Resource promptTemplateResource;

    public JobMatchAiServiceImpl(
            ObjectProvider<ChatClient> chatClientProvider,
            AiProperties aiProperties,
            @Value("${spring.ai.google.genai.api-key:}") String apiKey,
            @Value("classpath:/prompts/job-match-prompt.st") Resource promptTemplateResource
    ) {
        this.chatClientProvider = chatClientProvider;
        this.aiProperties = aiProperties;
        this.apiKey = apiKey;
        this.promptTemplateResource = promptTemplateResource;
    }

    @Override
    public JobMatchAiResult match(String resumeText, String jobDescription) {
        if (!StringUtils.hasText(resumeText)) {
            throw new ResumeTextUnavailableException(BLANK_RESUME_MESSAGE);
        }

        if (!StringUtils.hasText(jobDescription)) {
            throw new JobDescriptionValidationException(BLANK_JOB_DESCRIPTION_MESSAGE);
        }

        ensureConfigured();

        try {
            LimitedInput input = limitInput(resumeText, jobDescription);
            String prompt = buildPrompt(input.resumeText(), input.jobDescription());
            JobMatchAiResult result = getChatClient()
                    .prompt(prompt)
                    .options(ChatOptions.builder()
                            .model(aiProperties.getModel())
                            .temperature(aiProperties.getTemperature())
                            .build())
                    .call()
                    .entity(JobMatchAiResult.class);

            return normalizeAndValidate(result);
        } catch (AiConfigurationException
                 | ResumeTextUnavailableException
                 | JobDescriptionValidationException
                 | JobMatchAiException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.warn("AI job-match provider call failed: {}", exception.getClass().getSimpleName());
            throw new JobMatchAiException(
                    PROVIDER_UNAVAILABLE_MESSAGE,
                    JobMatchAiException.FailureType.PROVIDER_UNAVAILABLE,
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

    private LimitedInput limitInput(String resumeText, String jobDescription) {
        String limitedResume = limitText(resumeText.trim(), aiProperties.getMaxResumeCharacters());
        String limitedJobDescription = limitText(
                jobDescription.trim(),
                aiProperties.getMaxJobDescriptionCharacters()
        );

        int maxTotalCharacters = aiProperties.getMaxJobMatchInputCharacters();
        if (limitedResume.length() + limitedJobDescription.length() <= maxTotalCharacters) {
            return new LimitedInput(limitedResume, limitedJobDescription);
        }

        int jobLimit = Math.min(limitedJobDescription.length(), maxTotalCharacters / 2);
        int resumeLimit = Math.min(limitedResume.length(), maxTotalCharacters - jobLimit);
        int remaining = maxTotalCharacters - resumeLimit - jobLimit;

        if (remaining > 0 && jobLimit < limitedJobDescription.length()) {
            int additionalJobCharacters = Math.min(remaining, limitedJobDescription.length() - jobLimit);
            jobLimit += additionalJobCharacters;
            remaining -= additionalJobCharacters;
        }

        if (remaining > 0 && resumeLimit < limitedResume.length()) {
            resumeLimit += Math.min(remaining, limitedResume.length() - resumeLimit);
        }

        return new LimitedInput(
                limitedResume.substring(0, resumeLimit),
                limitedJobDescription.substring(0, jobLimit)
        );
    }

    private String limitText(String text, int maxCharacters) {
        return text.length() <= maxCharacters ? text : text.substring(0, maxCharacters);
    }

    private String buildPrompt(String resumeText, String jobDescription) {
        BeanOutputConverter<JobMatchAiResult> outputConverter =
                new BeanOutputConverter<>(JobMatchAiResult.class);
        PromptTemplate promptTemplate = new PromptTemplate(promptTemplateResource);

        return promptTemplate.render(Map.of(
                "resumeText", resumeText,
                "jobDescription", jobDescription,
                "format", outputConverter.getFormat()
        ));
    }

    private JobMatchAiResult normalizeAndValidate(JobMatchAiResult result) {
        if (result == null) {
            throw unexpectedOutputException();
        }

        JobMatchAiResult normalized = new JobMatchAiResult(
                normalizeScore(result.matchScore()),
                cleanText(result.summary()),
                cleanStringList(result.matchedSkills()),
                cleanStringList(result.missingSkills()),
                cleanSection(result.experienceMatch()),
                cleanSection(result.educationMatch()),
                cleanStringList(result.strengths()),
                cleanStringList(result.gaps()),
                cleanStringList(result.recommendations()),
                cleanStringList(result.keywordSuggestions())
        );

        if (isCompletelyEmpty(normalized)) {
            throw unexpectedOutputException();
        }

        return normalized;
    }

    private Integer normalizeScore(Integer score) {
        if (score == null) {
            return null;
        }

        return Math.max(0, Math.min(100, score));
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

    private JobMatchAiResult.MatchSection cleanSection(JobMatchAiResult.MatchSection section) {
        if (section == null) {
            return notFoundSection();
        }

        String status = cleanText(section.status());
        String normalizedStatus = status == null ? "NOT_FOUND" : status.toUpperCase();
        if (!ALLOWED_SECTION_STATUSES.contains(normalizedStatus)) {
            normalizedStatus = "NOT_FOUND";
        }

        return new JobMatchAiResult.MatchSection(
                normalizeScore(section.score()),
                normalizedStatus,
                cleanText(section.explanation())
        );
    }

    private JobMatchAiResult.MatchSection notFoundSection() {
        return new JobMatchAiResult.MatchSection(null, "NOT_FOUND", null);
    }

    private String cleanText(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        String cleaned = value.replace("\u0000", "").trim();
        return cleaned.isBlank() ? null : cleaned;
    }

    private boolean isCompletelyEmpty(JobMatchAiResult result) {
        return result.matchScore() == null
                && result.summary() == null
                && result.matchedSkills().isEmpty()
                && result.missingSkills().isEmpty()
                && !hasSectionContent(result.experienceMatch())
                && !hasSectionContent(result.educationMatch())
                && result.strengths().isEmpty()
                && result.gaps().isEmpty()
                && result.recommendations().isEmpty()
                && result.keywordSuggestions().isEmpty();
    }

    private boolean hasSectionContent(JobMatchAiResult.MatchSection section) {
        if (section == null) {
            return false;
        }

        return section.score() != null
                || section.explanation() != null
                || ("STRONG".equals(section.status())
                || "PARTIAL".equals(section.status())
                || "WEAK".equals(section.status()));
    }

    private JobMatchAiException unexpectedOutputException() {
        return new JobMatchAiException(
                UNEXPECTED_OUTPUT_MESSAGE,
                JobMatchAiException.FailureType.UNEXPECTED_OUTPUT
        );
    }

    private record LimitedInput(String resumeText, String jobDescription) {
    }
}
