package com.servicedesk.ai.dto;

import jakarta.validation.constraints.NotBlank;

public record AiApproveProposalRequestDTO(
        @NotBlank(message = "Action cannot be blank")
        String action,
        String notes
) {}
