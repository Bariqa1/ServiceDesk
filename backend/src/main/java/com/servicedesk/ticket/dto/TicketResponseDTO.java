package com.servicedesk.ticket.dto;

import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponseDTO {
    private UUID publicId;
    private String ticketNumber;
    private String title;
    private String description;
    private TicketStatus status;
    private TicketPriority priority;

    // Requester & Assignee
    private String requesterFullName;
    private String requesterEmail;
    private String requesterDepartment;
    private UUID requesterPublicId;

    private String assignedAgentFullName;
    private UUID assignedAgentPublicId;
    private String assignedTeamName;
    private UUID assignedTeamPublicId;

    // Category & Service
    private String categoryName;
    private String categoryCode;
    private UUID categoryPublicId;
    private String serviceName;
    private UUID servicePublicId;

    // SLA & Timelines
    private SlaStatus slaStatus;
    private boolean escalated;
    private String escalationReason;
    private Instant responseDeadline;
    private Instant resolutionDeadline;
    private double slaElapsedPercent;
    private Instant firstRespondedAt;
    private Instant resolvedAt;
    private Instant closedAt;
    private String resolutionSummary;

    private Instant createdAt;
    private Instant updatedAt;

    // Sub-collections
    private List<TicketCommentResponseDTO> comments;
    private List<WorkLogResponseDTO> workLogs;
    private List<AuditLogResponseDTO> auditLogs;
}
