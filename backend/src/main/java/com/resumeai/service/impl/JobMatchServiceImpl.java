package com.resumeai.service.impl;

import com.resumeai.config.AiProperties;
import com.resumeai.dto.ai.JobMatchAiResult;
import com.resumeai.dto.request.JobMatchRequest;
import com.resumeai.dto.response.JobMatchResponse;
import com.resumeai.entity.JobDescription;
import com.resumeai.entity.JobMatch;
import com.resumeai.entity.JobMatchStatus;
import com.resumeai.entity.Resume;
import com.resumeai.entity.User;
import com.resumeai.exception.AiConfigurationException;
import com.resumeai.exception.JobDescriptionValidationException;
import com.resumeai.exception.JobMatchAiException;
import com.resumeai.exception.JobMatchNotFoundException;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.exception.ResumeNotFoundException;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.mapper.JobMatchJsonMapper;
import com.resumeai.repository.JobDescriptionRepository;
import com.resumeai.repository.JobMatchRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.JobMatchAiService;
import com.resumeai.service.JobMatchService;
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
public class JobMatchServiceImpl implements JobMatchService {

    private static final String USER_NOT_FOUND_MESSAGE = "User not found.";
    private static final String RESUME_NOT_FOUND_MESSAGE = "Resume not found.";
    private static final String MATCH_NOT_FOUND_MESSAGE = "Job match not found.";
    private static final String RESUME_TEXT_UNAVAILABLE_MESSAGE = "Resume text is unavailable for job matching.";
    private static final String JOB_DESCRIPTION_UNAVAILABLE_MESSAGE = "Job description is required for matching.";
    private static final String GENERIC_FAILURE_MESSAGE = "AI job matching failed. Please try again later.";
    private static final int MAX_FAILURE_MESSAGE_LENGTH = 500;

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final JobDescriptionRepository jobDescriptionRepository;
    private final JobMatchRepository jobMatchRepository;
    private final JobMatchAiService jobMatchAiService;
    private final JobMatchJsonMapper jsonMapper;
    private final AiProperties aiProperties;
    private final PlatformTransactionManager transactionManager;

