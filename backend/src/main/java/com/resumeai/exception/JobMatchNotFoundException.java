package com.resumeai.exception;

public class JobMatchNotFoundException extends RuntimeException {

    public JobMatchNotFoundException(String message) {
        super(message);
    }
}
