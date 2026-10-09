package com.servicedesk.ai;

import com.servicedesk.ai.dto.AiAgentAnalysisResponseDTO;
import com.servicedesk.ai.dto.AiApproveProposalRequestDTO;
import com.servicedesk.ai.entity.AiAuditLog;
import com.servicedesk.ai.service.AiAgentService;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.repository.TicketRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AiAgentServiceTest {

    @Autowired
    private AiAgentService aiAgentService;

    @Autowired
    private TicketRepository ticketRepository;

    @Test
    @DisplayName("Should execute multi-agent state machine and generate trajectory")
    void shouldExecuteMultiAgentDiagnosis() {
        Ticket ticket = ticketRepository.findAll().get(0);

        AiAgentAnalysisResponseDTO response = aiAgentService.diagnoseTicket(ticket.getTicketNumber());

        assertThat(response).isNotNull();
        assertThat(response.ticketNumber()).isEqualTo(ticket.getTicketNumber());
        assertThat(response.trajectory()).isNotEmpty();
        assertThat(response.trajectory().size()).isGreaterThanOrEqualTo(5);
        assertThat(response.confidenceScore()).isGreaterThan(0.0);
        assertThat(response.rootCauseAnalysis()).isNotBlank();
        assertThat(response.proposedResolution()).isNotBlank();

        List<AiAuditLog> logs = aiAgentService.getTicketAiHistory(ticket.getTicketNumber());
        assertThat(logs).isNotEmpty();
        assertThat(logs.get(0).getConfidenceScore()).isEqualTo(response.confidenceScore());
    }

    @Test
    @DisplayName("Should approve and apply AI Agent proposal via Human-in-the-Loop")
    void shouldApproveAiProposal() {
        Ticket ticket = ticketRepository.findAll().get(0);
        aiAgentService.diagnoseTicket(ticket.getTicketNumber());

        AiApproveProposalRequestDTO approval = new AiApproveProposalRequestDTO("RESOLVE", "Approved by QA test suite");
        Ticket updated = aiAgentService.approveProposal(ticket.getTicketNumber(), approval, "qa.engineer");

        assertThat(updated.getStatus()).isEqualTo(TicketStatus.RESOLVED);
        assertThat(updated.getResolutionSummary()).isNotBlank();
        assertThat(updated.getResolvedAt()).isNotNull();

        List<AiAuditLog> logs = aiAgentService.getTicketAiHistory(ticket.getTicketNumber());
        assertThat(logs.get(0).getApprovalStatus()).isEqualTo("APPROVED");
        assertThat(logs.get(0).getApprovedBy()).isEqualTo("qa.engineer");
    }
}
