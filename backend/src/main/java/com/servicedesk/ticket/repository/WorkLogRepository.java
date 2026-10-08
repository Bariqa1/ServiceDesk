package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.WorkLog;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WorkLogRepository extends JpaRepository<WorkLog, Long> {
    @EntityGraph(attributePaths = {"agent"})
    List<WorkLog> findByTicketIdOrderByLoggedAtDesc(Long ticketId);
}
