package com.servicedesk.ticket.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAssignRequest {
    @NotNull(message = "Agent public ID is required")
    private UUID agentPublicId;
    private UUID teamPublicId;
}
