package com.resumeai.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.config.AiProperties;
import com.resumeai.config.RagProperties;
import com.resumeai.dto.request.ResumeChatRequest;
import com.resumeai.dto.response.ResumeChatResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeChatMessage;
import com.resumeai.entity.ResumeIndexStatus;
import com.resumeai.entity.User;
import com.resumeai.entity.UserRole;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeNotIndexedException;
import com.resumeai.repository.ResumeChatMessageRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.ResumeRetrievalService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.document.Document;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ResumeChatServiceImplTest {

    private static final String EMAIL = "owner@example.com";

    @Mock
    private UserRepository userRepository;

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private ResumeChatMessageRepository chatMessageRepository;

    @Mock
    private ResumeRetrievalService retrievalService;

    @Mock
    private ObjectProvider<ChatClient> chatClientProvider;

    @Mock
    private ChatClient chatClient;

    @Mock
    private ChatClient.ChatClientRequestSpec requestSpec;

    @Mock
    private ChatClient.CallResponseSpec responseSpec;

    private ResumeChatServiceImpl chatService;

    @BeforeEach
    void setUp() {
        AiProperties aiProperties = new AiProperties();
        aiProperties.setModel("gemini-3.6-flash");
        RagProperties ragProperties = new RagProperties();
        ragProperties.setSourceExcerptLength(120);

        chatService = new ResumeChatServiceImpl(
                userRepository,
                resumeRepository,
                chatMessageRepository,
                retrievalService,
                chatClientProvider,
                new ObjectMapper(),
                aiProperties,
                ragProperties
        );
        ReflectionTestUtils.setField(chatService, "apiKey", "test-key");
        ReflectionTestUtils.setField(chatService, "promptTemplateResource",
                new ClassPathResource("prompts/resume-rag-prompt.st"));
    }

    @Test
    void indexedResumeCanBeQueried() {
        mockOwnedResume(ResumeIndexStatus.INDEXED);
        mockRetrieval(List.of(document()));
        mockChat("Java and Spring Boot are mentioned [Source 1].");
        mockHistorySave();

        ResumeChatResponse response = chatService.ask(10L, request("What skills are mentioned?"), EMAIL);

        assertThat(response.getAnswer()).contains("Java");
        assertThat(response.getInsufficientContext()).isFalse();
        assertThat(response.getSources()).hasSize(1);
    }

    @Test
    void nonIndexedResumeReturnsConflict() {
        mockOwnedResume(ResumeIndexStatus.NOT_INDEXED);

        assertThatThrownBy(() -> chatService.ask(10L, request("What skills are mentioned?"), EMAIL))
                .isInstanceOf(ResumeNotIndexedException.class);

        verifyNoInteractions(retrievalService);
    }

    @Test
    void emptyRetrievalDoesNotCallGemini() {
        mockOwnedResume(ResumeIndexStatus.INDEXED);
        mockRetrieval(List.of());
        mockHistorySave();

        ResumeChatResponse response = chatService.ask(10L, request("What skills are mentioned?"), EMAIL);

        assertThat(response.getInsufficientContext()).isTrue();
        assertThat(response.getAnswer()).contains("could not find enough information");
        verifyNoInteractions(chatClient);
    }

    @Test
    void sourcesReturnedWithAnswer() {
        mockOwnedResume(ResumeIndexStatus.INDEXED);
        mockRetrieval(List.of(document()));
        mockChat("The resume mentions APIs [Source 1].");
        mockHistorySave();

        ResumeChatResponse response = chatService.ask(10L, request("Summarize my experience."), EMAIL);

        assertThat(response.getSources().getFirst().getChunkIndex()).isEqualTo(0);
        assertThat(response.getSources().getFirst().getSectionName()).isEqualTo("EXPERIENCE");
        assertThat(response.getSources().getFirst().getSimilarityScore()).isEqualTo(0.91);
    }

    @Test
    void anotherUsersResumeCannotBeQueried() {
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> chatService.ask(10L, request("What skills are mentioned?"), EMAIL))
                .isInstanceOf(ResumeNotFoundException.class);

        verify(retrievalService, never()).retrieve(any(), any(), anyString());
    }

    private void mockOwnedResume(ResumeIndexStatus status) {
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(resume(user, status)));
    }

    private void mockRetrieval(List<Document> documents) {
        when(retrievalService.retrieve(eq(1L), eq(10L), anyString())).thenReturn(documents);
    }

    private void mockChat(String answer) {
        when(chatClientProvider.getIfAvailable()).thenReturn(chatClient);
        when(chatClient.prompt(anyString())).thenReturn(requestSpec);
        when(requestSpec.options(any(ChatOptions.class))).thenReturn(requestSpec);
        when(requestSpec.call()).thenReturn(responseSpec);
        when(responseSpec.content()).thenReturn(answer);
    }

    private void mockHistorySave() {
        when(chatMessageRepository.save(any(ResumeChatMessage.class))).thenAnswer(invocation -> {
            ResumeChatMessage message = invocation.getArgument(0);
            message.setId(500L);
            message.setCreatedAt(LocalDateTime.now());
            return message;
        });
    }

    private ResumeChatRequest request(String question) {
        ResumeChatRequest request = new ResumeChatRequest();
        request.setQuestion(question);
        return request;
    }

    private Document document() {
        return Document.builder()
                .text("Built Spring Boot REST APIs and React workflows.")
                .metadata(Map.of(
                        "chunkIndex", 0,
                        "sectionName", "EXPERIENCE",
                        "userId", "1",
                        "resumeId", "10"
                ))
                .score(0.91)
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

    private Resume resume(User user, ResumeIndexStatus status) {
        return Resume.builder()
                .id(10L)
                .user(user)
                .originalFileName("resume.pdf")
                .storedFileName("stored.pdf")
                .filePath("uploads/resumes/stored.pdf")
                .contentType("application/pdf")
                .fileSize(1024L)
                .extractedText("Java resume")
                .indexStatus(status)
                .indexedChunkCount(status == ResumeIndexStatus.INDEXED ? 2 : 0)
                .build();
    }
}
