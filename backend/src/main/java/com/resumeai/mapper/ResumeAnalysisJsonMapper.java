package com.resumeai.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.dto.ai.ResumeAnalysisAiResult;
import com.resumeai.dto.response.ResumeAnalysisResponse;
import com.resumeai.exception.AiAnalysisException;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ResumeAnalysisJsonMapper {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };
    private static final TypeReference<List<ResumeAnalysisResponse.EducationItem>> EDUCATION_LIST_TYPE =
            new TypeReference<>() {
            };
    private static final TypeReference<List<ResumeAnalysisResponse.ExperienceItem>> EXPERIENCE_LIST_TYPE =
            new TypeReference<>() {
            };
    private static final TypeReference<List<ResumeAnalysisResponse.ProjectItem>> PROJECT_LIST_TYPE =
            new TypeReference<>() {
            };

    private final ObjectMapper objectMapper;

    public String writeCollection(Object value, String fieldName) {
        try {
            return objectMapper.writeValueAsString(value == null ? Collections.emptyList() : value);
        } catch (JsonProcessingException exception) {
            throw new AiAnalysisException(
                    "AI analysis returned data that could not be processed.",
                    AiAnalysisException.FailureType.UNEXPECTED_OUTPUT,
                    exception
            );
        }
    }

    public List<String> readStringList(String json, String fieldName) {
        return readList(json, STRING_LIST_TYPE, fieldName);
    }

    public List<ResumeAnalysisResponse.EducationItem> readEducation(String json) {
        return readList(json, EDUCATION_LIST_TYPE, "education");
    }

    public List<ResumeAnalysisResponse.ExperienceItem> readExperience(String json) {
        return readList(json, EXPERIENCE_LIST_TYPE, "experience");
    }

    public List<ResumeAnalysisResponse.ProjectItem> readProjects(String json) {
        return readList(json, PROJECT_LIST_TYPE, "projects");
    }

    public List<ResumeAnalysisResponse.EducationItem> toEducationResponse(
            List<ResumeAnalysisAiResult.EducationItem> items
    ) {
        if (items == null) {
            return Collections.emptyList();
        }

        return items.stream()
                .map(item -> new ResumeAnalysisResponse.EducationItem(
                        item.institution(),
                        item.qualification(),
                        item.field(),
                        item.startYear(),
                        item.endYear()
                ))
                .toList();
    }

    public List<ResumeAnalysisResponse.ExperienceItem> toExperienceResponse(
            List<ResumeAnalysisAiResult.ExperienceItem> items
    ) {
        if (items == null) {
            return Collections.emptyList();
        }

        return items.stream()
                .map(item -> new ResumeAnalysisResponse.ExperienceItem(
                        item.organization(),
                        item.role(),
                        item.duration(),
                        nullSafeList(item.responsibilities())
                ))
                .toList();
    }

    public List<ResumeAnalysisResponse.ProjectItem> toProjectResponse(
            List<ResumeAnalysisAiResult.ProjectItem> items
    ) {
        if (items == null) {
            return Collections.emptyList();
        }

        return items.stream()
                .map(item -> new ResumeAnalysisResponse.ProjectItem(
                        item.name(),
                        item.description(),
                        nullSafeList(item.technologies()),
                        nullSafeList(item.highlights())
                ))
                .toList();
    }

    private <T> List<T> readList(String json, TypeReference<List<T>> typeReference, String fieldName) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }

        try {
            List<T> value = objectMapper.readValue(json, typeReference);
            return value == null ? Collections.emptyList() : value;
        } catch (JsonProcessingException exception) {
            log.warn("Stored analysis JSON could not be read for field {}.", fieldName);
            return Collections.emptyList();
        }
    }

    private List<String> nullSafeList(List<String> values) {
        return values == null ? Collections.emptyList() : values;
    }
}
