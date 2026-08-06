package com.resumeai.controller;

import com.resumeai.dto.request.ResumeChatRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.ResumeChatResponse;
import com.resumeai.dto.response.ResumeIndexResponse;
import com.resumeai.service.ResumeChatService;
import com.resumeai.service.ResumeIndexingService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/rag/resumes")
public class ResumeRagController {

    private static final String DELETE_SUCCESS_MESSAGE = "Resume index deleted successfully.";

    private final ResumeIndexingService resumeIndexingService;
    private final ResumeChatService resumeChatService;

    @PostMapping(value = "/{resumeId}/index", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResumeIndexResponse> indexResume(
            @PathVariable Long resumeId,
            Principal principal
    ) {
        return ResponseEntity.ok(resumeIndexingService.indexResume(resumeId, principal.getName()));
    }

    @GetMapping(value = "/{resumeId}/index-status", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResumeIndexResponse> getIndexStatus(
            @PathVariable Long resumeId,
            Principal principal
    ) {
        return ResponseEntity.ok(resumeIndexingService.getIndexStatus(resumeId, principal.getName()));
    }

    @DeleteMapping(value = "/{resumeId}/index", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> deleteResumeIndex(
            @PathVariable Long resumeId,
            Principal principal
    ) {
        resumeIndexingService.deleteResumeIndex(resumeId, principal.getName());
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(DELETE_SUCCESS_MESSAGE)
                .build());
    }

    @PostMapping(
            value = "/{resumeId}/chat",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ResumeChatResponse> askResume(
            @PathVariable Long resumeId,
            @Valid @RequestBody ResumeChatRequest request,
            Principal principal
    ) {
        return ResponseEntity.ok(resumeChatService.ask(resumeId, request, principal.getName()));
    }

    @GetMapping(value = "/{resumeId}/chat-history", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ResumeChatResponse>> getChatHistory(
            @PathVariable Long resumeId,
            Principal principal
    ) {
        return ResponseEntity.ok(resumeChatService.getChatHistory(resumeId, principal.getName()));
    }
}
