package com.resumeai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResumeChatRequest {

    @NotBlank(message = "Question is required.")
    @Size(min = 3, max = 1000, message = "Question must be between 3 and 1000 characters.")
    private String question;
}
