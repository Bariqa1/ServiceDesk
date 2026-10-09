package com.servicedesk.ai.dto;

import lombok.Builder;

@Builder
public record AiAnalysisRequestDTO(
        Long ticketId,
        String ticketNumber,
        String title,
        String description,
        String category,
        String priority,
        String status,
        String requesterEmail,
        String requesterName,
        String createdAt
) {}
