package com.servicedesk.ai.dto;

import lombok.Builder;

@Builder
public record AiTrajectoryStepDTO(
        int stepIndex,
        String agent,
        String action,
        String thought,
        String toolCalled,
        String observation,
        String timestamp
) {}
