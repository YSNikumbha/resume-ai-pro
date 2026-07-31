package com.resumeai.service.impl;

import com.resumeai.dto.request.LoginRequest;
import com.resumeai.dto.request.RegisterRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.AuthResponse;
import com.resumeai.dto.response.CurrentUserResponse;
import com.resumeai.entity.User;
import com.resumeai.entity.UserRole;
import com.resumeai.exception.EmailAlreadyExistsException;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.repository.UserRepository;
import com.resumeai.security.JwtService;
import com.resumeai.service.AuthService;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final String REGISTRATION_SUCCESS_MESSAGE = "User registered successfully.";
    private static final String LOGIN_SUCCESS_MESSAGE = "Login successful";
    private static final String TOKEN_TYPE = "Bearer";
    private static final String USER_NOT_FOUND_MESSAGE = "User not found.";
    private static final String AUTHENTICATION_REQUIRED_MESSAGE = "Authentication is required.";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    @Override
    @Transactional
    public ApiResponse register(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        ensureEmailIsAvailable(normalizedEmail);

        User user = buildUser(request, normalizedEmail);
        userRepository.save(user);

        log.info("Registration successful.");
        return ApiResponse.builder()
                .success(true)
                .message(REGISTRATION_SUCCESS_MESSAGE)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        Authentication authentication = authenticate(normalizedEmail, request.getPassword());
        String token = jwtService.generateToken((UserDetails) authentication.getPrincipal());

        log.info("Login successful.");
        return AuthResponse.builder()
                .token(token)
                .type(TOKEN_TYPE)
                .message(LOGIN_SUCCESS_MESSAGE)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentUserResponse getCurrentUser() {
        String email = getAuthenticatedEmail();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_MESSAGE));

        return CurrentUserResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .build();
    }

    private void ensureEmailIsAvailable(String email) {
        if (userRepository.existsByEmail(email)) {
            log.warn("Duplicate email registration attempt rejected.");
            throw new EmailAlreadyExistsException();
        }
    }

    private User buildUser(RegisterRequest request, String email) {
        return User.builder()
                .fullName(request.getFullName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .build();
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private Authentication authenticate(String email, String password) {
        try {
            return authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password)
            );
        } catch (AuthenticationException exception) {
            log.warn("Authentication failure during login.");
            throw new BadCredentialsException("Invalid email or password.", exception);
        }
    }

    private String getAuthenticatedEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BadCredentialsException(AUTHENTICATION_REQUIRED_MESSAGE);
        }

        return authentication.getName();
    }
}
