package com.resumeai.service.impl;

import com.resumeai.config.UploadProperties;
import com.resumeai.dto.StoredFileDetails;
import com.resumeai.exception.FileStorageException;
import com.resumeai.exception.InvalidFileException;
import com.resumeai.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final String PDF_EXTENSION = ".pdf";
    private static final String INVALID_TYPE_MESSAGE = "Only PDF files are allowed.";
    private static final String EMPTY_FILE_MESSAGE = "Uploaded file cannot be empty.";
    private static final String FILE_TOO_LARGE_MESSAGE = "File size must not exceed 5 MB.";
    private static final String INVALID_PATH_MESSAGE = "Invalid file path.";
    private static final String STORAGE_ERROR_MESSAGE = "Could not store the uploaded file.";
    private static final String DELETE_ERROR_MESSAGE = "Could not delete the stored file.";

    private final UploadProperties uploadProperties;
    private final Path uploadDirectory;

    public FileStorageServiceImpl(UploadProperties uploadProperties) {
        this.uploadProperties = uploadProperties;
        this.uploadDirectory = Path.of(uploadProperties.dir()).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void initializeUploadDirectory() {
        try {
            Files.createDirectories(uploadDirectory);
        } catch (IOException exception) {
            throw new FileStorageException("Could not create upload directory.", exception);
        }
    }

    @Override
    public StoredFileDetails store(MultipartFile file) {
        validate(file);

        String originalFileName = sanitizeOriginalFileName(file.getOriginalFilename());
        String storedFileName = UUID.randomUUID() + PDF_EXTENSION;
        Path destination = uploadDirectory.resolve(storedFileName).normalize();

        ensureDestinationIsSafe(destination);

        try {
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new FileStorageException(STORAGE_ERROR_MESSAGE, exception);
        }

        return new StoredFileDetails(
                originalFileName,
                storedFileName,
                destination,
                file.getContentType(),
                file.getSize()
        );
    }

    @Override
    public void delete(Path filePath) {
        if (filePath == null) {
            return;
        }

        Path normalizedPath = filePath.toAbsolutePath().normalize();
        ensureDestinationIsSafe(normalizedPath);

        try {
            Files.deleteIfExists(normalizedPath);
        } catch (IOException exception) {
            throw new FileStorageException(DELETE_ERROR_MESSAGE, exception);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() == 0) {
            throw new InvalidFileException(EMPTY_FILE_MESSAGE);
        }

        if (file.getSize() > uploadProperties.maxFileSize()) {
            throw new InvalidFileException(FILE_TOO_LARGE_MESSAGE);
        }

        String originalFileName = sanitizeOriginalFileName(file.getOriginalFilename());
        if (!hasPdfExtension(originalFileName) || !MediaType.APPLICATION_PDF_VALUE.equals(file.getContentType())) {
            throw new InvalidFileException(INVALID_TYPE_MESSAGE);
        }
    }

    private String sanitizeOriginalFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "resume.pdf";
        }

        String normalizedSeparators = originalFileName.replace('\\', '/');
        String fileName = Path.of(normalizedSeparators).getFileName().toString();
        String sanitized = fileName
                .replaceAll("[\\r\\n\\t]", "")
                .replaceAll("[/\\\\]", "")
                .trim();

        return sanitized.isBlank() ? "resume.pdf" : sanitized;
    }

    private boolean hasPdfExtension(String fileName) {
        return fileName.toLowerCase(Locale.ROOT).endsWith(PDF_EXTENSION);
    }

    private void ensureDestinationIsSafe(Path destination) {
        if (!destination.toAbsolutePath().normalize().startsWith(uploadDirectory)) {
            throw new InvalidFileException(INVALID_PATH_MESSAGE);
        }
    }
}
