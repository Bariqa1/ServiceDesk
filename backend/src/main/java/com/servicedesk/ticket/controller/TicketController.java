package com.servicedesk.ticket.controller;

import com.servicedesk.common.dto.PageResponse;
import com.servicedesk.ticket.dto.*;
import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.service.TicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tickets")
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Ticket creation, lifecycle transitions, assignment, comments, and worklogs")
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    @Operation(summary = "Get paginated tickets with multi-field filtering")
    public ResponseEntity<PageResponse<TicketResponseDTO>> getTickets(
            @RequestParam(required = false) TicketStatus status,
            @RequestParam(required = false) TicketPriority priority,
            @RequestParam(required = false) SlaStatus slaStatus,
            @RequestParam(required = false) UUID categoryPublicId,
            @RequestParam(required = false) UUID assignedAgentPublicId,
            @RequestParam(required = false) UUID requesterPublicId,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        PageResponse<TicketResponseDTO> response = ticketService.getTickets(
                status, priority, slaStatus, categoryPublicId, assignedAgentPublicId, requesterPublicId, search, pageable
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Create a new ticket", description = "Employees or Agents can submit a support ticket")
    public ResponseEntity<TicketResponseDTO> createTicket(@Valid @RequestBody TicketCreateRequest request) {
        TicketResponseDTO created = ticketService.createTicket(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{publicId}")
    @Operation(summary = "Get ticket details by public ID")
    public ResponseEntity<TicketResponseDTO> getTicketByPublicId(@PathVariable UUID publicId) {
        TicketResponseDTO ticket = ticketService.getTicketByPublicId(publicId);
        return ResponseEntity.ok(ticket);
    }

    @PostMapping("/{publicId}/assign")
    @PreAuthorize("hasAnyRole('TEAM_LEAD', 'SERVICE_MANAGER')")
    @Operation(summary = "Assign ticket to agent", description = "Team Lead or Manager assigns ticket to a specific support agent")
    public ResponseEntity<TicketResponseDTO> assignTicket(
            @PathVariable UUID publicId,
            @Valid @RequestBody TicketAssignRequest request) {
        TicketResponseDTO updated = ticketService.assignTicket(publicId, request);
        return ResponseEntity.ok(updated);
    }

    @PatchMapping("/{publicId}/status")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'SERVICE_MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update ticket status", description = "Transitions ticket state according to lifecycle rules")
    public ResponseEntity<TicketResponseDTO> updateStatus(
            @PathVariable UUID publicId,
            @Valid @RequestBody TicketStatusUpdateRequest request) {
        TicketResponseDTO updated = ticketService.updateStatus(publicId, request);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{publicId}/resolve")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'SERVICE_MANAGER')")
    @Operation(summary = "Resolve ticket with summary")
    public ResponseEntity<TicketResponseDTO> resolveTicket(
            @PathVariable UUID publicId,
            @Valid @RequestBody TicketResolveRequest request) {
        TicketResponseDTO resolved = ticketService.resolveTicket(publicId, request);
        return ResponseEntity.ok(resolved);
    }

    @PostMapping("/{publicId}/comments")
    @Operation(summary = "Add a comment to ticket")
    public ResponseEntity<TicketCommentResponseDTO> addComment(
            @PathVariable UUID publicId,
            @Valid @RequestBody TicketCommentRequest request) {
        TicketCommentResponseDTO comment = ticketService.addComment(publicId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PostMapping("/{publicId}/worklogs")
    @PreAuthorize("hasAnyRole('AGENT', 'TEAM_LEAD', 'SERVICE_MANAGER')")
    @Operation(summary = "Log work time on ticket")
    public ResponseEntity<WorkLogResponseDTO> addWorkLog(
            @PathVariable UUID publicId,
            @Valid @RequestBody WorkLogRequest request) {
        WorkLogResponseDTO workLog = ticketService.addWorkLog(publicId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(workLog);
    }
}
