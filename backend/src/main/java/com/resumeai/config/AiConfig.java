package com.resumeai.config;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(AiProperties.class)
public class AiConfig {

    private final AiProperties aiProperties;

    @Bean
    @ConditionalOnProperty(name = "spring.ai.model.chat", havingValue = "google-genai")
    public ChatClient resumeAnalysisChatClient(ObjectProvider<ChatClient.Builder> builderProvider) {
        ChatClient.Builder builder = builderProvider.getIfAvailable();
        if (builder == null) {
            throw new IllegalStateException("Spring AI ChatClient builder is unavailable.");
        }

        return builder
                .defaultOptions(ChatOptions.builder()
                        .model(aiProperties.getModel())
                        .temperature(aiProperties.getTemperature())
                        .build())
                .build();
    }
}
