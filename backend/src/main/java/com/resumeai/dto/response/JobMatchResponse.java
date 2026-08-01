package com.resumeai.dto.response;

import com.resumeai.entity.JobMatchStatus;
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
public class JobMatchResponse {

    private Long id;

    private Long resumeId;

    private String resumeFileName;

    private Long jobDescriptionId;

    private String jobTitle;

    private String companyName;

    private Integer matchScore;

    private String summary;

    private List<String> matchedSkills;

    private List<String> missingSkills;

    private MatchSection experienceMatch;

    private MatchSection educationMatch;

    private List<String> strengths;

    private List<String> gaps;

    private List<String> recommendations;

    private List<String> keywordSuggestions;

    private JobMatchStatus status;

    private String modelName;

    private String failureMessage;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public record MatchSection(
            Integer score,
            String status,
            String explanation
    ) {
    }
}
