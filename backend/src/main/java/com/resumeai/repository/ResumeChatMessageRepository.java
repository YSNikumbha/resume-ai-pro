package com.resumeai.repository;

import com.resumeai.entity.ResumeChatMessage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResumeChatMessageRepository extends JpaRepository<ResumeChatMessage, Long> {

    List<ResumeChatMessage> findAllByResumeIdAndUserIdOrderByCreatedAtDesc(Long resumeId, Long userId);

    Optional<ResumeChatMessage> findByIdAndUserId(Long id, Long userId);

    void deleteAllByResumeIdAndUserId(Long resumeId, Long userId);
}
