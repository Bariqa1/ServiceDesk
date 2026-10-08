package com.servicedesk.ticket.dto;

import com.servicedesk.ticket.enums.TicketStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketStatusUpdateRequest {
    @NotNull(message = "New status is required")
    private TicketStatus status;
    private String reason;
}
