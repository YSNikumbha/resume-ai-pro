package com.resumeai.service.impl;

import com.resumeai.config.RagProperties;
import com.resumeai.exception.RagRetrievalException;
import com.resumeai.rag.RagMetadata;
import com.resumeai.service.ResumeRetrievalService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeRetrievalServiceImpl implements ResumeRetrievalService {

    private static final String RETRIEVAL_UNAVAILABLE_MESSAGE =
            "Resume retrieval is temporarily unavailable. Please try again later.";

    private final ObjectProvider<VectorStore> vectorStoreProvider;
    private final RagProperties ragProperties;

    @Override
    public List<Document> retrieve(Long userId, Long resumeId, String question) {
        if (!StringUtils.hasText(question)) {
            throw new IllegalArgumentException("Question is required.");
        }

        VectorStore vectorStore = vectorStoreProvider.getIfAvailable();
        if (vectorStore == null) {
            throw new RagRetrievalException(RETRIEVAL_UNAVAILABLE_MESSAGE);
        }

        SearchRequest request = SearchRequest.builder()
                .query(question.trim())
                .topK(ragProperties.getTopK())
                .similarityThreshold(ragProperties.getSimilarityThreshold())
                .filterExpression(RagMetadata.ownerResumeFilter(userId, resumeId))
                .build();

        try {
            List<Document> documents = vectorStore.similaritySearch(request);
            return documents == null ? List.of() : List.copyOf(documents);
        } catch (RuntimeException exception) {
            log.warn("Resume retrieval failed for resumeId={} userId={} errorType={}.",
                    resumeId, userId, exception.getClass().getSimpleName());
            throw new RagRetrievalException(RETRIEVAL_UNAVAILABLE_MESSAGE, exception);
        }
    }
}
