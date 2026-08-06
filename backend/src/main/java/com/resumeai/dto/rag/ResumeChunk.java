package com.resumeai.dto.rag;

public record ResumeChunk(
        String content,
        int chunkIndex,
        String sectionName,
        int startCharacter,
        int endCharacter
) {
}