    @Override
    public JobMatchResponse createMatch(JobMatchRequest request, String authenticatedEmail) {
        long startedAt = System.currentTimeMillis();
        MatchRequestContext context = createProcessingMatch(request, authenticatedEmail);

        log.info("Job-match request created for resumeId={} userId={} jobMatchId={}.",
                context.resumeId(), context.userId(), context.jobMatchId());

        try {
            JobMatchAiResult result = jobMatchAiService.match(context.resumeText(), context.jobDescription());
            JobMatchResponse response = completeMatch(context.jobMatchId(), result);
            log.info("Job match completed for resumeId={} userId={} jobMatchId={} durationMs={}.",
                    context.resumeId(), context.userId(), context.jobMatchId(), elapsedMillis(startedAt));
            return response;
        } catch (RuntimeException exception) {
            failMatch(context.jobMatchId(), exception);
            log.warn("Job match failed for resumeId={} userId={} jobMatchId={} durationMs={} errorType={}.",
                    context.resumeId(),
                    context.userId(),
                    context.jobMatchId(),
                    elapsedMillis(startedAt),
                    exception.getClass().getSimpleName());
            throw exception;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public JobMatchResponse getMatch(Long matchId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        JobMatch match = jobMatchRepository.findByIdAndUserId(matchId, user.getId())
                .orElseThrow(() -> new JobMatchNotFoundException(MATCH_NOT_FOUND_MESSAGE));
        return toResponse(match);
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobMatchResponse> getCurrentUserMatches(String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        return jobMatchRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<JobMatchResponse> getResumeMatches(Long resumeId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        ensureResumeOwnedByUser(resumeId, user.getId());

        return jobMatchRepository.findAllByResumeIdAndUserIdOrderByCreatedAtDesc(resumeId, user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteMatch(Long matchId, String authenticatedEmail) {
        User user = getUser(authenticatedEmail);
        JobMatch match = jobMatchRepository.findByIdAndUserId(matchId, user.getId())
                .orElseThrow(() -> new JobMatchNotFoundException(MATCH_NOT_FOUND_MESSAGE));
        JobDescription jobDescription = match.getJobDescription();
        Long jobDescriptionId = jobDescription.getId();

        jobMatchRepository.delete(match);
        jobMatchRepository.flush();

        if (jobMatchRepository.countByJobDescriptionId(jobDescriptionId) == 0) {
            jobDescriptionRepository.delete(jobDescription);
        }
    }

    private MatchRequestContext createProcessingMatch(JobMatchRequest request, String authenticatedEmail) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        return Objects.requireNonNull(transactionTemplate.execute(status -> {
            User user = getUser(authenticatedEmail);
            Resume resume = getOwnedResume(request.getResumeId(), user.getId());
            String resumeText = resume.getExtractedText();
            String jobDescriptionText = cleanRequiredText(
                    request.getDescription(),
                    JOB_DESCRIPTION_UNAVAILABLE_MESSAGE
            );

            if (!StringUtils.hasText(resumeText)) {
                throw new ResumeTextUnavailableException(RESUME_TEXT_UNAVAILABLE_MESSAGE);
            }

            JobDescription jobDescription = JobDescription.builder()
                    .user(user)
                    .title(cleanRequiredText(request.getTitle(), "Job title is required."))
                    .companyName(cleanOptionalText(request.getCompanyName()))
                    .description(jobDescriptionText)
                    .build();
            JobDescription savedJobDescription = jobDescriptionRepository.save(jobDescription);

            JobMatch jobMatch = JobMatch.builder()
                    .user(user)
                    .resume(resume)
                    .jobDescription(savedJobDescription)
                    .status(JobMatchStatus.PROCESSING)
                    .modelName(aiProperties.getModel())
                    .build();
            JobMatch savedJobMatch = jobMatchRepository.save(jobMatch);

            return new MatchRequestContext(
                    savedJobMatch.getId(),
                    resume.getId(),
                    user.getId(),
                    resumeText,
                    jobDescriptionText
            );
        }));
    }

    private JobMatchResponse completeMatch(Long jobMatchId, JobMatchAiResult result) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        return Objects.requireNonNull(transactionTemplate.execute(status -> {
            JobMatch match = getMatchById(jobMatchId);
            match.setMatchScore(result.matchScore());
            match.setSummary(result.summary());
            match.setMatchedSkills(jsonMapper.writeCollection(result.matchedSkills(), "matchedSkills"));
            match.setMissingSkills(jsonMapper.writeCollection(result.missingSkills(), "missingSkills"));
            match.setExperienceMatch(jsonMapper.writeObject(
                    jsonMapper.toResponseSection(result.experienceMatch()),
                    "experienceMatch"
            ));
            match.setEducationMatch(jsonMapper.writeObject(
                    jsonMapper.toResponseSection(result.educationMatch()),
                    "educationMatch"
            ));
            match.setStrengths(jsonMapper.writeCollection(result.strengths(), "strengths"));
            match.setGaps(jsonMapper.writeCollection(result.gaps(), "gaps"));
            match.setRecommendations(jsonMapper.writeCollection(result.recommendations(), "recommendations"));
            match.setKeywordSuggestions(jsonMapper.writeCollection(
                    result.keywordSuggestions(),
                    "keywordSuggestions"
            ));
            match.setModelName(aiProperties.getModel());
            match.setStatus(JobMatchStatus.COMPLETED);
            match.setFailureMessage(null);

            return toResponse(jobMatchRepository.save(match));
        }));
    }

    private void failMatch(Long jobMatchId, RuntimeException exception) {
        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);

        transactionTemplate.executeWithoutResult(status ->
                jobMatchRepository.findById(jobMatchId).ifPresent(match -> {
                    match.setStatus(JobMatchStatus.FAILED);
                    match.setFailureMessage(safeFailureMessage(exception));
                    jobMatchRepository.save(match);
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

    private JobMatch getMatchById(Long jobMatchId) {
        return jobMatchRepository.findById(jobMatchId)
                .orElseThrow(() -> new JobMatchNotFoundException(MATCH_NOT_FOUND_MESSAGE));
    }

    private void ensureResumeOwnedByUser(Long resumeId, Long userId) {
        if (!resumeRepository.existsByIdAndUserId(resumeId, userId)) {
            throw new ResumeNotFoundException(RESUME_NOT_FOUND_MESSAGE);
        }
    }

    private String cleanRequiredText(String value, String message) {
        if (!StringUtils.hasText(value)) {
            throw new JobDescriptionValidationException(message);
        }
        return value.trim();
    }

    private String cleanOptionalText(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private JobMatchResponse toResponse(JobMatch match) {
        Resume resume = match.getResume();
        JobDescription jobDescription = match.getJobDescription();

        return JobMatchResponse.builder()
                .id(match.getId())
                .resumeId(resume.getId())
                .resumeFileName(resume.getOriginalFileName())
                .jobDescriptionId(jobDescription.getId())
                .jobTitle(jobDescription.getTitle())
                .companyName(jobDescription.getCompanyName())
                .matchScore(match.getMatchScore())
                .summary(match.getSummary())
                .matchedSkills(jsonMapper.readStringList(match.getMatchedSkills(), "matchedSkills"))
                .missingSkills(jsonMapper.readStringList(match.getMissingSkills(), "missingSkills"))
                .experienceMatch(jsonMapper.readMatchSection(match.getExperienceMatch(), "experienceMatch"))
                .educationMatch(jsonMapper.readMatchSection(match.getEducationMatch(), "educationMatch"))
                .strengths(jsonMapper.readStringList(match.getStrengths(), "strengths"))
                .gaps(jsonMapper.readStringList(match.getGaps(), "gaps"))
                .recommendations(jsonMapper.readStringList(match.getRecommendations(), "recommendations"))
                .keywordSuggestions(jsonMapper.readStringList(match.getKeywordSuggestions(), "keywordSuggestions"))
                .status(match.getStatus())
                .modelName(match.getModelName())
                .failureMessage(match.getFailureMessage())
                .createdAt(match.getCreatedAt())
                .updatedAt(match.getUpdatedAt())
                .build();
    }

    private String safeFailureMessage(RuntimeException exception) {
        String message = switch (exception) {
            case AiConfigurationException aiConfigurationException -> aiConfigurationException.getMessage();
            case JobMatchAiException jobMatchAiException -> jobMatchAiException.getMessage();
            case ResumeTextUnavailableException resumeTextUnavailableException ->
                    resumeTextUnavailableException.getMessage();
            case JobDescriptionValidationException jobDescriptionValidationException ->
                    jobDescriptionValidationException.getMessage();
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

    private record MatchRequestContext(
            Long jobMatchId,
            Long resumeId,
            Long userId,
            String resumeText,
            String jobDescription
    ) {
    }
}
