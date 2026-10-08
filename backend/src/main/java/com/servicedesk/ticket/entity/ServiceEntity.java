package com.servicedesk.ticket.entity;

import com.servicedesk.common.entity.AuditableBaseEntity;
import com.servicedesk.ticket.enums.TicketPriority;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "services")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceEntity extends AuditableBaseEntity {

    @Column(nullable = false, length = 120)
    private String name;

    @Column(length = 255)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "default_priority", length = 20, nullable = false)
    @Builder.Default
    private TicketPriority defaultPriority = TicketPriority.MEDIUM;
}
