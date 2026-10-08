package com.servicedesk.ticket.service;

import com.servicedesk.common.dto.PageResponse;
import com.servicedesk.common.exception.BusinessRuleException;
import com.servicedesk.common.exception.ResourceNotFoundException;
import com.servicedesk.common.exception.UnauthorizedOperationException;
import com.servicedesk.sla.service.SlaCalculationService;
import com.servicedesk.ticket.dto.*;
import com.servicedesk.ticket.entity.*;
import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.mapper.TicketMapper;
import com.servicedesk.ticket.repository.*;
import com.servicedesk.user.entity.Team;
import com.servicedesk.user.entity.User;
import com.servicedesk.user.enums.RoleType;
import com.servicedesk.user.repository.TeamRepository;
import com.servicedesk.user.repository.UserRepository;
import com.servicedesk.user.service.UserService;
import com.servicedesk.websocket.service.TicketBroadcasterService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final UserService userService;
    private final SlaCalculationService slaCalculationService;
    private final TicketMapper ticketMapper;
    private final TicketBroadcasterService broadcasterService;

    @Transactional
    public TicketResponseDTO createTicket(TicketCreateRequest request) {
        User requester = userService.getCurrentUser();

        Category category = categoryRepository.findByPublicId(request.getCategoryPublicId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with ID: " + request.getCategoryPublicId()));

        ServiceEntity service = null;
        if (request.getServicePublicId() != null) {
            service = serviceRepository.findByPublicId(request.getServicePublicId())
                    .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + request.getServicePublicId()));
        }

        String ticketNumber = generateTicketNumber();

        Ticket ticket = Ticket.builder()
                .ticketNumber(ticketNumber)
                .title(request.getTitle())
                .description(request.getDescription())
                .status(TicketStatus.OPEN)
                .priority(request.getPriority())
                .requester(requester)
                .category(category)
                .service(service)
                .slaStatus(SlaStatus.WITHIN_SLA)
                .build();

        slaCalculationService.applySlaPolicy(ticket);

        ticket.addAuditLog(AuditLog.builder()
                .action("TICKET_CREATED")
                .performedBy(requester)
                .newValue(TicketStatus.OPEN.name())
                .details(String.format("Ticket %s created with priority %s under category %s", ticketNumber, ticket.getPriority(), category.getName()))
                .timestamp(Instant.now())
                .build());

        Ticket saved = ticketRepository.save(ticket);
        log.info("Ticket created successfully: {} by user {}", ticketNumber, requester.getUsername());

        broadcasterService.broadcastTicketEvent("TICKET_CREATED", saved, "New ticket " + ticketNumber + " created by " + requester.getFullName());

        return ticketMapper.toDTO(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<TicketResponseDTO> getTickets(
            TicketStatus status,
            TicketPriority priority,
            SlaStatus slaStatus,
            UUID categoryPublicId,
            UUID assignedAgentPublicId,
            UUID requesterPublicId,
            String search,
            Pageable pageable) {

        User currentUser = userService.getCurrentUser();
        boolean isEmployeeOnly = currentUser.getRoles().stream()
                .allMatch(r -> r.getName() == RoleType.ROLE_EMPLOYEE);

        Specification<Ticket> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // If employee, enforce viewing only own tickets
            if (isEmployeeOnly) {
                predicates.add(cb.equal(root.get("requester").get("id"), currentUser.getId()));
            } else if (requesterPublicId != null) {
                predicates.add(cb.equal(root.get("requester").get("publicId"), requesterPublicId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (priority != null) {
                predicates.add(cb.equal(root.get("priority"), priority));
            }
            if (slaStatus != null) {
                predicates.add(cb.equal(root.get("slaStatus"), slaStatus));
            }
            if (categoryPublicId != null) {
                predicates.add(cb.equal(root.get("category").get("publicId"), categoryPublicId));
            }
            if (assignedAgentPublicId != null) {
                predicates.add(cb.equal(root.get("assignedAgent").get("publicId"), assignedAgentPublicId));
            }
            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate numMatch = cb.like(cb.lower(root.get("ticketNumber")), searchPattern);
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), searchPattern);
                predicates.add(cb.or(numMatch, titleMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Ticket> page = ticketRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(ticketMapper::toDTO));
    }

    @Transactional(readOnly = true)
    public TicketResponseDTO getTicketByPublicId(UUID publicId) {
        Ticket ticket = ticketRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + publicId));

        User currentUser = userService.getCurrentUser();
        boolean isEmployeeOnly = currentUser.getRoles().stream()
                .allMatch(r -> r.getName() == RoleType.ROLE_EMPLOYEE);

        if (isEmployeeOnly && !ticket.getRequester().getId().equals(currentUser.getId())) {
            throw new UnauthorizedOperationException("Employees are only permitted to view their own tickets");
        }

        return ticketMapper.toDTO(ticket);
    }

    @Transactional
    public TicketResponseDTO assignTicket(UUID publicId, TicketAssignRequest request) {
        Ticket ticket = ticketRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + publicId));

        User assignedAgent = userRepository.findByPublicId(request.getAgentPublicId())
                .orElseThrow(() -> new ResourceNotFoundException("Agent not found with ID: " + request.getAgentPublicId()));

        Team assignedTeam = null;
        if (request.getTeamPublicId() != null) {
            assignedTeam = teamRepository.findByPublicId(request.getTeamPublicId())
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found with ID: " + request.getTeamPublicId()));
        } else if (assignedAgent.getTeam() != null) {
            assignedTeam = assignedAgent.getTeam();
        }

        User actor = userService.getCurrentUser();
        String oldAgentName = ticket.getAssignedAgent() != null ? ticket.getAssignedAgent().getFullName() : "Unassigned";

        ticket.setAssignedAgent(assignedAgent);
        ticket.setAssignedTeam(assignedTeam);

        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.ASSIGNED);
        }

        ticket.addAuditLog(AuditLog.builder()
                .action("TICKET_ASSIGNED")
                .performedBy(actor)
                .oldValue(oldAgentName)
                .newValue(assignedAgent.getFullName())
                .details(String.format("Assigned to Agent %s (Team: %s)", assignedAgent.getFullName(), assignedTeam != null ? assignedTeam.getName() : "None"))
                .timestamp(Instant.now())
                .build());

        Ticket saved = ticketRepository.save(ticket);
        broadcasterService.broadcastTicketEvent("TICKET_ASSIGNED", saved, "Ticket " + saved.getTicketNumber() + " assigned to " + assignedAgent.getFullName());

        return ticketMapper.toDTO(saved);
    }

    @Transactional
    public TicketResponseDTO updateStatus(UUID publicId, TicketStatusUpdateRequest request) {
        Ticket ticket = ticketRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + publicId));

        TicketStatus current = ticket.getStatus();
        TicketStatus target = request.getStatus();
        User actor = userService.getCurrentUser();

        validateStateTransition(current, target);

        ticket.setStatus(target);
        if (target == TicketStatus.CLOSED) {
            ticket.setClosedAt(Instant.now());
        } else if (target == TicketStatus.RESOLVED && ticket.getResolvedAt() == null) {
            ticket.setResolvedAt(Instant.now());
        }

        ticket.addAuditLog(AuditLog.builder()
                .action("STATUS_CHANGED")
                .performedBy(actor)
                .oldValue(current.name())
                .newValue(target.name())
                .details(request.getReason() != null ? request.getReason() : "Status updated to " + target.name())
                .timestamp(Instant.now())
                .build());

        Ticket saved = ticketRepository.save(ticket);
        broadcasterService.broadcastTicketEvent("STATUS_CHANGED", saved, "Ticket " + saved.getTicketNumber() + " status transitioned from " + current + " to " + target);

        return ticketMapper.toDTO(saved);
    }

    @Transactional
    public TicketResponseDTO resolveTicket(UUID publicId, TicketResolveRequest request) {
        Ticket ticket = ticketRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + publicId));

        User actor = userService.getCurrentUser();
        TicketStatus oldStatus = ticket.getStatus();

        ticket.setStatus(TicketStatus.RESOLVED);
        ticket.setResolvedAt(Instant.now());
        ticket.setResolutionSummary(request.getResolutionSummary());

        ticket.addAuditLog(AuditLog.builder()
                .action("TICKET_RESOLVED")
                .performedBy(actor)
                .oldValue(oldStatus.name())
                .newValue(TicketStatus.RESOLVED.name())
                .details("Resolution Summary: " + request.getResolutionSummary())
                .timestamp(Instant.now())
                .build());

        Ticket saved = ticketRepository.save(ticket);
        broadcasterService.broadcastTicketEvent("STATUS_CHANGED", saved, "Ticket " + saved.getTicketNumber() + " has been RESOLVED.");

        return ticketMapper.toDTO(saved);
    }

    @Transactional
    public TicketCommentResponseDTO addComment(UUID publicId, TicketCommentRequest request) {
        Ticket ticket = ticketRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + publicId));

        User author = userService.getCurrentUser();
        boolean isAgentOrLead = author.getRoles().stream()
                .anyMatch(r -> r.getName() == RoleType.ROLE_AGENT || r.getName() == RoleType.ROLE_TEAM_LEAD || r.getName() == RoleType.ROLE_SERVICE_MANAGER);

        // Record first response time if comment by agent
        if (isAgentOrLead && ticket.getFirstRespondedAt() == null) {
            ticket.setFirstRespondedAt(Instant.now());
        }

        TicketComment comment = TicketComment.builder()
                .ticket(ticket)
                .author(author)
                .content(request.getContent())
                .internal(request.isInternal() && isAgentOrLead) // Only agents/leads can post internal comments
                .build();

        ticket.addComment(comment);

        ticket.addAuditLog(AuditLog.builder()
                .action("COMMENT_ADDED")
                .performedBy(author)
                .details((comment.isInternal() ? "[Internal Note] " : "") + "Added by " + author.getFullName())
                .timestamp(Instant.now())
                .build());

        ticketRepository.save(ticket);
        broadcasterService.broadcastTicketEvent("COMMENT_ADDED", ticket, "New comment on ticket " + ticket.getTicketNumber());

        return TicketCommentResponseDTO.builder()
                .publicId(comment.getPublicId())
                .authorFullName(author.getFullName())
                .authorUsername(author.getUsername())
                .authorPublicId(author.getPublicId())
                .content(comment.getContent())
                .internal(comment.isInternal())
                .createdAt(Instant.now())
                .build();
    }

    @Transactional
    public WorkLogResponseDTO addWorkLog(UUID publicId, WorkLogRequest request) {
        Ticket ticket = ticketRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + publicId));

        User agent = userService.getCurrentUser();

        WorkLog workLog = WorkLog.builder()
                .ticket(ticket)
                .agent(agent)
                .timeSpentMinutes(request.getTimeSpentMinutes())
                .description(request.getDescription())
                .loggedAt(Instant.now())
                .build();

        ticket.addWorkLog(workLog);

        ticket.addAuditLog(AuditLog.builder()
                .action("WORKLOG_ADDED")
                .performedBy(agent)
                .details(String.format("Logged %d minutes: %s", request.getTimeSpentMinutes(), request.getDescription()))
                .timestamp(Instant.now())
                .build());

        ticketRepository.save(ticket);
        return WorkLogResponseDTO.builder()
                .publicId(workLog.getPublicId())
                .agentFullName(agent.getFullName())
                .agentPublicId(agent.getPublicId())
                .timeSpentMinutes(workLog.getTimeSpentMinutes())
                .description(workLog.getDescription())
                .loggedAt(workLog.getLoggedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CategoryResponseDTO> getCategories() {
        return categoryRepository.findAll().stream()
                .map(ticketMapper::toCategoryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ServiceResponseDTO> getServicesByCategory(UUID categoryPublicId) {
        Category cat = categoryRepository.findByPublicId(categoryPublicId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        return serviceRepository.findByCategoryId(cat.getId()).stream()
                .map(ticketMapper::toServiceDTO)
                .collect(Collectors.toList());
    }

    private void validateStateTransition(TicketStatus current, TicketStatus target) {
        if (current == target) return;

        boolean valid = switch (current) {
            case OPEN -> target == TicketStatus.ASSIGNED || target == TicketStatus.IN_PROGRESS || target == TicketStatus.CLOSED;
            case ASSIGNED -> target == TicketStatus.IN_PROGRESS || target == TicketStatus.WAITING_FOR_USER || target == TicketStatus.CLOSED;
            case IN_PROGRESS -> target == TicketStatus.WAITING_FOR_USER || target == TicketStatus.RESOLVED || target == TicketStatus.CLOSED;
            case WAITING_FOR_USER -> target == TicketStatus.IN_PROGRESS || target == TicketStatus.RESOLVED || target == TicketStatus.CLOSED;
            case RESOLVED -> target == TicketStatus.CLOSED || target == TicketStatus.REOPENED;
            case REOPENED -> target == TicketStatus.IN_PROGRESS || target == TicketStatus.ASSIGNED || target == TicketStatus.RESOLVED;
            case CLOSED -> false; // Closed tickets cannot be directly reopened without new lifecycle
        };

        if (!valid) {
            throw new BusinessRuleException(String.format("Invalid ticket status transition from %s to %s", current, target));
        }
    }

    private synchronized String generateTicketNumber() {
        String year = String.valueOf(LocalDate.now().getYear());
        long count = ticketRepository.count() + 1;
        return String.format("INC-%s-%04d", year, count);
    }
}
