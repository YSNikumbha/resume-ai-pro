package com.resumeai.controller;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.resumeai.dto.response.ResumeChatResponse;
import com.resumeai.dto.response.ResumeIndexResponse;
import com.resumeai.entity.ResumeIndexStatus;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeNotIndexedException;
import com.resumeai.security.JwtService;
import com.resumeai.service.ResumeChatService;
import com.resumeai.service.ResumeIndexingService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ResumeRagController.class)
class ResumeRagControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ResumeIndexingService resumeIndexingService;

    @MockitoBean
    private ResumeChatService resumeChatService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @Test
    void unauthenticatedRagRequestReturns401() throws Exception {
        mockMvc.perform(post("/api/rag/resumes/10/chat")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"What skills are mentioned?\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void validIndexRequestReturns200() throws Exception {
        when(resumeIndexingService.indexResume(10L, "owner@example.com")).thenReturn(indexResponse());

        mockMvc.perform(post("/api/rag/resumes/10/index").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeId").value(10))
                .andExpect(jsonPath("$.status").value("INDEXED"))
                .andExpect(jsonPath("$.chunkCount").value(3));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void validChatRequestReturns200() throws Exception {
        when(resumeChatService.ask(
                org.mockito.ArgumentMatchers.eq(10L),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.eq("owner@example.com")
        )).thenReturn(chatResponse());

        mockMvc.perform(post("/api/rag/resumes/10/chat")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"What skills are mentioned?\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resumeId").value(10))
                .andExpect(jsonPath("$.answer").value("Java is mentioned [Source 1]."));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void invalidChatRequestReturns400() throws Exception {
        mockMvc.perform(post("/api/rag/resumes/10/chat")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void anotherUsersResumeReturns404() throws Exception {
        when(resumeIndexingService.getIndexStatus(99L, "owner@example.com"))
                .thenThrow(new ResumeNotFoundException("Resume not found."));

        mockMvc.perform(get("/api/rag/resumes/99/index-status"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Resume not found."));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void nonIndexedResumeReturns409() throws Exception {
        when(resumeChatService.ask(
                org.mockito.ArgumentMatchers.eq(10L),
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.eq("owner@example.com")
        )).thenThrow(new ResumeNotIndexedException("Resume is not indexed for chat."));

        mockMvc.perform(post("/api/rag/resumes/10/chat")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"question\":\"What skills are mentioned?\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void chatHistoryIsScopedByOwnedResume() throws Exception {
        when(resumeChatService.getChatHistory(10L, "owner@example.com"))
                .thenReturn(List.of(chatResponse()));

        mockMvc.perform(get("/api/rag/resumes/10/chat-history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].resumeId").value(10));
    }

    private ResumeIndexResponse indexResponse() {
        return ResumeIndexResponse.builder()
                .resumeId(10L)
                .resumeFileName("resume.pdf")
                .status(ResumeIndexStatus.INDEXED)
                .chunkCount(3)
                .indexedAt(LocalDateTime.now())
                .build();
    }

    private ResumeChatResponse chatResponse() {
        return ResumeChatResponse.builder()
                .id(500L)
                .resumeId(10L)
                .resumeFileName("resume.pdf")
                .question("What skills are mentioned?")
                .answer("Java is mentioned [Source 1].")
                .sources(List.of())
                .modelName("gemini-3.5-flash")
                .createdAt(LocalDateTime.now())
                .insufficientContext(false)
                .build();
    }
}
