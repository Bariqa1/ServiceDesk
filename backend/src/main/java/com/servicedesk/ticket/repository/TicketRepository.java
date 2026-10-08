package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.Ticket;
import com.servicedesk.ticket.enums.SlaStatus;
import com.servicedesk.ticket.enums.TicketPriority;
import com.servicedesk.ticket.enums.TicketStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {

    @EntityGraph(attributePaths = {"requester", "assignedAgent", "assignedTeam", "category", "service", "slaPolicy"})
    Optional<Ticket> findByPublicId(UUID publicId);

    @EntityGraph(attributePaths = {"requester", "assignedAgent", "assignedTeam", "category", "service", "slaPolicy"})
    Optional<Ticket> findByTicketNumber(String ticketNumber);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.createdAt >= :startOfDay")
    long countCreatedToday(@Param("startOfDay") Instant startOfDay);

    // Active tickets requiring SLA monitoring (not resolved, not closed)
    @Query("SELECT t FROM Ticket t WHERE t.status NOT IN ('RESOLVED', 'CLOSED')")
    List<Ticket> findActiveTicketsForSlaCheck();

    // Metrics queries
    long countByStatus(TicketStatus status);
    long countByPriority(TicketPriority priority);
    long countBySlaStatus(SlaStatus slaStatus);
    long countByStatusNotIn(List<TicketStatus> statuses);

    @Query("SELECT COUNT(t) FROM Ticket t WHERE t.status = 'RESOLVED' AND t.resolvedAt >= :since")
    long countResolvedSince(@Param("since") Instant since);
}
