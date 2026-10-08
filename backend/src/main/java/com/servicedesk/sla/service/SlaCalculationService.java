package com.servicedesk.sla.service;

import com.servicedesk.ticket.entity.SlaPolicy;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.repository.SlaPolicyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class SlaCalculationService {

    private final SlaPolicyRepository slaPolicyRepository;

    public void applySlaPolicy(Ticket ticket) {
        TicketPriority priority = ticket.getPriority();
        SlaPolicy policy = slaPolicyRepository.findByPriority(priority)
                .orElseGet(() -> getDefaultPolicy(priority));

        ticket.setSlaPolicy(policy);
        Instant now = ticket.getCreatedAt() != null ? ticket.getCreatedAt() : Instant.now();

        ticket.setResponseDeadline(now.plus(Duration.ofMinutes(policy.getResponseTimeMinutes())));
        ticket.setResolutionDeadline(now.plus(Duration.ofMinutes(policy.getResolutionTimeMinutes())));
        ticket.setSlaStatus(SlaStatus.WITHIN_SLA);
    }

    public double calculateResolutionElapsedPercent(Ticket ticket, Instant now) {
        if (ticket.getCreatedAt() == null || ticket.getResolutionDeadline() == null) {
            return 0.0;
        }

        long totalDurationMs = Duration.between(ticket.getCreatedAt(), ticket.getResolutionDeadline()).toMillis();
        if (totalDurationMs <= 0) return 100.0;

        long elapsedMs = Duration.between(ticket.getCreatedAt(), now).toMillis();
        return Math.min(100.0, Math.max(0.0, ((double) elapsedMs / totalDurationMs) * 100.0));
    }

    public SlaPolicy getDefaultPolicy(TicketPriority priority) {
        return switch (priority) {
            case CRITICAL -> SlaPolicy.builder()
                    .priority(TicketPriority.CRITICAL)
                    .responseTimeMinutes(15)
                    .resolutionTimeMinutes(120) // 2 hours
                    .warningThresholdPercent(75)
                    .build();
            case HIGH -> SlaPolicy.builder()
                    .priority(TicketPriority.HIGH)
                    .responseTimeMinutes(30)
                    .resolutionTimeMinutes(240) // 4 hours
                    .warningThresholdPercent(75)
                    .build();
            case MEDIUM -> SlaPolicy.builder()
                    .priority(TicketPriority.MEDIUM)
                    .responseTimeMinutes(120) // 2 hours
                    .resolutionTimeMinutes(480) // 8 hours
                    .warningThresholdPercent(75)
                    .build();
            case LOW -> SlaPolicy.builder()
                    .priority(TicketPriority.LOW)
                    .responseTimeMinutes(240) // 4 hours
                    .resolutionTimeMinutes(1440) // 24 hours
                    .warningThresholdPercent(75)
                    .build();
        };
    }
}
