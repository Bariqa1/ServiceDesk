package com.servicedesk.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.servicedesk.ai.client.AiServiceClient;
import com.servicedesk.ai.dto.AiAgentAnalysisResponseDTO;
import com.servicedesk.ai.dto.AiAnalysisRequestDTO;
import com.servicedesk.ai.dto.AiApproveProposalRequestDTO;
import com.servicedesk.ai.entity.AiAuditLog;
import com.servicedesk.ai.repository.AiAuditLogRepository;
import com.servicedesk.common.exception.ResourceNotFoundException;
import com.servicedesk.ticket.entity.AuditLog;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.entity.TicketComment;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.repository.AuditLogRepository;
import com.servicedesk.ticket.repository.TicketCommentRepository;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.websocket.service.TicketBroadcasterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAgentService {

    private final TicketRepository ticketRepository;
    private final TicketCommentRepository ticketCommentRepository;
    private final AuditLogRepository auditLogRepository;
    private final AiAuditLogRepository aiAuditLogRepository;
    private final AiServiceClient aiServiceClient;
    private final TicketBroadcasterService ticketBroadcasterService;
    private final ObjectMapper objectMapper;

    public Ticket resolveTicket(String identifier) {
        try {
            UUID uuid = UUID.fromString(identifier);
            return ticketRepository.findByPublicId(uuid)
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with UUID: " + identifier));
        } catch (IllegalArgumentException ex) {
            return ticketRepository.findByTicketNumber(identifier)
                    .orElseGet(() -> {
                        try {
                            Long id = Long.parseLong(identifier);
                            return ticketRepository.findById(id)
                                    .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + identifier));
                        } catch (NumberFormatException nfe) {
                            throw new ResourceNotFoundException("Invalid ticket identifier: " + identifier);
                        }
                    });
        }
    }

    @Transactional
    public AiAgentAnalysisResponseDTO diagnoseTicket(String identifier) {
        Ticket ticket = resolveTicket(identifier);

        log.info("Executing Multi-Agent State Machine for ticket [{}]", ticket.getTicketNumber());

        AiAnalysisRequestDTO request = AiAnalysisRequestDTO.builder()
                .ticketId(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .category(ticket.getCategory() != null ? ticket.getCategory().getName() : "General")
                .priority(ticket.getPriority() != null ? ticket.getPriority().name() : "MEDIUM")
                .status(ticket.getStatus() != null ? ticket.getStatus().name() : "NEW")
                .requesterEmail(ticket.getRequester() != null ? ticket.getRequester().getEmail() : "user@company.sa")
                .requesterName(ticket.getRequester() != null ? ticket.getRequester().getFullName() : "Employee")
                .createdAt(ticket.getCreatedAt() != null ? ticket.getCreatedAt().toString() : Instant.now().toString())
                .build();

        AiAgentAnalysisResponseDTO response = aiServiceClient.runMultiAgentDiagnosis(request);

        String trajectoryJson = "[]";
        try {
            trajectoryJson = objectMapper.writeValueAsString(response.trajectory());
        } catch (Exception ex) {
            log.warn("Failed to serialize AI trajectory: {}", ex.getMessage());
        }

        String guardrailStatus = response.guardrailReport() != null ? response.guardrailReport().status() : "PASSED";
        Double guardrailRisk = response.guardrailReport() != null ? response.guardrailReport().riskScore() : 5.0;
        int violationsCount = (response.guardrailReport() != null && response.guardrailReport().violations() != null)
                ? response.guardrailReport().violations().size() : 0;

        AiAuditLog aiAuditLog = AiAuditLog.builder()
                .ticketId(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .predictedCategory(response.predictedCategory())
                .calculatedPriority(response.calculatedPriority())
                .confidenceScore(response.confidenceScore())
                .actionType(response.actionType())
                .requiresHumanApproval(response.requiresHumanApproval())
                .approvalStatus(response.requiresHumanApproval() ? "PENDING" : "AUTO_APPLIED")
                .rootCauseAnalysis(response.rootCauseAnalysis())
                .proposedResolution(response.proposedResolution())
                .trajectoryJson(trajectoryJson)
                .guardrailStatus(guardrailStatus)
                .guardrailRiskScore(guardrailRisk)
                .guardrailViolationsCount(violationsCount)
                .build();

        aiAuditLogRepository.save(aiAuditLog);

        auditLogRepository.save(AuditLog.builder()
                .ticket(ticket)
                .action("AI_AGENT_DIAGNOSIS_COMPLETED")
                .performedBy(ticket.getAssignedAgent() != null ? ticket.getAssignedAgent() : ticket.getRequester())
                .details(String.format("Confidence: %.1f%% | Action: %s | Guardrails: %s", response.confidenceScore(), response.actionType(), guardrailStatus))
                .build());

        ticketBroadcasterService.broadcastTicketEvent(
                "AI_DIAGNOSIS_COMPLETED",
                ticket,
                "Autonomous Multi-Agent diagnosis completed with " + response.confidenceScore() + "% confidence."
        );

        return response;
    }

    @Transactional
    public Ticket approveProposal(String identifier, AiApproveProposalRequestDTO request, String approvedBy) {
        Ticket ticket = resolveTicket(identifier);

        AiAuditLog latestAiLog = aiAuditLogRepository.findFirstByTicketIdOrderByCreatedAtDesc(ticket.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No AI diagnosis found for ticket: " + ticket.getTicketNumber()));

        latestAiLog.setApprovalStatus("APPROVED");
        latestAiLog.setApprovedBy(approvedBy != null ? approvedBy : "Technician");
        latestAiLog.setApprovedAt(LocalDateTime.now());
        aiAuditLogRepository.save(latestAiLog);

        String commentContent = String.format("🤖 [AI Recommendation Approved by %s]\n\n**Root Cause:**\n%s\n\n**Applied Solution:**\n%s%s",
                approvedBy != null ? approvedBy : "Technician",
                latestAiLog.getRootCauseAnalysis(),
                latestAiLog.getProposedResolution(),
                request.notes() != null && !request.notes().isBlank() ? "\n\n**Technician Note:** " + request.notes() : ""
        );

        ticketCommentRepository.save(TicketComment.builder()
                .ticket(ticket)
                .author(ticket.getAssignedAgent() != null ? ticket.getAssignedAgent() : ticket.getRequester())
                .content(commentContent)
                .internal(false)
                .build());

        if ("RESOLVE".equalsIgnoreCase(request.action()) || "AUTO_RESOLVE".equalsIgnoreCase(request.action())) {
            ticket.setStatus(TicketStatus.RESOLVED);
            ticket.setResolutionSummary(latestAiLog.getProposedResolution());
            ticket.setResolvedAt(Instant.now());
            ticketRepository.save(ticket);

            auditLogRepository.save(AuditLog.builder()
                    .ticket(ticket)
                    .action("TICKET_RESOLVED_VIA_AI_APPROVAL")
                    .performedBy(ticket.getAssignedAgent() != null ? ticket.getAssignedAgent() : ticket.getRequester())
                    .oldValue(TicketStatus.IN_PROGRESS.name())
                    .newValue(TicketStatus.RESOLVED.name())
                    .details("Resolved via approved AI recommendation by " + approvedBy)
                    .build());
        }

        ticketBroadcasterService.broadcastTicketEvent(
                "TICKET_RESOLVED",
                ticket,
                "Ticket resolved and approved via AI Agent recommendation."
        );

        return ticket;
    }

    @Transactional(readOnly = true)
    public List<AiAuditLog> getTicketAiHistory(String identifier) {
        Ticket ticket = resolveTicket(identifier);
        return aiAuditLogRepository.findByTicketIdOrderByCreatedAtDesc(ticket.getId());
    }
}
