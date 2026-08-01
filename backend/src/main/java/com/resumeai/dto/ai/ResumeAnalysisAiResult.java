package com.resumeai.dto.ai;

import java.util.List;

public record ResumeAnalysisAiResult(
        String summary,
        Integer atsScore,
        List<String> skills,
        List<EducationItem> education,
        List<ExperienceItem> experience,
        List<ProjectItem> projects,
        List<String> strengths,
        List<String> weaknesses,
        List<String> suggestions
) {

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
