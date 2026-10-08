package com.servicedesk.ticket.entity;

import com.servicedesk.common.entity.AuditableBaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category extends AuditableBaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 20)
    private String code; // e.g. "NET", "HARDWARE", "SOFTWARE", "ACCESS"

    @Column(length = 255)
    private String description;

    @Column(name = "icon_name", length = 50)
    private String iconName;
}
