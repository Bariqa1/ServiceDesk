package com.servicedesk.ai.dto;

import lombok.Builder;

@Builder
public record AiGuardrailViolationDTO(
        String rule,
        String severity,
        String details,
        String actionTaken
) {}
