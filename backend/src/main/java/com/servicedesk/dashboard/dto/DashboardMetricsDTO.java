package com.servicedesk.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsDTO {
    private long totalTickets;
    private long openTickets;
    private long inProgressTickets;
    private long criticalTickets;
    private long highPriorityTickets;
    private long slaAtRiskTickets;
    private long slaBreachedTickets;
    private long resolvedToday;
    private double slaComplianceRate; // percentage within SLA

    private Map<String, Long> ticketsByStatus;
    private Map<String, Long> ticketsByPriority;
    private Map<String, Long> ticketsByCategory;
}
