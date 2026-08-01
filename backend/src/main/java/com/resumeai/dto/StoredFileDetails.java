package com.resumeai.dto;

import java.nio.file.Path;

public record StoredFileDetails(
        String originalFileName,
        String storedFileName,
        Path filePath,
        String contentType,
        long fileSize
) {
}
