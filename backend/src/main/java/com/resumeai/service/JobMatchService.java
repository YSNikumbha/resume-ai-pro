package com.resumeai.service;

import com.resumeai.dto.request.JobMatchRequest;
import com.resumeai.dto.response.JobMatchResponse;
import java.util.List;

public interface JobMatchService {

    JobMatchResponse createMatch(JobMatchRequest request, String authenticatedEmail);

    JobMatchResponse getMatch(Long matchId, String authenticatedEmail);

    List<JobMatchResponse> getCurrentUserMatches(String authenticatedEmail);

    List<JobMatchResponse> getResumeMatches(Long resumeId, String authenticatedEmail);

    void deleteMatch(Long matchId, String authenticatedEmail);
}
