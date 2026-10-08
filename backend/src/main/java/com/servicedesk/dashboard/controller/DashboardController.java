package com.servicedesk.dashboard.controller;

import com.servicedesk.dashboard.dto.DashboardMetricsDTO;
import com.servicedesk.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard & Metrics", description = "Real-time SLA analytics and operational workload KPIs")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Get Dashboard KPIs", description = "Returns executive ticket metrics, SLA breaches, status breakdown, and categorization")
    public ResponseEntity<DashboardMetricsDTO> getDashboardMetrics() {
        DashboardMetricsDTO metrics = dashboardService.getExecutiveMetrics();
        return ResponseEntity.ok(metrics);
    }
}
