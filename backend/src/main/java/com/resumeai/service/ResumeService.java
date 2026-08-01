package com.resumeai.service;

import com.resumeai.dto.response.ResumeDetailResponse;
import com.resumeai.dto.response.ResumeResponse;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface ResumeService {

    ResumeDetailResponse uploadResume(MultipartFile file, String authenticatedEmail);

    List<ResumeResponse> getCurrentUserResumes(String authenticatedEmail);

    ResumeDetailResponse getResume(Long resumeId, String authenticatedEmail);

    void deleteResume(Long resumeId, String authenticatedEmail);
}
