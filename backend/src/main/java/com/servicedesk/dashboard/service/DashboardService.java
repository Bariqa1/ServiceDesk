package com.servicedesk.dashboard.service;

import com.servicedesk.dashboard.dto.DashboardMetricsDTO;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TicketRepository ticketRepository;

    @Transactional(readOnly = true)
    public DashboardMetricsDTO getExecutiveMetrics() {
        List<Ticket> allTickets = ticketRepository.findAll();
        long total = allTickets.size();

        long open = allTickets.stream().filter(t -> t.getStatus() == TicketStatus.OPEN || t.getStatus() == TicketStatus.ASSIGNED).count();
        long inProgress = allTickets.stream().filter(t -> t.getStatus() == TicketStatus.IN_PROGRESS).count();
        long critical = allTickets.stream().filter(t -> t.getPriority() == TicketPriority.CRITICAL && t.getStatus() != TicketStatus.CLOSED).count();
        long high = allTickets.stream().filter(t -> t.getPriority() == TicketPriority.HIGH && t.getStatus() != TicketStatus.CLOSED).count();
        long atRisk = allTickets.stream().filter(t -> t.getSlaStatus() == SlaStatus.AT_RISK).count();
        long breached = allTickets.stream().filter(t -> t.getSlaStatus() == SlaStatus.BREACHED).count();

        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long resolvedToday = allTickets.stream()
                .filter(t -> t.getStatus() == TicketStatus.RESOLVED && t.getResolvedAt() != null && t.getResolvedAt().isAfter(startOfDay))
                .count();

        long withinSla = allTickets.stream().filter(t -> t.getSlaStatus() == SlaStatus.WITHIN_SLA).count();
        double complianceRate = total > 0 ? ((double) withinSla / total) * 100.0 : 100.0;

        Map<String, Long> byStatus = new HashMap<>();
        for (TicketStatus s : TicketStatus.values()) {
            byStatus.put(s.name(), allTickets.stream().filter(t -> t.getStatus() == s).count());
        }

        Map<String, Long> byPriority = new HashMap<>();
        for (TicketPriority p : TicketPriority.values()) {
            byPriority.put(p.name(), allTickets.stream().filter(t -> t.getPriority() == p).count());
        }

        Map<String, Long> byCategory = new HashMap<>();
        for (Ticket t : allTickets) {
            String catName = t.getCategory() != null ? t.getCategory().getName() : "General";
            byCategory.put(catName, byCategory.getOrDefault(catName, 0L) + 1);
        }

        return DashboardMetricsDTO.builder()
                .totalTickets(total)
                .openTickets(open)
                .inProgressTickets(inProgress)
                .criticalTickets(critical)
                .highPriorityTickets(high)
                .slaAtRiskTickets(atRisk)
                .slaBreachedTickets(breached)
                .resolvedToday(resolvedToday)
                .slaComplianceRate(Math.round(complianceRate * 10.0) / 10.0)
                .ticketsByStatus(byStatus)
                .ticketsByPriority(byPriority)
                .ticketsByCategory(byCategory)
                .build();
    }
}
