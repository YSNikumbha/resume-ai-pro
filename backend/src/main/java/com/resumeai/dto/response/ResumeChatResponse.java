package com.resumeai.dto.response;

import java.time.LocalDateTime;
import java.util.List;
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
public class ResumeChatResponse {

    private Long id;
    private Long resumeId;
    private String resumeFileName;
    private String question;
    private String answer;
    private List<ResumeChatSource> sources;
    private String modelName;
    private LocalDateTime createdAt;
    private Boolean insufficientContext;
}
