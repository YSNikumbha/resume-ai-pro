package com.resumeai.service;

import com.resumeai.dto.response.ResumeAnalysisResponse;
import java.util.List;

public interface ResumeAnalysisService {

    ResumeAnalysisResponse analyzeResume(Long resumeId, String authenticatedEmail);

    ResumeAnalysisResponse getAnalysis(Long analysisId, String authenticatedEmail);

    List<ResumeAnalysisResponse> getResumeAnalyses(Long resumeId, String authenticatedEmail);

    List<ResumeAnalysisResponse> getCurrentUserAnalyses(String authenticatedEmail);
}
