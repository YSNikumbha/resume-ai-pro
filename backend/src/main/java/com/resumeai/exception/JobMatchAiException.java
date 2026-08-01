package com.resumeai.exception;

public class JobMatchAiException extends RuntimeException {

    private final FailureType failureType;

    public JobMatchAiException(String message, FailureType failureType) {
        super(message);
        this.failureType = failureType;
    }

    public JobMatchAiException(String message, FailureType failureType, Throwable cause) {
        super(message, cause);
        this.failureType = failureType;
    }

    public FailureType getFailureType() {
        return failureType;
    }

    public enum FailureType {
        PROVIDER_UNAVAILABLE,
        UNEXPECTED_OUTPUT
    }
}
