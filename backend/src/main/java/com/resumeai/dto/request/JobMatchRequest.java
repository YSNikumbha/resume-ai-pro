package com.resumeai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class JobMatchRequest {

    @NotNull(message = "Resume is required.")
    @Positive(message = "Resume is required.")
    private Long resumeId;

    @NotBlank(message = "Job title is required.")
    @Size(max = 160, message = "Job title must be 160 characters or fewer.")
    private String title;

    @Size(max = 160, message = "Company name must be 160 characters or fewer.")
    private String companyName;

    @NotBlank(message = "Job description is required.")
    @Size(
            min = 50,
            max = 20000,
            message = "Job description must be between 50 and 20000 characters."
    )
    private String description;
}
