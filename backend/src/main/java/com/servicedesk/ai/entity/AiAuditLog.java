package com.servicedesk.ai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class AiAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Column(name = "ticket_number", nullable = false, length = 32)
    private String ticketNumber;

    @Column(name = "predicted_category", length = 64)
    private String predictedCategory;

    @Column(name = "calculated_priority", length = 32)
    private String calculatedPriority;

    @Column(name = "confidence_score")
    private Double confidenceScore;

    @Column(name = "action_type", length = 64)
    private String actionType;

    @Column(name = "requires_human_approval")
    private Boolean requiresHumanApproval;

    @Column(name = "approval_status", length = 32)
    @Builder.Default
    private String approvalStatus = "PENDING";

    @Column(name = "root_cause_analysis", columnDefinition = "TEXT")
    private String rootCauseAnalysis;

    @Column(name = "proposed_resolution", columnDefinition = "TEXT")
    private String proposedResolution;

    @Column(name = "trajectory_json", columnDefinition = "TEXT")
    private String trajectoryJson;

    @Column(name = "guardrail_status", length = 32)
    @Builder.Default
    private String guardrailStatus = "PASSED";

    @Column(name = "guardrail_risk_score")
    private Double guardrailRiskScore;

    @Column(name = "guardrail_violations_count")
    private Integer guardrailViolationsCount;

    @Column(name = "approved_by", length = 64)
    private String approvedBy;


    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
