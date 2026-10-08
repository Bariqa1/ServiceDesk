package com.servicedesk.websocket.dto;

import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketEventDTO {
    private String eventType; // TICKET_CREATED, TICKET_ASSIGNED, STATUS_CHANGED, COMMENT_ADDED, SLA_WARNING, SLA_BREACHED, TICKET_ESCALATED
    private UUID ticketPublicId;
    private String ticketNumber;
    private String title;
    private TicketStatus status;
    private TicketPriority priority;
    private SlaStatus slaStatus;
    private String assignedAgentName;
    private String requesterName;
    private String message;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
