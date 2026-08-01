package com.resumeai.controller;

import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.ResumeDetailResponse;
import com.resumeai.dto.response.ResumeResponse;
import com.resumeai.service.ResumeService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/resumes")
public class ResumeController {

    private static final String DELETE_SUCCESS_MESSAGE = "Resume deleted successfully.";

    private final ResumeService resumeService;

    @PostMapping(
            value = "/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ResumeDetailResponse> uploadResume(
            @RequestPart("file") MultipartFile file,
            Principal principal
    ) {
        ResumeDetailResponse response = resumeService.uploadResume(file, principal.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<ResumeResponse>> getCurrentUserResumes(Principal principal) {
        return ResponseEntity.ok(resumeService.getCurrentUserResumes(principal.getName()));
    }

    @GetMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ResumeDetailResponse> getResume(
            @PathVariable Long id,
            Principal principal
    ) {
        return ResponseEntity.ok(resumeService.getResume(id, principal.getName()));
    }

    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse> deleteResume(
            @PathVariable Long id,
            Principal principal
    ) {
        resumeService.deleteResume(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.builder()
                .success(true)
                .message(DELETE_SUCCESS_MESSAGE)
                .build());
    }
}
