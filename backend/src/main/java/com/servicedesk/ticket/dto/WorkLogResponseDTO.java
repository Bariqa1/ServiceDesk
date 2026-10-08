package com.servicedesk.ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkLogResponseDTO {
    private UUID publicId;
    private String agentFullName;
    private UUID agentPublicId;
    private Integer timeSpentMinutes;
    private String description;
    private Instant loggedAt;
}
