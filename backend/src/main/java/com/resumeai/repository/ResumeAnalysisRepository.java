package com.resumeai.repository;

import com.resumeai.entity.AnalysisStatus;
import com.resumeai.entity.ResumeAnalysis;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResumeAnalysisRepository extends JpaRepository<ResumeAnalysis, Long> {

    List<ResumeAnalysis> findAllByUserIdOrderByAnalyzedAtDesc(Long userId);

    List<ResumeAnalysis> findAllByResumeIdAndUserIdOrderByAnalyzedAtDesc(Long resumeId, Long userId);

    Optional<ResumeAnalysis> findByIdAndUserId(Long id, Long userId);

    Optional<ResumeAnalysis> findFirstByResumeIdAndUserIdAndStatusOrderByAnalyzedAtDesc(
            Long resumeId,
            Long userId,
            AnalysisStatus status
    );

    @Modifying
    @Query("""
            delete from ResumeAnalysis analysis
            where analysis.resume.id = :resumeId
              and analysis.user.id = :userId
            """)
    int deleteAllByResumeIdAndUserId(@Param("resumeId") Long resumeId, @Param("userId") Long userId);
}
