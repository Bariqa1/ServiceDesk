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
public class TicketCommentResponseDTO {
    private UUID publicId;
    private String authorFullName;
    private String authorUsername;
    private UUID authorPublicId;
    private String content;
    private boolean internal;
    private Instant createdAt;
}
