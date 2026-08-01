package com.resumeai.mapper;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.dto.ai.JobMatchAiResult;
import com.resumeai.dto.response.JobMatchResponse;
import com.resumeai.exception.JobMatchAiException;
import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class JobMatchJsonMapper {

    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {
    };

    private final ObjectMapper objectMapper;

    public String writeCollection(Object value, String fieldName) {
        try {
            return objectMapper.writeValueAsString(value == null ? Collections.emptyList() : value);
        } catch (JsonProcessingException exception) {
            throw unexpectedOutputException(exception);
        }
    }

    public String writeObject(Object value, String fieldName) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw unexpectedOutputException(exception);
        }
    }

    public List<String> readStringList(String json, String fieldName) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }

        try {
            List<String> value = objectMapper.readValue(json, STRING_LIST_TYPE);
            return value == null ? Collections.emptyList() : value;
        } catch (JsonProcessingException exception) {
            log.warn("Stored job-match JSON could not be read for field {}.", fieldName);
            return Collections.emptyList();
        }
    }

    public JobMatchResponse.MatchSection readMatchSection(String json, String fieldName) {
        if (json == null || json.isBlank()) {
            return notFoundSection();
        }

        try {
            JobMatchResponse.MatchSection value = objectMapper.readValue(json, JobMatchResponse.MatchSection.class);
            return value == null ? notFoundSection() : value;
        } catch (JsonProcessingException exception) {
            log.warn("Stored job-match JSON could not be read for field {}.", fieldName);
            return notFoundSection();
        }
    }

    public JobMatchResponse.MatchSection toResponseSection(JobMatchAiResult.MatchSection section) {
        if (section == null) {
            return notFoundSection();
        }

        return new JobMatchResponse.MatchSection(
                section.score(),
                section.status(),
                section.explanation()
        );
    }

    private JobMatchResponse.MatchSection notFoundSection() {
        return new JobMatchResponse.MatchSection(null, "NOT_FOUND", null);
    }

    private JobMatchAiException unexpectedOutputException(JsonProcessingException exception) {
        return new JobMatchAiException(
                "Job match returned data that could not be processed.",
                JobMatchAiException.FailureType.UNEXPECTED_OUTPUT,
                exception
        );
    }
}
