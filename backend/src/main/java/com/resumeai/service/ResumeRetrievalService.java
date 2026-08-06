package com.resumeai.service;

import java.util.List;
import org.springframework.ai.document.Document;

public interface ResumeRetrievalService {

    List<Document> retrieve(Long userId, Long resumeId, String question);
}
