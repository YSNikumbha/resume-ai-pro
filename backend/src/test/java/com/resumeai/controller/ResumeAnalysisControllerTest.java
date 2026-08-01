package com.resumeai.controller;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.resumeai.dto.response.ResumeAnalysisResponse;
import com.resumeai.entity.AnalysisStatus;
import com.resumeai.exception.AiConfigurationException;
import com.resumeai.exception.AnalysisNotFoundException;
import com.resumeai.security.JwtService;
import com.resumeai.service.ResumeAnalysisService;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ResumeAnalysisController.class)
class ResumeAnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ResumeAnalysisService resumeAnalysisService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(post("/api/analyses/resumes/10").with(csrf()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void ownedResumeAnalysisReturns201() throws Exception {
        when(resumeAnalysisService.analyzeResume(10L, "owner@example.com")).thenReturn(response());

        mockMvc.perform(post("/api/analyses/resumes/10").with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(100))
                .andExpect(jsonPath("$.resumeId").value(10))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void missingAiConfigurationReturns503() throws Exception {
        when(resumeAnalysisService.analyzeResume(10L, "owner@example.com"))
                .thenThrow(new AiConfigurationException(
                        "AI analysis is not configured. Please contact the administrator."
                ));

        mockMvc.perform(post("/api/analyses/resumes/10").with(csrf()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message")
                        .value("AI analysis is not configured. Please contact the administrator."));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void missingAnalysisReturns404() throws Exception {
        when(resumeAnalysisService.getAnalysis(999L, "owner@example.com"))
                .thenThrow(new AnalysisNotFoundException("Analysis not found."));

        mockMvc.perform(get("/api/analyses/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Analysis not found."));
    }

    private ResumeAnalysisResponse response() {
        return ResumeAnalysisResponse.builder()
                .id(100L)
                .resumeId(10L)
                .resumeFileName("resume.pdf")
                .summary("Strong resume.")
                .atsScore(82)
                .skills(List.of("Java", "React"))
                .education(List.of())
                .experience(List.of())
                .projects(List.of())
                .strengths(List.of("Clear skills"))
                .weaknesses(List.of("Needs metrics"))
                .suggestions(List.of("Add measurable impact"))
                .analyzedAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .modelName("gemini-2.5-flash")
                .status(AnalysisStatus.COMPLETED)
                .build();
    }
}
