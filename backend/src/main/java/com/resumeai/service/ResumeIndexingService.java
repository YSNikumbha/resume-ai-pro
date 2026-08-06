package com.resumeai.service;

import com.resumeai.dto.response.ResumeIndexResponse;

public interface ResumeIndexingService {

    ResumeIndexResponse indexResume(Long resumeId, String authenticatedEmail);

    ResumeIndexResponse getIndexStatus(Long resumeId, String authenticatedEmail);

    void deleteResumeIndex(Long resumeId, String authenticatedEmail);
}
