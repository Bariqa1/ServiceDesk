package com.servicedesk.user.repository;

import com.servicedesk.user.entity.User;
import com.servicedesk.user.enums.RoleType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = {"roles", "team"})
    Optional<User> findByUsername(String username);

    @EntityGraph(attributePaths = {"roles", "team"})
    Optional<User> findByPublicId(UUID publicId);

    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.name = :roleName AND u.enabled = true")
    List<User> findByRole(@Param("roleName") RoleType roleName);

    List<User> findByTeamIdAndEnabledTrue(Long teamId);
}
