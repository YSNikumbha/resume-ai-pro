package com.resumeai.dto.response;

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
public class ResumeChatSource {

    private Integer chunkIndex;
    private String sectionName;
    private String excerpt;
    private Double similarityScore;
}
