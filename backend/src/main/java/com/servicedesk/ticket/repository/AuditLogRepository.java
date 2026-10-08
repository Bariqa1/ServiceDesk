package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.AuditLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    @EntityGraph(attributePaths = {"performedBy"})
    List<AuditLog> findByTicketIdOrderByTimestampDesc(Long ticketId);
}
