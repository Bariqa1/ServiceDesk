package com.servicedesk.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponseDTO {
    private UUID publicId;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String jobTitle;
    private String department;
    private String teamName;
    private UUID teamPublicId;
    private List<String> roles;
}
