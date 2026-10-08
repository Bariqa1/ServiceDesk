package com.servicedesk.ticket;

import com.servicedesk.common.exception.BusinessRuleException;
import com.servicedesk.ticket.dto.TicketStatusUpdateRequest;
import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.TicketStatus;
import com.servicedesk.ticket.mapper.TicketMapper;
import com.servicedesk.ticket.repository.TicketRepository;
import com.servicedesk.ticket.service.TicketService;
import com.servicedesk.user.entity.User;
import com.servicedesk.user.service.UserService;
import com.servicedesk.websocket.service.TicketBroadcasterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TicketStateTransitionTest {

    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private UserService userService;
    @Mock
    private TicketMapper ticketMapper;
    @Mock
    private TicketBroadcasterService broadcasterService;

    @InjectMocks
    private TicketService ticketService;

    private Ticket ticket;
    private UUID ticketId;
    private User testUser;

    @BeforeEach
    void setUp() {
        ticketId = UUID.randomUUID();
        testUser = User.builder().username("agent_tester").fullName("Agent Tester").build();
        testUser.setPublicId(UUID.randomUUID());

        ticket = Ticket.builder()
                .ticketNumber("INC-2026-0100")
                .title("Test Network Outage")
                .description("VPN connectivity dropped")
                .status(TicketStatus.OPEN)
                .build();
        ticket.setPublicId(ticketId);
    }

    @Test
    @DisplayName("Should successfully transition state from OPEN to IN_PROGRESS")
    void testValidStateTransition() {
        when(ticketRepository.findByPublicId(ticketId)).thenReturn(Optional.of(ticket));
        when(userService.getCurrentUser()).thenReturn(testUser);
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(i -> i.getArgument(0));

        TicketStatusUpdateRequest request = TicketStatusUpdateRequest.builder()
                .status(TicketStatus.IN_PROGRESS)
                .reason("Started investigation")
                .build();

        ticketService.updateStatus(ticketId, request);

        assertThat(ticket.getStatus()).isEqualTo(TicketStatus.IN_PROGRESS);
        assertThat(ticket.getAuditLogs()).hasSize(1);
        assertThat(ticket.getAuditLogs().get(0).getAction()).isEqualTo("STATUS_CHANGED");
    }

    @Test
    @DisplayName("Should reject invalid state transition (CLOSED cannot transition to IN_PROGRESS)")
    void testInvalidStateTransitionThrowsException() {
        ticket.setStatus(TicketStatus.CLOSED);
        when(ticketRepository.findByPublicId(ticketId)).thenReturn(Optional.of(ticket));
        when(userService.getCurrentUser()).thenReturn(testUser);

        TicketStatusUpdateRequest request = TicketStatusUpdateRequest.builder()
                .status(TicketStatus.IN_PROGRESS)
                .build();

        assertThatThrownBy(() -> ticketService.updateStatus(ticketId, request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Invalid ticket status transition");
    }
}
