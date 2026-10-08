package com.servicedesk.user.entity;

import com.servicedesk.common.entity.AuditableBaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "teams")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Team extends AuditableBaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(length = 255)
    private String description;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_user_id")
    private User lead;

    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
    @Builder.Default
    private Set<User> members = new HashSet<>();
}
