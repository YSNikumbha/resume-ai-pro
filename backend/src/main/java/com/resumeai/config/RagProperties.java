package com.resumeai.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.rag")
public class RagProperties {

    private String embeddingModel = "gemini-embedding-001";

    @Min(1)
    @Max(4096)
    private int embeddingDimensions = 768;

    private String vectorTableName = "resume_vector_store";

    @Min(200)
    @Max(3000)
    private int chunkSize = 800;

    @Min(0)
    @Max(1000)
    private int chunkOverlap = 150;

    @Min(1)
    @Max(20)
    private int topK = 5;

    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private double similarityThreshold = 0.60;

    @Min(3)
    @Max(4000)
    private int maxQuestionLength = 1000;

    @Min(50)
    @Max(1000)
    private int sourceExcerptLength = 250;
}
