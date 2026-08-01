package com.resumeai.controller;

import com.resumeai.dto.response.ResumeAnalysisResponse;
import com.resumeai.service.ResumeAnalysisService;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/analyses")
public class ResumeAnalysisController {

    private final ResumeAnalysisService resumeAnalysisService;

    @PostMapping(value = "/resumes/{resumeId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResumeAnalysisResponse> analyzeResume(
            @PathVariable Long resumeId,
            Principal principal
    ) {
        ResumeAnalysisResponse response = resumeAnalysisService.analyzeResume(resumeId, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping(value = "/{analysisId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResumeAnalysisResponse> getAnalysis(
            @PathVariable Long analysisId,
            Principal principal
    ) {
        return ResponseEntity.ok(resumeAnalysisService.getAnalysis(analysisId, principal.getName()));
    }

    @GetMapping(value = "/resumes/{resumeId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ResumeAnalysisResponse>> getResumeAnalyses(
            @PathVariable Long resumeId,
            Principal principal
    ) {
        return ResponseEntity.ok(resumeAnalysisService.getResumeAnalyses(resumeId, principal.getName()));
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ResumeAnalysisResponse>> getCurrentUserAnalyses(Principal principal) {
        return ResponseEntity.ok(resumeAnalysisService.getCurrentUserAnalyses(principal.getName()));
    }
}
