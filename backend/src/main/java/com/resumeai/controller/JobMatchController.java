package com.resumeai.controller;

import com.resumeai.dto.request.JobMatchRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.JobMatchResponse;
import com.resumeai.service.JobMatchService;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/job-matches")
public class JobMatchController {

    private static final String DELETE_SUCCESS_MESSAGE = "Job match deleted successfully.";

    private final JobMatchService jobMatchService;

    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<JobMatchResponse> createMatch(
            @Valid @RequestBody JobMatchRequest request,
            Principal principal
    ) {
        JobMatchResponse response = jobMatchService.createMatch(request, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<JobMatchResponse>> getCurrentUserMatches(Principal principal) {
        return ResponseEntity.ok(jobMatchService.getCurrentUserMatches(principal.getName()));
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<JobMatchResponse> getMatch(@PathVariable Long id, Principal principal) {
        return ResponseEntity.ok(jobMatchService.getMatch(id, principal.getName()));
    }

    @GetMapping(value = "/resumes/{resumeId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<JobMatchResponse>> getResumeMatches(
            @PathVariable Long resumeId,
            Principal principal
    ) {
        return ResponseEntity.ok(jobMatchService.getResumeMatches(resumeId, principal.getName()));
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> deleteMatch(@PathVariable Long id, Principal principal) {
        jobMatchService.deleteMatch(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(DELETE_SUCCESS_MESSAGE)
                .build());
    }
}
