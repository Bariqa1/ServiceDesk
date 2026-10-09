package com.servicedesk.ai.repository;

import com.servicedesk.ai.entity.AiAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AiAuditLogRepository extends JpaRepository<AiAuditLog, Long> {

    List<AiAuditLog> findByTicketIdOrderByCreatedAtDesc(Long ticketId);

    Optional<AiAuditLog> findFirstByTicketIdOrderByCreatedAtDesc(Long ticketId);
}
