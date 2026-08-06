package com.resumeai.exception;

public class ResumeChatException extends RuntimeException {

    public enum FailureType {
        PROVIDER_UNAVAILABLE,
        UNEXPECTED_OUTPUT
    }

    private final FailureType failureType;

    public ResumeChatException(String message, FailureType failureType) {
        super(message);
        this.failureType = failureType;
    }

    public ResumeChatException(String message, FailureType failureType, Throwable cause) {
        super(message, cause);
        this.failureType = failureType;
    }

    public FailureType getFailureType() {
        return failureType;
    }
}
