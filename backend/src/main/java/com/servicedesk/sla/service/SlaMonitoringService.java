package com.servicedesk.sla.service;

import com.servicedesk.ticket.entity.AuditLog;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.websocket.service.TicketBroadcasterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaMonitoringService {

    private final TicketRepository ticketRepository;
    private final SlaCalculationService slaCalculationService;
    private final TicketBroadcasterService broadcasterService;

    @Transactional
    public int checkAndEscalateActiveSlas() {
        List<Ticket> activeTickets = ticketRepository.findActiveTicketsForSlaCheck();
        Instant now = Instant.now();
        int affectedCount = 0;

        for (Ticket ticket : activeTickets) {
            SlaStatus previousStatus = ticket.getSlaStatus();
            boolean previouslyEscalated = ticket.isEscalated();

            // 1. Check if Resolution Deadline Breached
            if (ticket.getResolutionDeadline() != null && now.isAfter(ticket.getResolutionDeadline())) {
                ticket.setSlaStatus(SlaStatus.BREACHED);

                if (!previouslyEscalated) {
                    ticket.setEscalated(true);
                    ticket.setEscalationReason("Automated SLA Breach: Resolution deadline exceeded at " + ticket.getResolutionDeadline());

                    ticket.addAuditLog(AuditLog.builder()
                            .action("SLA_BREACH_AUTO_ESCALATED")
                            .oldValue(previousStatus.name())
                            .newValue(SlaStatus.BREACHED.name())
                            .details("Resolution deadline of " + ticket.getResolutionDeadline() + " has elapsed. Automatically escalated to Service Manager.")
                            .timestamp(now)
                            .build());

                    broadcasterService.broadcastTicketEvent("TICKET_ESCALATED", ticket, "Ticket " + ticket.getTicketNumber() + " breached SLA and was auto-escalated!");
                    affectedCount++;
                } else if (previousStatus != SlaStatus.BREACHED) {
                    broadcasterService.broadcastTicketEvent("SLA_BREACHED", ticket, "Ticket " + ticket.getTicketNumber() + " resolution SLA is now BREACHED");
                    affectedCount++;
                }
            } else {
                // 2. Check if At Risk (> 75% elapsed)
                double elapsedPercent = slaCalculationService.calculateResolutionElapsedPercent(ticket, now);
                int threshold = ticket.getSlaPolicy() != null ? ticket.getSlaPolicy().getWarningThresholdPercent() : 75;

                if (elapsedPercent >= threshold && previousStatus == SlaStatus.WITHIN_SLA) {
                    ticket.setSlaStatus(SlaStatus.AT_RISK);

                    ticket.addAuditLog(AuditLog.builder()
                            .action("SLA_WARNING_TRIGGERED")
                            .oldValue(SlaStatus.WITHIN_SLA.name())
                            .newValue(SlaStatus.AT_RISK.name())
                            .details(String.format("Resolution time elapsed is %.1f%% (>= %d%%). SLA status marked AT_RISK.", elapsedPercent, threshold))
                            .timestamp(now)
                            .build());

                    broadcasterService.broadcastTicketEvent("SLA_WARNING", ticket, "Ticket " + ticket.getTicketNumber() + " resolution time is at risk (" + (int)elapsedPercent + "% elapsed)");
                    affectedCount++;
                }
            }

            ticketRepository.save(ticket);
        }

        if (affectedCount > 0) {
            log.info("SLA Monitor: Processed {} active tickets, updated/escalated {} tickets.", activeTickets.size(), affectedCount);
        }

        return affectedCount;
    }
}
