package com.resumeai.exception;

import com.resumeai.dto.response.ApiResponse;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String VALIDATION_ERROR_FALLBACK = "Validation failed.";
    private static final String UNEXPECTED_ERROR_MESSAGE = "An unexpected error occurred.";
    private static final String ACCESS_DENIED_MESSAGE = "Access denied.";

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse> handleEmailAlreadyExists(EmailAlreadyExistsException exception) {
        return buildErrorResponse(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse> handleResourceNotFound(ResourceNotFoundException exception) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(ResumeNotFoundException.class)
    public ResponseEntity<ApiResponse> handleResumeNotFound(ResumeNotFoundException exception) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(AnalysisNotFoundException.class)
    public ResponseEntity<ApiResponse> handleAnalysisNotFound(AnalysisNotFoundException exception) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(JobMatchNotFoundException.class)
    public ResponseEntity<ApiResponse> handleJobMatchNotFound(JobMatchNotFoundException exception) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, exception.getMessage());
    }

    @ExceptionHandler(AiConfigurationException.class)
    public ResponseEntity<ApiResponse> handleAiConfiguration(AiConfigurationException exception) {
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(EmbeddingConfigurationException.class)
    public ResponseEntity<ApiResponse> handleEmbeddingConfiguration(EmbeddingConfigurationException exception) {
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(AiAnalysisException.class)
    public ResponseEntity<ApiResponse> handleAiAnalysis(AiAnalysisException exception) {
        HttpStatus status = exception.getFailureType() == AiAnalysisException.FailureType.UNEXPECTED_OUTPUT
                ? HttpStatus.BAD_GATEWAY
                : HttpStatus.SERVICE_UNAVAILABLE;
        return buildErrorResponse(status, exception.getMessage());
    }

    @ExceptionHandler(JobMatchAiException.class)
    public ResponseEntity<ApiResponse> handleJobMatchAi(JobMatchAiException exception) {
        HttpStatus status = exception.getFailureType() == JobMatchAiException.FailureType.UNEXPECTED_OUTPUT
                ? HttpStatus.BAD_GATEWAY
                : HttpStatus.SERVICE_UNAVAILABLE;
        return buildErrorResponse(status, exception.getMessage());
    }

    @ExceptionHandler(ResumeChatException.class)
    public ResponseEntity<ApiResponse> handleResumeChat(ResumeChatException exception) {
        HttpStatus status = exception.getFailureType() == ResumeChatException.FailureType.UNEXPECTED_OUTPUT
                ? HttpStatus.BAD_GATEWAY
                : HttpStatus.SERVICE_UNAVAILABLE;
        return buildErrorResponse(status, exception.getMessage());
    }

    @ExceptionHandler(ResumeIndexingException.class)
    public ResponseEntity<ApiResponse> handleResumeIndexing(ResumeIndexingException exception) {
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(RagRetrievalException.class)
    public ResponseEntity<ApiResponse> handleRagRetrieval(RagRetrievalException exception) {
        return buildErrorResponse(HttpStatus.SERVICE_UNAVAILABLE, exception.getMessage());
    }

    @ExceptionHandler(ResumeNotIndexedException.class)
    public ResponseEntity<ApiResponse> handleResumeNotIndexed(ResumeNotIndexedException exception) {
        return buildErrorResponse(HttpStatus.CONFLICT, exception.getMessage());
    }

    @ExceptionHandler(JobDescriptionValidationException.class)
    public ResponseEntity<ApiResponse> handleJobDescriptionValidation(JobDescriptionValidationException exception) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(ResumeTextUnavailableException.class)
    public ResponseEntity<ApiResponse> handleResumeTextUnavailable(ResumeTextUnavailableException exception) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(InvalidFileException.class)
    public ResponseEntity<ApiResponse> handleInvalidFile(InvalidFileException exception) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(ResumeProcessingException.class)
    public ResponseEntity<ApiResponse> handleResumeProcessing(ResumeProcessingException exception) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException exception) {
        return buildErrorResponse(HttpStatus.PAYLOAD_TOO_LARGE, "File size must not exceed 5 MB.");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ApiResponse> handleMissingServletRequestPart(MissingServletRequestPartException exception) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Resume file is required.");
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<ApiResponse> handleMultipartException(MultipartException exception) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Invalid multipart request.");
    }

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ApiResponse> handleFileStorage(FileStorageException exception) {
        log.error("File storage operation failed.", exception);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, exception.getMessage());
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse> handleAuthenticationException(AuthenticationException exception) {
        log.warn("Authentication failure: {}", exception.getMessage());
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, exception.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse> handleAccessDeniedException(AccessDeniedException exception) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, ACCESS_DENIED_MESSAGE);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse> handleValidationException(MethodArgumentNotValidException exception) {
        String message = extractValidationMessage(exception);
        return buildErrorResponse(HttpStatus.BAD_REQUEST, message);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse> handleIllegalArgument(IllegalArgumentException exception) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse> handleGenericException(Exception exception) {
        log.error("Unexpected error occurred while processing request.", exception);
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, UNEXPECTED_ERROR_MESSAGE);
    }

    private String extractValidationMessage(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .map(this::getDefaultMessage)
                .filter(defaultMessage -> !defaultMessage.isBlank())
                .distinct()
                .collect(Collectors.joining(" "));

        return message.isBlank() ? VALIDATION_ERROR_FALLBACK : message;
    }

    private String getDefaultMessage(FieldError fieldError) {
        String message = fieldError.getDefaultMessage();
        return message == null ? "" : message;
    }

    private ResponseEntity<ApiResponse> buildErrorResponse(HttpStatus status, String message) {
        ApiResponse response = ApiResponse.builder()
                .success(false)
                .message(message)
                .build();

        return ResponseEntity.status(status).body(response);
    }
}
