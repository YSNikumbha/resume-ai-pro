package com.resumeai.service;

import com.resumeai.dto.StoredFileDetails;
import java.nio.file.Path;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    StoredFileDetails store(MultipartFile file);

    void delete(Path filePath);
}
