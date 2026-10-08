package com.servicedesk.websocket.service;

import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.websocket.dto.TicketEventDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketBroadcasterService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastTicketEvent(String eventType, Ticket ticket, String message) {
        TicketEventDTO event = TicketEventDTO.builder()
                .eventType(eventType)
                .ticketPublicId(ticket.getPublicId())
                .ticketNumber(ticket.getTicketNumber())
                .title(ticket.getTitle())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .slaStatus(ticket.getSlaStatus())
                .assignedAgentName(ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getFullName() : "Unassigned")
                .requesterName(ticket.getRequester() != null ? ticket.getRequester().getFullName() : "Unknown")
                .message(message)
                .build();

        log.info("Broadcasting WebSocket Event: [{}] for Ticket {}", eventType, ticket.getTicketNumber());
        messagingTemplate.convertAndSend("/topic/tickets", event);

        if (eventType.startsWith("SLA_") || "TICKET_ESCALATED".equals(eventType)) {
            messagingTemplate.convertAndSend("/topic/sla-alerts", event);
        }
    }
}
