package com.resumeai.service;

import java.nio.file.Path;
import org.springframework.web.multipart.MultipartFile;

public interface PdfTextExtractor {

    String extractText(Path filePath);

    String extractText(MultipartFile file);
}
