package com.resumeai.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.resumeai.config.RagProperties;
import com.resumeai.dto.rag.ResumeChunk;
import com.resumeai.exception.ResumeTextUnavailableException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ResumeChunkingServiceImplTest {

    private ResumeChunkingServiceImpl chunkingService;

    @BeforeEach
    void setUp() {
        RagProperties ragProperties = new RagProperties();
        ragProperties.setChunkSize(140);
        ragProperties.setChunkOverlap(30);
        chunkingService = new ResumeChunkingServiceImpl(ragProperties);
    }

    @Test
    void blankTextRejected() {
        assertThatThrownBy(() -> chunkingService.chunk(" "))
                .isInstanceOf(ResumeTextUnavailableException.class);
    }

    @Test
    void normalTextCreatesChunks() {
        List<ResumeChunk> chunks = chunkingService.chunk("SUMMARY\nJava developer with React and Spring Boot experience.");

        assertThat(chunks).hasSize(1);
        assertThat(chunks.getFirst().content()).contains("Java developer");
    }

    @Test
    void longTextCreatesMultipleChunks() {
        List<ResumeChunk> chunks = chunkingService.chunk(longResumeText());

        assertThat(chunks).hasSizeGreaterThan(1);
    }

    @Test
    void chunkIndexesAreSequential() {
        List<ResumeChunk> chunks = chunkingService.chunk(longResumeText());

        assertThat(chunks).extracting(ResumeChunk::chunkIndex)
                .containsExactlyElementsOf(java.util.stream.IntStream.range(0, chunks.size()).boxed().toList());
    }

    @Test
    void overlapIsApplied() {
        List<ResumeChunk> chunks = chunkingService.chunk(singleLongSectionText());

        assertThat(chunks).hasSizeGreaterThan(1);
        assertThat(chunks.get(1).startCharacter()).isLessThan(chunks.getFirst().endCharacter());
    }

    @Test
    void noEmptyChunksCreated() {
        List<ResumeChunk> chunks = chunkingService.chunk(longResumeText());

        assertThat(chunks).allSatisfy(chunk -> assertThat(chunk.content()).isNotBlank());
    }

    @Test
    void sectionHeadingsAreDetected() {
        List<ResumeChunk> chunks = chunkingService.chunk("""
                SUMMARY
                Backend developer.

                SKILLS
                Java Spring Boot React PostgreSQL Docker Kubernetes AWS REST APIs.
                """);

        assertThat(chunks).extracting(ResumeChunk::sectionName)
                .contains("SUMMARY", "SKILLS");
    }

    private String longResumeText() {
        return """
                SUMMARY
                Java backend developer with React frontend experience and PostgreSQL database work.

                EXPERIENCE
                Built Spring Boot REST APIs for resume uploads and analysis workflows. Improved authentication, PDF text extraction, dashboard reporting, job matching, and production readiness. Added measurable improvements across validation, security, and frontend usability.

                PROJECTS
                ResumeAI Pro uses Java, Spring Boot, React, PostgreSQL, JWT, and Gemini integration. The project includes upload history, details, AI analysis, ATS scoring, job matching, and structured responses.
                """;
    }

    private String singleLongSectionText() {
        return "EXPERIENCE\n" + "Built Java Spring Boot APIs with React workflows and PostgreSQL persistence. ".repeat(10);
    }
}
