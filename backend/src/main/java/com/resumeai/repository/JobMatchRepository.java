package com.resumeai.repository;

import com.resumeai.entity.JobMatch;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobMatchRepository extends JpaRepository<JobMatch, Long> {

    List<JobMatch> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    List<JobMatch> findAllByResumeIdAndUserIdOrderByCreatedAtDesc(Long resumeId, Long userId);

    Optional<JobMatch> findByIdAndUserId(Long id, Long userId);

    long countByJobDescriptionId(Long jobDescriptionId);
}
