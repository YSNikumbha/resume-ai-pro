package com.resumeai.controller;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.resumeai.dto.response.JobMatchResponse;
import com.resumeai.entity.JobMatchStatus;
import com.resumeai.exception.JobMatchNotFoundException;
import com.resumeai.security.JwtService;
import com.resumeai.service.JobMatchService;
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

@WebMvcTest(JobMatchController.class)
class JobMatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobMatchService jobMatchService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(post("/api/job-matches")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void validCreateRequestReturns201() throws Exception {
        when(jobMatchService.createMatch(org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.eq(
                "owner@example.com"
        ))).thenReturn(response());

        mockMvc.perform(post("/api/job-matches")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequestJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(300))
                .andExpect(jsonPath("$.resumeId").value(10))
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.matchedSkills[0]").value("Java"));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void invalidRequestReturns400() throws Exception {
        String invalidJson = """
                {
                  "resumeId": 10,
                  "title": "",
                  "description": "too short"
                }
                """;

        mockMvc.perform(post("/api/job-matches")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void missingMatchReturns404() throws Exception {
        when(jobMatchService.getMatch(999L, "owner@example.com"))
                .thenThrow(new JobMatchNotFoundException("Job match not found."));

        mockMvc.perform(get("/api/job-matches/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Job match not found."));
    }

    @Test
    @WithMockUser(username = "owner@example.com")
    void anotherUsersMatchReturns404() throws Exception {
        when(jobMatchService.getMatch(300L, "owner@example.com"))
                .thenThrow(new JobMatchNotFoundException("Job match not found."));

        mockMvc.perform(get("/api/job-matches/300"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Job match not found."));
    }

    private String validRequestJson() {
        return """
                {
                  "resumeId": 10,
                  "title": "Senior Java Developer",
                  "companyName": "Acme",
                  "description": "We need a Java developer with Spring Boot, React, PostgreSQL, REST APIs, and cloud deployment experience."
                }
                """;
    }

    private JobMatchResponse response() {
        LocalDateTime now = LocalDateTime.now();
        return JobMatchResponse.builder()
                .id(300L)
                .resumeId(10L)
                .resumeFileName("resume.pdf")
                .jobDescriptionId(200L)
                .jobTitle("Senior Java Developer")
                .companyName("Acme")
                .matchScore(78)
                .summary("Good match.")
                .matchedSkills(List.of("Java", "Spring Boot"))
                .missingSkills(List.of("Kubernetes"))
                .experienceMatch(new JobMatchResponse.MatchSection(82, "STRONG", "Relevant experience."))
                .educationMatch(new JobMatchResponse.MatchSection(64, "PARTIAL", "Related education."))
                .strengths(List.of("Backend APIs"))
                .gaps(List.of("Cloud examples"))
                .recommendations(List.of("Add deployment impact"))
                .keywordSuggestions(List.of("REST APIs"))
                .status(JobMatchStatus.COMPLETED)
                .modelName("gemini-3.5-flash")
                .createdAt(now)
                .updatedAt(now)
                .build();
    }
}
