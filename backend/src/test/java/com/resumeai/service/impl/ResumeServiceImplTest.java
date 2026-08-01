package com.resumeai.service.impl;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.resumeai.entity.Resume;
import com.resumeai.entity.User;
import com.resumeai.entity.UserRole;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.repository.ResumeAnalysisRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.FileStorageService;
import com.resumeai.service.PdfTextExtractor;
import java.nio.file.Path;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ResumeServiceImplTest {

    private static final String EMAIL = "owner@example.com";

    @Mock
    private ResumeRepository resumeRepository;

    @Mock
    private ResumeAnalysisRepository resumeAnalysisRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FileStorageService fileStorageService;

    @Mock
    private PdfTextExtractor pdfTextExtractor;

    @InjectMocks
    private ResumeServiceImpl resumeService;

    @Test
    void deleteResumeDeletesOwnedAnalysesBeforeResume() {
        User user = user();
        Resume resume = resume(user);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.of(resume));

        resumeService.deleteResume(10L, EMAIL);

        InOrder inOrder = inOrder(resumeAnalysisRepository, resumeRepository, fileStorageService);
        inOrder.verify(resumeAnalysisRepository).deleteAllByResumeIdAndUserId(10L, 1L);
        inOrder.verify(resumeRepository).delete(resume);
        inOrder.verify(resumeRepository).flush();
        inOrder.verify(fileStorageService).delete(Path.of("uploads/resumes/stored.pdf"));
    }

    @Test
    void deleteResumeDoesNotDeleteAnalysesForUnownedResume() {
        User user = user();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUserId(10L, 1L)).thenReturn(Optional.empty());

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> resumeService.deleteResume(10L, EMAIL))
                .isInstanceOf(ResumeNotFoundException.class);

        verifyNoInteractions(resumeAnalysisRepository, fileStorageService);
    }

    private User user() {
        return User.builder()
                .id(1L)
                .fullName("Owner User")
                .email(EMAIL)
                .password("encoded")
                .role(UserRole.USER)
                .build();
    }

    private Resume resume(User user) {
        return Resume.builder()
                .id(10L)
                .user(user)
                .originalFileName("resume.pdf")
                .storedFileName("stored.pdf")
                .filePath("uploads/resumes/stored.pdf")
                .contentType("application/pdf")
                .fileSize(1024L)
                .extractedText("Java React resume")
                .build();
    }
}
