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
public class ResumeIndexResponse {

    private Long resumeId;
    private String resumeFileName;
    private ResumeIndexStatus status;
    private Integer chunkCount;
    private LocalDateTime indexedAt;
    private String failureMessage;
}
