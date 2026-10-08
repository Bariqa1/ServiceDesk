package com.servicedesk.ticket.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkLogRequest {
    @NotNull(message = "Time spent is required")
    @Min(value = 1, message = "Time spent must be at least 1 minute")
    private Integer timeSpentMinutes;

    @NotBlank(message = "Work description is required")
    private String description;
}
