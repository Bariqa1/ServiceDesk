package com.servicedesk.ticket.repository;

import com.servicedesk.ticket.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByPublicId(UUID publicId);
    Optional<Category> findByCode(String code);
}
