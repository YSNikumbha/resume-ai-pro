package com.resumeai.config;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Getter
@Setter
@Validated
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {

    private String model = "gemini-3.5-flash";

    @DecimalMin("0.0")
    @DecimalMax("1.0")
    private Double temperature = 0.2;

    @Min(1000)
    private int maxResumeCharacters = 30000;

    @Min(1000)
    private int maxJobDescriptionCharacters = 20000;

    @Min(2000)
    private int maxJobMatchInputCharacters = 45000;
}
