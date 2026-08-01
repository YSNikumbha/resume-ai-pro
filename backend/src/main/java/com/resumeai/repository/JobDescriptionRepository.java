package com.resumeai.repository;

import com.resumeai.entity.JobDescription;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobDescriptionRepository extends JpaRepository<JobDescription, Long> {

    List<JobDescription> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<JobDescription> findByIdAndUserId(Long id, Long userId);
}
