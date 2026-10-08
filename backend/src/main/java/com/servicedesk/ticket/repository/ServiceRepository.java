package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.ServiceEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceRepository extends JpaRepository<ServiceEntity, Long> {
    @EntityGraph(attributePaths = {"category"})
    Optional<ServiceEntity> findByPublicId(UUID publicId);

    @EntityGraph(attributePaths = {"category"})
    List<ServiceEntity> findByCategoryId(Long categoryId);
}
