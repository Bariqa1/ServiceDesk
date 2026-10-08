package com.servicedesk.ticket.entity;

import com.servicedesk.common.entity.AuditableBaseEntity;
import com.servicedesk.ticket.enums.TicketPriority;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sla_policies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SlaPolicy extends AuditableBaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(length = 20, unique = true, nullable = false)
    private TicketPriority priority;

    @Column(name = "response_time_minutes", nullable = false)
    private Integer responseTimeMinutes; // e.g. Critical = 15m, High = 30m, Medium = 120m, Low = 240m

    @Column(name = "resolution_time_minutes", nullable = false)
    private Integer resolutionTimeMinutes; // e.g. Critical = 120m (2h), High = 240m (4h), Medium = 480m (8h), Low = 1440m (24h)

    @Column(name = "warning_threshold_percent", nullable = false)
    @Builder.Default
    private Integer warningThresholdPercent = 75; // Mark AT_RISK at 75% elapsed
}
