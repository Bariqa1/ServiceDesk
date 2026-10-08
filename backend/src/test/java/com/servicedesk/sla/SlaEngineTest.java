package com.servicedesk.sla;

import com.servicedesk.sla.service.SlaCalculationService;
import com.servicedesk.ticket.entity.SlaPolicy;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.repository.SlaPolicyRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlaEngineTest {

    @Mock
    private SlaPolicyRepository slaPolicyRepository;

    @InjectMocks
    private SlaCalculationService slaCalculationService;

    @Test
    @DisplayName("Should calculate correct response (15m) and resolution (2h) deadlines for CRITICAL priority")
    void testCriticalSlaCalculation() {
        SlaPolicy criticalPolicy = SlaPolicy.builder()
                .priority(TicketPriority.CRITICAL)
                .responseTimeMinutes(15)
                .resolutionTimeMinutes(120)
                .warningThresholdPercent(75)
                .build();

        when(slaPolicyRepository.findByPriority(TicketPriority.CRITICAL)).thenReturn(Optional.of(criticalPolicy));

        Instant creationTime = Instant.parse("2026-10-08T10:00:00Z");
        Ticket ticket = Ticket.builder()
                .priority(TicketPriority.CRITICAL)
                .build();
        ticket.setCreatedAt(creationTime);

        slaCalculationService.applySlaPolicy(ticket);

        assertThat(ticket.getResponseDeadline()).isEqualTo(creationTime.plus(Duration.ofMinutes(15)));
        assertThat(ticket.getResolutionDeadline()).isEqualTo(creationTime.plus(Duration.ofMinutes(120)));
        assertThat(ticket.getSlaStatus()).isEqualTo(SlaStatus.WITHIN_SLA);
    }

    @Test
    @DisplayName("Should correctly calculate resolution elapsed percentage (e.g. 75% for at-risk warning)")
    void testSlaElapsedPercentage() {
        Instant created = Instant.parse("2026-10-08T10:00:00Z");
        Instant deadline = Instant.parse("2026-10-08T12:00:00Z"); // 120 minutes total

        Ticket ticket = Ticket.builder().build();
        ticket.setCreatedAt(created);
        ticket.setResolutionDeadline(deadline);

        // Check at 90 minutes (75% elapsed)
        Instant nowAt75 = created.plus(Duration.ofMinutes(90));
        double percent = slaCalculationService.calculateResolutionElapsedPercent(ticket, nowAt75);

        assertThat(percent).isEqualTo(75.0);
    }
}
