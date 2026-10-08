package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.SlaPolicy;
import com.servicedesk.ticket.enums.TicketPriority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Long> {
    Optional<SlaPolicy> findByPriority(TicketPriority priority);
}
