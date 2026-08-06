package com.resumeai.service;

import com.resumeai.dto.request.ResumeChatRequest;
import com.resumeai.dto.response.ResumeChatResponse;
import java.util.List;

public interface ResumeChatService {

    ResumeChatResponse ask(Long resumeId, ResumeChatRequest request, String authenticatedEmail);

    List<ResumeChatResponse> getChatHistory(Long resumeId, String authenticatedEmail);
}
