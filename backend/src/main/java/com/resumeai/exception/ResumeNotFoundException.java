package com.resumeai.exception;

public class ResumeNotFoundException extends RuntimeException {

    public ResumeNotFoundException(String message) {
        super(message);
    }
}
