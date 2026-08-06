package com.resumeai.config;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;
import org.springframework.util.StringUtils;

public class AiEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    private static final String PROPERTY_SOURCE_NAME = "resumeAiDynamicAiModelSelection";
    private static final String CHAT_MODEL_PROPERTY = "spring.ai.model.chat";
    private static final String EMBEDDING_MODEL_PROPERTY = "spring.ai.model.embedding.text";
    private static final String VECTOR_STORE_TYPE_PROPERTY = "spring.ai.vectorstore.type";
    private static final String GEMINI_API_KEY_PROPERTY = "GEMINI_API_KEY";
    private static final String SPRING_AI_GEMINI_API_KEY_PROPERTY = "SPRING_AI_GOOGLE_GENAI_API_KEY";
    private static final String GOOGLE_GENAI_API_KEY_PROPERTY = "spring.ai.google.genai.api-key";
    private static final String GOOGLE_GENAI_EMBEDDING_API_KEY_PROPERTY = "spring.ai.google.genai.embedding.api-key";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String apiKey = firstConfiguredValue(
                environment.getProperty(GEMINI_API_KEY_PROPERTY),
                environment.getProperty(SPRING_AI_GEMINI_API_KEY_PROPERTY),
                environment.getProperty(GOOGLE_GENAI_API_KEY_PROPERTY)
        );

        Map<String, Object> properties = new LinkedHashMap<>();
        properties.put(CHAT_MODEL_PROPERTY, apiKey == null ? "none" : "google-genai");
        properties.put(EMBEDDING_MODEL_PROPERTY, apiKey == null ? "none" : "google-genai");
        properties.put(VECTOR_STORE_TYPE_PROPERTY, apiKey == null ? "none" : "pgvector");
        if (apiKey != null) {
            properties.put(GOOGLE_GENAI_API_KEY_PROPERTY, apiKey);
            properties.put(GOOGLE_GENAI_EMBEDDING_API_KEY_PROPERTY, apiKey);
        }

        environment.getPropertySources().addFirst(new MapPropertySource(PROPERTY_SOURCE_NAME, properties));
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }

    private String firstConfiguredValue(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value) && !isUnresolvedPlaceholder(value)) {
                return value.trim();
            }
        }
        return null;
    }

    private boolean isUnresolvedPlaceholder(String value) {
        String trimmedValue = value.trim();
        return trimmedValue.startsWith("${") && trimmedValue.endsWith("}");
    }
}
