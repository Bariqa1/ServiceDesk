package com.servicedesk.ai.controller;

import com.servicedesk.ai.dto.AiAgentAnalysisResponseDTO;
import com.servicedesk.ai.dto.AiApproveProposalRequestDTO;
import com.servicedesk.ai.entity.AiAuditLog;
import com.servicedesk.ai.service.AiAgentService;
import com.servicedesk.ticket.dto.TicketResponseDTO;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.mapper.TicketMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/tickets/{identifier}/ai")
@RequiredArgsConstructor
@Tag(name = "AI Agents", description = "Autonomous Multi-Agent diagnosis, trajectory tracking, and Human-in-the-Loop decision approval")
public class AiAgentController {

    private final AiAgentService aiAgentService;
    private final TicketMapper ticketMapper;

    @PostMapping("/diagnose")
    @Operation(summary = "Run autonomous multi-agent analysis on ticket",
            description = "Triggers the multi-agent graph (Supervisor, Triage, Knowledge RAG, Diagnostic Tools, and HITL Gatekeeper)")
    public ResponseEntity<AiAgentAnalysisResponseDTO> runAgentDiagnosis(
            @PathVariable String identifier) {
        AiAgentAnalysisResponseDTO response = aiAgentService.diagnoseTicket(identifier);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/approve")
    @PreAuthorize("hasAnyRole('AGENT', 'ADMIN')")
    @Operation(summary = "Human-in-the-Loop: Approve and apply AI Agent proposal",
            description = "Technician reviews and applies the agent recommendation, updating status and adding comments")
    public ResponseEntity<TicketResponseDTO> approveProposal(
            @PathVariable String identifier,
            @Valid @RequestBody AiApproveProposalRequestDTO request,
            Principal principal) {
        String username = principal != null ? principal.getName() : "Technician";
        Ticket updatedTicket = aiAgentService.approveProposal(identifier, request, username);
        return ResponseEntity.ok(ticketMapper.toDTO(updatedTicket));
    }

    @GetMapping("/history")
    @Operation(summary = "Get historical AI Agent audit runs for ticket")
    public ResponseEntity<List<AiAuditLog>> getAiHistory(
            @PathVariable String identifier) {
        List<AiAuditLog> history = aiAgentService.getTicketAiHistory(identifier);
        return ResponseEntity.ok(history);
    }
}
