package com.servicedesk.ai.dto;

import lombok.Builder;
import java.util.List;

@Builder
public record AiAgentAnalysisResponseDTO(
        String ticketNumber,
        String languageDetected,
        String predictedCategory,
        String calculatedPriority,
        double urgencyScore,
        double confidenceScore,
        String actionType,
        boolean requiresHumanApproval,
        String rootCauseAnalysis,
        String proposedResolution,
        String suggestedTeam,
        String slaBreachRisk,
        List<AiTrajectoryStepDTO> trajectory,
        List<AiKnowledgeMatchDTO> knowledgeMatches,
        List<AiDiagnosticResultDTO> diagnosticResults,
        AiGuardrailReportDTO guardrailReport
) {}
