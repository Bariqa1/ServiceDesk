package com.servicedesk.user.service;

import com.servicedesk.common.exception.ResourceNotFoundException;
import com.servicedesk.user.dto.UserResponseDTO;
import com.servicedesk.user.entity.User;
import com.servicedesk.user.enums.RoleType;
import com.servicedesk.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in database"));
    }

    @Transactional(readOnly = true)
    public User getUserByPublicId(UUID publicId) {
        return userRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + publicId));
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAgents() {
        return userRepository.findByRole(RoleType.ROLE_AGENT).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponseDTO> getTeamMembers(UUID teamPublicId) {
        return userRepository.findAll().stream()
                .filter(u -> u.getTeam() != null && u.getTeam().getPublicId().equals(teamPublicId))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public UserResponseDTO mapToDTO(User user) {
        List<String> roles = user.getRoles().stream()
                .map(r -> r.getName().name())
                .collect(Collectors.toList());

        return UserResponseDTO.builder()
                .publicId(user.getPublicId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .jobTitle(user.getJobTitle())
                .department(user.getDepartment())
                .teamName(user.getTeam() != null ? user.getTeam().getName() : null)
                .teamPublicId(user.getTeam() != null ? user.getTeam().getPublicId() : null)
                .roles(roles)
                .build();
    }
}
