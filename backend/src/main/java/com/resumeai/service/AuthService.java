package com.resumeai.service;

import com.resumeai.dto.request.LoginRequest;
import com.resumeai.dto.request.RegisterRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.AuthResponse;
import com.resumeai.dto.response.CurrentUserResponse;

public interface AuthService {

    ApiResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    CurrentUserResponse getCurrentUser();
}
