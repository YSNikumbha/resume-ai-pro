package com.resumeai.service.impl;

import com.resumeai.config.RagProperties;
import com.resumeai.dto.rag.ResumeChunk;
import com.resumeai.exception.ResumeTextUnavailableException;
import com.resumeai.service.ResumeChunkingService;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ResumeChunkingServiceImpl implements ResumeChunkingService {

    private static final String DEFAULT_SECTION = "GENERAL";
    private static final int MIN_CHUNK_CHARACTERS = 80;
    private static final Set<String> COMMON_SECTIONS = Set.of(
            "SUMMARY",
            "PROFESSIONAL SUMMARY",
            "PROFILE",
            "OBJECTIVE",
            "SKILLS",
            "TECHNICAL SKILLS",
            "EXPERIENCE",
            "WORK EXPERIENCE",
            "PROFESSIONAL EXPERIENCE",
            "EMPLOYMENT",
            "EDUCATION",
            "PROJECTS",
            "CERTIFICATIONS",
            "CERTIFICATION",
            "ACHIEVEMENTS",
            "AWARDS"
    );

    private final RagProperties ragProperties;

    @Override
    public List<ResumeChunk> chunk(String resumeText) {
        if (!StringUtils.hasText(resumeText)) {
            throw new ResumeTextUnavailableException("Resume text is unavailable for indexing.");
        }

        String normalizedText = normalizeText(resumeText);
        List<SectionBlock> sections = splitIntoSections(normalizedText);
        List<ResumeChunk> chunks = new ArrayList<>();

        for (SectionBlock section : sections) {
            splitSection(section, chunks);
        }

        List<ResumeChunk> reindexedChunks = new ArrayList<>(chunks.size());
        for (int index = 0; index < chunks.size(); index++) {
            ResumeChunk chunk = chunks.get(index);
            reindexedChunks.add(new ResumeChunk(
                    chunk.content(),
                    index,
                    chunk.sectionName(),
                    chunk.startCharacter(),
                    chunk.endCharacter()
            ));
        }

        return List.copyOf(reindexedChunks);
    }

    private String normalizeText(String text) {
        return text.replace("\r\n", "\n")
                .replace('\r', '\n')
                .replaceAll("[ \\t]+\\n", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
    }

    private List<SectionBlock> splitIntoSections(String text) {
        List<SectionBlock> sections = new ArrayList<>();
        String currentSection = DEFAULT_SECTION;
        int currentStart = 0;
        int cursor = 0;

        String[] lines = text.split("\n", -1);
        for (String line : lines) {
            String heading = detectHeading(line);
            if (heading != null && cursor > currentStart) {
                addSection(sections, currentSection, text.substring(currentStart, cursor), currentStart);
                currentSection = heading;
                currentStart = cursor;
            } else if (heading != null) {
                currentSection = heading;
            }
            cursor += line.length() + 1;
        }

        if (currentStart < text.length()) {
            addSection(sections, currentSection, text.substring(currentStart), currentStart);
        }

        return sections.isEmpty()
                ? List.of(new SectionBlock(DEFAULT_SECTION, text, 0))
                : sections;
    }

    private String detectHeading(String line) {
        String cleaned = line.replace(":", "").trim();
        if (cleaned.isBlank() || cleaned.length() > 60) {
            return null;
        }

        String normalized = cleaned.toUpperCase(Locale.ROOT);
        if (COMMON_SECTIONS.contains(normalized)) {
            return normalized;
        }

        return null;
    }

    private void addSection(List<SectionBlock> sections, String sectionName, String content, int startCharacter) {
        String trimmedContent = content.trim();
        if (!trimmedContent.isBlank()) {
            int leadingWhitespace = content.indexOf(trimmedContent);
            sections.add(new SectionBlock(
                    StringUtils.hasText(sectionName) ? sectionName : DEFAULT_SECTION,
                    trimmedContent,
                    Math.max(0, startCharacter + leadingWhitespace)
            ));
        }
    }

    private void splitSection(SectionBlock section, List<ResumeChunk> chunks) {
        String content = section.content();
        int chunkSize = ragProperties.getChunkSize();
        int overlap = Math.min(ragProperties.getChunkOverlap(), Math.max(0, chunkSize - 1));
        int start = 0;

        while (start < content.length()) {
            int end = Math.min(content.length(), start + chunkSize);
            if (end < content.length()) {
                end = findNaturalBreak(content, start, end);
            }

            String chunkContent = content.substring(start, end).trim();
            if (chunkContent.length() >= MIN_CHUNK_CHARACTERS || content.length() <= MIN_CHUNK_CHARACTERS) {
                int leadingWhitespace = content.substring(start, end).indexOf(chunkContent);
                int chunkStart = section.startCharacter() + start + Math.max(0, leadingWhitespace);
                chunks.add(new ResumeChunk(
                        chunkContent,
                        chunks.size(),
                        section.sectionName(),
                        chunkStart,
                        chunkStart + chunkContent.length()
                ));
            }

            if (end >= content.length()) {
                break;
            }

            int nextStart = Math.max(0, end - overlap);
            if (nextStart <= start) {
                nextStart = end;
            }
            start = nextStart;
        }
    }

    private int findNaturalBreak(String content, int start, int targetEnd) {
        int minEnd = Math.min(content.length(), start + Math.max(MIN_CHUNK_CHARACTERS, targetEnd - start - 200));

        for (int index = targetEnd; index > minEnd; index--) {
            char character = content.charAt(index - 1);
            if (character == '\n' || character == '.' || character == ';') {
                return index;
            }
        }

        for (int index = targetEnd; index > minEnd; index--) {
            if (Character.isWhitespace(content.charAt(index - 1))) {
                return index;
            }
        }

        return targetEnd;
    }

    private record SectionBlock(String sectionName, String content, int startCharacter) {
    }
}
