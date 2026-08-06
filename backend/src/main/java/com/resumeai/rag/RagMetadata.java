package com.resumeai.rag;

import org.springframework.ai.vectorstore.filter.Filter;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;

public final class RagMetadata {

    public static final String USER_ID = "userId";
    public static final String RESUME_ID = "resumeId";
    public static final String ORIGINAL_FILE_NAME = "originalFileName";
    public static final String CHUNK_INDEX = "chunkIndex";
    public static final String SECTION_NAME = "sectionName";
    public static final String UPLOADED_AT = "uploadedAt";

    private RagMetadata() {
    }

    public static Filter.Expression ownerResumeFilter(Long userId, Long resumeId) {
        FilterExpressionBuilder builder = new FilterExpressionBuilder();
        return builder.and(
                builder.eq(USER_ID, String.valueOf(userId)),
                builder.eq(RESUME_ID, String.valueOf(resumeId))
        ).build();
    }
}
