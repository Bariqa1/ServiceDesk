package com.servicedesk.ticket.mapper;

import com.servicedesk.sla.service.SlaCalculationService;
import com.servicedesk.ticket.dto.*;
import com.servicedesk.ticket.entity.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class TicketMapper {

    private final SlaCalculationService slaCalculationService;

    public TicketResponseDTO toDTO(Ticket ticket) {
        if (ticket == null) return null;

        double elapsed = slaCalculationService.calculateResolutionElapsedPercent(ticket, Instant.now());

        return TicketResponseDTO.builder()
                .publicId(ticket.getPublicId())
                .ticketNumber(ticket.getTicketNumber())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())

                .requesterFullName(ticket.getRequester() != null ? ticket.getRequester().getFullName() : null)
                .requesterEmail(ticket.getRequester() != null ? ticket.getRequester().getEmail() : null)
                .requesterDepartment(ticket.getRequester() != null ? ticket.getRequester().getDepartment() : null)
                .requesterPublicId(ticket.getRequester() != null ? ticket.getRequester().getPublicId() : null)

                .assignedAgentFullName(ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getFullName() : null)
                .assignedAgentPublicId(ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getPublicId() : null)
                .assignedTeamName(ticket.getAssignedTeam() != null ? ticket.getAssignedTeam().getName() : null)
                .assignedTeamPublicId(ticket.getAssignedTeam() != null ? ticket.getAssignedTeam().getPublicId() : null)

                .categoryName(ticket.getCategory() != null ? ticket.getCategory().getName() : null)
                .categoryCode(ticket.getCategory() != null ? ticket.getCategory().getCode() : null)
                .categoryPublicId(ticket.getCategory() != null ? ticket.getCategory().getPublicId() : null)
                .serviceName(ticket.getService() != null ? ticket.getService().getName() : null)
                .servicePublicId(ticket.getService() != null ? ticket.getService().getPublicId() : null)

                .slaStatus(ticket.getSlaStatus())
                .escalated(ticket.isEscalated())
                .escalationReason(ticket.getEscalationReason())
                .responseDeadline(ticket.getResponseDeadline())
                .resolutionDeadline(ticket.getResolutionDeadline())
                .slaElapsedPercent(Math.round(elapsed * 10.0) / 10.0)
                .firstRespondedAt(ticket.getFirstRespondedAt())
                .resolvedAt(ticket.getResolvedAt())
                .closedAt(ticket.getClosedAt())
                .resolutionSummary(ticket.getResolutionSummary())

                .createdAt(ticket.getCreatedAt())
                .updatedAt(ticket.getUpdatedAt())

                .comments(toCommentDTOs(ticket.getComments()))
                .workLogs(toWorkLogDTOs(ticket.getWorkLogs()))
                .auditLogs(toAuditLogDTOs(ticket.getAuditLogs()))
                .build();
    }

    public List<TicketCommentResponseDTO> toCommentDTOs(List<TicketComment> comments) {
        if (comments == null) return Collections.emptyList();
        return comments.stream()
                .map(c -> TicketCommentResponseDTO.builder()
                        .publicId(c.getPublicId())
                        .authorFullName(c.getAuthor() != null ? c.getAuthor().getFullName() : "Unknown")
                        .authorUsername(c.getAuthor() != null ? c.getAuthor().getUsername() : "")
                        .authorPublicId(c.getAuthor() != null ? c.getAuthor().getPublicId() : null)
                        .content(c.getContent())
                        .internal(c.isInternal())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<WorkLogResponseDTO> toWorkLogDTOs(List<WorkLog> workLogs) {
        if (workLogs == null) return Collections.emptyList();
        return workLogs.stream()
                .map(w -> WorkLogResponseDTO.builder()
                        .publicId(w.getPublicId())
                        .agentFullName(w.getAgent() != null ? w.getAgent().getFullName() : "Unknown")
                        .agentPublicId(w.getAgent() != null ? w.getAgent().getPublicId() : null)
                        .timeSpentMinutes(w.getTimeSpentMinutes())
                        .description(w.getDescription())
                        .loggedAt(w.getLoggedAt())
                        .build())
                .collect(Collectors.toList());
    }

    public List<AuditLogResponseDTO> toAuditLogDTOs(List<AuditLog> auditLogs) {
        if (auditLogs == null) return Collections.emptyList();
        return auditLogs.stream()
                .map(a -> AuditLogResponseDTO.builder()
                        .publicId(a.getPublicId())
                        .performedByFullName(a.getPerformedBy() != null ? a.getPerformedBy().getFullName() : "SYSTEM")
                        .action(a.getAction())
                        .oldValue(a.getOldValue())
                        .newValue(a.getNewValue())
                        .details(a.getDetails())
                        .timestamp(a.getTimestamp())
                        .build())
                .collect(Collectors.toList());
    }

    public CategoryResponseDTO toCategoryDTO(Category category) {
        if (category == null) return null;
        return CategoryResponseDTO.builder()
                .publicId(category.getPublicId())
                .name(category.getName())
                .code(category.getCode())
                .description(category.getDescription())
                .iconName(category.getIconName())
                .build();
    }

    public ServiceResponseDTO toServiceDTO(ServiceEntity service) {
        if (service == null) return null;
        return ServiceResponseDTO.builder()
                .publicId(service.getPublicId())
                .name(service.getName())
                .description(service.getDescription())
                .categoryName(service.getCategory() != null ? service.getCategory().getName() : null)
                .categoryPublicId(service.getCategory() != null ? service.getCategory().getPublicId() : null)
                .defaultPriority(service.getDefaultPriority())
                .build();
    }
}
