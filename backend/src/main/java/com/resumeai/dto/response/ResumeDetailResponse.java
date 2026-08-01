package com.resumeai.dto.response;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeDetailResponse {

    private Long id;

    private String originalFileName;

    private String contentType;

    private Long fileSize;

    private LocalDateTime uploadedAt;

    private LocalDateTime updatedAt;

    private String extractedText;
}
