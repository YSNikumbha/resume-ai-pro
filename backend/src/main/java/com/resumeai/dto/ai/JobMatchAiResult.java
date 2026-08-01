package com.resumeai.dto.ai;

import java.util.List;

public record JobMatchAiResult(
        Integer matchScore,
        String summary,
        List<String> matchedSkills,
        List<String> missingSkills,
        MatchSection experienceMatch,
        MatchSection educationMatch,
        List<String> strengths,
        List<String> gaps,
        List<String> recommendations,
        List<String> keywordSuggestions
) {

    public record MatchSection(
            Integer score,
            String status,
            String explanation
    ) {
    }
}
