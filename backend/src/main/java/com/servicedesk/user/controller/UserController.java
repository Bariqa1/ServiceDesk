package com.servicedesk.user.controller;

import com.servicedesk.user.dto.UserResponseDTO;
import com.servicedesk.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User queries and role assignments")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current authenticated profile")
    public ResponseEntity<UserResponseDTO> getCurrentUser() {
        return ResponseEntity.ok(userService.mapToDTO(userService.getCurrentUser()));
    }

    @GetMapping("/agents")
    @PreAuthorize("hasAnyRole('TEAM_LEAD', 'SERVICE_MANAGER', 'AGENT')")
    @Operation(summary = "List all active support agents for ticket assignment")
    public ResponseEntity<List<UserResponseDTO>> getAgents() {
        return ResponseEntity.ok(userService.getAgents());
    }
}
