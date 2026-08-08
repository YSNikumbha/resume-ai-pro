package com.resumeai.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.resumeai.config.RagProperties;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.ObjectProvider;

@ExtendWith(MockitoExtension.class)
class ResumeRetrievalServiceImplTest {

    @Mock
    private ObjectProvider<VectorStore> vectorStoreProvider;

    @Mock
    private VectorStore vectorStore;

    private ResumeRetrievalServiceImpl retrievalService;

    @BeforeEach
    void setUp() {
        RagProperties ragProperties = new RagProperties();
        ragProperties.setTopK(7);
        ragProperties.setSimilarityThreshold(0.72);
        retrievalService = new ResumeRetrievalServiceImpl(vectorStoreProvider, ragProperties);
    }

    @Test
    void searchIsFilteredByUserId() {
        ArgumentCaptor<SearchRequest> captor = mockSearch();

        retrievalService.retrieve(1L, 10L, "What skills are mentioned?");

        assertThat(captor.getValue().getFilterExpression().toString()).contains("userId", "1");
    }

    @Test
    void searchIsFilteredByResumeId() {
        ArgumentCaptor<SearchRequest> captor = mockSearch();

        retrievalService.retrieve(1L, 10L, "What skills are mentioned?");

        assertThat(captor.getValue().getFilterExpression().toString()).contains("resumeId", "10");
    }

    @Test
    void emptyResultHandled() {
        mockSearch();

        List<Document> documents = retrievalService.retrieve(1L, 10L, "Unanswered question?");

        assertThat(documents).isEmpty();
    }

    @Test
    void topKApplied() {
        ArgumentCaptor<SearchRequest> captor = mockSearch();

        retrievalService.retrieve(1L, 10L, "What skills are mentioned?");

        assertThat(captor.getValue().getTopK()).isEqualTo(7);
    }

    @Test
    void similarityThresholdApplied() {
        ArgumentCaptor<SearchRequest> captor = mockSearch();

        retrievalService.retrieve(1L, 10L, "What skills are mentioned?");

        assertThat(captor.getValue().getSimilarityThreshold()).isEqualTo(0.72);
    }

    private ArgumentCaptor<SearchRequest> mockSearch() {
        ArgumentCaptor<SearchRequest> captor = ArgumentCaptor.forClass(SearchRequest.class);
        when(vectorStoreProvider.getIfAvailable()).thenReturn(vectorStore);
        when(vectorStore.similaritySearch(captor.capture())).thenReturn(List.of());
        return captor;
    }
}
