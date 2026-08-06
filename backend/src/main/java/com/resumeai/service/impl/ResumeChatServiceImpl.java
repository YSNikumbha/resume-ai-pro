package com.resumeai.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.config.AiProperties;
import com.resumeai.config.RagProperties;
import com.resumeai.dto.request.ResumeChatRequest;
import com.resumeai.dto.response.ResumeChatResponse;
import com.resumeai.dto.response.ResumeChatSource;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeChatMessage;
import com.resumeai.entity.ResumeIndexStatus;
import com.resumeai.entity.User;
import com.resumeai.exception.AiConfigurationException;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.exception.ResumeChatException;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeNotIndexedException;
import com.resumeai.rag.RagMetadata;
import com.resumeai.repository.ResumeChatMessageRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.ResumeChatService;
import com.resumeai.service.ResumeRetrievalService;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.google.genai.GoogleGenAiChatOptions;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeChatServiceImpl implements ResumeChatService {

    private static final String USER_NOT_FOUND_MESSAGE = "User not found.";
    private static final String RESUME_NOT_FOUND_MESSAGE = "Resume not found.";
    private static final String RESUME_NOT_INDEXED_MESSAGE = "Resume is not indexed for chat.";
    private static final String MISSING_CONFIGURATION_MESSAGE =
            "AI analysis is not configured. Please contact the administrator.";
    private static final String PROVIDER_UNAVAILABLE_MESSAGE =
            "Resume chat provider is temporarily unavailable. Please try again later.";
    private static final String UNEXPECTED_OUTPUT_MESSAGE =
            "Resume chat returned an unexpected response. Please try again later.";
    private static final String INSUFFICIENT_CONTEXT_ANSWER =
            "I could not find enough information in this resume to answer that question.";

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeChatMessageRepository chatMessageRepository;
    private final ResumeRetrievalService retrievalService;
    private final ObjectProvider<ChatClient> chatClientProvider;
    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;
    private final RagProperties ragProperties;

    @Value("${spring.ai.google.genai.api-key:}")
    private String apiKey;

    @Value("classpath:/prompts/resume-rag-prompt.st")
    private Resource promptTemplateResource;

    @Override
    public ResumeChatResponse ask(Long resumeId, ResumeChatRequest request, String authenticatedEmail) {
        long startedAt = System.currentTimeMillis();
        User user = getUser(authenticatedEmail);
        Resume resume = getOwnedResume(resumeId, user.getId());

        if (resume.getIndexStatus() != ResumeIndexStatus.INDEXED) {
            throw new ResumeNotIndexedException(RESUME_NOT_INDEXED_MESSAGE);
        }

        String question = cleanQuestion(request.getQuestion());
        List<Document> documents = retrievalService.retrieve(user.getId(), resume.getId(), question);
        List<ResumeChatSource> sources = toSources(documents);

        if (documents.isEmpty()) {
            ResumeChatResponse response = saveAndBuildResponse(
                    user,
                    resume,
                    question,
                    INSUFFICIENT_CONTEXT_ANSWER,
                    sources,
                    true
            );
            log.info("Resume chat returned insufficient context for resumeId={} userId={} durationMs={}.",
                    resume.getId(), user.getId(), elapsedMillis(startedAt));
            return response;
        }

        ensureConfigured();

        try {
            String prompt = buildPrompt(question, documents);
            String answer = chatClientProvider.getIfAvailable()
                    .prompt(prompt)
                    .options(GoogleGenAiChatOptions.builder()
                            .model(aiProperties.getModel())
                            .temperature(aiProperties.getTemperature())
                            .responseMimeType("text/plain")
                            .googleSearchRetrieval(false)
                            .internalToolExecutionEnabled(false)
                            .build())
                    .call()
                    .content();
            String cleanAnswer = cleanAnswer(answer);

            ResumeChatResponse response = saveAndBuildResponse(user, resume, question, cleanAnswer, sources, false);
            log.info("Resume chat answered for resumeId={} userId={} sources={} durationMs={}.",
                    resume.getId(), user.getId(), sources.size(), elapsedMillis(startedAt));
            return response;
        } catch (ResumeChatException | AiConfigurationException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            log.warn("Resume chat provider call failed for resumeId={} userId={} errorType={}.",
                    resume.getId(), user.getId(), exception.getClass().getSimpleName());
            throw new ResumeChatException(
                    PROVIDER_UNAVAILABLE_MESSAGE,
                    ResumeChatException.FailureType.PROVIDER_UNAVAILABLE,
                    exception
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeChatResponse> getChatHistory(Long resumeId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        Resume resume = getOwnedResume(resumeId, user.getId());

        return chatMessageRepository.findAllByResumeIdAndUserIdOrderByCreatedAtDesc(resume.getId(), user.getId())
                .stream()
                .map(message -> toResponse(message, resume))
                .toList();
    }

    private String cleanQuestion(String question) {
        if (!StringUtils.hasText(question)) {
            throw new IllegalArgumentException("Question is required.");
        }

        String cleaned = question.replace("\u0000", "").trim();
        if (cleaned.length() < 3 || cleaned.length() > ragProperties.getMaxQuestionLength()) {
            throw new IllegalArgumentException(
                    "Question must be between 3 and " + ragProperties.getMaxQuestionLength() + " characters."
            );
        }
        return cleaned;
    }

    private void ensureConfigured() {
        if (!StringUtils.hasText(apiKey) || chatClientProvider.getIfAvailable() == null) {
            throw new AiConfigurationException(MISSING_CONFIGURATION_MESSAGE);
        }
    }

    private String buildPrompt(String question, List<Document> documents) {
        PromptTemplate promptTemplate = new PromptTemplate(promptTemplateResource);
        return promptTemplate.render(Map.of(
                "question", question,
                "context", buildContext(documents)
        ));
    }

    private String buildContext(List<Document> documents) {
        StringBuilder context = new StringBuilder();
        for (int index = 0; index < documents.size(); index++) {
            Document document = documents.get(index);
            context.append("[Source ").append(index + 1).append("]\n")
                    .append("Section: ").append(metadataString(document, RagMetadata.SECTION_NAME, "GENERAL")).append("\n")
                    .append("Content: ").append(document.getText()).append("\n\n");
        }
        return context.toString().trim();
    }

    private String cleanAnswer(String answer) {
        if (!StringUtils.hasText(answer)) {
            throw new ResumeChatException(
                    UNEXPECTED_OUTPUT_MESSAGE,
                    ResumeChatException.FailureType.UNEXPECTED_OUTPUT
            );
        }

        return answer.replace("\u0000", "").trim();
    }

    private List<ResumeChatSource> toSources(List<Document> documents) {
        List<ResumeChatSource> sources = new ArrayList<>();
        for (Document document : documents) {
            sources.add(ResumeChatSource.builder()
                    .chunkIndex(metadataInteger(document, RagMetadata.CHUNK_INDEX))
                    .sectionName(metadataString(document, RagMetadata.SECTION_NAME, "GENERAL"))
                    .excerpt(excerpt(document.getText()))
                    .similarityScore(document.getScore())
                    .build());
        }
        return List.copyOf(sources);
    }

    private ResumeChatResponse saveAndBuildResponse(
            User user,
            Resume resume,
            String question,
            String answer,
            List<ResumeChatSource> sources,
            boolean insufficientContext
    ) {
        ResumeChatMessage message = ResumeChatMessage.builder()
                .user(user)
                .resume(resume)
                .question(question)
                .answer(answer)
                .sourcesJson(writeSources(sources))
                .insufficientContext(insufficientContext)
                .modelName(aiProperties.getModel())
                .build();

        return toResponse(chatMessageRepository.save(message), resume);
    }

    private ResumeChatResponse toResponse(ResumeChatMessage message, Resume resume) {
        return ResumeChatResponse.builder()
                .id(message.getId())
                .resumeId(resume.getId())
                .resumeFileName(resume.getOriginalFileName())
                .question(message.getQuestion())
                .answer(message.getAnswer())
                .sources(readSources(message.getSourcesJson()))
                .modelName(message.getModelName())
                .createdAt(message.getCreatedAt() == null ? LocalDateTime.now() : message.getCreatedAt())
                .insufficientContext(Boolean.TRUE.equals(message.getInsufficientContext()))
                .build();
    }

    private String writeSources(List<ResumeChatSource> sources) {
        try {
            return objectMapper.writeValueAsString(sources == null ? List.of() : sources);
        } catch (JsonProcessingException exception) {
            throw new ResumeChatException(
                    UNEXPECTED_OUTPUT_MESSAGE,
                    ResumeChatException.FailureType.UNEXPECTED_OUTPUT,
                    exception
            );
        }
    }

    private List<ResumeChatSource> readSources(String sourcesJson) {
        if (!StringUtils.hasText(sourcesJson)) {
            return List.of();
        }

        try {
            List<ResumeChatSource> sources = objectMapper.readValue(
                    sourcesJson,
                    new TypeReference<List<ResumeChatSource>>() {
                    }
            );
            return sources == null ? List.of() : sources;
        } catch (JsonProcessingException exception) {
            log.warn("Malformed stored resume chat sources JSON encountered.");
            return List.of();
        }
    }

    private String excerpt(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }

        String cleaned = text.replaceAll("\\s+", " ").trim();
        int maxLength = ragProperties.getSourceExcerptLength();
        return cleaned.length() <= maxLength
                ? cleaned
                : cleaned.substring(0, maxLength).trim() + "...";
    }

    private String metadataString(Document document, String key, String fallback) {
        Object value = document.getMetadata().get(key);
        return value == null ? fallback : String.valueOf(value);
    }

    private Integer metadataInteger(Document document, String key) {
        Object value = document.getMetadata().get(key);
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value != null) {
            try {
                return Integer.parseInt(String.valueOf(value));
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_MESSAGE));
    }

    private Resume getOwnedResume(Long resumeId, Long userId) {
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResumeNotFoundException(RESUME_NOT_FOUND_MESSAGE));
    }

    private long elapsedMillis(long startedAt) {
        return System.currentTimeMillis() - startedAt;
    }
}
