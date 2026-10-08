package com.servicedesk.user.repository;

import com.servicedesk.user.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByPublicId(UUID publicId);
    Optional<Team> findByName(String name);
}
