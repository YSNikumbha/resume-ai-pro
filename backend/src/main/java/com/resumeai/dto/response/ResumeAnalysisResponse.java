package com.resumeai.dto.response;

import com.resumeai.entity.AnalysisStatus;
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
public class ResumeAnalysisResponse {

    private Long id;

    private Long resumeId;

    private String resumeFileName;

    private String summary;

    private Integer atsScore;

    private List<String> skills;

    private List<EducationItem> education;

    private List<ExperienceItem> experience;

    private List<ProjectItem> projects;

    private List<String> strengths;

    private List<String> weaknesses;

    private List<String> suggestions;

    private LocalDateTime analyzedAt;

    private LocalDateTime updatedAt;

    private String modelName;

    private AnalysisStatus status;

    private String failureMessage;

    public record EducationItem(
            String institution,
            String qualification,
            String field,
            Integer startYear,
            Integer endYear
    ) {
    }

    public record ExperienceItem(
            String organization,
            String role,
            String duration,
            List<String> responsibilities
    ) {
    }

    public record ProjectItem(
            String name,
            String description,
            List<String> technologies,
            List<String> highlights
    ) {
    }
}
