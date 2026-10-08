package com.servicedesk.ticket.dto;

import com.servicedesk.ticket.enums.TicketPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceResponseDTO {
    private UUID publicId;
    private String name;
    private String description;
    private String categoryName;
    private UUID categoryPublicId;
    private TicketPriority defaultPriority;
}
