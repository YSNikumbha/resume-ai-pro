package com.resumeai.service;

import com.resumeai.dto.rag.ResumeChunk;
import java.util.List;

public interface ResumeChunkingService {

    List<ResumeChunk> chunk(String resumeText);
}
