package com.servicedesk.ai.dto;

import lombok.Builder;
import java.util.Map;

@Builder
public record AiDiagnosticResultDTO(
        String toolName,
        String status,
        Map<String, Object> details
) {}
