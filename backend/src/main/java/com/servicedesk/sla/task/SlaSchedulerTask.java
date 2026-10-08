package com.servicedesk.sla.task;

import com.servicedesk.sla.service.SlaMonitoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SlaSchedulerTask {

    private final SlaMonitoringService slaMonitoringService;

    // Run every 60 seconds (60,000 ms)
    @Scheduled(fixedRateString = "${app.sla.check-rate-ms:60000}", initialDelay = 10000)
    public void executeSlaChecks() {
        try {
            slaMonitoringService.checkAndEscalateActiveSlas();
        } catch (Exception ex) {
            log.error("Error executing scheduled SLA check task: ", ex);
        }
    }
}
