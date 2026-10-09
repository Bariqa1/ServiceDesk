package com.servicedesk.ai.dto;

import lombok.Builder;

@Builder
public record AiKnowledgeMatchDTO(
        String articleId,
        String title,
        double relevanceScore,
        String recommendedSolution,
        String rootCause,
        String category
) {}
