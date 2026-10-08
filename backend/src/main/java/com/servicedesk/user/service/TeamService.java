package com.servicedesk.user.service;

import com.servicedesk.common.exception.ResourceNotFoundException;
import com.servicedesk.user.dto.TeamResponseDTO;
import com.servicedesk.user.entity.Team;
import com.servicedesk.user.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;

    @Transactional(readOnly = true)
    public List<TeamResponseDTO> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Team getTeamByPublicId(UUID publicId) {
        return teamRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found with ID: " + publicId));
    }

    public TeamResponseDTO mapToDTO(Team team) {
        return TeamResponseDTO.builder()
                .publicId(team.getPublicId())
                .name(team.getName())
                .description(team.getDescription())
                .leadFullName(team.getLead() != null ? team.getLead().getFullName() : null)
                .leadPublicId(team.getLead() != null ? team.getLead().getPublicId() : null)
                .membersCount(team.getMembers() != null ? team.getMembers().size() : 0)
                .build();
    }
}
