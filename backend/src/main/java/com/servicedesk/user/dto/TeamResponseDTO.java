package com.servicedesk.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamResponseDTO {
    private UUID publicId;
    private String name;
    private String description;
    private String leadFullName;
    private UUID leadPublicId;
    private int membersCount;
}
