package com.resumeai.dto.response;

import com.resumeai.entity.ResumeIndexStatus;
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
public class ResumeResponse {

    private Long id;

    private String originalFileName;

    private String contentType;

    private Long fileSize;

    private LocalDateTime uploadedAt;

    private LocalDateTime updatedAt;

    private ResumeIndexStatus indexStatus;

    private LocalDateTime indexedAt;

    private Integer indexedChunkCount;

    private String indexingFailureMessage;

    private String extractedTextPreview;
}
