package com.resumeai.exception;

public class EmailAlreadyExistsException extends RuntimeException {

    public static final String DEFAULT_MESSAGE = "Email is already registered.";

    public EmailAlreadyExistsException() {
        super(DEFAULT_MESSAGE);
    }
}

