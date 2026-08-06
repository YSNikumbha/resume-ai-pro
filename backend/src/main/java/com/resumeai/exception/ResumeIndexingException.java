package com.resumeai.exception;

public class ResumeIndexingException extends RuntimeException {

    public ResumeIndexingException(String message) {
        super(message);
    }

    public ResumeIndexingException(String message, Throwable cause) {
        super(message, cause);
    }
}
