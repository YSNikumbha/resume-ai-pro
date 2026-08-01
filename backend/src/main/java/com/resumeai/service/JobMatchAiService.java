package com.resumeai.service;

import com.resumeai.dto.ai.JobMatchAiResult;

public interface JobMatchAiService {

    JobMatchAiResult match(String resumeText, String jobDescription);
}
