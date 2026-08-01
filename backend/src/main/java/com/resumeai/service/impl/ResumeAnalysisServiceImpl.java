package com.resumeai.service.impl;

import com.resumeai.config.AiProperties;
import com.resumeai.dto.ai.ResumeAnalysisAiResult;
import com.resumeai.dto.response.ResumeAnalysisResponse;
import com.resumeai.entity.AnalysisStatus;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeAnalysis;
import com.resumeai.entity.User;
import com.resumeai.exception.AiAnalysisException;
import com.resumeai.exception.AiConfigurationException;
import com.resumeai.exception.AnalysisNotFoundException;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.mapper.ResumeAnalysisJsonMapper;
import com.resumeai.repository.ResumeAnalysisRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.ResumeAiService;
import com.resumeai.service.ResumeAnalysisService;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeAnalysisServiceImpl implements ResumeAnalysisService {

    private static final String USER_NOT_FOUND_MESSAGE = "User not found.";
    private static final String RESUME_NOT_FOUND_MESSAGE = "Resume not found.";
    private static final String ANALYSIS_NOT_FOUND_MESSAGE = "Analysis not found.";
    private static final String RESUME_TEXT_UNAVAILABLE_MESSAGE = "Resume text is unavailable for analysis.";
    private static final String GENERIC_FAILURE_MESSAGE = "AI analysis failed. Please try again later.";
    private static final int MAX_FAILURE_MESSAGE_LENGTH = 500;

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final ResumeAiService resumeAiService;
    private final ResumeAnalysisJsonMapper jsonMapper;
    private final AiProperties aiProperties;
    private final PlatformTransactionManager transactionManager;

    @Override
    public ResumeAnalysisResponse analyzeResume(Long resumeId, String authenticatedEmail) {
        long startedAt = System.currentTimeMillis();
        AnalysisRequestContext context = createProcessingAnalysis(resumeId, authenticatedEmail);

        log.info("Analysis requested for resumeId={} userId={} analysisId={}.",
                context.resumeId(), context.userId(), context.analysisId());

        try {
            ResumeAnalysisAiResult result = resumeAiService.analyze(context.resumeText());
            ResumeAnalysisResponse response = completeAnalysis(context.analysisId(), result);
            log.info("Analysis completed for resumeId={} userId={} analysisId={} durationMs={}.",
                    context.resumeId(), context.userId(), context.analysisId(), elapsedMillis(startedAt));
            return response;
        } catch (RuntimeException exception) {
            failAnalysis(context.analysisId(), exception);
            log.warn("Analysis failed for resumeId={} userId={} analysisId={} durationMs={} errorType={}.",
                    context.resumeId(),
                    context.userId(),
                    context.analysisId(),
                    elapsedMillis(startedAt),
                    exception.getClass().getSimpleName());
            throw exception;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeAnalysisResponse getAnalysis(Long analysisId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        ResumeAnalysis analysis = resumeAnalysisRepository.findByIdAndUserId(analysisId, user.getId())
                .orElseThrow(() -> new AnalysisNotFoundException(ANALYSIS_NOT_FOUND_MESSAGE));
        return toResponse(analysis);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeAnalysisResponse> getResumeAnalyses(Long resumeId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        ensureResumeOwnedByUser(resumeId, user.getId());

        return resumeAnalysisRepository.findAllByResumeIdAndUserIdOrderByAnalyzedAtDesc(resumeId, user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeAnalysisResponse> getCurrentUserAnalyses(String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        return resumeAnalysisRepository.findAllByUserIdOrderByAnalyzedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private AnalysisRequestContext createProcessingAnalysis(Long resumeId, String authenticatedEmail) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        return Objects.requireNonNull(transactionTemplate.execute(status -> {
            User user = getUser(authenticatedEmail);
            Resume resume = getOwnedResume(resumeId, user.getId());

            if (!StringUtils.hasText(resume.getExtractedText())) {
                throw new ResumeTextUnavailableException(RESUME_TEXT_UNAVAILABLE_MESSAGE);
            }

            ResumeAnalysis analysis = ResumeAnalysis.builder()
                    .resume(resume)
                    .user(user)
                    .status(AnalysisStatus.PROCESSING)
                    .modelName(aiProperties.getModel())
                    .build();
            ResumeAnalysis savedAnalysis = resumeAnalysisRepository.save(analysis);

            return new AnalysisRequestContext(
                    savedAnalysis.getId(),
                    resume.getId(),
                    user.getId(),
                    resume.getExtractedText()
            );
        }));
    }

    private ResumeAnalysisResponse completeAnalysis(Long analysisId, ResumeAnalysisAiResult result) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        return Objects.requireNonNull(transactionTemplate.execute(status -> {
            ResumeAnalysis analysis = getAnalysisById(analysisId);
            analysis.setSummary(result.summary());
            analysis.setAtsScore(result.atsScore());
            analysis.setSkills(jsonMapper.writeCollection(result.skills(), "skills"));
            analysis.setEducation(jsonMapper.writeCollection(
                    jsonMapper.toEducationResponse(result.education()),
                    "education"
            ));
            analysis.setExperience(jsonMapper.writeCollection(
                    jsonMapper.toExperienceResponse(result.experience()),
                    "experience"
            ));
            analysis.setProjects(jsonMapper.writeCollection(
                    jsonMapper.toProjectResponse(result.projects()),
                    "projects"
            ));
            analysis.setStrengths(jsonMapper.writeCollection(result.strengths(), "strengths"));
            analysis.setWeaknesses(jsonMapper.writeCollection(result.weaknesses(), "weaknesses"));
            analysis.setSuggestions(jsonMapper.writeCollection(result.suggestions(), "suggestions"));
            analysis.setModelName(aiProperties.getModel());
            analysis.setStatus(AnalysisStatus.COMPLETED);
            analysis.setFailureMessage(null);

            return toResponse(resumeAnalysisRepository.save(analysis));
        }));
    }

    private void failAnalysis(Long analysisId, RuntimeException exception) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        transactionTemplate.executeWithoutResult(status ->
                resumeAnalysisRepository.findById(analysisId).ifPresent(analysis -> {
                    analysis.setStatus(AnalysisStatus.FAILED);
                    analysis.setFailureMessage(safeFailureMessage(exception));
                    resumeAnalysisRepository.save(analysis);
                })
        );
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException(USER_NOT_FOUND_MESSAGE));
    }

    private Resume getOwnedResume(Long resumeId, Long userId) {
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ResumeNotFoundException(RESUME_NOT_FOUND_MESSAGE));
    }

    private ResumeAnalysis getAnalysisById(Long analysisId) {
        return resumeAnalysisRepository.findById(analysisId)
                .orElseThrow(() -> new AnalysisNotFoundException(ANALYSIS_NOT_FOUND_MESSAGE));
    }

    private void ensureResumeOwnedByUser(Long resumeId, Long userId) {
        if (!resumeRepository.existsByIdAndUserId(resumeId, userId)) {
            throw new ResumeNotFoundException(RESUME_NOT_FOUND_MESSAGE);
        }
    }

    private ResumeAnalysisResponse toResponse(ResumeAnalysis analysis) {
        Resume resume = analysis.getResume();

        return ResumeAnalysisResponse.builder()
                .id(analysis.getId())
                .resumeId(resume.getId())
                .resumeFileName(resume.getOriginalFileName())
                .summary(analysis.getSummary())
                .atsScore(analysis.getAtsScore())
                .skills(jsonMapper.readStringList(analysis.getSkills(), "skills"))
                .education(jsonMapper.readEducation(analysis.getEducation()))
                .experience(jsonMapper.readExperience(analysis.getExperience()))
                .projects(jsonMapper.readProjects(analysis.getProjects()))
                .strengths(jsonMapper.readStringList(analysis.getStrengths(), "strengths"))
                .weaknesses(jsonMapper.readStringList(analysis.getWeaknesses(), "weaknesses"))
                .suggestions(jsonMapper.readStringList(analysis.getSuggestions(), "suggestions"))
                .analyzedAt(analysis.getAnalyzedAt())
                .updatedAt(analysis.getUpdatedAt())
                .modelName(analysis.getModelName())
                .status(analysis.getStatus())
                .failureMessage(analysis.getFailureMessage())
                .build();
    }

    private String safeFailureMessage(RuntimeException exception) {
        String message = switch (exception) {
            case AiConfigurationException aiConfigurationException -> aiConfigurationException.getMessage();
            case AiAnalysisException aiAnalysisException -> aiAnalysisException.getMessage();
            case ResumeTextUnavailableException resumeTextUnavailableException ->
                    resumeTextUnavailableException.getMessage();
            default -> GENERIC_FAILURE_MESSAGE;
        };

        if (!StringUtils.hasText(message)) {
            return GENERIC_FAILURE_MESSAGE;
        }

        return message.length() <= MAX_FAILURE_MESSAGE_LENGTH
                ? message
                : message.substring(0, MAX_FAILURE_MESSAGE_LENGTH);
    }

    private long elapsedMillis(long startedAt) {
        return System.currentTimeMillis() - startedAt;
    }

    private record AnalysisRequestContext(
            Long analysisId,
            Long resumeId,
            Long userId,
            String resumeText
    ) {
    }
}
