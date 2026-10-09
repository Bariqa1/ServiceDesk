package com.servicedesk.ai.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record AiGuardrailReportDTO(
        String status,
        double riskScore,
        String sanitizedTitle,
        String sanitizedDescription,
        List<AiGuardrailViolationDTO> violations,
        boolean promptInjectionDetected,
        boolean piiRedacted,
        boolean secretsRedacted,
        boolean destructiveCommandsBlocked
) {}
