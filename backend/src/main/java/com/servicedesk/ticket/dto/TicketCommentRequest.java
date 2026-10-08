package com.servicedesk.ticket.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketCommentRequest {
    @NotBlank(message = "Comment content cannot be empty")
    private String content;
    private boolean internal;
}
