package com.resumeai.service;

import com.resumeai.dto.ai.ResumeAnalysisAiResult;

public interface ResumeAiService {

    ResumeAnalysisAiResult analyze(String resumeText);
}
