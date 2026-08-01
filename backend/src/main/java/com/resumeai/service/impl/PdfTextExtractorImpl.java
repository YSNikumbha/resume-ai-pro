package com.resumeai.service.impl;

import com.resumeai.exception.ResumeProcessingException;
import com.resumeai.service.PdfTextExtractor;
import java.io.IOException;
import java.nio.file.Path;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PdfTextExtractorImpl implements PdfTextExtractor {

    private static final String NO_READABLE_TEXT_MESSAGE = "No readable text could be extracted from the PDF.";
    private static final String EXTRACTION_FAILED_MESSAGE = "Unable to extract text from the PDF.";
    private static final String ENCRYPTED_PDF_MESSAGE = "Encrypted PDF files cannot be read.";

    @Override
    public String extractText(Path filePath) {
        try (PDDocument document = Loader.loadPDF(filePath.toFile())) {
            return extractReadableText(document);
        } catch (InvalidPasswordException exception) {
            throw new ResumeProcessingException(ENCRYPTED_PDF_MESSAGE, exception);
        } catch (IOException exception) {
            throw new ResumeProcessingException(EXTRACTION_FAILED_MESSAGE, exception);
        }
    }

    @Override
    public String extractText(MultipartFile file) {
        try (PDDocument document = Loader.loadPDF(file.getBytes())) {
            return extractReadableText(document);
        } catch (InvalidPasswordException exception) {
            throw new ResumeProcessingException(ENCRYPTED_PDF_MESSAGE, exception);
        } catch (IOException exception) {
            throw new ResumeProcessingException(EXTRACTION_FAILED_MESSAGE, exception);
        }
    }

    private String extractReadableText(PDDocument document) throws IOException {
        String extractedText = new PDFTextStripper().getText(document).trim();

        if (extractedText.isBlank()) {
            throw new ResumeProcessingException(NO_READABLE_TEXT_MESSAGE);
        }

        return extractedText;
    }
}
